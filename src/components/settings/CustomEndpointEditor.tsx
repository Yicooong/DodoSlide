/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// 导入图标：ChevronDown(下箭头)、ChevronUp(上箭头)、Plus(添加)、Pencil(编辑)、Trash2(删除)、X(取消)、Check(确认)
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
// 导入自定义端点类型
import type { CustomEndpoint } from '../../lib/providers/types';
// 导入端点 URL 标准化函数
import { normalizeEndpointUrl } from '../../lib/providers/types';

/** 自定义端点编辑器组件属性接口 */
interface CustomEndpointEditorProps {
  endpoints: Record<string, CustomEndpoint>;  // 当前端点映射（key -> 端点）
  onChange: (endpoints: Record<string, CustomEndpoint>) => void;  // 端点变更回调
}

/**
 * 自定义端点编辑器组件
 * 功能：
 * - 可折叠的面板，管理提供商的自定义端点
 * - 支持添加、编辑、删除端点
 * - 编辑时若名称变更，自动更新 key 并删除旧 key
 * - URL 在失焦时自动标准化
 * - 默认折叠状态，避免占用过多空间
 */
export const CustomEndpointEditor: React.FC<CustomEndpointEditorProps> = ({
  endpoints,
  onChange,
}) => {
  // 是否展开面板
  const [expanded, setExpanded] = useState(false);
  // 是否处于添加模式
  const [isAdding, setIsAdding] = useState(false);
  // 正在编辑的端点 key
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // 表单状态：用于添加/编辑端点
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // 端点条目数组（显式类型标注以解决 TypeScript 推断问题）
  const endpointEntries = Object.entries(endpoints) as [string, CustomEndpoint][];

  /** 重置表单状态：清空输入并退出编辑/添加模式 */
  const resetForm = () => {
    setFormName('');
    setFormUrl('');
    setFormDescription('');
    setIsAdding(false);
    setEditingKey(null);
  };

  /** 添加新端点 */
  const handleAdd = () => {
    if (!formName.trim() || !formUrl.trim()) return;

    // 从名称生成 key：小写、空格替换为连字符
    const key = formName.trim().toLowerCase().replace(/\s+/g, '-');
    const endpoint: CustomEndpoint = {
      name: formName.trim(),
      url: normalizeEndpointUrl(formUrl),
      description: formDescription.trim() || undefined,
    };

    onChange({ ...endpoints, [key]: endpoint });
    resetForm();
  };

  /** 进入编辑模式：加载端点数据到表单 */
  const handleEdit = (key: string) => {
    const ep = endpoints[key];
    setFormName(ep.name);
    setFormUrl(ep.url);
    setFormDescription(ep.description || '');
    setEditingKey(key);
    setIsAdding(false);
  };

  /** 更新已存在的端点 */
  const handleUpdate = () => {
    if (!editingKey || !formName.trim() || !formUrl.trim()) return;

    const endpoint: CustomEndpoint = {
      name: formName.trim(),
      url: normalizeEndpointUrl(formUrl),
      description: formDescription.trim() || undefined,
    };

    const updated = { ...endpoints };
    // 如果 key 变更（名称变了），删除旧 key
    const newKey = formName.trim().toLowerCase().replace(/\s+/g, '-');
    if (newKey !== editingKey) {
      delete updated[editingKey];
    }
    updated[newKey] = endpoint;

    onChange(updated);
    resetForm();
  };

  /** 删除端点 */
  const handleDelete = (key: string) => {
    const updated = { ...endpoints };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div>
      {/* 可折叠头部：显示标题和数量徽章 */}
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
          {/* 已有端点列表 */}
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
              {/* 操作按钮：悬停时显示 */}
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

          {/* 添加/编辑表单 */}
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
                onBlur={() => setFormUrl(prev => normalizeEndpointUrl(prev))}  // 失焦时标准化 URL
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
                {/* 取消按钮 */}
                <button
                  onClick={resetForm}
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
                {/* 确认按钮：根据模式调用添加或更新 */}
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

          {/* 添加按钮：无正在编辑时显示 */}
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
