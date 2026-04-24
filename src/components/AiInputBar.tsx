/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, AlertCircle, X } from 'lucide-react';

interface AiInputBarProps {
  isVisible: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<{ success: boolean; code?: string; error?: string }>;
  isGenerating: boolean;
  error: string | null;
}

export const AiInputBar: React.FC<AiInputBarProps> = ({
  isVisible,
  onClose,
  onGenerate,
  isGenerating,
  error,
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isVisible && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const handleSubmit = async () => {
    if (!input.trim() || isGenerating) return;
    await onGenerate(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="描述你想要创建的幻灯片... (Cmd/Ctrl + Enter 发送, Esc 关闭)"
            rows={3}
            className="w-full px-4 py-3 pr-24 rounded-xl focus:outline-none resize-none"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)'
            }}
            disabled={isGenerating}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="关闭"
            >
              <X size={18} />
            </button>
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isGenerating}
              className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--accent)' }}
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  生成中
                </>
              ) : (
                <>
                  <Send size={16} />
                  发送
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl flex items-start gap-2"
            style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            <AlertCircle className="flex-shrink-0 mt-0.5" size={16} style={{ color: '#ef4444' }} />
            <div className="text-sm" style={{ color: '#fca5a5' }}>{error}</div>
          </div>
        )}
      </div>
    </div>
  );
};
