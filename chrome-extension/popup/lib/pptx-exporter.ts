/**
 * DOM-to-PPTX conversion pipeline.
 * Extracted from src/lib/pptx-exporter.ts — adapted for extension use.
 *
 * Uses an iframe for clean style isolation (same rendering as main app).
 */

import pptxgen from 'pptxgenjs';
import React from 'react';
import { transpileCode, executeSlideCode, SlideErrorBoundary } from './slide-renderer';
// @ts-ignore — import CSS as raw string (not applied as stylesheet)
import tailwindCSS from './tailwind.css?raw';

/**
 * Preprocess Tailwind CSS for iframe injection.
 * - @import: removed because Google Fonts fetch fails in extension iframe, blocking entire stylesheet
 * - @layer: kept as-is (browser native support, removing would break brace matching)
 * - @property: removed (only needed for CSS animation interpolation, not static export)
 */
function preprocessTailwindForExport(css: string): string {
  return css
    .replace(/@import[^;]+;/g, '')
    .replace(/@property\s+--[a-zA-Z0-9-]+\{[^}]*\}/g, '')
    .trim();
}

/** Hardcoded 16:9 canvas config */
const CANVAS_16x9 = {
  width: 1280,
  height: 720,
  pptxWidthIn: 13.33,
  pptxHeightIn: 7.5,
  pptxLayout: 'LAYOUT_16x9',
};

/**
 * Export a single rendered DOM container to a PPTX slide.
 */
