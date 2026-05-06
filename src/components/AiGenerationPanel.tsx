/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
// 导入图标：X(关闭)、Send(发送)、Sparkles(闪光)、Loader2(加载)、AlertCircle(警告)、Copy(复制)、Check(确认)、Code2(代码)、ChevronDown(下箭头)、ChevronUp(上箭头)、Palette(调色板)、Type(文字)、Layout(布局)、Image(图片)
import { X, Send, Sparkles, Loader2, AlertCircle, Copy, Check, Code2, ChevronDown, ChevronUp, Palette, Type, Layout as LayoutIcon, Image } from 'lucide-react';

/** Prompt 风格选项：用于选择 AI 生成的设计风格 */
interface PromptStyle {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// 预设的 Prompt 风格列表
const PROMPT_STYLES: PromptStyle[] = [
  {
    id: 'modern',
    name: '现代简约',
    description: '简洁现代的设计风格，适合商务演示',
    icon: <LayoutIcon size={16} />
  },
  {
    id: 'tech',
    name: '科技感',
    description: '蓝色科技风格，适合技术主题',
    icon: <Sparkles size={16} />
  },
  {
    id: 'creative',
    name: '创意活泼',
    description: '鲜艳色彩，适合创意主题',
    icon: <Palette size={16} />
  },
  {
    id: 'professional',
    name: '专业严谨',
    description: '简洁专业，适合学术和商务',
    icon: <Type size={16} />
  },
  {
    id: 'elegant',
    name: '优雅典雅',
    description: '柔和色调，适合艺术和文化',
    icon: <Image size={16} />
  },
];

/** AI 生成面板组件属性接口 */
interface AiGenerationPanelProps {
  isVisible: boolean;                    // 是否可见
  onClose: () => void;                   // 关闭回调
  onGenerate: (prompt: string, styleId: string) => Promise<{ success: boolean; code?: string; error?: string }>;  // 生成回调
  onReplace: (code: string) => void;     // 替换代码回调
  isGenerating: boolean;                 // 是否正在生成
  error: string | null;                  // 错误信息
  promptSettings: {                      // Prompt 设置
    customPrompt: string;
    useDefaultPrompt: boolean;
    userInstructions: string;
  };
  onUpdatePromptSettings: (settings: any) => void;  // 更新 Prompt 设置
}

/**
 * AI 生成面板组件（旧版弹窗式）
 * 功能：
 * - 提供 prompt 输入区域
 * - 支持选择生成风格
 * - 显示生成的代码并提供复制功能
 * - 支持高级设置（额外指令）
 * - 显示示例 prompt 供用户快速使用
 */
export const AiGenerationPanel: React.FC<AiGenerationPanelProps> = ({
  isVisible,
  onClose,
  onGenerate,
  onReplace,
  isGenerating,
  error,
  promptSettings,
  onUpdatePromptSettings,
}) => {
  // 输入内容
  const [input, setInput] = useState('');
  // 生成的代码
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  // 复制状态
  const [copied, setCopied] = useState(false);
  // 选中的风格
  const [selectedStyle, setSelectedStyle] = useState('modern');
  // 是否显示高级设置
  const [showAdvanced, setShowAdvanced] = useState(false);
  // 文本域引用：用于自动聚焦
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 面板可见时自动聚焦到输入框
  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVisible]);

  // 不可见时不渲染
  if (!isVisible) return null;

  /** 处理提交：调用生成 API 并保存结果 */
  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;

    setGeneratedCode(null);
    const result = await onGenerate(input, selectedStyle);
    if (result.success && result.code) {
      setGeneratedCode(result.code);
    }
  };

  /** 关闭面板并重置状态 */
  const handleClose = () => {
    setGeneratedCode(null);
    setInput('');
    setCopied(false);
    onClose();
  };

  /** 使用生成的代码：替换当前幻灯片代码并关闭面板 */
  const handleUseCode = () => {
    if (generatedCode) {
      onReplace(generatedCode);
      handleClose();
    }
  };

  /** 复制生成的代码到剪贴板 */
  const copyCode = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  /** 处理键盘事件：Cmd/Ctrl + Enter 发送 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 示例 prompt 列表
  const examplePrompts = [
    '创建一个科技风格的封面幻灯片，标题是"人工智能的未来"',
    '设计一个产品发布会的介绍页面，包含标题、副标题和日期',
    '制作一个关于环保主题的幻灯片，使用绿色配色方案',
  ];

  /** 使用示例 prompt：填入输入框并聚焦 */
  const useExample = (example: string) => {
    setInput(example);
    textareaRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩：点击关闭 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 弹窗主体 */}
      <div className="relative rounded-2xl shadow-2xl w-[900px] max-h-[90vh] overflow-hidden flex flex-col" style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        {/* 弹窗头部：标题和关闭按钮 */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>AI 生成幻灯片</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>描述你想要创建的幻灯片</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 弹窗内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* 左侧列：输入区、错误显示、示例、生成代码 */}
            <div className="col-span-2 space-y-4">
              {/* Prompt 输入区域 */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="描述你想要创建的幻灯片内容...&#10;例如：创建一个关于2024年技术趋势的演示文稿"
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none resize-none"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)'
                  }}
                  disabled={isGenerating}
                />
                <div className="absolute bottom-3 right-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  ⌘ + Enter 发送
                </div>
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 rounded-xl flex items-start gap-2"
                  style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                >
                  <AlertCircle className="flex-shrink-0 mt-0.5" size={16} style={{ color: '#ef4444' }} />
                  <div className="text-sm" style={{ color: '#fca5a5' }}>{error}</div>
                </div>
              )}

              {/* 示例 Prompt 按钮 */}
              <div>
                <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>示例 Prompt：</div>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, index) => (
                    <button
                      key={index}
                      onClick={() => useExample(example)}
                      className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                      style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', borderColor: 'var(--border-default)', border: '1px solid var(--border-default)' }}
                      disabled={isGenerating}
                    >
                      {example.substring(0, 25)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* 生成的代码显示区域 */}
              {generatedCode && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <Code2 size={16} />
                      生成的 React 代码
                    </div>
                    <button
                      onClick={copyCode}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors"
                      style={{ background: 'var(--bg-button)', color: 'var(--text-secondary)' }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                      {copied ? '已复制' : '复制代码'}
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl border overflow-x-auto max-h-64 overflow-y-auto text-xs"
                    style={{ background: '#0f172a', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              )}
            </div>

            {/* 右侧列：风格选择和高级设置 */}
            <div className="col-span-1 space-y-4">
              {/* 设计风格选择 */}
              <div>
                <div className="text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  设计风格
                </div>
                <div className="space-y-2">
                  {PROMPT_STYLES.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className="w-full p-3 rounded-lg border text-left transition-all"
                      style={{
                        background: selectedStyle === style.id ? 'var(--accent-bg)' : 'var(--bg-card)',
                        borderColor: selectedStyle === style.id ? 'var(--border-active)' : 'var(--border-default)'
                      }}
                      disabled={isGenerating}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: selectedStyle === style.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                          {style.icon}
                        </span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {style.name}
                        </span>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {style.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 高级设置（可展开） */}
              <div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm transition-colors w-full"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showAdvanced ? '隐藏' : '显示'} 高级设置
                </button>

                {showAdvanced && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                        额外指令
                      </label>
                      <textarea
                        value={promptSettings.userInstructions}
                        onChange={(e) => onUpdatePromptSettings({ userInstructions: e.target.value })}
                        placeholder="添加额外的生成指令，例如设计风格、颜色偏好等..."
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg focus:outline-none text-xs resize-none"
                        style={{
                          background: 'var(--bg-input)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border-default)'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 弹窗底部按钮区 */}
        <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="px-4 py-2 text-white text-sm rounded-xl transition-colors"
            style={{ background: 'var(--bg-button)' }}
          >
            {generatedCode ? '取消' : '关闭'}
          </button>
          {generatedCode && (
            <button
              onClick={handleUseCode}
              className="px-4 py-2 text-white text-sm rounded-xl transition-colors flex items-center gap-2"
              style={{ background: '#22c55e' }}
            >
              <Check size={16} />
              使用此代码
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="flex-1 py-3 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--accent)' }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Send size={18} />
                生成幻灯片
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
