import React, { useState, useEffect, useRef } from 'react';
import { Code, Eye, RotateCcw, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CanvasRatio, getCanvasConfig } from '../../lib/canvas-config';
import { useSlideRenderer } from '../../hooks/use-slide-renderer';
import AiAssistantSidebar from './AiAssistantSidebar';

interface Slide {
  id: string;
  name: string;
  code: string;
}

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface WorkspacePhaseProps {
  slides: Slide[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  updateCurrentSlideCode: (code: string) => void;
  canvasRatio: CanvasRatio;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  generationProgress?: { current: number; total: number };
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onExport: () => void;
}

const WorkspacePhase: React.FC<WorkspacePhaseProps> = ({
  slides,
  currentSlideIndex,
  setCurrentSlideIndex,
  updateCurrentSlideCode,
  canvasRatio,
  messages,
  onSendMessage,
  isGenerating,
  generationProgress,
  error,
  onRetry,
  onBack,
  onExport,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [scale, setScale] = useState(0.75);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const currentCode = slides[currentSlideIndex]?.code || '';
  const { error: renderError, RenderedSlide } = useSlideRenderer(currentCode);
  const canvasConfig = getCanvasConfig(canvasRatio);

  // Auto-scale preview
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
    <div className="flex h-full">
      {/* Left: AI Sidebar (30%) */}
      <motion.div
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '30%', opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="border-r flex flex-col h-full overflow-hidden shrink-0"
        style={{
          borderColor: 'var(--border-subtle)',
          background: 'var(--bg-sidebar)',
        }}
      >
        <AiAssistantSidebar
          messages={messages}
          onSendMessage={onSendMessage}
          isGenerating={isGenerating}
          generationProgress={generationProgress}
          error={error}
          onRetry={onRetry}
          canvasRatio={canvasRatio}
        />
      </motion.div>

      {/* Right: Content Area (70%) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex-1 flex flex-col h-full overflow-hidden"
      >
        {/* Top control bar */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b shrink-0"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-header)' }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="返回入口"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Tab switcher */}
            <div
              className="flex items-center p-0.5 rounded-lg border"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => setActiveTab('preview')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
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
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all"
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

          <div className="flex items-center gap-2">
            {isGenerating && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Loader2 className="w-3 h-3 animate-spin" />
                生成中...
              </div>
            )}
            <button
              onClick={onRetry}
              disabled={isGenerating}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80 disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
              title="重新生成"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
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

        {/* Slide thumbnails strip */}
        {slides.length > 1 && (
          <div
            className="flex gap-2 px-4 py-2 border-b overflow-x-auto shrink-0"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-sidebar)' }}
          >
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
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

        {/* Main content area */}
        <div className="flex-1 overflow-hidden relative" style={{ background: 'var(--bg-main)' }}>
          {/* Preview mode */}
          <div
            className={`absolute inset-0 flex items-center justify-center p-8 transition-opacity duration-300 ${
              activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
            }`}
            style={{ background: 'var(--bg-preview)' }}
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
                  <RenderedSlide />
                )}
              </div>
            </div>
          </div>

          {/* Code mode */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              activeTab === 'code' ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'
            }`}
          >
            <div className="h-full overflow-auto p-4">
              <pre
                className="text-xs leading-relaxed font-mono whitespace-pre-wrap"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentCode || '// 等待生成...'}
              </pre>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkspacePhase;
