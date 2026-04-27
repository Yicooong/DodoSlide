/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Plus, Server } from 'lucide-react';
import type { Provider } from '../../lib/providers/types';
import { ProviderListItem } from './ProviderListItem';

interface ProviderListProps {
  providers: Provider[];
  currentProviderId: string;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export const ProviderList: React.FC<ProviderListProps> = ({
  providers,
  currentProviderId,
  onSwitch,
  onDelete,
  onAdd,
  onEdit,
}) => {
  if (providers.length === 0) {
    return (
      <div className="space-y-4">
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

  return (
    <div className="space-y-2">
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
