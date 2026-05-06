/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Pencil, Trash2, Check, Server } from 'lucide-react';
import type { Provider } from '../../lib/providers/types';

interface ProviderListItemProps {
  provider: Provider;
  isCurrent: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

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
      {/* Current indicator */}
      <div className="flex-shrink-0">
        {isCurrent ? (
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--accent)' }} />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--border-default)' }} />
        )}
      </div>

      {/* Icon */}
      <div className="flex-shrink-0 p-1.5 rounded-lg" style={{ background: 'var(--bg-input)' }}>
        <Server size={16} style={{ color: isCurrent ? 'var(--accent)' : 'var(--text-muted)' }} />
      </div>

      {/* Name and category */}
      <div className="flex-grow min-w-0">
        <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {provider.name}
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {provider.category === 'custom' ? '自定义' : provider.category}
          {provider.settingsConfig.model && ` · ${provider.settingsConfig.model}`}
        </div>
      </div>

      {/* Current badge */}
      {isCurrent && (
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--accent)', color: 'var(--text-inverse)' }}>
          <Check size={10} />
          当前
        </div>
      )}

      {/* Action buttons */}
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
