/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback, Component } from 'react';
import { 
  Play, 
  Download, 
  Code2, 
  Layout, 
  FileJson, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Maximize2,
  Trash2,
  Upload,
  Settings,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import * as Babel from '@babel/standalone';
import pptxgen from 'pptxgenjs';
import { DEFAULT_CODE } from './constants';
import { cn } from './lib/utils';
import { useAiGeneration } from './lib/use-ai-generation';
import { SettingsModal } from './components/SettingsModal';
import { AiInputModal } from './components/AiInputModal';

// Libs for the sandbox
import * as LucideIcons from 'lucide-react';

// Error Boundary to catch runtime errors in rendered slides
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }
  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 font-mono p-4">渲染错误: {this.state.error}</div>;
    }
    return this.props.children;
  }
}

const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

// Slide Thumbnail Component - renders a mini preview of the slide
const SlideThumbnail: React.FC<{ code: string; isActive: boolean }> = ({ code, isActive }) => {
  const [thumbnailContent, setThumbnailContent] = useState<React.ReactNode>(null);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);

  useEffect(() => {
    try {
      const result = Babel.transform(code, {
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
          setThumbnailContent(<Component />);
          setHasError(false);
        }
      }
    } catch (err) {
      setHasError(true);
    }
  }, [code]);

  // Calculate scale based on container size - use ResizeObserver for accurate sizing
  useEffect(() => {
    if (!containerRef.current) return;
    
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const newScale = Math.min(containerWidth / 1280, containerHeight / 720);
        setScale(newScale);
      }
    };
    
    updateScale();
    
    const observer = new ResizeObserver(() => {
      updateScale();
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <span className="text-[8px] text-red-400">错误</span>
      </div>
    );
  }

  // Calculate scaled dimensions
  const scaledWidth = 1280 * scale;
  const scaledHeight = 720 * scale;

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-white"
    >
      <div 
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `scale(${scale})`,
          width: '1280px',
          height: '720px',
        }}
      >
          <div
            className="logical-slide-root w-[1280px] h-[720px] relative overflow-hidden bg-white"
            style={{
              // @ts-ignore
              '--vh': '7.2px',
              '--vw': '12.8px',
            }}
          >
            <style>{`
              .logical-slide-root * {
                box-sizing: border-box;
              }
              .logical-slide-root .min-h-screen,
              .logical-slide-root .h-screen {
                min-height: 720px !important;
                height: 720px !important;
              }
              .logical-slide-root .min-w-screen,
              .logical-slide-root .w-screen {
                min-width: 1280px !important;
                width: 1280px !important;
              }
            `}</style>
            <ErrorBoundaryWrapper>
              {thumbnailContent}
            </ErrorBoundaryWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};

// Slide type definition
interface Slide {
  id: string;
  name: string;
  code: string;
}

