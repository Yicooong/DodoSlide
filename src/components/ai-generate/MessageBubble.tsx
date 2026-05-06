/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, RotateCcw, Copy, Check, Clock, CheckCircle, Palette, Layout, Code2 } from 'lucide-react';
import type { ChatMessage } from '../../lib/chat/types';

interface MessageBubbleProps {
  message: ChatMessage;
  onRetry?: (messageId: string) => void;
}

/** Extract design summary from JSX code */
function extractDesignSummary(code: string): { bg: string; layout: string; icons: string[] } {
  const bgMatch = code.match(/bg-\[?(#[0-9a-fA-F]+|[\w-]+)\]?/);
  const bg = bgMatch ? bgMatch[1] : '白色背景';

  const hasFlex = /flex/.test(code);
  const hasGrid = /grid/.test(code);
  const layout = hasGrid ? '网格布局' : hasFlex ? '弹性布局' : '标准布局';

  const iconMatches = code.matchAll(/import\s*\{([^}]+)\}\s*from\s*'lucide-react'/g);
  const icons: string[] = [];
  for (const match of iconMatches) {
    const imported = match[1].split(',').map(s => s.trim()).filter(Boolean);
    icons.push(...imported.slice(0, 3));
  }

  return { bg, layout, icons: icons.slice(0, 4) };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isStreaming = message.status === 'streaming';
  const isComplete = message.status === 'complete';
  const isError = message.status === 'error';
  const hasCode = !!message.code;

  const handleCopy = async () => {
    const textToCopy = message.code || message.content;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // Error message
  if (isError) {
    return (
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
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
            }}
          >
            {message.error || message.content || '生成失败'}
          </div>
          {onRetry && (
            <button
              onClick={() => onRetry(message.id)}
              className="mt-1 text-xs px-2 py-1 rounded transition-all cursor-pointer hover:opacity-80"
              style={{ color: 'var(--accent)' }}
            >
              重试
            </button>
          )}
        </div>
      </div>
    );
  }

  // Streaming state — show animated dots
  if (isStreaming && !isComplete) {
    return (
      <div className="flex gap-2">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))' }}
        >
          <Sparkles className="w-3 h-3 text-white animate-pulse" />
        </div>
        <div
          className="px-3 py-2 rounded-xl rounded-tl-sm text-xs"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
            </div>
            <span style={{ color: 'var(--text-muted)' }}>正在生成幻灯片...</span>
          </div>
        </div>
      </div>
    );
  }

  // Completion card — show design summary instead of code
  if (isComplete && hasCode) {
    const summary = extractDesignSummary(message.code!);
    return (
      <div className="flex gap-2 group">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))' }}
        >
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[85%] flex flex-col items-start">
          <div
            className="px-3 py-2.5 rounded-xl rounded-tl-sm text-xs"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                幻灯片已生成
              </span>
            </div>

            {/* Design summary */}
            <div className="space-y-1.5 ml-5">
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Palette className="w-3 h-3" />
                <span>背景: {summary.bg}</span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                <Layout className="w-3 h-3" />
                <span>{summary.layout}</span>
              </div>
              {summary.icons.length > 0 && (
                <div className="flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <Code2 className="w-3 h-3" />
                  <span>图标: {summary.icons.join(', ')}</span>
                </div>
              )}
            </div>

            {/* Sync notice */}
            <div className="mt-2 ml-5 text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
              代码已同步到编辑区
            </div>
          </div>

          {/* Action bar */}
          <div className="flex items-center gap-1.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-2.5 h-2.5" />
              {formatTime(message.timestamp)}
            </span>
            <button
              onClick={handleCopy}
              className="p-0.5 rounded transition-colors cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="复制代码"
            >
              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User message or fallback AI message (no code)
  return (
    <div className={`flex gap-2 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))' }}
        >
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
            isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'
          }`}
          style={{
            background: isUser ? 'var(--accent)' : 'var(--bg-card)',
            color: isUser ? 'var(--text-inverse)' : 'var(--text-primary)',
            border: !isUser ? '1px solid var(--border-subtle)' : 'none',
          }}
        >
          {message.content}
        </div>
        <div className={`flex items-center gap-1.5 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-2.5 h-2.5" />
            {formatTime(message.timestamp)}
          </span>
          {message.content && (
            <button
              onClick={handleCopy}
              className="p-0.5 rounded transition-colors cursor-pointer hover:opacity-80"
              style={{ color: 'var(--text-muted)' }}
              title="复制"
            >
              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
