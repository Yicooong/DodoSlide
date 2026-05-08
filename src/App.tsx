/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// React 核心 hooks
import React, { useState, useRef, useCallback, useEffect } from 'react';
// 动画库
import { motion, AnimatePresence } from 'motion/react';
// 可调整大小的面板组件
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle, usePanelRef } from 'react-resizable-panels';
// PPTX 生成库
import pptxgen from 'pptxgenjs';

// Hooks - 自定义状态管理
import { useSlides, Slide } from './hooks/use-slides';
import { useAppState } from './hooks/use-app-state';
import { useSlideRenderer } from './hooks/use-slide-renderer';
import { useAiGeneration } from './lib/use-ai-generation';

// Components - UI 组件
import { SlideSidebar } from './components/slide/SlideSidebar';
import { CodeEditor } from './components/editor/CodeEditor';
import { SlidePreview } from './components/preview/SlidePreview';
import { AppHeader } from './components/header/AppHeader';
import { ExportModal, ExportMode } from './components/export/ExportModal';
import { SettingsModal } from './components/SettingsModal';
import LandingPage from './components/landing/LandingPage';
import AiGeneratePage from './components/ai-generate/AiGeneratePage';

// Libs - 工具库
import { CANVAS_CONFIGS, CanvasConfig } from './lib/canvas-config';
import { THEME_CONFIGS, ThemeConfig } from './lib/theme-config';
import { exportSingleSlide, exportSlideByCode } from './lib/pptx-exporter';

// Utils - 工具函数
import { cn } from './lib/utils';

// Inspector - 预览到代码编辑系统
import { InspectorProvider, InspectOverlay, useInspector } from './components/inspector';

// Present - 演示模式
import { Player } from './components/present/Player';

// Design - 设计系统
import { DesignProvider } from './components/design/DesignProvider';
import { DesignPanel } from './components/design/DesignPanel';

/**
 * Inspector 包装组件
 * 连接 SlidePreview、InspectOverlay 和 Inspector 切换按钮
 * 必须在 InspectorProvider 内部使用
 */
const InspectorWrapper: React.FC<{
  canvasConfig: CanvasConfig;
  scale: number;
  error: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
  previewRef: React.RefObject<HTMLDivElement>;
  onScaleChange: (scale: number) => void;
  RenderedSlide: React.FC;
}> = ({ canvasConfig, scale, error, containerRef, previewRef, onScaleChange, RenderedSlide }) => {
  useInspector();

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        <SlidePreview
          canvasConfig={canvasConfig}
          scale={scale}
          error={error}
          containerRef={containerRef}
          previewRef={previewRef}
          onScaleChange={onScaleChange}
        >
          <RenderedSlide />
        </SlidePreview>
        <InspectOverlay />
      </div>
    </div>
  );
};

/**
 * 主应用组件
 * 负责管理应用状态、视图切换、幻灯片编辑/预览、导出等功能
 */