export const exportSingleSlide = async (
  pres: pptxgen,
  containerRef: HTMLDivElement,
  canvasConfig: { width: number; height: number; pptxWidthIn: number },
  scale: number
) => {
  const slide = pres.addSlide();

  const container = (containerRef.querySelector('.logical-slide-root') ||
    containerRef.firstElementChild) as HTMLElement;
  if (!container) return;

  const currentScale = scale || 1;
  const pxToIn = (px: number) =>
    ((px / currentScale) * canvasConfig.pptxWidthIn) / canvasConfig.width;

  // Calculate absolute opacity by walking up the DOM tree
  const getEffectiveOpacity = (el: HTMLElement, stopAt: HTMLElement) => {
    let op = 1;
    let current: HTMLElement | null = el;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      op *= parseFloat(style.opacity || '1');
      if (current === stopAt) break;
      current = current.parentElement;
    }
    return op;
  };

  // Canvas-based color parser — resolves any CSS color to hex/alpha
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1;
  tempCanvas.height = 1;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const parseColor = (colorStr: string, opacityStr = '1') => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'none' || !ctx) {
      return { color: 'FFFFFF', transparency: 100, isTransparent: true };
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const alpha = (a / 255) * parseFloat(opacityStr || '1');
    return {
      color: [r, g, b]
        .map((x) => x.toString(16).padStart(2, '0').toUpperCase())
        .join(''),
      transparency: Math.round((1 - alpha) * 100),
      isTransparent: alpha < 0.05,
    };
  };

  // Slide background
  const rootStyle = window.getComputedStyle(container);
  const rootBg = parseColor(rootStyle.backgroundColor);
  slide.background = { color: rootBg.isTransparent ? 'FFFFFF' : rootBg.color };

  // Pass 1: Shapes, SVGs, borders
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as HTMLElement;

  while (node) {
    const tagName = node.tagName.toLowerCase();
    const nStyle = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    if (
      rect.width === 0 ||
      rect.height === 0 ||
      nStyle.display === 'none' ||
      nStyle.visibility === 'hidden'
    ) {
      node = walker.nextNode() as HTMLElement;
      continue;
    }

    const effectiveOp = getEffectiveOpacity(node, container);
    const globalOpacity = effectiveOp.toString();

    // SVG icons
    if (tagName === 'svg') {
      try {
        let svgData = new XMLSerializer().serializeToString(node);
        const colorInfo = parseColor(nStyle.color, globalOpacity);
        const trueHex = `#${colorInfo.color}`;
        svgData = svgData.replace(/currentColor/g, trueHex);
        if (!svgData.includes('stroke=')) {
          svgData = svgData.replace('<svg', `<svg stroke="${trueHex}"`);
        }
        const svgBase64 = `data:image/svg+xml;base64,${window.btoa(
          unescape(encodeURIComponent(svgData))
        )}`;
        slide.addImage({
          data: svgBase64,
          x: pxToIn(rect.left - parentRect.left),
          y: pxToIn(rect.top - parentRect.top),
          w: pxToIn(rect.width),
          h: pxToIn(rect.height),
          transparency:
            colorInfo.transparency > 0 ? colorInfo.transparency : undefined,
        });
      } catch (e) {
        console.error('SVG export failed', e);
      }
    }
    // Shapes and backgrounds
    else if (node !== container) {
      let bgStr = nStyle.backgroundColor;
      if (
        (!bgStr || bgStr === 'transparent' || bgStr === 'rgba(0, 0, 0, 0)') &&
        nStyle.backgroundImage &&
        nStyle.backgroundImage !== 'none'
      ) {
        const match = nStyle.backgroundImage.match(
          /(rgb|rgba|hsl|hsla|oklch|color)\([^)]+\)|#[0-9a-fA-F]{3,8}/
        );
        if (match) bgStr = match[0];
      }

      const bgInfo = parseColor(bgStr, globalOpacity);
      const topW = parseFloat(nStyle.borderTopWidth || '0');
      const rightW = parseFloat(nStyle.borderRightWidth || '0');
      const bottomW = parseFloat(nStyle.borderBottomWidth || '0');
      const leftW = parseFloat(nStyle.borderLeftWidth || '0');

      const isSymmetrical =
        topW === rightW && topW === bottomW && topW === leftW;
      const maxBorder = Math.max(topW, rightW, bottomW, leftW);
      const borderInfo = parseColor(nStyle.borderColor, globalOpacity);

      const hasBg = !bgInfo.isTransparent;
      const hasSymmetricalBorder =
        isSymmetrical && maxBorder > 0 && !borderInfo.isTransparent;

      if ((hasBg || hasSymmetricalBorder) && rect.width > 2 && rect.height > 2) {
        const br = parseInt(nStyle.borderRadius || '0');
        const isPill =
          nStyle.borderRadius.includes('999') ||
          nStyle.borderRadius.includes('50%');
        const roundness = isPill ? 0.5 : br > 0 ? 0.05 : 0;

        const shapeType =
          br > 0 ? pres.ShapeType.roundRect : pres.ShapeType.rect;
        const shapeOpts: any = {
          x: pxToIn(rect.left - parentRect.left),
          y: pxToIn(rect.top - parentRect.top),
          w: pxToIn(rect.width),
          h: pxToIn(rect.height),
        };

        if (br > 0) shapeOpts.rectRadius = roundness;
        if (hasBg)
          shapeOpts.fill = {
            color: bgInfo.color,
            transparency: bgInfo.transparency,
          };
        if (hasSymmetricalBorder) {
          shapeOpts.line = {
            color: borderInfo.color,
            transparency: borderInfo.transparency,
            width: maxBorder / currentScale,
          };
          if (nStyle.borderStyle.includes('dashed'))
            shapeOpts.line.dashType = 'dash';
        }

        slide.addShape(shapeType, shapeOpts);
      }

      // Asymmetrical borders as lines
      if (!isSymmetrical && !borderInfo.isTransparent) {
        const drawLine = (
          w: number,
          x: number,
          y: number,
          length: number,
          isVertical: boolean
        ) => {
          if (w <= 0) return;
          slide.addShape(pres.ShapeType.line, {
            x: pxToIn(x - parentRect.left),
            y: pxToIn(y - parentRect.top),
            w: isVertical ? 0 : pxToIn(length),
            h: isVertical ? pxToIn(length) : 0,
            line: {
              color: borderInfo.color,
              width: w / currentScale,
              transparency: borderInfo.transparency,
            },
          });
        };
        drawLine(topW, rect.left, rect.top, rect.width, false);
        drawLine(bottomW, rect.left, rect.bottom, rect.width, false);
        drawLine(leftW, rect.left, rect.top, rect.height, true);
        drawLine(rightW, rect.right, rect.top, rect.height, true);
      }
    }

    node = walker.nextNode() as HTMLElement;
  }

  // Pass 2: Rich text
  const textNodes: Text[] = [];
  const textWalker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT
  );
  let tnNode;
  while ((tnNode = textWalker.nextNode())) {
    textNodes.push(tnNode as Text);
  }

  const blockGroups = new Map<
    HTMLElement,
    { tn: Text; rect: DOMRect; style: CSSStyleDeclaration }[]
  >();
  const parentRect = container.getBoundingClientRect();

  textNodes.forEach((tn) => {
    if (tn.parentElement && tn.parentElement.closest('svg')) return;

    const range = document.createRange();
    range.selectNodeContents(tn);
    const rect = range.getBoundingClientRect();

    if (
      rect.width === 0 ||
      rect.height === 0 ||
      !tn.textContent ||
      tn.textContent.length === 0
    )
      return;

    let parent = tn.parentElement;
    while (parent && parent !== container) {
      const style = window.getComputedStyle(parent);
      if (style.display !== 'inline') break;
      parent = parent.parentElement;
    }
    if (!parent) parent = container;

    if (!blockGroups.has(parent)) blockGroups.set(parent, []);
    blockGroups.get(parent)!.push({
      tn,
      rect,
      style: window.getComputedStyle(tn.parentElement as HTMLElement),
    });
  });

  blockGroups.forEach((items, blockParent) => {
    const richTextObjects: any[] = [];
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    items.forEach(({ tn, style }) => {
      let textStr = tn.textContent || '';
      const isPre = style.whiteSpace.startsWith('pre');

      if (!isPre) {
        textStr = textStr.replace(/[ \t\r\n\f]+/g, ' ');
      }
      if (textStr.length === 0) return;

      const range = document.createRange();
      range.selectNodeContents(tn);
      const rRect = range.getBoundingClientRect();
      if (rRect.width > 0 && rRect.height > 0) {
        minX = Math.min(minX, rRect.left);
        minY = Math.min(minY, rRect.top);
        maxX = Math.max(maxX, rRect.right);
        maxY = Math.max(maxY, rRect.bottom);
      }

      const effectiveOp = getEffectiveOpacity(
        tn.parentElement as HTMLElement,
        container
      );
      const textColor = parseColor(style.color, effectiveOp.toString());
      const rawFontSize = parseFloat(style.fontSize || '16');

      richTextObjects.push({
        text: textStr,
        options: {
          color: textColor.color,
          transparency:
            textColor.transparency > 0 ? textColor.transparency : undefined,
          fontSize: rawFontSize * 0.75,
          bold: parseInt(style.fontWeight || '400') >= 600,
          italic: style.fontStyle === 'italic',
          fontFace: 'Microsoft YaHei',
        },
      });
    });

    if (richTextObjects.length > 0 && minX !== Infinity) {
      const blockStyle = window.getComputedStyle(blockParent);
      const textAlign =
        blockStyle.textAlign === 'center'
          ? pres.AlignH.center
          : blockStyle.textAlign === 'right'
            ? pres.AlignH.right
            : pres.AlignH.left;

      const wIn = Math.max(pxToIn(maxX - minX), 0.1);
      const hIn = Math.max(pxToIn(maxY - minY), 0.1);
      const bufferW = 0.25;
      const bufferH = 0.05;

      let finX = pxToIn(minX - parentRect.left);
      let finY = pxToIn(minY - parentRect.top);

      if (textAlign === pres.AlignH.center) {
        finX -= bufferW / 2;
      } else if (textAlign === pres.AlignH.right) {
        finX -= bufferW;
      }

      slide.addText(richTextObjects, {
        x: finX,
        y: finY,
        w: wIn + bufferW,
        h: hIn + bufferH,
        align: textAlign,
        valign: 'middle',
        margin: 0.05,
        wrap: true,
      });
    }
  });
};

