/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
// 导入图标：Code(代码)、Eye(预览)、RotateCcw(重新生成)、Download(导出)、ArrowLeft(返回)、PanelLeft(面板切换)、Plus(新建)
import { Code, Eye, RotateCcw, Download, ArrowLeft, PanelLeft, Plus } from 'lucide-react';
// 导入可拖拽调整大小的面板组件
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
// 导入画布比例类型和配置获取函数
import { CanvasRatio, getCanvasConfig } from '../../lib/canvas-config';
// 导入幻灯片渲染 hook：将 JSX 代码转为可渲染组件
import { useSlideRenderer } from '../../hooks/use-slide-renderer';
// 导入导出弹窗组件和导出模式类型
import { ExportModal, ExportMode } from '../export/ExportModal';
// 导入代码编辑器组件
import { CodeEditor } from '../editor/CodeEditor';
// 导入对话管理返回值类型
import { UseConversationReturn } from '../../lib/chat/use-conversation';
// 导入 AI 助手侧边栏组件
import AiAssistantSidebar from './AiAssistantSidebar';
// 导入对话列表侧边栏组件
import ConversationListSidebar from './ConversationListSidebar';

/** 幻灯片数据结构 */
interface Slide {
  id: string;
  name: string;
  code: string;
}

/** 工作区阶段组件属性接口 */
interface WorkspacePhaseProps {
  slides: Slide[];                             // 所有幻灯片数组
  currentSlideIndex: number;                   // 当前选中的幻灯片索引
  setCurrentSlideIndex: (index: number) => void;  // 设置当前幻灯片
  updateCurrentSlideCode: (code: string) => void;  // 更新当前幻灯片代码
  canvasRatio: CanvasRatio;                    // 画布比例
  monacoTheme: string;                         // Monaco 编辑器主题
  conversation: UseConversationReturn;         // 对话管理对象
  onSendMessage: (message: string) => void;    // 发送消息回调
  isGenerating: boolean;                       // 是否正在生成
  error: string | null;                        // 错误信息
  onRetry: () => void;                         // 重试回调
  onBack: () => void;                          // 返回入口回调
  onNewConversation: () => void;               // 新建对话回调
  onSwitchConversation: (id: string) => void;  // 切换对话回调
  onExportPPTX: (mode: 'all' | 'current' | 'range', startPage?: number, endPage?: number) => Promise<void>;  // 导出 PPTX
  onStopGenerate: () => void;                  // 停止生成回调
}

/**
 * 工作区阶段组件
 * 功能：
 * - 三栏布局：对话列表（可折叠）+ AI 助手 + 内容区
 * - 内容区支持预览/代码两种模式切换
 * - 幻灯片自动缩放适配容器大小
 * - 支持导出 PPTX 功能
 * - 支持对话管理和新建
 */