const App = () => {
  // ========== Hooks 初始化 ==========
  // 应用全局状态（视图类型、主题、画布比例等）
  const appState = useAppState();
  // 幻灯片管理（增删改查、当前索引等）
  const slidesHook = useSlides(appState.canvasRatio);
  // 获取当前幻灯片的代码
  const currentCode = slidesHook.slides[slidesHook.currentSlideIndex]?.code || '';
  // JSX 转译器，将幻灯片代码转换为可渲染的 React 组件
  const { transpiledCode, error, RenderedSlide } = useSlideRenderer(currentCode);
  // AI 生成相关功能
  const aiGen = useAiGeneration();

  // ========== Refs ==========
  // 容器引用，用于计算缩放比例
  const containerRef = useRef<HTMLDivElement>(null);
  // 预览区域引用，用于导出时获取 DOM
  const previewRef = useRef<HTMLDivElement>(null);
  // 侧边栏面板引用，用于命令式折叠/展开
  const sidebarPanelRef = usePanelRef();
  // 设计面板面板引用，用于命令式折叠/展开
  const designPanelRef = usePanelRef();

  // ========== Local State ==========
  // 画布缩放比例
  const [scale, setScale] = useState(0.75);
  // 是否正在导出
  const [isExporting, setIsExporting] = useState(false);
  // 是否显示导出弹窗
  const [showExportModal, setShowExportModal] = useState(false);
  // 导出模式：'current' | 'all' | 'range'
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  // 导出范围起始页
  const [exportRangeStart, setExportRangeStart] = useState(1);
  // 导出范围结束页
  const [exportRangeEnd, setExportRangeEnd] = useState(1);
  // 导出指定页码
  const [exportSpecificPage, setExportSpecificPage] = useState(1);
  // 是否显示设置弹窗
  const [showSettings, setShowSettings] = useState(false);
  // 设计面板是否折叠
  const [designPanelCollapsed, setDesignPanelCollapsed] = useState(false);

  // 当当前幻灯片变化时更新代码（由渲染器处理）
  useEffect(() => {
    // Code is already updated by the render
  }, [slidesHook.currentSlideIndex, slidesHook.slides]);

  // ========== 事件处理函数 ==========
  
  /**
   * 处理文件上传
   * 读取上传的文本文件并更新当前幻灯片代码
   */
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

  /**
   * 导出为 PPTX 文件
   * 支持三种模式：当前幻灯片、指定范围、全部幻灯片
   */
  const exportToPPTX = async (mode: ExportMode, startPage?: number, endPage?: number) => {
    setIsExporting(true);

    try {
      if (mode === 'current') {
        // 仅导出当前幻灯片
        const pres = new pptxgen();
        pres.layout = appState.canvasConfig.pptxLayout as any;

        await exportSingleSlide(pres, slidesHook.slides[slidesHook.currentSlideIndex]?.code || '', slidesHook.slides[slidesHook.currentSlideIndex]?.name || 'Slide', previewRef.current, appState.canvasConfig, scale);

        await pres.writeFile({ fileName: `Slide_${slidesHook.slides[slidesHook.currentSlideIndex].name}_${Date.now()}.pptx` });
      } else if (mode === 'range' && startPage !== undefined && endPage !== undefined) {
        // 导出指定范围的幻灯片
        const pres = new pptxgen();
        pres.layout = appState.canvasConfig.pptxLayout as any;

        const start = Math.max(1, startPage) - 1; // 转换为 0 基索引
        const end = Math.min(slidesHook.slides.length, endPage);

        for (let i = start; i < end; i++) {
          const slide = slidesHook.slides[i];
          await exportSlideByCode(pres, slide.code, slide.name, appState.canvasConfig);
        }

        await pres.writeFile({ fileName: `Presentation_Slides_${startPage}-${endPage}_${Date.now()}.pptx` });
      } else {
        // 导出全部幻灯片
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

  /**
   * 处理导出按钮点击
   * 初始化导出参数并显示弹窗
   */
  const handleExportClick = () => {
    setExportRangeStart(1);
    setExportRangeEnd(slidesHook.slides.length);
    setExportSpecificPage(slidesHook.currentSlideIndex + 1);
    setShowExportModal(true);
  };

  /**
   * 处理画布比例变化
   */
  const handleCanvasRatioChange = (ratio: string) => {
    appState.setCanvasRatio(ratio as any);
  };

  /**
   * 处理主题变化
   */
  const handleThemeChange = (theme: string) => {
    appState.setAppTheme(theme as any);
  };

  /**
   * 处理确认导出
   * 根据导出模式执行相应的导出逻辑
   */
  const handleConfirmExport = () => {
    if (exportMode === 'current') {
      // 先跳转到指定页，然后导出
      const pageIndex = exportSpecificPage - 1;
      slidesHook.setCurrentSlideIndex(pageIndex);
      // 等待状态更新后导出
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

  /**
   * 处理从着陆页导航
   * 切换视图类型并设置相应的标签页
   */
  const handleNavigate = (view: 'landing' | 'ai-generate' | 'code' | 'preview') => {
    appState.setViewType(view);
    if (view === 'code' || view === 'preview') {
      appState.setActiveTab('preview');
    }
  };

  // ========== 渲染逻辑 ==========

  // 渲染演示模式
  if (appState.presenting) {
    return (
      <Player
        slides={slidesHook.slides}
        initialIndex={slidesHook.currentSlideIndex}
        canvasConfig={appState.canvasConfig}
        onExit={() => appState.setPresenting(false)}
      />
    );
  }

  // 渲染着陆页
  if (appState.viewType === 'landing') {
    return (
      <div className={appState.themeConfig.rootClass} style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>
        <LandingPage onNavigate={handleNavigate} />
      </div>
    );
  }

  // 渲染 AI 生成页
  if (appState.viewType === 'ai-generate') {
    return (
      <div className={appState.themeConfig.rootClass} style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>
        <AiGeneratePage
          onNavigate={handleNavigate}
          onExportPPTX={exportToPPTX}
          onStopGenerate={aiGen.stopGenerate}
          aiGen={aiGen}
          canvasRatio={appState.canvasRatio}
          setCanvasRatio={handleCanvasRatioChange}
          monacoTheme={appState.themeConfig.monacoTheme}
          slidesHook={slidesHook}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
        />
        {/* 设置弹窗 */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          providerManager={aiGen.providerManager}
          promptSettings={aiGen.promptSettings}
          onUpdatePromptSettings={aiGen.updatePromptSettings}
        />
      </div>
    );
  }

  // 渲染主编辑器/预览界面
  return (
    <div className={`h-screen overflow-hidden font-sans ${appState.themeConfig.rootClass}`} style={{ background: 'var(--bg-root)', color: 'var(--text-primary)' }}>
      <DesignProvider>
          <InspectorProvider
            currentCode={currentCode}
            onCodeChange={slidesHook.updateCurrentSlideCode}
          >
            <PanelGroup orientation="horizontal" style={{ height: '100%' }}>
            {/* 左侧边栏：幻灯片缩略图 */}
            <Panel
              panelRef={sidebarPanelRef}
              id="sidebar"
              defaultSize={18}
              minSize={12}
              maxSize="30%"
              collapsible
              collapsedSize={48}
              className="overflow-hidden"
            >
              <SlideSidebar
                slides={slidesHook.slides}
                currentSlideIndex={slidesHook.currentSlideIndex}
                canvasRatio={appState.canvasRatio}
                collapsed={appState.sidebarCollapsed}
                onToggleCollapse={() => {
                  if (appState.sidebarCollapsed) {
                    sidebarPanelRef.current?.expand();
                    appState.setSidebarCollapsed(false);
                  } else {
                    sidebarPanelRef.current?.collapse();
                    appState.setSidebarCollapsed(true);
                  }
                }}
                onSelectSlide={slidesHook.setCurrentSlideIndex}
                onAddSlide={slidesHook.addNewSlide}
                onDeleteSlide={slidesHook.deleteSlide}
                onRenameSlide={slidesHook.renameSlide}
                onDuplicateSlide={slidesHook.duplicateSlide}
              />
            </Panel>

            {/* 面板调整手柄（左侧） */}
            <PanelResizeHandle disabled={appState.sidebarCollapsed} className="w-[3px] hover:w-[5px] transition-all cursor-col-resize" style={{ background: 'var(--border-subtle)' }} />

            {/* 中栏：预览/编辑器 */}
            <Panel defaultSize={57} minSize={40} className="overflow-hidden">
              <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-main)' }}>
                {/* 顶部导航栏 */}
                <AppHeader
                  activeTab={appState.activeTab}
                  setActiveTab={appState.setActiveTab}
                  canvasRatio={appState.canvasRatio}
                  setCanvasRatio={handleCanvasRatioChange}
                  canvasConfigs={Object.values(CANVAS_CONFIGS) as CanvasConfig[]}
                  appTheme={appState.appTheme}
                  setAppTheme={handleThemeChange}
                  themeConfigs={Object.values(THEME_CONFIGS) as ThemeConfig[]}
                  isGenerating={aiGen.isGenerating}
                  showSettings={showSettings}
                  setShowSettings={setShowSettings}
                  onUpload={handleFileUpload}
                  onExport={handleExportClick}
                  onNavigateToAi={() => appState.setViewType('ai-generate')}
                  onPresent={() => appState.setPresenting(true)}
                />

                {/* 工作区容器 */}
                <main className="flex-grow relative overflow-hidden">
                  {/* 视图：代码编辑器 */}
                  <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", appState.activeTab === 'code' ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none")}>
                    <CodeEditor
                      code={slidesHook.slides[slidesHook.currentSlideIndex]?.code || ''}
                      onChange={slidesHook.updateCurrentSlideCode}
                      monacoTheme={appState.themeConfig.monacoTheme}
                    />
                  </div>

                  {/* 视图：预览 */}
                  <div className={cn("absolute inset-0 flex flex-col transition-opacity duration-300", appState.activeTab === 'preview' ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none")} style={{ background: 'var(--bg-preview-canvas)' }}>
                    <InspectorWrapper
                      canvasConfig={appState.canvasConfig}
                      scale={scale}
                      error={error}
                      containerRef={containerRef}
                      previewRef={previewRef}
                      onScaleChange={setScale}
                      RenderedSlide={RenderedSlide}
                    />
                  </div>
                </main>
              </div>
            </Panel>

            {/* 面板调整手柄（右侧） */}
            <PanelResizeHandle disabled={designPanelCollapsed} className="w-[3px] hover:w-[5px] transition-all cursor-col-resize" style={{ background: 'var(--border-subtle)' }} />

            {/* 右栏：设计面板 */}
            <Panel
              panelRef={designPanelRef}
              id="design"
              defaultSize={18}
              minSize={12}
              maxSize="25%"
              collapsible
              collapsedSize={48}
              className="overflow-hidden"
            >
              <DesignPanel
                collapsed={designPanelCollapsed}
                onToggleCollapse={() => {
                  if (designPanelCollapsed) {
                    designPanelRef.current?.expand();
                    setDesignPanelCollapsed(false);
                  } else {
                    designPanelRef.current?.collapse();
                    setDesignPanelCollapsed(true);
                  }
                }}
              />
            </Panel>
          </PanelGroup>
        </InspectorProvider>
      </DesignProvider>

      {/* 设置弹窗 */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        providerManager={aiGen.providerManager}
        promptSettings={aiGen.promptSettings}
        onUpdatePromptSettings={aiGen.updatePromptSettings}
      />

      {/* 导出弹窗 */}
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
