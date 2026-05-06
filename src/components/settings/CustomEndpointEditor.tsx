/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import type { CustomEndpoint } from '../../lib/providers/types';
import { normalizeEndpointUrl } from '../../lib/providers/types';

interface CustomEndpointEditorProps {
  endpoints: Record<string, CustomEndpoint>;
  onChange: (endpoints: Record<string, CustomEndpoint>) => void;
}

export const CustomEndpointEditor: React.FC<CustomEndpointEditorProps> = ({
  endpoints,
  onChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Form state for add/edit
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const endpointEntries = Object.entries(endpoints);

  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormDescription('');
    setIsAdding(false);
    setEditingKey(null);
  };

  const handleAdd = () => {
    if (!formName.trim() || !formUrl.trim()) return;

    const key = formName.trim().toLowerCase().replace(/\s+/g, '-');
    const endpoint: CustomEndpoint = {
      name: formName.trim(),
      url: normalizeEndpointUrl(formUrl),
      description: formDescription.trim() || undefined,
    };

    onChange({ ...endpoints, [key]: endpoint });
    resetForm();
  };

  const handleEdit = (key: string) => {
    const ep = endpoints[key];
    setFormName(ep.name);
    setFormUrl(ep.url);
    setFormDescription(ep.description || '');
    setEditingKey(key);
    setIsAdding(false);
  };

  const handleUpdate = () => {
    if (!editingKey || !formName.trim() || !formUrl.trim()) return;

    const endpoint: CustomEndpoint = {
      name: formName.trim(),
      url: normalizeEndpointUrl(formUrl),
      description: formDescription.trim() || undefined,
    };

    const updated = { ...endpoints };
    // If key changed, remove old key
    const newKey = formName.trim().toLowerCase().replace(/\s+/g, '-');
    if (newKey !== editingKey) {
      delete updated[editingKey];
    }
    updated[newKey] = endpoint;

    onChange(updated);
    resetForm();
  };

  const handleDelete = (key: string) => {
    const updated = { ...endpoints };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div>
      {/* Collapsible header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs transition-colors w-full"
        style={{ color: 'var(--text-muted)' }}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        自定义端点
        {endpointEntries.length > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--bg-input)' }}>
            {endpointEntries.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {/* Existing endpoints */}
          {endpointEntries.map(([key, ep]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2.5 rounded-lg group"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}
            >
              <div className="flex-grow min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {ep.name}
                </div>
                <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                  {ep.url}
                </div>
                {ep.description && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {ep.description}
                  </div>
                )}
              </div>
              <button
                onClick={() => handleEdit(key)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => handleDelete(key)}
                className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add/Edit form */}
          {(isAdding || editingKey) && (
            <div className="p-3 rounded-lg space-y-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="端点名称"
                className="w-full px-3 py-2 rounded-lg focus:outline-none text-xs"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              />
              <input
                type="text"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                onBlur={() => setFormUrl(prev => normalizeEndpointUrl(prev))}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 rounded-lg focus:outline-none text-xs"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              />
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="描述 (可选)"
                className="w-full px-3 py-2 rounded-lg focus:outline-none text-xs"
                style={{
                  background: 'var(--bg-input)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={resetForm}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
                <button
                  onClick={editingKey ? handleUpdate : handleAdd}
                  disabled={!formName.trim() || !formUrl.trim()}
                  className="p-1.5 rounded-lg disabled:opacity-50"
                  style={{ color: 'var(--accent)' }}
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Add button */}
          {!isAdding && !editingKey && (
            <button
              onClick={() => { setIsAdding(true); resetForm(); setFormName(''); setFormUrl(''); setFormDescription(''); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
              style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', border: '1px dashed var(--border-default)' }}
            >
              <Plus size={12} />
              添加端点
            </button>
          )}
        </div>
      )}
    </div>
  );
};
