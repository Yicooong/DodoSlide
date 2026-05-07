/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// 导入图标：Plus(添加)、Server(服务器)
import { Plus, Server } from 'lucide-react';
// 导入提供商类型
import type { Provider } from '../../lib/providers/types';
// 导入提供商列表项组件
import { ProviderListItem } from './ProviderListItem';

/** 提供商列表组件属性接口 */
interface ProviderListProps {
  providers: Provider[];                    // 提供商数组
  currentProviderId: string;                // 当前使用的提供商 ID
  onSwitch: (id: string) => void;           // 切换提供商回调
  onDelete: (id: string) => void;           // 删除提供商回调
  onAdd: () => void;                        // 添加提供商回调
  onEdit: (id: string) => void;             // 编辑提供商回调
}

/**
 * 提供商列表组件
 * 功能：
 * - 显示所有已配置的提供商列表
 * - 空状态时显示提示信息并引导添加
 * - 每个提供商使用 ProviderListItem 渲染
 * - 底部提供"添加提供商"按钮
 */
export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  currentProviderId,
  onSwitch,
  onDelete,
  onAdd,
  onEdit,
}) => {
  // 空状态：无任何提供商配置
  if (providers.length === 0) {
    return (
      <div className="space-y-4">
        {/* 空状态提示 */}
        <div className="text-center py-8">
          <div className="inline-flex p-3 rounded-xl mb-3" style={{ background: 'var(--bg-input)' }}>
            <Server size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            尚未配置任何 API 提供商
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            点击下方按钮添加您的第一个提供商
          </div>
        </div>
        {/* 添加按钮 */}
        <button
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors text-white"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={16} />
          添加提供商
        </button>
      </div>
    );
  }

  // 正常状态：显示提供商列表
  return (
    <div className="space-y-2">
      {/* 渲染所有提供商项 */}
      {providers.map((provider) => (
        <ProviderListItem
          key={provider.id}
          provider={provider}
          isCurrent={provider.id === currentProviderId}
          onSwitch={onSwitch}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
      {/* 底部添加按钮：虚线边框样式 */}
      <button
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-colors"
        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px dashed var(--border-default)' }}
      >
        <Plus size={16} />
        添加提供商
      </button>
    </div>
  );
};
