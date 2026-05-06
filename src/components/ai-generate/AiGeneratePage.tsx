/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewType } from '../../hooks/use-app-state';
import { CanvasRatio, CANVAS_CONFIGS } from '../../lib/canvas-config';
import { AiGenerationState } from '../../lib/use-ai-generation';
import { buildMessages, getDefaultSystemPrompt } from '../../lib/prompt-manager';
import { getStylePromptBundle } from '../../prompts/templates/index';
import { useConversation } from '../../lib/chat/use-conversation';
import { useStreaming } from '../../lib/chat/use-streaming';
import { extractCodeFromResponse } from '../../lib/chat/code-extractor';
import { getDefaultCode } from '../../constants';
import type { ProviderSettingsConfig } from '../../lib/providers/types';
import type { Slide } from '../../hooks/use-slides';
import EntryPhase from './EntryPhase';
import WorkspacePhase from './WorkspacePhase';

interface AiGeneratePageProps {
  onNavigate: (view: ViewType) => void;
  onExportPPTX: (mode: 'all' | 'current' | 'range', startPage?: number, endPage?: number) => Promise<void>;
  onStopGenerate: () => void;
  aiGen: AiGenerationState & {
    generate: (userInput: string, canvasRatio?: CanvasRatio) => Promise<{ success: boolean; code?: string; error?: string }>;
    clearError: () => void;
    promptSettings: any;
    stopGenerate: () => void;
    providerManager: {
      getCurrentProvider: () => {
        settingsConfig: ProviderSettingsConfig;
      } | null;
    };
  };
  canvasRatio: CanvasRatio;
  setCanvasRatio: (ratio: string) => void;
  monacoTheme: string;
  slidesHook: {
    slides: Slide[];
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;
    updateCurrentSlideCode: (code: string) => void;
    setSlidesBulk: (slides: Slide[]) => void;
    addNewSlide: () => void;
  };
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
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

const AiGeneratePage: React.FC<AiGeneratePageProps> = ({
  onNavigate,
  onExportPPTX,
  onStopGenerate,
  aiGen,
  canvasRatio,
  monacoTheme,
  slidesHook,
  showSettings,
  setShowSettings,
}) => {
  const [phase, setPhase] = useState<Phase>('entry');
  const [context, setContext] = useState<GenerationContext>({
    canvasRatio: '16:9',
  });

  const conversation = useConversation();
  const { isStreaming, streamGenerate } = useStreaming();
  const abortRef = useRef<AbortController | null>(null);

  const handleContextUpdate = (updates: Partial<GenerationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  const getProviderConfig = useCallback((): ProviderSettingsConfig | null => {
    const provider = aiGen.providerManager.getCurrentProvider();
    if (!provider?.settingsConfig?.apiKey || !provider?.settingsConfig?.endpoint || !provider?.settingsConfig?.model) {
      return null;
    }
    return provider.settingsConfig;
  }, [aiGen.providerManager]);

  /** Save current slides to the active conversation */
  const saveCurrentSlides = useCallback(() => {
    if (conversation.activeId) {
      conversation.updateSlides(conversation.activeId, slidesHook.slides);
    }
  }, [conversation, slidesHook.slides]);

  /** Load slides from a conversation */
  const loadSlidesFromConversation = useCallback((convId: string) => {
    const savedSlides = conversation.getSlides(convId);
    if (savedSlides && savedSlides.length > 0) {
      slidesHook.setSlidesBulk(savedSlides);
    } else {
      // No saved slides, use default
      const ratio = conversation.activeConversation?.canvasRatio || canvasRatio;
      slidesHook.setSlidesBulk([{ id: '1', name: '幻灯片 1', code: getDefaultCode(ratio) }]);
    }
  }, [conversation, canvasRatio, slidesHook]);

  /** Handle conversation switch — save current, load target */
  const handleSwitchConversation = useCallback((id: string) => {
    saveCurrentSlides();
    conversation.switchConversation(id);
    loadSlidesFromConversation(id);
  }, [saveCurrentSlides, conversation, loadSlidesFromConversation]);

  /** Create a new conversation and stay in workspace */
  const handleNewConversation = useCallback(() => {
    // Save current slides to current conversation
    saveCurrentSlides();

    const ratio = canvasRatio;
    const newSlides: Slide[] = [{ id: '1', name: '幻灯片 1', code: getDefaultCode(ratio) }];

    const conv = conversation.createConversation('新对话', undefined, ratio, newSlides);

    // Clear slides to default
    slidesHook.setSlidesBulk(newSlides);

    // Stay in workspace
    setPhase('workspace');
  }, [saveCurrentSlides, canvasRatio, conversation, slidesHook]);

  const handleStartGenerate = useCallback(async () => {
    const prompt = context.directInput || buildGuidedPrompt(context);
    if (!prompt) return;

    const config = getProviderConfig();
    if (!config) {
      // Fallback to legacy generate if provider not configured
      const selectedRatio = context.canvasRatio || canvasRatio;
      const result = await aiGen.generate(prompt, selectedRatio);
      if (result.success && result.code) {
        slidesHook.updateCurrentSlideCode(result.code);
      }
      return;
    }

    const selectedRatio = context.canvasRatio || canvasRatio;
    const styleId = context.selectedStyle || 'modern';
    const styleBundle = getStylePromptBundle(styleId);
    const systemPrompt = getDefaultSystemPrompt(selectedRatio);

    // Create new conversation with current slides
    const conv = conversation.createConversation(
      prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
      styleId,
      selectedRatio,
      [...slidesHook.slides],
    );

    // Add user message
    const userMsg = conversation.addUserMessage(conv.id, prompt);

    // Transition to workspace
    setPhase('workspace');

    // Create assistant placeholder
    const assistantMsg = conversation.addAssistantMessage(conv.id, userMsg.id, '');

    // Build messages with proper system role
    const messages = buildMessages(systemPrompt, [], prompt, styleBundle, aiGen.promptSettings, selectedRatio);

    // Stream generate
    abortRef.current = new AbortController();
    await streamGenerate({
      messages,
      config,
      signal: abortRef.current.signal,
      onDelta: (delta) => {
        conversation.appendToMessage(conv.id, assistantMsg.id, delta);
      },
      onDone: (fullContent) => {
        const extracted = extractCodeFromResponse(fullContent);
        if (extracted) {
          slidesHook.updateCurrentSlideCode(extracted);
          // Save slides to conversation after generation
          const updatedSlides = [...slidesHook.slides];
          updatedSlides[slidesHook.currentSlideIndex] = {
            ...updatedSlides[slidesHook.currentSlideIndex],
            code: extracted,
          };
          conversation.updateSlides(conv.id, updatedSlides);

          conversation.updateMessage(conv.id, assistantMsg.id, {
            status: 'complete',
            content: '幻灯片已生成并同步到编辑区',
            code: extracted,
          });
        } else {
          conversation.updateMessage(conv.id, assistantMsg.id, {
            status: 'error',
            content: fullContent,
            error: '无法从 AI 响应中提取代码',
          });
        }
        conversation.commitMessage(conv.id);
      },
      onError: (error) => {
        conversation.updateMessage(conv.id, assistantMsg.id, {
          status: 'error',
          error,
        });
        conversation.commitMessage(conv.id);
      },
    });
  }, [context, canvasRatio, aiGen, slidesHook, conversation, streamGenerate, getProviderConfig]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (!conversation.activeId) return;

    const config = getProviderConfig();
    if (!config) {
      // Fallback to legacy
      await aiGen.generate(message, canvasRatio);
      return;
    }

    const conv = conversation.activeConversation!;
    const userMsg = conversation.addUserMessage(conv.id, message);

    const selectedRatio = conv.canvasRatio || canvasRatio;
    const styleId = conv.styleId || 'modern';
    const styleBundle = getStylePromptBundle(styleId);
    const systemPrompt = getDefaultSystemPrompt(selectedRatio);

    // Build conversation history for context
    const chain = conversation.currentChain;
    const historyMessages = chain
      .filter(m => m.id !== userMsg.id) // Exclude the just-added user message
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' as const : m.role as 'user' | 'assistant',
        content: m.role === 'assistant' ? (m.code || m.content) : m.content,
      }));

