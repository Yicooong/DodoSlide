/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
// 导入 lucide-react 图标组件：Send(发送)、Sparkles(闪光/魔法)、Square(停止)
import { Send, Sparkles, Square } from 'lucide-react';
// 导入画布比例类型定义
import { CanvasRatio } from '../../lib/canvas-config';
// 导入聊天消息类型定义
import type { ChatMessage } from '../../lib/chat/types';
// 导入消息气泡子组件，用于渲染单条聊天消息
import MessageBubble from './MessageBubble';

/** AI 助手侧边栏组件属性接口 */
interface AiAssistantSidebarProps {
  messages: ChatMessage[];       // 聊天消息列表
  onSendMessage: (message: string) => void;  // 发送消息回调
  isGenerating: boolean;         // 是否正在生成中
  error: string | null;          // 错误信息（旧版兼容）
  onRetry: () => void;           // 重试回调（旧版兼容）
  onStopGenerate: () => void;    // 停止生成回调
  onRetryMessage?: (messageId: string) => void;  // 重试单条消息回调
  canvasRatio: CanvasRatio;      // 画布比例
  welcomeMessage?: string;       // 欢迎消息（可选）
}

/**
 * AI 助手侧边栏组件
 * 功能：
 * - 显示与 AI 的对话历史
 * - 提供消息输入框和发送功能
 * - 显示生成状态和快捷操作按钮
 * - 支持停止正在进行的生成任务
 */
const AiAssistantSidebar: React.FC<AiAssistantSidebarProps> = ({
  messages,
  onSendMessage,
  isGenerating,
  error,
  onRetry,
  onStopGenerate,
  onRetryMessage,
  canvasRatio,
  welcomeMessage,
}) => {
  // 输入框内容状态
  const [inputValue, setInputValue] = useState('');
  // 消息列表底部引用，用于自动滚动
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 当消息列表或生成状态变化时，自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  /** 处理消息提交：发送输入内容并清空输入框 */
  const handleSubmit = () => {
    if (!inputValue.trim() || isGenerating) return;
    onSendMessage(inputValue.trim());
    setInputValue('');
  };

  /** 处理键盘事件：Enter 发送，Shift+Enter 换行 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 快捷操作按钮文案列表，点击直接发送对应内容
  const quickActions = [
    '把背景调深一点',
    '增加数据图表',
    '文字再精简一些',
    '换个配色方案',
  ];

  // 判断是否显示欢迎消息：当没有消息且不在生成中时显示
  const showWelcome = messages.length === 0 && !isGenerating;

  return (
    <div className="flex flex-col h-full">
      {/* 头部：AI 助手标题栏 */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        {/* AI 图标：渐变圆形背景 + 闪光图标 */}
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

      {/* 消息列表区域 */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* 欢迎消息：初始状态显示 */}
        {showWelcome && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: 'var(--accent)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {welcomeMessage || '幻灯片已生成，你可以告诉我需要修改的地方'}
            </p>
          </div>
        )}

        {/* 渲染所有消息 */}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onRetry={onRetryMessage}
          />
        ))}

        {/* 全局错误显示（旧版兼容回退）：当没有消息处于错误状态时才显示 */}
        {error && !messages.some(m => m.status === 'error') && (
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: '#EF4444' }}
            >
              <span className="text-white text-[10px]">!</span>
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

        {/* 滚动锚点：确保新消息可见 */}
        <div ref={messagesEndRef} />
      </div>

      {/* 生成状态指示器：生成中时显示在聊天区域底部 */}
      {isGenerating && (
        <div
          className="mx-3 mb-2 flex items-center justify-between px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* 弹跳动画圆点：模拟 AI 思考中 */}
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
            </div>
            <span className="text-[11px]" style={{ color: 'var(--accent)' }}>
              AI 正在生成幻灯片...
            </span>
          </div>
          {/* 停止按钮：中断正在进行的生成任务 */}
          <button
            onClick={onStopGenerate}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-all cursor-pointer hover:opacity-80"
            style={{ background: '#EF4444', color: '#fff' }}
          >
            <Square className="w-2.5 h-2.5" />
            停止
          </button>
        </div>
      )}

      {/* 快捷操作按钮：有消息且不在生成中时显示 */}
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

      {/* 输入区域 */}
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
          {/* 文本输入框 */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="告诉 AI 你的修改需求..."
            className="flex-1 bg-transparent outline-none text-xs"
            style={{ color: 'var(--text-primary)' }}
            disabled={isGenerating}  // 生成中时禁用输入
          />
          {/* 发送按钮 */}
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isGenerating}  // 无内容或生成中时禁用
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
