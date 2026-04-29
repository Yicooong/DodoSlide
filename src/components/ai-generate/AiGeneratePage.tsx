import React, { useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../../hooks/use-app-state';
import { CanvasRatio } from '../../lib/canvas-config';
import { AiGenerationState } from '../../lib/use-ai-generation';
import { buildStylePrompt } from '../../lib/prompt-manager';
import { getStylePrompt } from '../../prompts/templates/index';
import EntryPhase from './EntryPhase';
import WorkspacePhase from './WorkspacePhase';

interface AiGeneratePageProps {
  onNavigate: (view: ViewType) => void;
  aiGen: AiGenerationState & {
    generate: (userInput: string, canvasRatio?: CanvasRatio) => Promise<{ success: boolean; code?: string; error?: string }>;
    clearError: () => void;
    promptSettings: any;
  };
  canvasRatio: CanvasRatio;
  setCanvasRatio: (ratio: string) => void;
  slidesHook: {
    slides: Array<{ id: string; name: string; code: string }>;
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;
    updateCurrentSlideCode: (code: string) => void;
    addNewSlide: () => void;
    setSlideCode: (index: number, code: string) => void;
    setSlidesBulk: (slides: Array<{ id: string; name: string; code: string }>) => void;
  };
}

export type GenerationMode = 'guided' | 'direct';

export interface GenerationContext {
  purpose?: string;
  scenario?: string;
  tone?: string;
  memory?: string;
  preference?: string;
  directInput?: string;
  selectedStyle?: string;
  selectedTemplate?: string;
  pageCount?: number;
  canvasRatio?: '16:9' | '4:3';
}

type Phase = 'entry' | 'workspace';

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

const AiGeneratePage: React.FC<AiGeneratePageProps> = ({
  onNavigate,
  aiGen,
  canvasRatio,
  slidesHook,
}) => {
  const [phase, setPhase] = useState<Phase>('entry');
  const [context, setContext] = useState<GenerationContext>({
    pageCount: 10,
    canvasRatio: '16:9',
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [multiProgress, setMultiProgress] = useState<{ current: number; total: number } | undefined>();

  const handleContextUpdate = (updates: Partial<GenerationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  const handleStartGenerate = useCallback(async () => {
    const prompt = context.directInput || buildGuidedPrompt(context);
    if (!prompt) return;

    const selectedRatio = context.canvasRatio || canvasRatio;
    const pageCount = context.pageCount || 10;
    const styleId = context.selectedStyle || 'modern';

    // Add user message
    setMessages([{ role: 'user', content: prompt }]);

    // Transition to workspace
    setPhase('workspace');

    if (pageCount > 1) {
      // Multi-slide generation
      await generateMultiSlides(prompt, pageCount, styleId, selectedRatio);
    } else {
      // Single slide generation
      await generateSingleSlide(prompt, styleId, selectedRatio);
    }
  }, [context, canvasRatio, aiGen]);

  const generateSingleSlide = async (prompt: string, styleId: string, ratio: CanvasRatio) => {
    const stylePrompt = getStylePrompt(styleId);
    const enhancedPrompt = stylePrompt
      ? `${prompt}\n\n设计要求：\n${stylePrompt}`
      : prompt;

    const result = await aiGen.generate(enhancedPrompt, ratio);
    if (result.success && result.code) {
      slidesHook.updateCurrentSlideCode(result.code);
      setMessages(prev => [...prev, { role: 'ai', content: '幻灯片已生成！你可以在右侧预览效果，或告诉我需要修改的地方。' }]);
    } else {
      setMessages(prev => [...prev, { role: 'ai', content: `生成失败：${result.error || '未知错误'}` }]);
    }
  };

  const generateMultiSlides = async (
    prompt: string,
    pageCount: number,
    styleId: string,
    ratio: CanvasRatio
  ) => {
    const stylePrompt = getStylePrompt(styleId);
    const generated: Array<{ id: string; name: string; code: string }> = [];

    setMultiProgress({ current: 0, total: pageCount });

    for (let i = 0; i < pageCount; i++) {
      setMultiProgress({ current: i, total: pageCount });

      const summary = generated.length > 0
        ? generated.map((s, idx) => `第${idx + 1}页：${s.name}`).join('；')
        : '';

      const slidePrompt = `${prompt}\n\n这是第 ${i + 1} 页，共 ${pageCount} 页。${summary ? `\n前面的页面：${summary}` : ''}\n\n设计要求：\n${stylePrompt}`;

      const result = await aiGen.generate(slidePrompt, ratio);

      if (result.success && result.code) {
        generated.push({
          id: Date.now().toString() + i,
          name: `幻灯片 ${i + 1}`,
          code: result.code,
        });
        // Update slides incrementally
        slidesHook.setSlideCode(i, result.code);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `第 ${i + 1} 页生成失败：${result.error}` }]);
        break;
      }
    }

    setMultiProgress(undefined);

    if (generated.length > 0) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `已成功生成 ${generated.length} 页幻灯片！你可以在下方切换页面预览，或告诉我需要修改的地方。`,
      }]);
    }
  };

  const handleSendMessage = useCallback(async (message: string) => {
    setMessages(prev => [...prev, { role: 'user', content: message }]);

    const selectedRatio = context.canvasRatio || canvasRatio;
    const styleId = context.selectedStyle || 'modern';
    const stylePrompt = getStylePrompt(styleId);

    const result = await aiGen.generate(
      `${message}\n\n基于当前幻灯片内容进行修改。\n\n设计要求：\n${stylePrompt}`,
      selectedRatio
    );

    if (result.success && result.code) {
      slidesHook.updateCurrentSlideCode(result.code);
      setMessages(prev => [...prev, { role: 'ai', content: '已更新！告诉我还需要调整什么。' }]);
    } else {
      setMessages(prev => [...prev, { role: 'ai', content: `修改失败：${result.error || '未知错误'}` }]);
    }
  }, [context, canvasRatio, aiGen, slidesHook]);

  const handleBack = () => {
    setPhase('entry');
    setMessages([]);
    setMultiProgress(undefined);
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'var(--bg-root)' }}
    >
      {/* Minimal header */}
      <div
        className="flex items-center h-12 px-4 border-b shrink-0"
        style={{
          background: 'var(--bg-header)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors hover:opacity-80 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-xs">返回</span>
        </button>
        <h1
          className="ml-3 text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          AI 幻灯片生成
        </h1>
      </div>

      {/* Phase content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'entry' ? (
            <motion.div
              key="entry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <EntryPhase
                context={context}
                onContextUpdate={handleContextUpdate}
                onStartGenerate={handleStartGenerate}
                isGenerating={aiGen.isGenerating}
                canvasRatio={canvasRatio}
              />
            </motion.div>
          ) : (
            <motion.div
              key="workspace"
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="h-full"
            >
              <WorkspacePhase
                slides={slidesHook.slides}
                currentSlideIndex={slidesHook.currentSlideIndex}
                setCurrentSlideIndex={slidesHook.setCurrentSlideIndex}
                updateCurrentSlideCode={slidesHook.updateCurrentSlideCode}
                canvasRatio={canvasRatio}
                messages={messages}
                onSendMessage={handleSendMessage}
                isGenerating={aiGen.isGenerating}
                generationProgress={multiProgress}
                error={aiGen.error}
                onRetry={handleStartGenerate}
                onBack={handleBack}
                onExport={() => onNavigate('code')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function buildGuidedPrompt(context: GenerationContext): string {
  const parts: string[] = [];
  if (context.purpose) parts.push(`目的：${context.purpose}`);
  if (context.scenario) parts.push(`场景：${context.scenario}`);
  if (context.tone) parts.push(`风格：${context.tone}`);
  if (context.memory) parts.push(`核心信息：${context.memory}`);
  if (context.preference) parts.push(`偏好：${context.preference}`);
  return parts.join('\n');
}

export default AiGeneratePage;
