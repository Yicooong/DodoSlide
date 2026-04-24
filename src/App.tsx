/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import pptxgen from 'pptxgenjs';

// Hooks
import { useSlides, Slide } from './hooks/use-slides';
import { useAppState } from './hooks/use-app-state';
import { useSlideRenderer } from './hooks/use-slide-renderer';
import { useAiGeneration } from './lib/use-ai-generation';

// Components
import { SlideSidebar } from './components/slide/SlideSidebar';
import { CodeEditor } from './components/editor/CodeEditor';
import { SlidePreview } from './components/preview/SlidePreview';
import { AppHeader } from './components/header/AppHeader';
import { ExportModal, ExportMode } from './components/export/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import { AiGenerationPanel } from './components/AiGenerationPanel';

// Libs
import { CANVAS_CONFIGS, CanvasConfig } from './lib/canvas-config';
import { THEME_CONFIGS, ThemeConfig } from './lib/theme-config';
import { exportSingleSlide, exportSlideByCode } from './lib/pptx-exporter';

// Utils
import { cn } from './lib/utils';

const App = () => {
  // Hooks
  const slidesHook = useSlides();
  const appState = useAppState();
  const currentCode = slidesHook.slides[slidesHook.currentSlideIndex]?.code || '';
  const { transpiledCode, error, RenderedSlide } = useSlideRenderer(currentCode);
  const aiGen = useAiGeneration();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Local state
  const [scale, setScale] = useState(0.75);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  const [exportRangeStart, setExportRangeStart] = useState(1);
  const [exportRangeEnd, setExportRangeEnd] = useState(1);
  const [exportSpecificPage, setExportSpecificPage] = useState(1);
  const [showAiInput, setShowAiInput] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Update code when current slide changes
  useEffect(() => {
    // Code is already updated by the render
  }, [slidesHook.currentSlideIndex, slidesHook.slides]);

  // Handle scale update
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(entry.contentRect.width / appState.canvasConfig.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [appState.canvasRatio, appState.canvasConfig]);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) slidesHook.updateCurrentSlideCode(content);
      };
      reader.readAsText(file);
    }
  };

  // Handle AI Generation
  const handleAiGenerate = async (userInput: string, styleId: string = 'modern') => {
    const styleInstructions: Record<string, string> = {
      modern: '使用现代简约的设计风格，白色背景，深色文字，简洁的布局',
      tech: '使用科技感的设计风格，蓝色为主色调，包含科技元素图标',
      creative: '使用创意活泼的设计风格，鲜艳的色彩，动态的布局',
      professional: '使用专业严谨的设计风格，简洁的配色，清晰的层次',
      elegant: '使用优雅典雅的设计风格，柔和的色调，精致的排版',
    };

    const stylePrompt = styleInstructions[styleId] || '';
    const enhancedPrompt = stylePrompt ? `${userInput}\n\n设计要求：${stylePrompt}` : userInput;

    const result = await aiGen.generate(enhancedPrompt);
    if (result.success && result.code) {
      slidesHook.updateCurrentSlideCode(result.code);
    }
    return result;
  };

  // Handle AI Replace
  const handleAiReplace = (code: string) => {
    slidesHook.updateCurrentSlideCode(code);
    appState.setActiveTab('code');
  };

  // Main export function supporting both current and all slides
  const exportToPPTX = async (mode: ExportMode, startPage?: number, endPage?: number) => {
    setIsExporting(true);

    try {
      if (mode === 'current') {
        // Export only current slide
        const pres = new pptxgen();
        pres.layout = appState.canvasConfig.pptxLayout as any;

        await exportSingleSlide(pres, slidesHook.slides[slidesHook.currentSlideIndex].code, slidesHook.slides[slidesHook.currentSlideIndex].name, previewRef.current, appState.canvasConfig, scale);

        await pres.writeFile({ fileName: `Slide_${slidesHook.slides[slidesHook.currentSlideIndex].name}_${Date.now()}.pptx` });
      } else if (mode === 'range' && startPage !== undefined && endPage !== undefined) {
        // Export range of slides
        const pres = new pptxgen();
        pres.layout = appState.canvasConfig.pptxLayout as any;

        const start = Math.max(1, startPage) - 1; // Convert to 0-based index
        const end = Math.min(slidesHook.slides.length, endPage);

        for (let i = start; i < end; i++) {
          const slide = slidesHook.slides[i];
          await exportSlideByCode(pres, slide.code, slide.name, appState.canvasConfig);
        }

        await pres.writeFile({ fileName: `Presentation_Slides_${startPage}-${endPage}_${Date.now()}.pptx` });
      } else {
        // Export all slides
        const pres = new pptxgen();
        pres.layout = appState.canvasConfig.pptxLayout as any;

        for (let i = 0; i < slidesHook.slides.length; i++) {
          const slide = slidesHook.slides[i];
          await exportSlideByCode(pres, slide.code, slide.name, appState.canvasConfig);
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

  // Handle export button click
  const handleExportClick = () => {
    setExportRangeStart(1);
    setExportRangeEnd(slidesHook.slides.length);
    setExportSpecificPage(slidesHook.currentSlideIndex + 1);
    setShowExportModal(true);
  };

  // Handle canvas ratio change
  const handleCanvasRatioChange = (ratio: string) => {
    appState.setCanvasRatio(ratio as any);
  };

  // Handle theme change
  const handleThemeChange = (theme: string) => {
    appState.setAppTheme(theme as any);
  };

  // Handle confirm export
  const handleConfirmExport = () => {
    if (exportMode === 'current') {
      // Navigate to the specified page first, then export
      const pageIndex = exportSpecificPage - 1;
      slidesHook.setCurrentSlideIndex(pageIndex);
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
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans ${appState.themeConfig.rootClass}`} style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>

      {/* Left Sidebar: Slide Thumbnails */}
      <SlideSidebar
        slides={slidesHook.slides}
        currentSlideIndex={slidesHook.currentSlideIndex}
        canvasRatio={appState.canvasRatio}
        collapsed={appState.sidebarCollapsed}
        onToggleCollapse={() => appState.setSidebarCollapsed(!appState.sidebarCollapsed)}
        onSelectSlide={slidesHook.setCurrentSlideIndex}
        onAddSlide={slidesHook.addNewSlide}
        onDeleteSlide={slidesHook.deleteSlide}
        onRenameSlide={slidesHook.renameSlide}
        onDuplicateSlide={slidesHook.duplicateSlide}
      />

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-main)' }}>

        {/* Header Bar */}
        <AppHeader
          activeTab={appState.activeTab}
          setActiveTab={appState.setActiveTab}
          canvasRatio={appState.canvasRatio}
          setCanvasRatio={handleCanvasRatioChange}
          canvasConfigs={Object.values(CANVAS_CONFIGS) as CanvasConfig[]}
          appTheme={appState.appTheme}
          setAppTheme={handleThemeChange}
          themeConfigs={Object.values(THEME_CONFIGS) as ThemeConfig[]}
          showAiInput={showAiInput}
          setShowAiInput={setShowAiInput}
          isGenerating={aiGen.isGenerating}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onUpload={handleFileUpload}
          onExport={handleExportClick}
        />

        {/* Workspace Container */}
        <main className="flex-grow relative overflow-hidden">

          {/* View: Editor */}
          <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", appState.activeTab === 'code' ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none")}>
            <CodeEditor
              code={slidesHook.slides[slidesHook.currentSlideIndex]?.code || ''}
              onChange={slidesHook.updateCurrentSlideCode}
              monacoTheme={appState.themeConfig.monacoTheme}
            />
          </div>

          {/* View: Preview */}
          <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", appState.activeTab === 'preview' ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none")} style={{ background: 'var(--bg-preview)' }}>
            <SlidePreview
              canvasConfig={appState.canvasConfig}
              scale={scale}
              error={error}
              containerRef={containerRef}
              previewRef={previewRef}
              onScaleChange={setScale}
            >
              {RenderedSlide()}
            </SlidePreview>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiSettings={aiGen.apiSettings}
        onUpdateApiSettings={aiGen.updateApiSettings}
        promptSettings={aiGen.promptSettings}
        onUpdatePromptSettings={aiGen.updatePromptSettings}
      />

      {/* AI Generation Panel */}
      <AiGenerationPanel
        isVisible={showAiInput}
        onClose={() => {
          setShowAiInput(false);
          aiGen.clearError();
        }}
        onGenerate={handleAiGenerate}
        onReplace={handleAiReplace}
        isGenerating={aiGen.isGenerating}
        error={aiGen.error}
        promptSettings={aiGen.promptSettings}
        onUpdatePromptSettings={aiGen.updatePromptSettings}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        isExporting={isExporting}
        exportMode={exportMode}
        setExportMode={setExportMode}
        exportRangeStart={exportRangeStart}
        setExportRangeStart={setExportRangeStart}
        exportRangeEnd={exportRangeEnd}
        setExportRangeEnd={setExportRangeEnd}
        exportSpecificPage={exportSpecificPage}
        setExportSpecificPage={setExportSpecificPage}
        currentSlideIndex={slidesHook.currentSlideIndex}
        totalSlides={slidesHook.slides.length}
        currentSlideName={slidesHook.slides[slidesHook.currentSlideIndex]?.name || ''}
        onExport={handleConfirmExport}
      />
    </div>
  );
};

export default App;