const WorkspacePhase: React.FC<WorkspacePhaseProps> = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  updateCurrentSlideCode,
  canvasRatio,
  monacoTheme,
  conversation,
  onSendMessage,
  isGenerating,
  error,
  onRetry,
  onBack,
  onNewConversation,
  onSwitchConversation,
  onExportPPTX,
  onStopGenerate,
}) => {
  // 当前激活的标签页：preview(预览) 或 code(代码)
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  // 预览缩放比例
  const [scale, setScale] = useState(0.75);
  // 是否显示对话列表面板
  const [showConversations, setShowConversations] = useState(true);
  // 预览容器引用
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 导出弹窗相关状态
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  const [exportRangeStart, setExportRangeStart] = useState(1);
  const [exportRangeEnd, setExportRangeEnd] = useState(1);
  const [exportSpecificPage, setExportSpecificPage] = useState(1);

  /** 打开导出弹窗：初始化导出参数 */
  const handleExportClick = () => {
    setExportRangeStart(1);
    setExportRangeEnd(slides.length);
    setExportSpecificPage(currentSlideIndex + 1);
    setShowExportModal(true);
  };

  /**
   * 确认导出：根据导出模式执行对应的导出操作
   * - current：导出指定页
   * - range：导出指定范围
   * - all：导出全部
   */
  const handleConfirmExport = async () => {
    setIsExporting(true);
    try {
      if (exportMode === 'current') {
        const pageIndex = exportSpecificPage - 1;
        setCurrentSlideIndex(pageIndex);
        await new Promise(resolve => setTimeout(resolve, 100));
        await onExportPPTX('current');
      } else if (exportMode === 'range') {
        const start = Math.min(exportRangeStart, exportRangeEnd);
        const end = Math.max(exportRangeStart, exportRangeEnd);
        await onExportPPTX('range', start, end);
      } else {
        await onExportPPTX('all');
      }
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // 获取当前幻灯片的代码
  const currentCode = slides[currentSlideIndex]?.code || '';
  // 使用幻灯片渲染 hook 获取渲染组件和错误信息
  const { error: renderError, RenderedSlide } = useSlideRenderer(currentCode);
  // 获取当前画布配置（宽度、高度等）
  const canvasConfig = getCanvasConfig(canvasRatio);

  // 获取当前消息链（过滤掉 system 消息用于显示）
  const displayMessages = useMemo(() => {
    return conversation.currentChain.filter(m => m.role !== 'system');
  }, [conversation.currentChain]);

  // 使用 ResizeObserver 自动计算预览缩放比例，使幻灯片适配容器
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(entry.contentRect.width / canvasConfig.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasConfig.width]);

  return (
    <div className="h-full">
    {/* 水平可拖拽面板组 */}
    <PanelGroup orientation="horizontal" className="h-full" style={{ height: '100%' }}>
      {/* 左侧：对话列表面板（可折叠） */}
      {showConversations && (
        <>
          <Panel defaultSize="15%" minSize="12%" maxSize="25%" className="overflow-hidden">
            <div
              className="border-r flex flex-col h-full overflow-hidden"
              style={{
                borderColor: 'var(--border-subtle)',
                background: 'var(--bg-sidebar)',
              }}
            >
              <ConversationListSidebar
                conversations={conversation.conversations}
                activeId={conversation.activeId}
                onSwitch={onSwitchConversation}
                onCreate={onNewConversation}
                onDelete={conversation.deleteConversation}
                onRename={conversation.renameConversation}
              />
            </div>
          </Panel>
          {/* 面板拖拽分隔条 */}
          <PanelResizeHandle className="w-[3px] hover:w-[5px] transition-all cursor-col-resize" style={{ background: 'var(--border-subtle)' }} />
        </>
      )}

      {/* 中间：AI 助手面板 */}
      <Panel defaultSize={showConversations ? '25%' : '30%'} minSize="20%" maxSize="45%" className="overflow-hidden">
        <div
          className="border-r flex flex-col h-full overflow-hidden"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-sidebar)',
          }}
        >
          {/* 工具栏：切换对话列表 + 新建对话按钮 */}
          <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="p-1 rounded-md transition-all cursor-pointer hover:opacity-80"
              style={{ color: showConversations ? 'var(--accent)' : 'var(--text-muted)' }}
              title={showConversations ? '隐藏对话列表' : '显示对话列表'}
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNewConversation}
              className="p-1 rounded-md transition-all cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="新建对话"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <AiAssistantSidebar
            messages={displayMessages}
            onSendMessage={onSendMessage}
            isGenerating={isGenerating}
            error={error}
            onRetry={onRetry}
            onStopGenerate={onStopGenerate}
            canvasRatio={canvasRatio}
            welcomeMessage="描述你想要的幻灯片，AI 将为你生成"
          />
        </div>
      </Panel>

      {/* 右侧面板分隔条 */}
      <PanelResizeHandle className="w-[3px] hover:w-[5px] transition-all cursor-col-resize" style={{ background: 'var(--border-subtle)' }} />

      {/* 右侧：内容区域（预览/代码切换） */}
      <Panel defaultSize={showConversations ? '60%' : '70%'} minSize="45%" className="overflow-hidden">
        <div className="flex flex-col h-full overflow-hidden">
        {/* 顶部控制栏：返回按钮、标签切换、操作按钮 */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-header)' }}
        >
          <div className="flex items-center gap-2">
            {/* 返回入口按钮 */}
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="返回入口"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* 预览/代码标签切换 */}
            <div
              className="flex items-center p-0.5 rounded-lg border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeTab === 'preview' ? 'var(--bg-button)' : 'transparent',
                  color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <Eye className="w-3 h-3" />
                预览
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap"
                style={{
                  background: activeTab === 'code' ? 'var(--bg-button)' : 'transparent',
                  color: activeTab === 'code' ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                <Code className="w-3 h-3" />
                代码
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 重新生成按钮（生成完成后显示） */}
            {!isGenerating && (
              <button
                onClick={onRetry}
                className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
                title="重新生成"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {/* 导出按钮 */}
            <button
              onClick={handleExportClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
              style={{
                background: 'var(--accent)',
                color: 'var(--text-inverse)',
              }}
            >
              <Download className="w-3 h-3" />
              导出
            </button>
          </div>
        </div>

        {/* 幻灯片缩略图条：多张幻灯片时显示 */}
        {slides.length > 1 && (
          <div
            className="flex gap-2 px-4 py-2 border-b overflow-x-auto shrink-0"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-sidebar)' }}
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap"
                style={{
                  background: idx === currentSlideIndex ? 'var(--accent-bg)' : 'transparent',
                  color: idx === currentSlideIndex ? 'var(--accent)' : 'var(--text-muted)',
                  border: idx === currentSlideIndex ? '1px solid var(--accent)' : '1px solid transparent',
                }}
              >
                {slide.name || `第 ${idx + 1} 页`}
              </button>
            ))}
          </div>
        )}

        {/* 主内容区域：预览或代码编辑器 */}
        <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--bg-main)' }}>
          {/* 预览模式：使用 CSS transform 缩放 */}
          <div
            className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 ${
              activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
            }`}
            style={{ background: 'var(--bg-preview-canvas)' }}
          >
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-lg"
              style={{
                width: canvasConfig.width * scale,
                height: canvasConfig.height * scale,
                boxShadow: 'var(--shadow-preview)',
              }}
            >
              <div
                ref={previewRef}
                style={{
                  width: canvasConfig.width,
                  height: canvasConfig.height,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                {renderError ? (
                  /* 渲染错误显示 */
                  <div className="w-full h-full flex items-center justify-center p-8" style={{ background: 'var(--bg-card)' }}>
                    <div className="text-center">
                      <p className="text-sm font-medium mb-2" style={{ color: '#EF4444' }}>
                        渲染错误
                      </p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {renderError}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* 正常渲染幻灯片 */
                  <RenderedSlide />
                )}
              </div>
            </div>
          </div>

          {/* 代码模式：Monaco 编辑器 */}
          <div
            className={`absolute inset-0 flex flex-col transition-opacity duration-300 ${
              activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
            }`}
          >
            <CodeEditor
              code={currentCode || '// 等待生成...'}
              onChange={updateCurrentSlideCode}
              monacoTheme={monacoTheme}
            />
          </div>
        </div>
        </div>
      </Panel>
    </PanelGroup>

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
      currentSlideIndex={currentSlideIndex}
      totalSlides={slides.length}
      currentSlideName={slides[currentSlideIndex]?.name || ''}
      onExport={handleConfirmExport}
    />
    </div>
  );
};

export default WorkspacePhase;
