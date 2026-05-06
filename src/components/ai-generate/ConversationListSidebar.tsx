/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
// 导入图标：Plus(新建)、Search(搜索)、Trash2(删除)、Edit3(编辑)、Check(确认)、X(取消)、MessageSquare(消息)
import { Plus, Search, Trash2, Edit3, Check, X, MessageSquare } from 'lucide-react';
// 导入对话摘要类型
import type { ConversationSummary } from '../../lib/chat/types';

/** 对话列表侧边栏组件属性接口 */
interface ConversationListSidebarProps {
  conversations: ConversationSummary[];  // 对话列表
  activeId: string | null;               // 当前活跃的对话 ID
  onSwitch: (id: string) => void;        // 切换对话回调
  onCreate: () => void;                  // 创建新对话回调
  onDelete: (id: string) => void;        // 删除对话回调
  onRename: (id: string, title: string) => void;  // 重命名对话回调
}

/**
 * 对话列表侧边栏组件
 * 功能：
 * - 显示所有对话的列表，支持搜索过滤
 * - 支持重命名和删除操作
 * - 高亮显示当前活跃的对话
 * - 显示对话的相对时间和消息数量
 */
const ConversationListSidebar: React.FC<ConversationListSidebarProps> = ({
  conversations,
  activeId,
  onSwitch,
  onCreate,
  onDelete,
  onRename,
}) => {
  // 搜索关键词状态
  const [search, setSearch] = useState('');
  // 正在编辑的对话 ID
  const [editingId, setEditingId] = useState<string | null>(null);
  // 编辑中的标题内容
  const [editTitle, setEditTitle] = useState('');
  // 编辑输入框引用：用于自动聚焦
  const editInputRef = useRef<HTMLInputElement>(null);

  // 根据搜索关键词过滤对话列表（不区分大小写）
  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  /** 开始编辑对话标题：设置编辑状态并聚焦输入框 */
  const handleStartEdit = (conv: ConversationSummary) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  /** 确认编辑：调用重命名回调并清除编辑状态 */
  const handleConfirmEdit = () => {
    if (editingId && editTitle.trim()) {
      onRename(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  /** 取消编辑：清除编辑状态 */
  const handleCancelEdit = () => {
    setEditingId(null);
  };

  /** 处理编辑框键盘事件：Enter 确认，Escape 取消 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirmEdit();
    if (e.key === 'Escape') handleCancelEdit();
  };

  /**
   * 格式化相对时间
   * 根据时间戳计算与当前时间的差值，返回人类可读的相对时间描述
   */
  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp).toLocaleDateString('zh-CN');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部区域：标题 + 新建按钮 + 搜索框 */}
      <div className="px-3 py-3 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
            对话列表
          </span>
          <button
            onClick={onCreate}
            className="p-1 rounded-md transition-all cursor-pointer hover:opacity-80"
            style={{ color: 'var(--accent)', background: 'var(--bg-input)' }}
            title="新建对话"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}
        >
          <Search className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索对话..."
            className="flex-1 bg-transparent outline-none text-[11px]"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      {/* 对话列表区域 */}
      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          /* 空状态：搜索无结果或暂无对话 */
          <div className="flex flex-col items-center justify-center h-full py-8">
            <MessageSquare className="w-6 h-6 mb-2 opacity-20" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {search ? '没有匹配的对话' : '暂无对话'}
            </p>
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {filtered.map(conv => {
              const isActive = conv.id === activeId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => !isEditing && onSwitch(conv.id)}
                  className={`group relative px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                    isActive ? 'ring-1' : ''
                  }`}
                  style={{
                    background: isActive ? 'var(--bg-card)' : 'transparent',
                    borderColor: isActive ? 'var(--accent)' : 'transparent',
                    ringColor: isActive ? 'var(--accent)' : undefined,
                  }}
                  // 鼠标悬停效果：非活跃项显示背景色
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'var(--bg-input)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {isEditing ? (
                    /* 编辑模式：显示输入框和确认/取消按钮 */
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent outline-none text-[11px] px-1 py-0.5 rounded"
                        style={{
                          color: 'var(--text-primary)',
                          border: '1px solid var(--accent)',
                        }}
                      />
                      <button
                        onClick={handleConfirmEdit}
                        className="p-0.5 rounded cursor-pointer hover:opacity-80"
                        style={{ color: 'var(--accent)' }}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-0.5 rounded cursor-pointer hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    /* 普通模式：显示对话信息和操作按钮 */
                    <>
                      <div className="text-[11px] font-medium truncate pr-10" style={{ color: 'var(--text-primary)' }}>
                        {conv.title}
                      </div>
                      {conv.lastMessage && (
                        <div className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {conv.lastMessage}
                        </div>
                      )}
                      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {formatRelativeTime(conv.updatedAt)} · {conv.messageCount} 条消息
                      </div>

                      {/* 操作按钮：悬停时显示编辑和删除按钮 */}
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(conv);
                          }}
                          className="p-0.5 rounded transition-colors cursor-pointer hover:opacity-80"
                          style={{ color: 'var(--text-muted)' }}
                          title="重命名"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(conv.id);
                          }}
                          className="p-0.5 rounded transition-colors cursor-pointer hover:opacity-80"
                          style={{ color: '#EF4444' }}
                          title="删除"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationListSidebar;
