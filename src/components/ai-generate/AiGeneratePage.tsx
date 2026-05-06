/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef } from 'react';
// 导入图标：ArrowLeft(返回箭头)、Settings(设置齿轮)
import { ArrowLeft, Settings } from 'lucide-react';
// 导入 motion 动画库：motion(动画组件)、AnimatePresence(进出场动画容器)
import { motion, AnimatePresence } from 'motion/react';
// 导入视图类型定义
import { ViewType } from '../../hooks/use-app-state';
// 导入画布比例类型和配置
import { CanvasRatio, CANVAS_CONFIGS } from '../../lib/canvas-config';
// 导入 AI 生成状态类型
import { AiGenerationState } from '../../lib/use-ai-generation';
// 导入 prompt 构建函数：buildMessages(组装消息)、getDefaultSystemPrompt(默认系统提示词)
import { buildMessages, getDefaultSystemPrompt } from '../../lib/prompt-manager';
// 导入风格 prompt bundle 获取函数
import { getStylePromptBundle } from '../../prompts/templates/index';
// 导入对话管理 hook
import { useConversation } from '../../lib/chat/use-conversation';
// 导入流式生成 hook
import { useStreaming } from '../../lib/chat/use-streaming';
// 导入代码提取函数：从 AI 响应中提取 JSX 代码
import { extractCodeFromResponse } from '../../lib/chat/code-extractor';
// 导入默认代码生成函数
import { getDefaultCode } from '../../constants';
// 导入提供商设置配置类型
import type { ProviderSettingsConfig } from '../../lib/providers/types';
// 导入幻灯片类型
import type { Slide } from '../../hooks/use-slides';
// 导入入口阶段组件（初始输入界面）
import EntryPhase from './EntryPhase';
// 导入工作区阶段组件（生成后的编辑预览界面）
import WorkspacePhase from './WorkspacePhase';

/** AI 生成页面组件属性接口 */
interface AiGeneratePageProps {
  onNavigate: (view: ViewType) => void;  // 页面导航回调
  onExportPPTX: (mode: 'all' | 'current' | 'range', startPage?: number, endPage?: number) => Promise<void>;  // 导出 PPTX
  onStopGenerate: () => void;            // 停止生成回调
  aiGen: AiGenerationState & {           // AI 生成状态及方法
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
  canvasRatio: CanvasRatio;              // 当前画布比例
  setCanvasRatio: (ratio: string) => void;  // 设置画布比例
  monacoTheme: string;                   // Monaco 编辑器主题
  slidesHook: {                          // 幻灯片管理 hook
    slides: Slide[];
    currentSlideIndex: number;
    setCurrentSlideIndex: (index: number) => void;
    updateCurrentSlideCode: (code: string) => void;
    setSlidesBulk: (slides: Slide[]) => void;
    addNewSlide: () => void;
  };
  showSettings: boolean;                 // 是否显示设置弹窗
  setShowSettings: (show: boolean) => void;  // 设置弹窗显隐控制
}

/** 生成模式：guided(引导式) 或 direct(直接输入) */
export type GenerationMode = 'guided' | 'direct';

/** 生成上下文：存储用户的输入和选择 */
export interface GenerationContext {
  purpose?: string;      // 演示目的
  scenario?: string;     // 使用场景
  tone?: string;         // 风格调性
  memory?: string;       // 核心记忆点
  preference?: string;   // 偏好设置
  directInput?: string;  // 直接输入的内容
  selectedStyle?: string;  // 选中的风格模板 ID
  selectedTemplate?: string;  // 选中的内容模板 ID
  pageCount?: number;    // 页数
  canvasRatio?: '16:9' | '4:3';  // 画布比例
}

/** 阶段类型：entry(入口) 或 workspace(工作区) */
type Phase = 'entry' | 'workspace';

/**
 * AI 生成页面主组件
 * 职责：
 * - 管理 entry 和 workspace 两个阶段的状态切换
 * - 处理对话的创建、切换和消息发送
 * - 协调流式生成和代码提取
 * - 管理幻灯片的保存和加载
 */
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
  // 当前阶段状态：entry(入口页) 或 workspace(工作区)
  const [phase, setPhase] = useState<Phase>('entry');
  // 生成上下文：存储用户的输入和选项
  const [context, setContext] = useState<GenerationContext>({
    canvasRatio: '16:9',
  });

