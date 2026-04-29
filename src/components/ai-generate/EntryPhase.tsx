import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, MessageCircle, Edit3, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { GenerationContext, GenerationMode } from './AiGeneratePage';
import { STYLE_TEMPLATES } from '../../prompts/templates/index';
import { CanvasRatio } from '../../lib/canvas-config';
import TemplateCard from './TemplateCard';

interface EntryPhaseProps {
  context: GenerationContext;
  onContextUpdate: (updates: Partial<GenerationContext>) => void;
  onStartGenerate: () => void;
  isGenerating: boolean;
  canvasRatio: CanvasRatio;
}

const PAGE_COUNT_OPTIONS = [5, 8, 10, 12, 15];

const EntryPhase: React.FC<EntryPhaseProps> = ({
  context,
  onContextUpdate,
  onStartGenerate,
  isGenerating,
  canvasRatio,
}) => {
  const [mode, setMode] = useState<GenerationMode>('direct');
  const [inputValue, setInputValue] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [inputValue]);

  const handleSubmit = () => {
    const prompt = mode === 'direct'
      ? inputValue.trim()
      : buildGuidedPrompt();

    if (!prompt) return;
    onContextUpdate({ directInput: prompt });
    onStartGenerate();
  };

  const buildGuidedPrompt = (): string => {
    const parts: string[] = [];
    if (context.purpose) parts.push(`目的：${context.purpose}`);
    if (context.scenario) parts.push(`场景：${context.scenario}`);
    if (context.tone) parts.push(`风格：${context.tone}`);
    if (context.memory) parts.push(`核心信息：${context.memory}`);
    if (context.preference) parts.push(`偏好：${context.preference}`);
    return parts.join('\n');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Hero area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
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
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>
            选择一个风格模板，描述你的需求，AI 为你生成专业幻灯片
          </p>
        </motion.div>

        {/* Glassmorphism Chat Box */}
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
          {/* Mode switcher */}
          <div className="flex gap-1 p-2 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <button
              onClick={() => setMode('direct')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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

          {/* Input area */}
          <div className="p-4">
            {mode === 'direct' ? (
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="用 AnyGen 创造无限可能"
                rows={2}
                className="w-full bg-transparent outline-none resize-none text-base leading-relaxed"
                style={{
                  color: 'var(--text-primary)',
                  caretColor: 'var(--accent)',
                }}
              />
            ) : (
              <GuidedInput context={context} onContextUpdate={onContextUpdate} />
            )}
          </div>

          {/* Action bar */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                设置
              </button>
              <button
                onClick={() => {
                  const tags = ['10页左右', '包含数据图表', '简洁文字'];
                  const current = inputValue || '';
                  const newInput = current ? `${current} ${tags[0]}` : tags.join('，');
                  setInputValue(newInput);
                }}
                className="px-2 py-1 rounded-md text-xs transition-all cursor-pointer hover:opacity-80"
                style={{
                  color: 'var(--text-muted)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                + 标签
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg transition-all cursor-pointer hover:opacity-80"
                style={{ color: 'var(--text-muted)' }}
                title="语音输入"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isGenerating || (!inputValue.trim() && mode === 'direct')}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-inverse)',
                }}
              >
                {isGenerating ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div
              className="px-4 py-3 border-t"
              style={{ borderColor: 'var(--glass-border)' }}
            >
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                    页数
                  </label>
                  <div className="flex gap-1">
                    {PAGE_COUNT_OPTIONS.map((count) => (
                      <button
                        key={count}
                        onClick={() => onContextUpdate({ pageCount: count })}
                        className="px-2 py-1 rounded text-xs transition-all cursor-pointer"
                        style={{
                          background: context.pageCount === count ? 'var(--accent)' : 'var(--bg-input)',
                          color: context.pageCount === count ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        }}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                    比例
                  </label>
                  <div className="flex gap-1">
                    {(['16:9', '4:3'] as const).map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => onContextUpdate({ canvasRatio: ratio })}
                        className="px-2 py-1 rounded text-xs transition-all cursor-pointer"
                        style={{
                          background: context.canvasRatio === ratio ? 'var(--accent)' : 'var(--bg-input)',
                          color: context.canvasRatio === ratio ? 'var(--text-inverse)' : 'var(--text-secondary)',
                        }}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Style Template Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-3xl"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              选择风格模板
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 px-2 justify-center">
            {STYLE_TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={context.selectedStyle === template.id}
                onSelect={(id) => onContextUpdate({ selectedStyle: id })}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Guided mode inline input
const GuidedInput: React.FC<{
  context: GenerationContext;
  onContextUpdate: (updates: Partial<GenerationContext>) => void;
}> = ({ context, onContextUpdate }) => {
  const steps = [
    { key: 'purpose' as const, label: '这份演示文稿要解决什么问题？', placeholder: '例如：向投资人展示产品价值' },
    { key: 'scenario' as const, label: '使用场景是什么？', placeholder: '例如：商业路演' },
    { key: 'tone' as const, label: '希望什么风格？', placeholder: '例如：科技未来感' },
  ];

  const currentEmpty = steps.find(s => !context[s.key]);

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
