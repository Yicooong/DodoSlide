/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// 导入图标：Pencil(编辑)、Trash2(删除)、Check(确认)、Server(服务器)
import { Pencil, Trash2, Check, Server } from 'lucide-react';
// 导入提供商类型
import type { Provider } from '../../lib/providers/types';

/** 提供商列表项组件属性接口 */
interface ProviderListItemProps {
  provider: Provider;        // 提供商数据
  isCurrent: boolean;        // 是否为当前使用的提供商
  onSwitch: (id: string) => void;  // 切换到该提供商
  onDelete: (id: string) => void;  // 删除该提供商
  onEdit: (id: string) => void;    // 编辑该提供商
}

/**
 * 提供商列表项组件
 * 功能：
 * - 显示提供商信息：名称、类别、模型
 * - 当前提供商有特殊标识（圆点 + "当前" 徽章）
 * - 点击整行切换到该提供商
 * - 悬停显示编辑和删除按钮
 * - 编辑/删除按钮使用 stopPropagation 防止触发切换
 */
export const ProviderListItem: React.FC<ProviderListItemProps> = ({
  provider,
  isCurrent,
  onSwitch,
  onDelete,
  onEdit,
}) => {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group"
      style={{
        background: isCurrent ? 'var(--accent-bg)' : 'var(--bg-card)',
        border: isCurrent ? '1px solid var(--border-active)' : '1px solid var(--border-default)',
      }}
      onClick={() => onSwitch(provider.id)}
    >
      {/* 当前状态指示器：圆点 */}
      <div className="flex-shrink-0">
        {isCurrent ? (
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-default)' }} />
        )}
      </div>

      {/* 服务器图标 */}
      <div className="flex-shrink-0 p-1.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
        <Server size={16} style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-muted)' }} />
      </div>

      {/* 名称和类别信息 */}
      <div className="flex-grow min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {provider.name}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {provider.category === 'custom' ? '自定义' : provider.category}
          {provider.settingsConfig.model && ` · ${provider.settingsConfig.model}`}
        </div>
      </div>

      {/* "当前" 徽章：仅当前提供商显示 */}
      {isCurrent && (
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}>
          <Check size={10} />
          当前
        </div>
      )}

      {/* 操作按钮：悬停时显示编辑和删除 */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(provider.id); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="编辑"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(provider.id); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="删除"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