const App = () => {
  // Multi-slide state management
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', name: '幻灯片 1', code: DEFAULT_CODE }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [transpiledCode, setTranspiledCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(0.75);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // AI Generation
  const {
    isGenerating,
    error: aiError,
    generate,
    clearError,
    apiSettings,
    updateApiSettings,
    promptSettings,
    updatePromptSettings,
  } = useAiGeneration();
  
  const [showSettings, setShowSettings] = useState(false);
  const [showAiInput, setShowAiInput] = useState(false);
  const [editingSlideName, setEditingSlideName] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'current' | 'range'>('all');
  const [exportRangeStart, setExportRangeStart] = useState(1);
  const [exportRangeEnd, setExportRangeEnd] = useState(1);
  const [exportSpecificPage, setExportSpecificPage] = useState(1);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setScale(entry.contentRect.width / 1280);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('code');
  const previewRef = useRef<HTMLDivElement>(null);

  // Update code when current slide changes
  useEffect(() => {
    setCode(slides[currentSlideIndex]?.code || DEFAULT_CODE);
  }, [currentSlideIndex, slides]);

  // Update current slide's code when code changes
  const updateCurrentSlideCode = useCallback((newCode: string) => {
    setCode(newCode);
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated[currentSlideIndex] = { ...updated[currentSlideIndex], code: newCode };
      return updated;
    });
  }, [currentSlideIndex]);

  // Add new slide
  const addNewSlide = useCallback(() => {
    const newSlide: Slide = {
      id: Date.now().toString(),
      name: `幻灯片 ${slides.length + 1}`,
      code: DEFAULT_CODE
    };
    setSlides((prev: Slide[]) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
  }, [slides.length]);

  // Delete slide
  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return; // Keep at least one slide
    setSlides((prev: Slide[]) => prev.filter((_: Slide, i: number) => i !== index));
    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex((prev: number) => prev - 1);
    }
  }, [slides.length, currentSlideIndex]);

  // Rename slide
  const renameSlide = useCallback((index: number, newName: string) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
    setEditingSlideName(null);
  }, []);

  // Duplicate slide
  const duplicateSlide = useCallback((index: number) => {
    const slideToDuplicate = slides[index];
    const newSlide: Slide = {
      id: Date.now().toString(),
      name: `${slideToDuplicate.name} 副本`,
      code: slideToDuplicate.code
    };
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newSlide);
      return updated;
    });
    setCurrentSlideIndex(index + 1);
  }, [slides]);

  // Transpile JSX to JS
  useEffect(() => {
    try {
      const result = Babel.transform(code, {
        presets: ['react', ['env', { modules: 'commonjs' }]],
        filename: 'slide.tsx'
      }).code;
      
      if (result) {
        // Wrap transpiled code to handle CommonJS exports and mock require
        // Use a cleaner scope to avoid identifier collisions
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
        setTranspiledCode(wrappedCode);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [code]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) updateCurrentSlideCode(content);
      };
      reader.readAsText(file);
    }
  };

  // Handle AI Generation
  const handleAiGenerate = async (userInput: string) => {
    const result = await generate(userInput);
    if (result.success && result.code) {
      updateCurrentSlideCode(result.code);
      setActiveTab('code');
    }
    return result;
  };

  // PPTX Export Logic (Dynamically mapping DOM to PPTX with SVG support)
  const exportSingleSlideToPPTX = async (pres: any, slideCode: string, slideName: string) => {
    // Transpile the slide code
    let transpiled;
    try {
      const result = Babel.transform(slideCode, {
        presets: ['react', ['env', { modules: 'commonjs' }]],
        filename: 'slide.tsx'
      }).code;
      
      if (result) {
        transpiled = `
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
      }
    } catch (err) {
      throw new Error(`幻灯片 "${slideName}" 代码解析错误: ${err.message}`);
    }

    if (!transpiled) return;

    // Create a temporary container for rendering
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1280px';
    tempContainer.style.height = '720px';
    document.body.appendChild(tempContainer);

    // Render the component
    try {
      const dependencies = { React, icons: LucideIcons };
      const renderFn = new Function('dependencies', transpiled);
      const Component = renderFn(dependencies);
      
      if (typeof Component !== 'function') {
        throw new Error(`幻灯片 "${slideName}" 必须导出一个默认组件`);
      }

      // Create root and render
      const root = document.createElement('div');
      root.className = 'logical-slide-root w-[1280px] h-[720px] relative overflow-hidden';
      root.style.width = '1280px';
      root.style.height = '720px';
      tempContainer.appendChild(root);

      // Use ReactDOM to render (we'll use a simple approach)
      const { createElement } = React;
      const element = createElement(Component);
      
      // For simplicity, we'll use the existing preview approach
      // by temporarily setting the code and using the existing render logic
      // But since we can't easily do that, we'll create a minimal DOM structure
      // This is a simplified version - in production you'd want proper React rendering
      
      // For now, let's use a simpler approach: create a hidden preview
      const slide = pres.addSlide();
      
      // Parse and export the slide content
      // This is a placeholder - the actual implementation would need proper React rendering
      // For now, we'll export a slide with the name
      slide.addText(slideName, { x: 0.5, y: 0.5, w: 9, h: 0.5, fontSize: 24, bold: true });
      
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  // Export a single slide to PPTX
  const exportSingleSlide = async (pres: any, slideCode: string, slideName: string, containerRef: HTMLDivElement | null) => {
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
    const pxToIn = (px: number) => ((px / currentScale) * 13.33) / 1280;

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

  // Main export function supporting both current and all slides
  const exportToPPTX = async (mode: 'all' | 'current' | 'range', startPage?: number, endPage?: number) => {
    setIsExporting(true);
    
    try {
      if (mode === 'current') {
        // Export only current slide
        const pres = new pptxgen();
        pres.layout = 'LAYOUT_WIDE';
        
        await exportSingleSlide(pres, slides[currentSlideIndex].code, slides[currentSlideIndex].name, previewRef.current);
        
        await pres.writeFile({ fileName: `Slide_${slides[currentSlideIndex].name}_${Date.now()}.pptx` });
      } else if (mode === 'range' && startPage !== undefined && endPage !== undefined) {
        // Export range of slides
        const pres = new pptxgen();
        pres.layout = 'LAYOUT_WIDE';
        
        const start = Math.max(1, startPage) - 1; // Convert to 0-based index
        const end = Math.min(slides.length, endPage);
        
        for (let i = start; i < end; i++) {
          const slide = slides[i];
          await exportSlideToPPTX(pres, slide, i);
        }
        
        await pres.writeFile({ fileName: `Presentation_Slides_${startPage}-${endPage}_${Date.now()}.pptx` });
      } else {
        // Export all slides
        const pres = new pptxgen();
        pres.layout = 'LAYOUT_WIDE';
        
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          await exportSlideToPPTX(pres, slide, i);
        }
        
        await pres.writeFile({ fileName: `Presentation_All_Slides_${Date.now()}.pptx` });
      }
    } catch (err: any) {
      console.error('Export failed:', err);
      alert('导出失败: ' + err.message);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Helper function to export a single slide to PPTX
  const exportSlideToPPTX = async (pres: pptxgen, slide: Slide, index: number) => {
    // Create a temporary container for this slide
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '1280px';
    tempContainer.style.height = '720px';
    document.body.appendChild(tempContainer);
    
    try {
      // Transpile the slide code
      const result = Babel.transform(slide.code, {
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
          root.className = 'logical-slide-root w-[1280px] h-[720px] relative overflow-hidden';
          root.style.width = '1280px';
          root.style.height = '720px';
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
          await exportSingleSlide(pres, slide.code, slide.name, tempContainer);
          
          // Cleanup
          reactRoot.unmount();
        }
      }
    } catch (err: any) {
      console.error(`Failed to export slide "${slide.name}":`, err);
    } finally {
      document.body.removeChild(tempContainer);
    }
  };

  // Safe Rendering of User Component
  const RenderedSlide = useCallback(() => {
    if (!transpiledCode) return null;
    try {
      // Create a function from the transpiled code
      const dependencies = {
        React,
        icons: LucideIcons
      };
      const renderFn = new Function('dependencies', transpiledCode);
      const Component = renderFn(dependencies);
      
      if (typeof Component !== 'function') {
         return <div className="text-red-500 font-mono p-4">Code must export a default component.</div>;
      }

      return <ErrorBoundaryWrapper><Component /></ErrorBoundaryWrapper>;
    } catch (err: any) {
      return <div className="text-red-500 font-mono p-4">Runtime Error: {err.message}</div>;
    }
  }, [transpiledCode]);

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100 overflow-hidden font-sans">
      
      {/* Left Sidebar: Slide Thumbnails */}
      <div className="w-64 border-r border-slate-800 flex flex-col bg-slate-950">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 flex items-center px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layout className="text-white" size={18} />
            </div>
            <span className="font-bold text-sm">幻灯片</span>
          </div>
        </div>

        {/* Slide List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {slides.map((slide: Slide, index: number) => (
            <div
              key={slide.id}
              onClick={() => setCurrentSlideIndex(index)}
              className={cn(
                "group relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden",
                currentSlideIndex === index
                  ? "border-indigo-500 bg-indigo-500/10"
                  : "border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50"
              )}
            >
              {/* Slide Number */}
              <div className="absolute top-1 left-1.5 text-[10px] font-mono text-slate-500">
                {index + 1}
              </div>
              
              {/* Slide Thumbnail Preview */}
              <div className="aspect-video bg-white m-1 mt-4 mb-1 rounded overflow-hidden relative">
                <SlideThumbnail code={slide.code} isActive={currentSlideIndex === index} />
              </div>
              
              {/* Slide Name */}
              <div className="px-2 pb-1.5">
                {editingSlideName === slide.id ? (
                  <input
                    type="text"
                    defaultValue={slide.name}
                    onBlur={(e) => renameSlide(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameSlide(index, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setEditingSlideName(null);
                      }
                    }}
                    className="w-full text-[11px] bg-slate-800 border border-indigo-500 rounded px-1 py-0.5 outline-none"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span 
                      className="text-[11px] text-slate-300 truncate flex-1"
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingSlideName(slide.id);
                      }}
                    >
                      {slide.name}
                    </span>
                    
                    {/* Actions Menu */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSlide(index);
                        }}
                        className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        title="复制"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(index);
                        }}
                        className="p-0.5 rounded hover:bg-red-900/50 text-slate-400 hover:text-red-400"
                        title="删除"
                        disabled={slides.length <= 1}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={addNewSlide}
            className="w-full py-2 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-all flex items-center justify-center gap-2 text-sm font-medium"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            新建幻灯片
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden bg-slate-900">
        
        {/* Header Bar */}
        <header className="h-16 border-b border-white/5 px-8 flex items-center justify-between bg-slate-950/50 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight">Slide <span className="text-indigo-400">Playground</span></h1>
            
            <nav className="flex items-center bg-slate-900 p-1 rounded-lg border border-white/5">
               <button 
                  onClick={() => setActiveTab('code')}
                  className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", activeTab === 'code' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
               >
                  编辑器
               </button>
               <button 
                  onClick={() => setActiveTab('preview')}
                  className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all", activeTab === 'preview' ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:text-slate-300")}
               >
                  预览
               </button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowAiInput(true)}
                disabled={isGenerating}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
             >
                <Sparkles size={16} />
                AI 生成
             </button>
             <button 
                onClick={() => setShowSettings(true)}
                className="bg-slate-800 hover:bg-slate-700 active:scale-95 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border border-white/5"
             >
                <Settings size={16} />
                设置
             </button>
             <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 active:scale-95 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border border-white/5">
                <Upload size={16} />
                上传 JSX
                <input type="file" accept=".jsx,.tsx,.js,.ts" className="hidden" onChange={handleFileUpload} />
             </label>
             {/* Export Button - Opens Modal */}
             <button 
                onClick={() => {
                  setExportRangeStart(1);
                  setExportRangeEnd(slides.length);
                  setExportSpecificPage(currentSlideIndex + 1);
                  setShowExportModal(true);
                }}
                disabled={isExporting || !!error}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95"
             >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                导出 PPTX
             </button>
          </div>
        </header>

        {/* Workspace Container */}
        <main className="flex-grow relative overflow-hidden">
          
          {/* View: Editor */}
          <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", activeTab === 'code' ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none")}>
            <div className="flex-grow">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={code}
                onChange={(value) => updateCurrentSlideCode(value || '')}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  padding: { top: 20 },
                  fontFamily: 'JetBrains Mono',
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* View: Preview */}
          <div className={cn("absolute inset-0 flex flex-col bg-[#020617] transition-opacity duration-300", activeTab === 'preview' ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none")}>
            {/* Preview Stage */}
            <div className="flex-grow flex items-center justify-center p-12 bg-grid-slate-900/[0.2] overflow-hidden">
               <div ref={containerRef} className="w-full max-w-[1100px] aspect-video bg-white shadow-[0_0_80px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden relative">
                  <div 
                    ref={previewRef} 
                    className="w-[1280px] h-[720px] origin-top-left overflow-hidden bg-white selection:bg-indigo-100"
                    style={{ transform: `scale(${scale})` }}
                  >
                     <div 
                        className="logical-slide-root w-[1280px] h-[720px] relative overflow-hidden"
                        style={{
                           // @ts-ignore
                           '--vh': '7.2px', // Treat 1vh as 1/100 of 720px
                           '--vw': '12.8px',
                        }}
                     >
                        <style>{`
                           .logical-slide-root * {
                              box-sizing: border-box;
                           }
                           .logical-slide-root .min-h-screen, 
                           .logical-slide-root .h-screen {
                              min-height: 720px !important;
                              height: 720px !important;
                           }
                           .logical-slide-root .min-w-screen,
                           .logical-slide-root .w-screen {
                              min-width: 1280px !important;
                              width: 1280px !important;
                           }
                        `}</style>
                        {RenderedSlide()}
                     </div>
                  </div>
               </div>
            </div>

            {/* Error Overlay */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] bg-red-950/90 backdrop-blur-md border border-red-900/50 p-4 rounded-xl shadow-2xl font-mono text-xs text-red-200 z-50"
                >
                   <div className="font-bold flex items-center gap-2 mb-2 text-red-400">
                     <AlertCircle size={14} /> 代码解析错误
                   </div>
                   <div className="opacity-80 leading-relaxed">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiSettings={apiSettings}
        onUpdateApiSettings={updateApiSettings}
        promptSettings={promptSettings}
        onUpdatePromptSettings={updatePromptSettings}
      />

      {/* AI Input Modal */}
      <AiInputModal
        isOpen={showAiInput}
        onClose={() => {
          setShowAiInput(false);
          clearError();
        }}
        onGenerate={handleAiGenerate}
        isGenerating={isGenerating}
        error={aiError}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Download size={20} className="text-indigo-400" />
                导出 PPTX
              </h3>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Export Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">导出范围</label>
                
                {/* Option 1: Export All */}
                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  exportMode === 'all' 
                    ? "border-indigo-500 bg-indigo-500/10" 
                    : "border-slate-600 hover:border-slate-500"
                )}>
                  <input 
                    type="radio" 
                    name="exportMode" 
                    value="all"
                    checked={exportMode === 'all'}
                    onChange={(e) => setExportMode(e.target.value as 'all' | 'current' | 'range')}
                    className="w-4 h-4 text-indigo-500 accent-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">全部导出</div>
                    <div className="text-xs text-slate-400">导出所有 {slides.length} 张幻灯片</div>
                  </div>
                </label>

                {/* Option 2: Export Current */}
                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  exportMode === 'current' 
                    ? "border-indigo-500 bg-indigo-500/10" 
                    : "border-slate-600 hover:border-slate-500"
                )}>
                  <input 
                    type="radio" 
                    name="exportMode" 
                    value="current"
                    checked={exportMode === 'current'}
                    onChange={(e) => setExportMode(e.target.value as 'all' | 'current' | 'range')}
                    className="w-4 h-4 text-indigo-500 accent-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">导出当前幻灯片</div>
                    <div className="text-xs text-slate-400">仅导出第 {currentSlideIndex + 1} 张: {slides[currentSlideIndex]?.name}</div>
                  </div>
                </label>

                {/* Option 3: Export Range */}
                <label className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  exportMode === 'range' 
                    ? "border-indigo-500 bg-indigo-500/10" 
                    : "border-slate-600 hover:border-slate-500"
                )}>
                  <input 
                    type="radio" 
                    name="exportMode" 
                    value="range"
                    checked={exportMode === 'range'}
                    onChange={(e) => setExportMode(e.target.value as 'all' | 'current' | 'range')}
                    className="w-4 h-4 text-indigo-500 accent-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">导出指定范围</div>
                    <div className="text-xs text-slate-400">导出连续的多个幻灯片</div>
                  </div>
                </label>

                {/* Range Input Fields */}
                {exportMode === 'range' && (
                  <div className="flex items-center gap-3 pl-7 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">从</span>
                      <input 
                        type="number" 
                        min={1} 
                        max={slides.length}
                        value={exportRangeStart}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setExportRangeStart(Math.max(1, Math.min(val, slides.length)));
                        }}
                        className="w-16 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">到</span>
                      <input 
                        type="number" 
                        min={1} 
                        max={slides.length}
                        value={exportRangeEnd}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setExportRangeEnd(Math.max(1, Math.min(val, slides.length)));
                        }}
                        className="w-16 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-sm text-slate-500">共 {slides.length} 页</span>
                  </div>
                )}

                {/* Specific Page Input */}
                {exportMode === 'current' && (
                  <div className="flex items-center gap-3 pl-7 mt-2">
                    <span className="text-sm text-slate-400">指定页码:</span>
                    <input 
                      type="number" 
                      min={1} 
                      max={slides.length}
                      value={exportSpecificPage}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setExportSpecificPage(Math.max(1, Math.min(val, slides.length)));
                      }}
                      className="w-16 px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white text-center focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-sm text-slate-500">/ {slides.length}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-3">
              <button 
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              >
                取消
              </button>
              <button 
                onClick={() => {
                  if (exportMode === 'current') {
                    // Navigate to the specified page first, then export
                    const pageIndex = exportSpecificPage - 1;
                    setCurrentSlideIndex(pageIndex);
                    // Wait for state update then export
                    setTimeout(() => {
                      exportToPPTX('current');
                    }, 100);
                  } else if (exportMode === 'range') {
                    const start = Math.min(exportRangeStart, exportRangeEnd);
                    const end = Math.max(exportRangeStart, exportRangeEnd);
                    exportToPPTX('range', start, end);
                  } else {
                    exportToPPTX('all');
                  }
                }}
                disabled={isExporting || (exportMode === 'range' && exportRangeStart > exportRangeEnd)}
                className="px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center gap-2 transition-all"
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isExporting ? '导出中...' : '确认导出'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default App;