    const messages = buildMessages(systemPrompt, historyMessages, message, styleBundle, aiGen.promptSettings, selectedRatio);

    const assistantMsg = conversation.addAssistantMessage(conv.id, userMsg.id, '');

    abortRef.current = new AbortController();
    await streamGenerate({
      messages,
      config,
      signal: abortRef.current.signal,
      onDelta: (delta) => {
        conversation.appendToMessage(conv.id, assistantMsg.id, delta);
      },
      onDone: (fullContent) => {
        const extracted = extractCodeFromResponse(fullContent);
        if (extracted) {
          slidesHook.updateCurrentSlideCode(extracted);
          // Save slides to conversation after generation
          const updatedSlides = [...slidesHook.slides];
          updatedSlides[slidesHook.currentSlideIndex] = {
            ...updatedSlides[slidesHook.currentSlideIndex],
            code: extracted,
          };
          conversation.updateSlides(conv.id, updatedSlides);

          conversation.updateMessage(conv.id, assistantMsg.id, {
            status: 'complete',
            content: '幻灯片已更新并同步到编辑区',
            code: extracted,
          });
        } else {
          conversation.updateMessage(conv.id, assistantMsg.id, {
            status: 'error',
            content: fullContent,
            error: '无法从 AI 响应中提取代码',
          });
        }
        conversation.commitMessage(conv.id);
      },
      onError: (error) => {
        conversation.updateMessage(conv.id, assistantMsg.id, {
          status: 'error',
          error,
        });
        conversation.commitMessage(conv.id);
      },
    });
  }, [conversation, canvasRatio, aiGen, slidesHook, streamGenerate, getProviderConfig]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    aiGen.stopGenerate();
  }, [aiGen]);

  const handleEnterWorkspace = useCallback(() => {
    setPhase('workspace');
  }, []);

  const handleBack = () => {
    setPhase('entry');
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
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
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
                onEnterWorkspace={handleEnterWorkspace}
                isGenerating={aiGen.isGenerating || isStreaming}
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
                monacoTheme={monacoTheme}
                conversation={conversation}
                onSendMessage={handleSendMessage}
                isGenerating={aiGen.isGenerating || isStreaming}
                error={aiGen.error}
                onRetry={handleStartGenerate}
                onBack={handleBack}
                onNewConversation={handleNewConversation}
                onSwitchConversation={handleSwitchConversation}
                onExportPPTX={onExportPPTX}
                onStopGenerate={handleStop}
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
