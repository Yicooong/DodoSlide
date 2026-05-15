import React, { useState, useRef, useEffect } from 'react';
// 导入图标：Sparkles(闪光)、Send(发送)、MessageCircle(对话)、Edit3(编辑)、Layout(布局)
import { Sparkles, Send, MessageCircle, Edit3, Layout } from 'lucide-react';
// 导入 motion 动画库
import { motion } from 'motion/react';
// 导入生成模式和上下文类型
import { GenerationContext, GenerationMode } from './AiGeneratePage';
// 导入风格模板常量和分类系统
import { STYLE_TEMPLATES, CATEGORY_LABELS, getCategories, getTemplatesByCategory, type TemplateCategory } from '../../prompts/templates/index';
// 导入画布比例类型
import { CanvasRatio } from '../../lib/canvas-config';
// 导入风格模板卡片组件
import TemplateCard from './TemplateCard';

/** 入口阶段组件属性接口 */
interface EntryPhaseProps {
  context: GenerationContext;                          // 生成上下文
  onContextUpdate: (updates: Partial<GenerationContext>) => void;  // 更新上下文回调
  onStartGenerate: () => void;                         // 开始生成回调
  onEnterWorkspace: () => void;                        // 进入工作区回调
  isGenerating: boolean;                               // 是否正在生成
  canvasRatio: CanvasRatio;                            // 画布比例
}

/**
 * 入口阶段组件
 * 功能：
 * - 显示欢迎标题和功能说明
 * - 提供快捷 prompt 卡片（产品发布、技术分享等）
 * - 玻璃拟态聊天输入框，支持直接输入和引导模式
 * - 画布比例选择器（16:9 / 4:3）
 * - 风格模板卡片选择
 */
