/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// 导入图标：Sparkles(闪光)、RotateCcw(重试)、Copy(复制)、Check(确认)、Clock(时钟)、CheckCircle(完成)、Palette(调色板)、Layout(布局)、Code2(代码)
import { Sparkles, RotateCcw, Copy, Check, Clock, CheckCircle, Palette, Layout, Code2 } from 'lucide-react';
// 导入聊天消息类型
import type { ChatMessage } from '../../lib/chat/types';

/** 消息气泡组件属性接口 */
interface MessageBubbleProps {
  message: ChatMessage;          // 消息对象
  onRetry?: (messageId: string) => void;  // 重试回调（可选）
}

/**
 * 从 JSX 代码中提取设计摘要信息
 * 分析代码中的背景色、布局类型和使用的图标
 */
function extractDesignSummary(code: string): { bg: string; layout: string; icons: string[] } {
  // 提取背景色类名
  const bgMatch = code.match(/bg-\[?(#[0-9a-fA-F]+|[\w-]+)\]?/);
  const bg = bgMatch ? bgMatch[1] : '白色背景';

  // 判断布局类型
  const hasFlex = /flex/.test(code);
  const hasGrid = /grid/.test(code);
  const layout = hasGrid ? '网格布局' : hasFlex ? '弹性布局' : '标准布局';

  // 提取导入的 lucide-react 图标名称
  const iconMatches = code.matchAll(/import\s*\{([^}]+)\}\s*from\s*'lucide-react'/g);
  const icons: string[] = [];
  for (const match of iconMatches) {
    const imported = match[1].split(',').map(s => s.trim()).filter(Boolean);
    icons.push(...imported.slice(0, 3));
  }

  return { bg, layout, icons: icons.slice(0, 4) };
}

/**
 * 消息气泡组件
 * 功能：
 * - 根据消息状态显示不同 UI（流式中、完成、错误、普通）
 * - 完成状态时显示设计摘要（背景、布局、图标）
 * - 支持复制消息内容
 * - 显示消息时间戳
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRetry }) => {
  // 复制状态：用于显示复制成功反馈
  const [copied, setCopied] = useState(false);
  // 消息角色判断
  const isUser = message.role === 'user';
  // 消息状态判断
  const isStreaming = message.status === 'streaming';
  const isComplete = message.status === 'complete';
  const isError = message.status === 'error';
  // 是否包含生成的代码
  const hasCode = !!message.code;

  /**
   * 处理复制：将消息内容或代码复制到剪贴板
   * 优先使用现代 Clipboard API，失败时回退到 execCommand
   */
  const handleCopy = async () => {
    const textToCopy = message.code || message.content;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 回退方案：创建临时 textarea 执行复制
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

  /** 格式化时间戳为 HH:MM 格式 */
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  // 错误消息：显示错误内容和重试按钮
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

  // 流式生成中：显示动画圆点表示正在生成
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
            {/* 弹跳动画圆点：模拟 AI 思考中 */}
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

  // 完成状态且有代码：显示设计摘要卡片
  if (isComplete && hasCode) {
    const summary = extractDesignSummary(message.code!);
    return (
      <div className="flex gap-2 group">
        {/* AI 头像：渐变圆形背景 */}
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
            {/* 头部：完成状态标识 */}
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                幻灯片已生成
              </span>
            </div>

            {/* 设计摘要：背景色、布局类型、使用的图标 */}
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

            {/* 同步提示：告知用户代码已同步到编辑区 */}
            <div className="mt-2 ml-5 text-[10px] px-2 py-1 rounded" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
              代码已同步到编辑区
            </div>
          </div>

          {/* 底部操作栏：时间戳 + 复制按钮（悬停显示） */}
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

  // 用户消息或普通 AI 消息（无代码）
  return (
    <div className={`flex gap-2 group ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* AI 头像（仅 AI 消息显示） */}
      {!isUser && (
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))' }}
        >
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 消息内容气泡 */}
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
        {/* 底部操作栏：时间戳 + 复制按钮（悬停显示） */}
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
