import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import { CanvasRatio } from '../../lib/canvas-config';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface AiAssistantSidebarProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  canvasRatio: CanvasRatio;
}

const AiAssistantSidebar: React.FC<AiAssistantSidebarProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  error,
  onRetry,
  canvasRatio,
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickActions = [
    '把背景调深一点',
    '增加数据图表',
    '文字再精简一些',
    '换个配色方案',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))' }}
        >
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          AI 助手
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {messages.length === 0 && !isGenerating && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              幻灯片已生成，你可以告诉我需要修改的地方
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))' }}
              >
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
              }`}
              style={{
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                color: msg.role === 'user' ? 'var(--text-inverse)' : 'var(--text-primary)',
                border: msg.role === 'ai' ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Error */}
        {error && (
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#EF4444' }}
            >
              <RotateCcw className="w-3 h-3 text-white" />
            </div>
            <div className="flex-1">
              <div
                className="px-3 py-2 rounded-xl rounded-tl-sm text-xs"
                style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}
              >
                {error}
              </div>
              <button
                onClick={onRetry}
                className="mt-1 text-xs px-2 py-1 rounded transition-all cursor-pointer hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                重试
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {messages.length > 0 && !isGenerating && (
        <div className="px-3 pb-2 flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action}
              onClick={() => onSendMessage(action)}
              className="px-2 py-1 rounded-full text-[10px] transition-all cursor-pointer hover:scale-105"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div
        className="px-3 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉 AI 你的修改需求..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--text-primary)' }}
            disabled={isGenerating}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isGenerating}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiAssistantSidebar;