const EntryPhase: React.FC<EntryPhaseProps> = ({
  context,
  onContextUpdate,
  onStartGenerate,
  onEnterWorkspace,
  isGenerating,
  canvasRatio,
}) => {
  // 输入模式：direct(直接输入) 或 guided(引导模式)
  const [mode, setMode] = useState<GenerationMode>('direct');
  // 输入框内容
  const [inputValue, setInputValue] = useState('');
  // 文本域引用：用于自动调整高度
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 分类筛选状态：null 表示"全部"
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | null>(null);

  // 根据输入内容自动调整文本域高度（最大 200px）
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  /**
   * 处理提交：根据当前模式构建 prompt 并触发开始生成
   * - direct 模式：使用输入框内容
   * - guided 模式：使用引导式字段拼接
   */
  const handleSubmit = () => {
    const prompt = mode === 'direct'
      ? inputValue.trim()
      : buildGuidedPrompt();

    if (!prompt) return;
    onContextUpdate({ directInput: prompt });
    onStartGenerate();
  };

  /** 将引导模式的各个字段拼接为 prompt 字符串 */
  const buildGuidedPrompt = (): string => {
    const parts: string[] = [];
    if (context.purpose) parts.push(`目的：${context.purpose}`);
    if (context.scenario) parts.push(`场景：${context.scenario}`);
    if (context.tone) parts.push(`风格：${context.tone}`);
    if (context.memory) parts.push(`核心信息：${context.memory}`);
    if (context.preference) parts.push(`偏好：${context.preference}`);
    return parts.join('\n');
  };

  /** 处理键盘事件：Enter 发送，Shift+Enter 换行 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 快捷 prompt 卡片：点击后填入预设的 prompt 内容
  const quickPrompts = [
    { label: '产品发布', icon: '🚀', prompt: '帮我做一份产品发布演示文稿，包含产品介绍、核心功能、市场分析和未来规划' },
    { label: '技术分享', icon: '💻', prompt: '帮我做一份技术分享PPT，主题是微服务架构的最佳实践' },
    { label: '商业路演', icon: '📊', prompt: '帮我做一份商业路演演示文稿，面向投资人，包含痛点、解决方案、商业模式和团队介绍' },
    { label: '季度汇报', icon: '📈', prompt: '帮我做一份Q1季度工作汇报，包含业绩数据、项目进展和下季度计划' },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* 标题区域：使用 motion 实现入场动画 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1
            className="text-4xl font-bold tracking-tight mb-3"
            style={{
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
              color: 'var(--text-primary)',
            }}
          >
            今天可以帮你做什么？
          </h1>
          <p className="text-base" style={{ color: 'var(--text-muted)' }}>
            选择风格模板，描述你的需求，AI 为你生成专业幻灯片
          </p>
        </motion.div>

        {/* 快捷 prompt 卡片网格：2x2 布局 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="w-full max-w-2xl mb-6"
        >
          <div className="grid grid-cols-2 gap-3">
            {quickPrompts.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setInputValue(item.prompt);
                  setMode('direct');
                }}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01] cursor-pointer min-w-0"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{item.prompt}</p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* 玻璃拟态聊天输入框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-2xl rounded-2xl overflow-hidden mb-8"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
          }}
        >
          {/* 模式切换器：直接输入 / 引导模式 */}
          <div className="flex gap-1 p-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <button
              onClick={() => setMode('direct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                mode === 'direct' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                background: mode === 'direct' ? 'var(--accent-bg)' : 'transparent',
                color: mode === 'direct' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <Edit3 className="w-3 h-3" />
              直接输入
            </button>
            <button
              onClick={() => setMode('guided')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                mode === 'guided' ? 'shadow-sm' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                background: mode === 'guided' ? 'var(--accent-bg)' : 'transparent',
                color: mode === 'guided' ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              <MessageCircle className="w-3 h-3" />
              引导模式
            </button>
          </div>

          {/* 输入区域：根据模式显示不同的输入组件 */}
          <div className="p-4">
            {mode === 'direct' ? (
              /* 直接输入模式：多行文本域 */
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="描述你想要的幻灯片内容..."
                rows={2}
                className="w-full bg-transparent outline-none resize-none text-base leading-relaxed"
                style={{
                  color: 'var(--text-primary)',
                  caretColor: 'var(--accent)',
                }}
              />
            ) : (
              /* 引导模式：多字段引导输入组件 */
              <GuidedInput context={context} onContextUpdate={onContextUpdate} />
            )}
          </div>

          {/* 底部操作栏：画布比例选择 + 按钮 */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-2">
              {/* 画布比例选择按钮 */}
              <div className="flex gap-1">
                {(['16:9', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => onContextUpdate({ canvasRatio: ratio })}
                    className="px-2 py-1 rounded text-[10px] transition-all cursor-pointer whitespace-nowrap"
                    style={{
                      background: context.canvasRatio === ratio ? 'var(--accent)' : 'transparent',
                      color: context.canvasRatio === ratio ? 'var(--text-inverse)' : 'var(--text-muted)',
                      border: `1px solid ${context.canvasRatio === ratio ? 'var(--accent)' : 'var(--glass-border)'}`,
                    }}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* 直接编辑按钮：跳过 AI 生成，直接进入代码编辑器 */}
              <button
                onClick={onEnterWorkspace}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer hover:opacity-80 whitespace-nowrap"
                style={{
                  background: 'var(--bg-button)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)',
                }}
                title="直接进入编辑模式"
              >
                <Layout className="w-4 h-4" />
                直接编辑
              </button>
              {/* 生成按钮 */}
              <button
                onClick={handleSubmit}
                disabled={isGenerating || (!inputValue.trim() && mode === 'direct')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',
                }}
              >
                {isGenerating ? (
                  /* 生成中：显示旋转加载动画 */
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                生成
              </button>
            </div>
          </div>
        </motion.div>

        {/* 风格模板卡片区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              选择风格模板
            </span>
          </div>

          {/* 分类筛选标签栏 */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <button
              onClick={() => setSelectedCategory(null)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
              style={{
                background: selectedCategory === null ? 'var(--accent)' : 'var(--glass-bg)',
                color: selectedCategory === null ? 'var(--text-inverse)' : 'var(--text-muted)',
                border: `1px solid ${selectedCategory === null ? 'var(--accent)' : 'var(--glass-border)'}`,
              }}
            >
              全部
            </button>
            {getCategories().map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer"
                style={{
                  background: selectedCategory === cat ? 'var(--accent)' : 'var(--glass-bg)',
                  color: selectedCategory === cat ? 'var(--text-inverse)' : 'var(--text-muted)',
                  border: `1px solid ${selectedCategory === cat ? 'var(--accent)' : 'var(--glass-border)'}`,
                }}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* 模板卡片网格 */}
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-3 pb-4 px-2">
              {(selectedCategory ? getTemplatesByCategory(selectedCategory) : STYLE_TEMPLATES).map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={context.selectedStyle === template.id}
                  onSelect={(id) => onContextUpdate({ selectedStyle: id })}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

/**
 * 引导输入子组件
 * 提供三个字段：目的、场景、风格，帮助用户结构化输入需求
 */
const GuidedInput: React.FC<{
  context: GenerationContext;
  onContextUpdate: (updates: Partial<GenerationContext>) => void;
}> = ({ context, onContextUpdate }) => {
  const steps = [
    { key: 'purpose' as const, label: '这份演示文稿要解决什么问题？', placeholder: '例如：向投资人展示产品价值' },
    { key: 'scenario' as const, label: '使用场景是什么？', placeholder: '例如：商业路演' },
    { key: 'tone' as const, label: '希望什么风格？', placeholder: '例如：科技未来感' },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div key={step.key}>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>
            {step.label}
          </label>
          <input
            type="text"
            value={context[step.key] || ''}
            onChange={(e) => onContextUpdate({ [step.key]: e.target.value })}
            placeholder={step.placeholder}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2"
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              ['--tw-ring-color' as string]: 'var(--accent)',
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default EntryPhase;
