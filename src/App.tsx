/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Editor from '@monaco-editor/react';
import * as Babel from '@babel/standalone';
import pptxgen from 'pptxgenjs';
import { DEFAULT_CODE } from './constants';
import { cn } from './lib/utils';

// Libs for the sandbox
import * as LucideIcons from 'lucide-react';

const App = () => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [transpiledCode, setTranspiledCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [scale, setScale] = useState(0.75);
  const containerRef = useRef<HTMLDivElement>(null);

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
        if (content) setCode(content);
      };
      reader.readAsText(file);
    }
  };

  // PPTX Export Logic (Dynamically mapping DOM to PPTX with SVG support)
  const exportToPPTX = async () => {
    setIsExporting(true);
    const pres = new pptxgen();
    pres.layout = 'LAYOUT_WIDE';
    const slide = pres.addSlide();

    if (!previewRef.current) {
      setIsExporting(false);
      return;
    }

    const container = (previewRef.current.querySelector('.logical-slide-root') || previewRef.current.firstElementChild) as HTMLElement;
    if (!container) {
      setIsExporting(false);
      return;
    }

    const currentScale = scale || 1;
    // getBoundingClientRect returns scaled physical pixels, requires unscaling
    const pxToIn = (px: number) => ((px / currentScale) * 13.33) / 1280;

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

      const globalOpacity = nStyle.opacity;

      // Handle Icons (SVGs)
      if (tagName === 'svg') {
        try {
          let svgData = new XMLSerializer().serializeToString(node);
          
          // 1. Convert SVG currentColor natively to a literal RGBA string!
          // This allows PowerPoint to inherit the exact nested translucency of the HTML DOM.
          const trueRGBA = parseColor(nStyle.color, nStyle.opacity).rgba;
          svgData = svgData.replace(/currentColor/g, trueRGBA);
          
          // 2. Sometimes SVG strokes are missed if they inherit.
          if (!svgData.includes('stroke=')) {
              svgData = svgData.replace('<svg', `<svg stroke="${trueRGBA}"`);
          }

          const svgBase64 = `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgData)))}`;
          
          slide.addImage({
            data: svgBase64,
            x: pxToIn(rect.left - parentRect.left),
            y: pxToIn(rect.top - parentRect.top),
            w: pxToIn(rect.width),
            h: pxToIn(rect.height)
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
       const textStr = tn.textContent?.replace(/\n/g, ' ') || '';
       if (rect.width === 0 || rect.height === 0 || textStr.trim().length === 0) return;

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
           textStr = textStr.replace(/\s+/g, ' '); // Collapse HTML whitespace naturally
           if (textStr.trim().length === 0) return;

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

           const textColor = parseColor(style.color, style.opacity);
           const rawFontSize = parseFloat(style.fontSize || '16');

           richTextObjects.push({
               text: textStr,
               options: {
                   color: textColor.color,
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
           
           slide.addText(richTextObjects, {
             x: pxToIn(minX - parentRect.left),
             y: pxToIn(minY - parentRect.top),
             w: Math.max(pxToIn(maxX - minX), 0.1) + 0.05, // Tight constraints bypasses flex/icon overlaps!
             h: Math.max(pxToIn(maxY - minY), 0.1) + 0.05,
             align: textAlign,
             valign: 'middle', // Keeps inline content tightly grouped
             margin: 0,
             wrap: true
           });
       }
    });

    pres.writeFile({ fileName: `Export_Slide_${Date.now()}.pptx` })
      .then(() => setIsExporting(false))
      .catch((e) => {
         console.error(e);
         setIsExporting(false);
      });
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

      return <Component />;
    } catch (err: any) {
      return <div className="text-red-500 font-mono p-4">Runtime Error: {err.message}</div>;
    }
  }, [transpiledCode]);

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar: Navigation */}
      <div className="w-16 border-r border-slate-800 flex flex-col items-center py-6 gap-8 bg-slate-950">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Layout className="text-white" size={24} />
        </div>
        <div className="flex flex-col gap-6">
          <button 
            onClick={() => setActiveTab('code')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'code' ? "bg-indigo-600/20 text-indigo-400" : "text-slate-500 hover:text-slate-300")}
          >
            <Code2 size={24} />
          </button>
          <button 
            onClick={() => setActiveTab('preview')}
            className={cn("p-3 rounded-xl transition-all", activeTab === 'preview' ? "bg-indigo-600/20 text-indigo-400" : "text-slate-500 hover:text-slate-300")}
          >
            <Play size={24} />
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
             <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 active:scale-95 px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border border-white/5">
                <Upload size={16} />
                上传 JSX
                <input type="file" accept=".jsx,.tsx,.js,.ts" className="hidden" onChange={handleFileUpload} />
             </label>
             <button 
                onClick={exportToPPTX}
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
                onChange={(value) => setCode(value || '')}
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
    </div>
  );
};

export default App;
