/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Loader2, AlertCircle, Copy, Check, Code2 } from 'lucide-react';

interface AiInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  onReplace: (code: string) => void;
  isGenerating: boolean;
  error: string | null;
}

export const AiInputModal: React.FC<AiInputModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  onReplace,
  isGenerating,
  error,
}) => {
  const [input, setInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;
    
    setGeneratedCode(null);
    const result = await onGenerate(input);
    if (result.success && result.code) {
      setGeneratedCode(result.code);
    }
  };

  const handleClose = () => {
    setGeneratedCode(null);
    setInput('');
    setCopied(false);
    onClose();
  };

  const handleUseCode = () => {
    if (generatedCode) {
      onReplace(generatedCode);
      handleClose();
    }
  };

  const copyCode = async () => {
    if (generatedCode) {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const examplePrompts = [
    '创建一个科技风格的封面幻灯片，标题是"人工智能的未来"',
    '设计一个产品发布会的介绍页面，包含标题、副标题和日期',
    '制作一个关于环保主题的幻灯片，使用绿色配色方案',
  ];

  const useExample = (example: string) => {
    setInput(example);
    textareaRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden" style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
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

        {/* Content */}
        <div className="p-6">
          {/* Input Area */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="描述你想要创建的幻灯片内容...&#10;例如：创建一个关于2024年技术趋势的演示文稿"
              rows={6}
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

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-3 rounded-xl flex items-start gap-2"
              style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
            >
              <AlertCircle className="flex-shrink-0 mt-0.5" size={16} style={{ color: '#ef4444' }} />
              <div className="text-sm" style={{ color: '#fca5a5' }}>{error}</div>
            </div>
          )}

          {/* Examples */}
          <div className="mt-4">
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
                  {example.substring(0, 20)}...
                </button>
              ))}
            </div>
          </div>

          {/* Generated Code Display */}
          {generatedCode && (
            <div className="mt-4">
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
              <pre className="p-4 rounded-xl border overflow-x-auto max-h-48 overflow-y-auto text-xs"
                style={{ background: '#0f172a', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <code>{generatedCode}</code>
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3" style={{ borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
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
