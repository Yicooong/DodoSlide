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
 * 导出单个幻灯片到 PPTX
 *
 * 采用两阶段（Pass）渲染策略：
 * - Pass 1：遍历 DOM 元素，绘制形状（背景、圆角矩形、边框）和 SVG 图标
 * - Pass 2：聚合同一文本块内的文本节点，统一导出为富文本
 *
 * @param pres           pptxgen 演示文稿实例
 * @param slideCode      幻灯片的 JSX 源代码
 * @param slideName      幻灯片名称
 * @param containerRef   已渲染的幻灯片 DOM 容器引用
 * @param canvasConfig   画布配置：设计尺寸（width/height）和 PPTX 英寸宽度（pptxWidthIn）
 * @param scale          当前预览的缩放比例（用于将屏幕像素还原为逻辑像素）
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

  // 获取幻灯片根元素，优先使用带标记类的元素
  const container = (containerRef.querySelector('.logical-slide-root') || containerRef.firstElementChild) as HTMLElement;
  if (!container) {
    return;
  }

  const currentScale = scale || 1;
  // 像素到英寸的转换函数
  // getBoundingClientRect 返回的是缩放后的物理像素，需要除以 currentScale 还原为逻辑像素
  // 再按画布比例换算为 PPTX 英寸（以 pptxWidthIn 为基准）
  const pxToIn = (px: number) => ((px / currentScale) * canvasConfig.pptxWidthIn) / canvasConfig.width;

  // 计算元素的累积透明度：沿 DOM 树向上遍历，将所有祖先的 opacity 相乘
  // stopAt 参数限定遍历的边界（通常为幻灯片容器）
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

  // 基于 Canvas 的颜色解析器（万能方案）
  // 原理：将任意 CSS 颜色绘制到 1x1 的 Canvas 上，再读取像素的 RGBA 值
  // 可以准确解析所有现代 CSS 颜色格式（oklch、color-mix、rgba、hsla 等）
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1; tempCanvas.height = 1;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { color: 'FFFFFF', transparency: 100, isTransparent: true, rgba: 'rgba(255,255,255,0)' };
  }

  /**
   * 解析 CSS 颜色字符串，返回 PPTX 所需的十六进制颜色和透明度
   *
   * @param colorStr   CSS 颜色值（如 'oklch(...)', 'rgba(...)', '#ff0000' 等）
   * @param opacityStr 额外的透明度乘数（来自祖先元素的 opacity 累积值）
   * @returns 包含十六进制颜色、透明度百分比、是否透明、alpha 值和 rgba 字符串的对象
   */
  const parseColor = (colorStr: string, opacityStr = '1') => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'none' || !ctx) {
       return { color: 'FFFFFF', transparency: 100, isTransparent: true, rgba: 'rgba(255,255,255,0)' };
    }
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    // 合并 Canvas 解析出的 alpha 和传入的 opacityStr
    const alpha = (a / 255) * parseFloat(opacityStr || '1');
    return {
      color: [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(''),
      transparency: Math.round((1 - alpha) * 100),
      isTransparent: alpha < 0.05,
      alpha: alpha,
      rgba: `rgba(${r}, ${g}, ${b}, ${alpha})`
    };
  };

  // 解析幻灯片根元素的背景色
  const rootStyle = window.getComputedStyle(container);
  const rootBg = parseColor(rootStyle.backgroundColor);
  slide.background = { color: rootBg.isTransparent ? 'FFFFFF' : rootBg.color };

  // ==========================================
  // Pass 1：遍历所有元素节点，绘制形状和 SVG 图标
  // ==========================================
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode() as HTMLElement;

  while (node) {
    const tagName = node.tagName.toLowerCase();
    const nStyle = window.getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const parentRect = container.getBoundingClientRect();

    // 跳过无尺寸或不可见的元素
    if (rect.width === 0 || rect.height === 0 || nStyle.display === 'none' || nStyle.visibility === 'hidden') {
       node = walker.nextNode() as HTMLElement;
       continue;
    }

    // 计算元素相对于幻灯片容器的累积透明度
    const effectiveOp = getEffectiveOpacity(node, container);
    const globalOpacity = effectiveOp.toString();

    // ----- 处理 SVG 图标 -----
    if (tagName === 'svg') {
      try {
        let svgData = new XMLSerializer().serializeToString(node);

        // 1. 解析 SVG 的真实颜色（计入 DOM 树累积的透明度）
        const colorInfo = parseColor(nStyle.color, globalOpacity);
        const trueHex = `#${colorInfo.color}`;

        // 将 SVG 中的 currentColor 替换为实际的十六进制颜色值
        svgData = svgData.replace(/currentColor/g, trueHex);

        // 2. 确保 SVG 显式设置 stroke 属性（PPTX 渲染需要）
        if (!svgData.includes('stroke=')) {
            svgData = svgData.replace('<svg', `<svg stroke="${trueHex}"`);
        }

        // 将 SVG 数据编码为 base64 Data URI
        const svgBase64 = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`;

        // 以图片形式添加到 PPTX 幻灯片
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
    // ----- 处理普通元素（形状和文本容器）-----
    // 注意：跳过根容器本身，避免将其作为重复形状绘制
    else if (node !== container) {
      // 修复 Tailwind 渐变背景：当 background-color 透明时，从 background-image 中提取回退颜色
      let bgStr = nStyle.backgroundColor;
      if ((!bgStr || bgStr === 'transparent' || bgStr === 'rgba(0, 0, 0, 0)') && nStyle.backgroundImage && nStyle.backgroundImage !== 'none') {
          // 从渐变声明中提取颜色值（如 rgba(...)、oklch(...)、#fff 等）
          const match = nStyle.backgroundImage.match(/(rgb|rgba|hsl|hsla|oklch|color)\([^)]+\)|#[0-9a-fA-F]{3,8}/);
          if (match) bgStr = match[0];
      }

      // 解析背景色（含累积透明度）
      const bgInfo = parseColor(bgStr, globalOpacity);

      // 提取四边的边框宽度，用于处理不对称边框（如水平分割线）
      const topW = parseFloat(nStyle.borderTopWidth || '0');
      const rightW = parseFloat(nStyle.borderRightWidth || '0');
      const bottomW = parseFloat(nStyle.borderBottomWidth || '0');
      const leftW = parseFloat(nStyle.borderLeftWidth || '0');

      // 判断四边是否对称（宽度一致）
      const isSymmetrical = topW === rightW && topW === bottomW && topW === leftW;
      const maxBorder = Math.max(topW, rightW, bottomW, leftW);
      const borderInfo = parseColor(nStyle.borderColor, globalOpacity);

      const hasBg = !bgInfo.isTransparent;
      const hasSymmetricalBorder = isSymmetrical && maxBorder > 0 && !borderInfo.isTransparent;

      // 步骤 1：绘制背景 + 对称边框为一个统一的形状
      if ((hasBg || hasSymmetricalBorder) && rect.width > 2 && rect.height > 2) {
        const br = parseInt(nStyle.borderRadius || '0');
        // PPTX rectRadius 的严格规则：避免将大圆角矩形变成胶囊形
        // 当 borderRadius 为 999px 或 50% 时视为药丸形（pill），使用最大圆角 0.5
        // 否则使用固定小圆角 0.05
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

        // 添加对称边框
        if (hasSymmetricalBorder) {
            shapeOpts.line = {
                color: borderInfo.color,
                transparency: borderInfo.transparency,
                width: maxBorder / currentScale
            };
            // 处理虚线边框
            if (nStyle.borderStyle.includes('dashed')) shapeOpts.line.dashType = 'dash';
        }

        slide.addShape(shapeType, shapeOpts);
      }

      // 步骤 2：处理不对称边框——将其绘制为独立的直线（例如水平分割线）
      if (!isSymmetrical && !borderInfo.isTransparent) {
         /**
          * 绘制单边边框为直线
          * @param w         边框宽度（像素）
          * @param x         起点 X（屏幕坐标）
          * @param y         起点 Y（屏幕坐标）
          * @param length    线段长度（屏幕坐标）
          * @param isVertical 是否为垂直线
          */
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

         // 分别绘制四条边
         drawLine(topW, rect.left, rect.top, rect.width, false);    // 上边
         drawLine(bottomW, rect.left, rect.bottom, rect.width, false); // 下边
         drawLine(leftW, rect.left, rect.top, rect.height, true);   // 左边
         drawLine(rightW, rect.right, rect.top, rect.height, true);  // 右边
      }
    }

    node = walker.nextNode() as HTMLElement;
  }

  // ==========================================
  // Pass 2：富文本聚合与内联字体导出
  // ==========================================
  // 收集所有文本节点
  const textNodes: Text[] = [];
  const textWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let tnNode;
  while((tnNode = textWalker.nextNode())) {
     textNodes.push(tnNode as Text);
  }

  // 按最近的"结构块"（Structural Block）分组文本节点
  // 这样可以确保同一行或同一段落的多个文本片段被聚合到一个 PPTX 文本框中
  const blockGroups = new Map<HTMLElement, { tn: Text, rect: DOMRect, style: CSSStyleDeclaration }[]>();
  const parentRect = container.getBoundingClientRect();

  // 将文本节点分组到其所属的结构块
  textNodes.forEach(tn => {
     // 忽略 SVG 内部的文本（SVG 已在 Pass 1 中处理）
     if (tn.parentElement && tn.parentElement.closest('svg')) return;

     // 获取文本节点的精确包围盒
     const range = document.createRange();
     range.selectNodeContents(tn);
     const rect = range.getBoundingClientRect();

     // 跳过空的、不可见的文本节点
     if (rect.width === 0 || rect.height === 0 || !tn.textContent || tn.textContent.length === 0) return;

     // 向上查找最近的非 inline 块级元素作为分组锚点
     // 这样可以正确处理 flex 布局中的文本分组
     let parent = tn.parentElement;
     while(parent && parent !== container) {
         const style = window.getComputedStyle(parent);
         // 遇到非 inline 元素时停止上溯
         if (style.display !== 'inline') {
             break;
         }
         parent = parent.parentElement;
     }
     if (!parent) parent = container;

     // 将文本节点加入对应块级的分组
     if (!blockGroups.has(parent)) blockGroups.set(parent, []);
     blockGroups.get(parent)!.push({ tn, rect, style: window.getComputedStyle(tn.parentElement as HTMLElement) });
  });

  // 遍历每个文本块分组，渲染聚合后的富文本
  blockGroups.forEach((items, blockParent) => {
     const richTextObjects: any[] = [];
     let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

     items.forEach(({ tn, style }) => {
         let textStr = tn.textContent || '';
         const isPre = style.whiteSpace.startsWith('pre');

         if (!isPre) {
             // 对非 <pre> 元素，折叠 HTML 空白符为单个空格
             // 保留 &nbsp;（\xA0）不被折叠
             textStr = textStr.replace(/[ \t\r\n\f]+/g, ' ');
         }

         if (textStr.length === 0) return;

         // 计算文本片段的精确包围盒
         const range = document.createRange();
         range.selectNodeContents(tn);
         const rRect = range.getBoundingClientRect();
         if (rRect.width > 0 && rRect.height > 0) {
             minX = Math.min(minX, rRect.left);
             minY = Math.min(minY, rRect.top);
             maxX = Math.max(maxX, rRect.right);
             maxY = Math.max(maxY, rRect.bottom);
         }

         // 获取文本节点的真实累积透明度
         const effectiveOp = getEffectiveOpacity(tn.parentElement as HTMLElement, container);
         const textColor = parseColor(style.color, effectiveOp.toString());
         const rawFontSize = parseFloat(style.fontSize || '16');

         // 构建 PPTX 富文本对象
         richTextObjects.push({
             text: textStr,
             options: {
                 color: textColor.color,
                 transparency: textColor.transparency > 0 ? textColor.transparency : undefined,
                 fontSize: rawFontSize * 0.75, // 将 px 转换为 pt（1px ≈ 0.75pt）
                 bold: parseInt(style.fontWeight || '400') >= 600,
                 italic: style.fontStyle === 'italic',
                 fontFace: 'Microsoft YaHei' // 使用微软雅黑字体保证中文兼容性
             }
         });
     });

     // 如果有有效的富文本片段，添加到 PPTX 幻灯片
     if (richTextObjects.length > 0 && minX !== Infinity) {
         const blockStyle = window.getComputedStyle(blockParent);
         // 根据 CSS text-align 映射 PPTX 水平对齐方式
         const textAlign = blockStyle.textAlign === 'center' ? pres.AlignH.center : (blockStyle.textAlign === 'right' ? pres.AlignH.right : pres.AlignH.left);

         // 计算文本包围盒的尺寸（英寸）
         const wIn = Math.max(pxToIn(maxX - minX), 0.1);
         const hIn = Math.max(pxToIn(maxY - minY), 0.1);

         // 缓冲值：处理跨平台字体渲染的字距差异，避免 PPT 中不必要的换行
         const bufferW = 0.25;
         const bufferH = 0.05;

         let finX = pxToIn(minX - parentRect.left);
         let finY = pxToIn(minY - parentRect.top);

         // 根据对齐方式调整 X 坐标，确保文本框展开后仍保持正确的视觉对齐
         if (textAlign === pres.AlignH.center) {
             finX -= (bufferW / 2);
         } else if (textAlign === pres.AlignH.right) {
             finX -= bufferW;
         }

         // 将富文本添加到幻灯片
         slide.addText(richTextObjects, {
           x: finX,
           y: finY,
           w: wIn + bufferW, // 扩展的宽度给字体引擎留出呼吸空间
           h: hIn + bufferH,
           align: textAlign,
           valign: 'middle',
           margin: 0.05, // 微小的内边距
           wrap: true
         });
     }
  });
};

/**
 * 通过代码渲染并导出幻灯片
 *
 * 工作流程：
 * 1. 创建临时隐藏容器（定位在屏幕外）
 * 2. 使用 Babel 将 JSX 代码转译为浏览器可执行的 JS
 * 3. 通过 new Function 构建沙箱环境，注入 React 和 Lucide 图标依赖
 * 4. 使用 ReactDOM 渲染组件到临时容器
 * 5. 调用 exportSingleSlide 导出渲染后的 DOM
 * 6. 清理临时容器和 React 根
 *
 * @param pres          pptxgen 演示文稿实例
 * @param slideCode     幻灯片的 JSX 源代码
 * @param slideName     幻灯片名称
 * @param canvasConfig  画布配置对象
 */
export const exportSlideByCode = async (
  pres: pptxgen,
  slideCode: string,
  slideName: string,
  canvasConfig: { width: number; height: number; pptxWidthIn: number }
) => {
  // 创建临时容器，放置在屏幕外（left: -9999px）以避免用户看到
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.style.width = `${canvasConfig.width}px`;
  tempContainer.style.height = `${canvasConfig.height}px`;
  document.body.appendChild(tempContainer);

  try {
    // 使用 Babel 将 JSX/TSX 代码转译为 JavaScript
    const result = Babel.transform(slideCode, {
      presets: ['react', ['env', { modules: 'commonjs' }]],
      filename: 'slide.tsx'
    }).code;

    if (result) {
      // 构建沙箱包装函数，模拟 CommonJS 模块系统
      // 将 'react' 和 'lucide-react' 的 require 调用重定向到注入的依赖
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

      // 注入 React 和 Lucide 图标作为依赖
      const dependencies = { React, icons: LucideIcons };
      // 使用 new Function 执行包装后的代码，获取幻灯片组件
      const renderFn = new Function('dependencies', wrappedCode);
      const Component = renderFn(dependencies);

      // 确保获取到的是有效的函数组件
      if (typeof Component === 'function') {
        // 创建根元素并设置尺寸
        const root = document.createElement('div');
        root.className = 'logical-slide-root relative overflow-hidden';
        root.style.width = `${canvasConfig.width}px`;
        root.style.height = `${canvasConfig.height}px`;
        tempContainer.appendChild(root);

        // 使用 ReactDOM.createRoot 渲染组件（React 19 并发 API）
        const { createElement } = React;
        const { createRoot } = await import('react-dom/client');
        const reactRoot = createRoot(root);

        // 等待渲染完成
        await new Promise<void>((resolve) => {
          reactRoot.render(createElement(ErrorBoundaryWrapper, null, createElement(Component)));
          // 给浏览器留出渲染和样式计算的时间
          setTimeout(resolve, 100);
        });

        // 执行 DOM 到 PPTX 的导出（scale=1 因为是按原始尺寸渲染的）
        await exportSingleSlide(pres, slideCode, slideName, tempContainer, canvasConfig, 1);

        // 清理：卸载 React 根
        reactRoot.unmount();
      }
    }
  } catch (err: any) {
    console.error(`Failed to export slide "${slideName}":`, err);
  } finally {
    // 无论如何都要移除临时容器，避免内存泄漏
    document.body.removeChild(tempContainer);
  }
};