  // 对话管理 hook：处理对话的 CRUD 操作
  const conversation = useConversation();
  // 流式生成 hook：处理 SSE 流式响应
  const { isStreaming, streamGenerate } = useStreaming();
  // 请求中止控制器引用：用于取消正在进行的生成请求
  const abortRef = useRef<AbortController | null>(null);

  /** 更新生成上下文：合并新的更新值到现有上下文 */
  const handleContextUpdate = (updates: Partial<GenerationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  /** 获取当前提供商的 API 配置，若未配置完整则返回 null */
  const getProviderConfig = useCallback((): ProviderSettingsConfig | null => {
    const provider = aiGen.providerManager.getCurrentProvider();
    if (!provider?.settingsConfig?.apiKey || !provider?.settingsConfig?.endpoint || !provider?.settingsConfig?.model) {
      return null;
    }
    return provider.settingsConfig;
  }, [aiGen.providerManager]);

  /** 将当前幻灯片保存到活跃对话中 */
  const saveCurrentSlides = useCallback(() => {
    if (conversation.activeId) {
      conversation.updateSlides(conversation.activeId, slidesHook.slides);
    }
  }, [conversation, slidesHook.slides]);

  /** 从对话中加载幻灯片，若无保存的幻灯片则使用默认幻灯片 */
  const loadSlidesFromConversation = useCallback((convId: string) => {
    const savedSlides = conversation.getSlides(convId);
    if (savedSlides && savedSlides.length > 0) {
      slidesHook.setSlidesBulk(savedSlides);
    } else {
      // 没有保存的幻灯片，使用默认
      const ratio = conversation.activeConversation?.canvasRatio || canvasRatio;
      slidesHook.setSlidesBulk([{ id: '1', name: '幻灯片 1', code: getDefaultCode(ratio) }]);
    }
  }, [conversation, canvasRatio, slidesHook]);

  /** 处理对话切换：先保存当前幻灯片，再加载目标对话的幻灯片 */
  const handleSwitchConversation = useCallback((id: string) => {
    saveCurrentSlides();
    conversation.switchConversation(id);
    loadSlidesFromConversation(id);
  }, [saveCurrentSlides, conversation, loadSlidesFromConversation]);

  /** 创建新对话并停留在工作区：重置幻灯片为默认状态 */
  const handleNewConversation = useCallback(() => {
    // 保存当前幻灯片到当前对话
    saveCurrentSlides();

    const ratio = canvasRatio;
    const newSlides: Slide[] = [{ id: '1', name: '幻灯片 1', code: getDefaultCode(ratio) }];

    const conv = conversation.createConversation('新对话', undefined, ratio, newSlides);

    // 重置幻灯片为默认
    slidesHook.setSlidesBulk(newSlides);

    // 停留在工作区
    setPhase('workspace');
  }, [saveCurrentSlides, canvasRatio, conversation, slidesHook]);

  /**
   * 开始生成幻灯片
   * 流程：
   * 1. 构建用户 prompt（直接输入或引导式）
   * 2. 检查提供商配置，若无则使用旧版生成方式
   * 3. 创建新对话并添加用户消息
   * 4. 切换到工作区阶段
   * 5. 流式生成并实时更新消息
   * 6. 生成完成后提取代码并更新幻灯片
   */
  const handleStartGenerate = useCallback(async () => {
    const prompt = context.directInput || buildGuidedPrompt(context);
    if (!prompt) return;

    const config = getProviderConfig();
    if (!config) {
      // 若未配置提供商，回退到旧版生成方式
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

    // 创建新对话，保存当前幻灯片快照
    const conv = conversation.createConversation(
      prompt.slice(0, 30) + (prompt.length > 30 ? '...' : ''),
      styleId,
      selectedRatio,
      [...slidesHook.slides],
    );

    // 添加用户消息
    const userMsg = conversation.addUserMessage(conv.id, prompt);

    // 切换到工作区阶段
    setPhase('workspace');

    // 创建 AI 回复占位消息
    const assistantMsg = conversation.addAssistantMessage(conv.id, userMsg.id, '');

    // 组装完整的消息列表（包含 system role）
    const messages = buildMessages(systemPrompt, [], prompt, styleBundle, aiGen.promptSettings, selectedRatio);

    // 创建中止控制器并开始流式生成
    abortRef.current = new AbortController();
    await streamGenerate({
      messages,
      config,
      signal: abortRef.current.signal,
      onDelta: (delta) => {
        // 实时追加生成的内容到消息
        conversation.appendToMessage(conv.id, assistantMsg.id, delta);
      },
      onDone: (fullContent) => {
        // 生成完成：提取代码并更新幻灯片
        const extracted = extractCodeFromResponse(fullContent);
        if (extracted) {
          slidesHook.updateCurrentSlideCode(extracted);
          // 保存幻灯片到对话
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
          // 无法提取代码：标记为错误
          conversation.updateMessage(conv.id, assistantMsg.id, {
            status: 'error',
            content: fullContent,
            error: '无法从 AI 响应中提取代码',
          });
        }
        conversation.commitMessage(conv.id);
      },
      onError: (error) => {
        // 生成出错：更新消息状态
        conversation.updateMessage(conv.id, assistantMsg.id, {
          status: 'error',
          error,
        });
        conversation.commitMessage(conv.id);
      },
    });
  }, [context, canvasRatio, aiGen, slidesHook, conversation, streamGenerate, getProviderConfig]);

  /**
   * 发送后续消息（在工作区中与 AI 继续对话）
   * 流程与 handleStartGenerate 类似，但会携带对话历史
   */
  const handleSendMessage = useCallback(async (message: string) => {
    if (!conversation.activeId) return;

    const config = getProviderConfig();
    if (!config) {
      // 回退到旧版生成方式
      await aiGen.generate(message, canvasRatio);
      return;
    }

    const conv = conversation.activeConversation!;
    const userMsg = conversation.addUserMessage(conv.id, message);

    const selectedRatio = conv.canvasRatio || canvasRatio;
    const styleId = conv.styleId || 'modern';
    const styleBundle = getStylePromptBundle(styleId);
    const systemPrompt = getDefaultSystemPrompt(selectedRatio);

    // 构建对话历史作为上下文（排除刚添加的用户消息）
    const chain = conversation.currentChain;
    const historyMessages = chain
      .filter(m => m.id !== userMsg.id)
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
          // 保存更新后的幻灯片到对话
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

  /** 停止生成：中止请求并更新 AI 生成状态 */
  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    aiGen.stopGenerate();
  }, [aiGen]);

  /** 直接进入工作区（不经过生成流程） */
  const handleEnterWorkspace = useCallback(() => {
    setPhase('workspace');
  }, []);

  /** 返回入口阶段 */
  const handleBack = () => {
    setPhase('entry');
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ background: 'var(--bg-root)' }}
    >
      {/* 顶部导航栏：返回按钮、标题、设置按钮 */}
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

      {/* 阶段内容区域：使用 AnimatePresence 实现进出场动画 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === 'entry' ? (
            /* 入口阶段：用户输入需求和选择风格 */
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
            /* 工作区阶段：对话交互、预览和代码编辑 */
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

/**
 * 将引导式上下文构建为 prompt 字符串
 * 将用户的各个输入字段拼接成格式化的文本
 */
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
