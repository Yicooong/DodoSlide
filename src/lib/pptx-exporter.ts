/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import pptxgen from 'pptxgenjs';
import * as Babel from '@babel/standalone';
import * as LucideIcons from 'lucide-react';
import React from 'react';
import { ErrorBoundaryWrapper } from '../hooks/use-slide-renderer';

/**
 * Export a single slide to PPTX presentation
 */
export const exportSingleSlide = async (
  pres: pptxgen,
  slideCode: string,
  slideName: string,
  containerRef: HTMLDivElement | null,
  canvasConfig: { width: number; height: number; pptxWidthIn: number },
  scale: number
) => {
  const slide = pres.addSlide();

  if (!containerRef) {
    return;
  }

  const container = (containerRef.querySelector('.logical-slide-root') || containerRef.firstElementChild) as HTMLElement;
  if (!container) {
    return;
  }

  const currentScale = scale || 1;
  // getBoundingClientRect returns scaled physical pixels, requires unscaling
  const pxToIn = (px: number) => ((px / currentScale) * canvasConfig.pptxWidthIn) / canvasConfig.width;

  // Calculate Absolute Opacity by walking up the DOM tree
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

  // Bulletproof Canvas-based Color Parser
  // Can accurately resolve ANY modern CSS color (oklch, color-mix, rgba) to strict Hex/Alpha
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1; tempCanvas.height = 1;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { color: 'FFFFFF', transparency: 100, isTransparent: true, rgba: 'rgba(255,255,255,0)' };
  }

  const parseColor = (colorStr: string, opacityStr = '1') => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'none' || !ctx) {
       return { color: 'FFFFFF', transparency: 100, isTransparent: true, rgba: 'rgba(255,255,255,0)' };
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    const alpha = (a / 255) * parseFloat(opacityStr || '1');
    return {
      color: [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(''),
      transparency: Math.round((1 - alpha) * 100),
      isTransparent: alpha < 0.05,
      alpha: alpha,
      rgba: `rgba(${r}, ${g}, ${b}, ${alpha})`
    };
  };

  const rootStyle = window.getComputedStyle(container);
  const rootBg = parseColor(rootStyle.backgroundColor);
  slide.background = { color: rootBg.isTransparent ? 'FFFFFF' : rootBg.color };

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as HTMLElement;

  while (node) {
    const tagName = node.tagName.toLowerCase();
    const nStyle = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    // Skip elements without physical dimensions or invisible ones
    if (rect.width === 0 || rect.height === 0 || nStyle.display === 'none' || nStyle.visibility === 'hidden') {
       node = walker.nextNode() as HTMLElement;
       continue;
    }

    const effectiveOp = getEffectiveOpacity(node, container);
    const globalOpacity = effectiveOp.toString();

    // Handle Icons (SVGs)
    if (tagName === 'svg') {
      try {
        let svgData = new XMLSerializer().serializeToString(node);

        // 1. Resolve true color and alpha accounting for DOM tree opacity
        const colorInfo = parseColor(nStyle.color, globalOpacity);
        const trueHex = `#${colorInfo.color}`;

        // Force currentColor to exact Hex
        svgData = svgData.replace(/currentColor/g, trueHex);

        // 2. Ensure strokes are explicitly set
        if (!svgData.includes('stroke=')) {
            svgData = svgData.replace('<svg', `<svg stroke="${trueHex}"`);
        }

        const svgBase64 = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`;

        slide.addImage({
          data: svgBase64,
          x: pxToIn(rect.left - parentRect.left),
          y: pxToIn(rect.top - parentRect.top),
          w: pxToIn(rect.width),
          h: pxToIn(rect.height),
          transparency: colorInfo.transparency > 0 ? colorInfo.transparency : undefined
        });
      } catch (e) {
        console.error("SVG Export failed", e);
      }
    }
    // Handle Blocks (Text and Shapes)
    else if (node !== container) { // CRITICAL FIX: Skip drawing the Root Container as a duplicate shape!
      // Fix Tailwind Gradients: Extract fallback color from background-image if background-color is transparent
      let bgStr = nStyle.backgroundColor;
      if ((!bgStr || bgStr === 'transparent' || bgStr === 'rgba(0, 0, 0, 0)') && nStyle.backgroundImage && nStyle.backgroundImage !== 'none') {
          const match = nStyle.backgroundImage.match(/(rgb|rgba|hsl|hsla|oklch|color)\([^)]+\)|#[0-9a-fA-F]{3,8}/);
          if (match) bgStr = match[0];
      }

      // Shapes
      const bgInfo = parseColor(bgStr, globalOpacity);
      // Extract specific borders to handle asymmetry
      const topW = parseFloat(nStyle.borderTopWidth || '0');
      const rightW = parseFloat(nStyle.borderRightWidth || '0');
      const bottomW = parseFloat(nStyle.borderBottomWidth || '0');
      const leftW = parseFloat(nStyle.borderLeftWidth || '0');

      const isSymmetrical = topW === rightW && topW === bottomW && topW === leftW;
      const maxBorder = Math.max(topW, rightW, bottomW, leftW);
      const borderInfo = parseColor(nStyle.borderColor, globalOpacity);

      const hasBg = !bgInfo.isTransparent;
      const hasSymmetricalBorder = isSymmetrical && maxBorder > 0 && !borderInfo.isTransparent;

      // 1. Draw Background & Symmetrical Border as a unified shape
      if ((hasBg || hasSymmetricalBorder) && rect.width > 2 && rect.height > 2) {
        const br = parseInt(nStyle.borderRadius || '0');
        // Strict rules for PPTX rectRadius: avoid turning large rounded-rects into capsules
        const isPill = nStyle.borderRadius.includes('999') || nStyle.borderRadius.includes('50%');
        const roundness = isPill ? 0.5 : (br > 0 ? 0.05 : 0);

        const shapeType = br > 0 ? pres.ShapeType.roundRect : pres.ShapeType.rect;
        const shapeOpts: any = {
          x: pxToIn(rect.left - parentRect.left),
          y: pxToIn(rect.top - parentRect.top),
          w: pxToIn(rect.width),
          h: pxToIn(rect.height)
        };

        if (br > 0) shapeOpts.rectRadius = roundness;
        if (hasBg) shapeOpts.fill = { color: bgInfo.color, transparency: bgInfo.transparency };

        if (hasSymmetricalBorder) {
            shapeOpts.line = {
                color: borderInfo.color,
                transparency: borderInfo.transparency,
                width: maxBorder / currentScale
            };
            if (nStyle.borderStyle.includes('dashed')) shapeOpts.line.dashType = 'dash';
        }

        slide.addShape(shapeType, shapeOpts);
      }

      // 2. Draw Asymmetrical Borders as distinct strict lines (e.g., horizontal dividers)
      if (!isSymmetrical && !borderInfo.isTransparent) {
         const drawLine = (w: number, x: number, y: number, length: number, isVertical: boolean) => {
            if (w <= 0) return;
            slide.addShape(pres.ShapeType.line, {
               x: pxToIn(x - parentRect.left),
               y: pxToIn(y - parentRect.top),
               w: isVertical ? 0 : pxToIn(length),
               h: isVertical ? pxToIn(length) : 0,
               line: {
                   color: borderInfo.color,
                   width: w / currentScale,
                   transparency: borderInfo.transparency
               }
            });
         };

         drawLine(topW, rect.left, rect.top, rect.width, false); // Top
         drawLine(bottomW, rect.left, rect.bottom, rect.width, false); // Bottom
         drawLine(leftW, rect.left, rect.top, rect.height, true);  // Left
         drawLine(rightW, rect.right, rect.top, rect.height, true); // Right
      }
    }

    node = walker.nextNode() as HTMLElement;
  }

  // ==========================================
  // Pass 2: Rich Text & Inline Font Aggregation
  // ==========================================
  const textNodes: Text[] = [];
  const textWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let tnNode;
  while((tnNode = textWalker.nextNode())) {
     textNodes.push(tnNode as Text);
  }

  const blockGroups = new Map<HTMLElement, { tn: Text, rect: DOMRect, style: CSSStyleDeclaration }[]>();
  const parentRect = container.getBoundingClientRect();

  // Group all text nodes by their closest Structural Block
  textNodes.forEach(tn => {
     if (tn.parentElement && tn.parentElement.closest('svg')) return; // Ignore text inside SVGs

     const range = document.createRange();
     range.selectNodeContents(tn);
     const rect = range.getBoundingClientRect();

     // Collapse lines, ignore entirely empty invisible traces
     if (rect.width === 0 || rect.height === 0 || !tn.textContent || tn.textContent.length === 0) return;

     let parent = tn.parentElement;
     while(parent && parent !== container) {
         const style = window.getComputedStyle(parent);
         // Stop climbing if we hit a purely non-inline block (fixes flex-item grouping)
         if (style.display !== 'inline') {
             break;
         }
         parent = parent.parentElement;
     }
     if (!parent) parent = container;

     if (!blockGroups.has(parent)) blockGroups.set(parent, []);
     blockGroups.get(parent)!.push({ tn, rect, style: window.getComputedStyle(tn.parentElement as HTMLElement) });
  });

  // Render aggregated text segments
  blockGroups.forEach((items, blockParent) => {
     const richTextObjects: any[] = [];
     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

     items.forEach(({ tn, style }) => {
         let textStr = tn.textContent || '';
         const isPre = style.whiteSpace.startsWith('pre');

         if (!isPre) {
             // Collapse HTML whitespace naturally (but do not destroy \xA0 non-breaking spaces)
             textStr = textStr.replace(/[ \t\r\n\f]+/g, ' ');
         }

         if (textStr.length === 0) return;

         // Compute exact ink boundaries per chunk
         const range = document.createRange();
         range.selectNodeContents(tn);
         const rRect = range.getBoundingClientRect();
         if (rRect.width > 0 && rRect.height > 0) {
             minX = Math.min(minX, rRect.left);
             minY = Math.min(minY, rRect.top);
             maxX = Math.max(maxX, rRect.right);
             maxY = Math.max(maxY, rRect.bottom);
         }

         // Retrieve absolute opacity for each text block by walking the tree!
         const effectiveOp = getEffectiveOpacity(tn.parentElement as HTMLElement, container);
         const textColor = parseColor(style.color, effectiveOp.toString());
         const rawFontSize = parseFloat(style.fontSize || '16');

         richTextObjects.push({
             text: textStr,
             options: {
                 color: textColor.color,
                 transparency: textColor.transparency > 0 ? textColor.transparency : undefined,
                 fontSize: rawFontSize * 0.75, // px to pt
                 bold: parseInt(style.fontWeight || '400') >= 600,
                 italic: style.fontStyle === 'italic',
                 fontFace: 'Microsoft YaHei'
             }
         });
     });

     if (richTextObjects.length > 0 && minX !== Infinity) {
         const blockStyle = window.getComputedStyle(blockParent);
         const textAlign = blockStyle.textAlign === 'center' ? pres.AlignH.center : (blockStyle.textAlign === 'right' ? pres.AlignH.right : pres.AlignH.left);

         const wIn = Math.max(pxToIn(maxX - minX), 0.1);
         const hIn = Math.max(pxToIn(maxY - minY), 0.1);

         // Buffer handles cross-platform font rendering kerning differences so PPT doesn't wrap lines unnecessarily
         const bufferW = 0.25;
         const bufferH = 0.05;

         let finX = pxToIn(minX - parentRect.left);
         let finY = pxToIn(minY - parentRect.top);

         // Adjust X to maintain true visual alignment when box is expanded
         if (textAlign === pres.AlignH.center) {
             finX -= (bufferW / 2);
         } else if (textAlign === pres.AlignH.right) {
             finX -= bufferW;
         }

         slide.addText(richTextObjects, {
           x: finX,
           y: finY,
           w: wIn + bufferW, // Expanded frame allows font engine breathing room!
           h: hIn + bufferH,
           align: textAlign,
           valign: 'middle',
           margin: 0.05, // Give very subtle native padding
           wrap: true
         });
     }
  });
};

/**
 * Helper function to render and export a slide by code
 */
export const exportSlideByCode = async (
  pres: pptxgen,
  slideCode: string,
  slideName: string,
  canvasConfig: { width: number; height: number; pptxWidthIn: number }
) => {
  // Create a temporary container for this slide
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = `${canvasConfig.width}px`;
  tempContainer.style.height = `${canvasConfig.height}px`;
  document.body.appendChild(tempContainer);

  try {
    // Transpile the slide code
    const result = Babel.transform(slideCode, {
      presets: ['react', ['env', { modules: 'commonjs' }]],
      filename: 'slide.tsx'
    }).code;

    if (result) {
      const wrappedCode = `
        return (function(dependencies) {
          const __react_lib__ = dependencies.React;
          const __icons_lib__ = dependencies.icons;

          const exports = {};
          const module = { exports };
          const require = (name) => {
            if (name === 'react') return __react_lib__;
            if (name === 'react/jsx-runtime') return __react_lib__;
            if (name === 'lucide-react') return __icons_lib__;
            return {};
          };

          ${result}

          return module.exports.default || module.exports.MySlide || module.exports;
        })(dependencies)
      `;

      const dependencies = { React, icons: LucideIcons };
      const renderFn = new Function('dependencies', wrappedCode);
      const Component = renderFn(dependencies);

      if (typeof Component === 'function') {
        // Create a root element and render
        const root = document.createElement('div');
        root.className = 'logical-slide-root relative overflow-hidden';
        root.style.width = `${canvasConfig.width}px`;
        root.style.height = `${canvasConfig.height}px`;
        tempContainer.appendChild(root);

        // Use ReactDOM to render (create a temporary React root)
        const { createElement } = React;
        const { createRoot } = await import('react-dom/client');
        const reactRoot = createRoot(root);

        await new Promise<void>((resolve) => {
          reactRoot.render(createElement(ErrorBoundaryWrapper, null, createElement(Component)));
          // Wait a bit for rendering to complete
          setTimeout(resolve, 100);
        });

        // Now export this slide
        await exportSingleSlide(pres, slideCode, slideName, tempContainer, canvasConfig, 1);

        // Cleanup
        reactRoot.unmount();
      }
    }
  } catch (err: any) {
    console.error(`Failed to export slide "${slideName}":`, err);
  } finally {
    document.body.removeChild(tempContainer);
  }
};