/**
 * Full pipeline: transpile JSX → render to iframe DOM → walk DOM → generate PPTX.
 * Uses an iframe for clean style isolation.
 * Returns a Blob of the .pptx file.
 */
export const exportSlideByCode = async (
  slideCode: string
): Promise<Blob> => {
  const canvasConfig = CANVAS_16x9;

  // Create hidden iframe for clean rendering context
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = `${canvasConfig.width}px`;
  iframe.style.height = `${canvasConfig.height}px`;
  iframe.style.border = 'none';
  document.body.appendChild(iframe);

  try {
    // Preprocess and inject CSS directly into the iframe HTML document
    const preprocessedCSS = preprocessTailwindForExport(tailwindCSS);
    const iframeDoc = iframe.contentDocument!;
    iframeDoc.open();
    iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${canvasConfig.width}px; height: ${canvasConfig.height}px; overflow: hidden; font-family: sans-serif; }
    ${preprocessedCSS}
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`);
    iframeDoc.close();

    // Wait for CSS to be ready
    await new Promise((r) => setTimeout(r, 100));

    // Verify Tailwind CSS loaded: check if bg-white produces a white background
    const testEl = iframeDoc.createElement('div');
    testEl.className = 'bg-white';
    iframeDoc.body.appendChild(testEl);
    const testBg = iframeDoc.defaultView!.getComputedStyle(testEl).backgroundColor;
    iframeDoc.body.removeChild(testEl);
    if (testBg === 'rgba(0, 0, 0, 0)' || testBg === 'transparent') {
      console.warn('Tailwind CSS may not have loaded in iframe. bg-white resolved to:', testBg);
    }

    // Transpile and execute
    const wrappedCode = transpileCode(slideCode);
    const Component = executeSlideCode(wrappedCode);

    // Create logical-slide-root inside iframe body
    const root = iframeDoc.createElement('div');
    root.className = 'logical-slide-root relative overflow-hidden';
    root.style.width = `${canvasConfig.width}px`;
    root.style.height = `${canvasConfig.height}px`;
    root.style.setProperty('--vh', `${canvasConfig.height / 100}px`);
    root.style.setProperty('--vw', `${canvasConfig.width / 100}px`);

    // Inject isolation styles (same as SlidePreview.tsx)
    const styleTag = iframeDoc.createElement('style');
    styleTag.textContent = `
      .logical-slide-root * {
        box-sizing: border-box;
      }
      .logical-slide-root .min-h-screen,
      .logical-slide-root .h-screen {
        min-height: ${canvasConfig.height}px !important;
        height: ${canvasConfig.height}px !important;
      }
      .logical-slide-root .min-w-screen,
      .logical-slide-root .w-screen {
        min-width: ${canvasConfig.width}px !important;
        width: ${canvasConfig.width}px !important;
      }
    `;
    root.appendChild(styleTag);
    iframeDoc.body.appendChild(root);

    // Render React component into the iframe's root
    const { createRoot } = await import('react-dom/client');
    const reactRoot = createRoot(root);

    await new Promise<void>((resolve) => {
      reactRoot.render(
        React.createElement(
          SlideErrorBoundary,
          null,
          React.createElement(Component)
        )
      );
      setTimeout(resolve, 500);
    });

    // Generate PPTX from the iframe's rendered DOM
    const pres = new pptxgen();
    pres.layout = canvasConfig.pptxLayout as any;
    await exportSingleSlide(pres, iframeDoc.body as any, canvasConfig, 1);

    // Return as Blob
    const rawBlob = await pres.write({ outputType: 'blob' });
    const blob = new Blob([rawBlob], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });

    // Cleanup
    reactRoot.unmount();
    return blob;
  } finally {
    document.body.removeChild(iframe);
  }
};
