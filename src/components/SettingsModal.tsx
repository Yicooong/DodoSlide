/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Key, Settings, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import type { Provider, ConnectionTestResult } from '../lib/providers/types';
import { DEFAULT_SYSTEM_PROMPT } from '../lib/prompt-manager';
import type { UseProviderManagerReturn } from '../lib/providers/use-provider-manager';
import { OpenAiCompatibleStrategy } from '../lib/providers/openai-strategy';
import { ProviderList } from './settings/ProviderList';
import { ProviderDetailEditor } from './settings/ProviderDetailEditor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerManager: UseProviderManagerReturn;
  promptSettings: {
    customPrompt: string;
    useDefaultPrompt: boolean;
    userInstructions: string;
  };
  onUpdatePromptSettings: (settings: any) => void;
}

type SettingsTab = 'api' | 'prompt';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providerManager,
  promptSettings,
  onUpdatePromptSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // Provider editing state
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [isAddingProvider, setIsAddingProvider] = useState(false);

  if (!isOpen) return null;

  const editingProvider = editingProviderId ? providerManager.getProvider(editingProviderId) : undefined;
  const isEditingOrAdding = isAddingProvider || editingProviderId !== null;

  // Provider actions
  const handleAddProvider = () => {
    setIsAddingProvider(true);
    setEditingProviderId(null);
  };

  const handleEditProvider = (id: string) => {
    setEditingProviderId(id);
    setIsAddingProvider(false);
  };

  const handleDeleteProvider = (id: string) => {
    if (window.confirm('确定要删除此提供商吗？')) {
      providerManager.deleteProvider(id);
      if (editingProviderId === id) {
        setEditingProviderId(null);
      }
    }
  };

  const handleSaveProvider = (provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>) => {
    providerManager.addProvider(provider);
    setIsAddingProvider(false);
  };

  const handleUpdateProvider = (id: string, updates: Partial<Provider>) => {
    providerManager.updateProvider(id, updates);
    setEditingProviderId(null);
  };

  const handleCancelEdit = () => {
    setIsAddingProvider(false);
    setEditingProviderId(null);
  };

  const handleTestConnection = async (providerId: string): Promise<ConnectionTestResult> => {
    return providerManager.testConnection(providerId);
  };

  const handleListModels = async (endpoint: string, apiKey: string): Promise<{ success: boolean; models?: string[]; error?: string }> => {
    const strategy = new OpenAiCompatibleStrategy();
    return strategy.listModels({ endpoint, apiKey, model: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden" style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
              <Settings size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('api')}
            className="flex-1 px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'api' ? 'var(--accent)' : 'var(--text-muted)',
              background: activeTab === 'api' ? 'var(--accent-bg)' : 'transparent',
              borderBottom: activeTab === 'api' ? '2px solid var(--accent)' : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Key size={16} />
              API 配置
            </div>
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className="flex-1 px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'prompt' ? 'var(--accent)' : 'var(--text-muted)',
              background: activeTab === 'prompt' ? 'var(--accent-bg)' : 'transparent',
              borderBottom: activeTab === 'prompt' ? '2px solid var(--accent)' : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles size={16} />
              Prompt 配置
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-130px)]">
          {activeTab === 'api' ? (
            <div>
              {isEditingOrAdding ? (
                <ProviderDetailEditor
                  provider={editingProvider}
                  onSave={handleSaveProvider}
                  onUpdate={handleUpdateProvider}
                  onCancel={handleCancelEdit}
                  onTestConnection={handleTestConnection}
                  onListModels={handleListModels}
                />
              ) : (
                <ProviderList
                  providers={providerManager.providers}
                  currentProviderId={providerManager.currentProviderId}
                  onSwitch={providerManager.switchProvider}
                  onDelete={handleDeleteProvider}
                  onAdd={handleAddProvider}
                  onEdit={handleEditProvider}
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Use Default Prompt Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>使用默认 Prompt</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>使用内置的系统 Prompt 生成幻灯片</div>
                </div>
                <button
                  onClick={() => onUpdatePromptSettings({ useDefaultPrompt: !promptSettings.useDefaultPrompt })}
                  className="w-12 h-6 rounded-full transition-colors"
                  style={{ background: promptSettings.useDefaultPrompt ? 'var(--accent)' : 'var(--bg-button)' }}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    promptSettings.useDefaultPrompt ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Custom Prompt Editor */}
              {!promptSettings.useDefaultPrompt && (
                <div>
                  <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                    自定义系统 Prompt
                  </label>
                  <textarea
                    value={promptSettings.customPrompt}
                    onChange={(e) => onUpdatePromptSettings({ customPrompt: e.target.value })}
                    placeholder="输入自定义的 system prompt..."
                    rows={10}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none font-mono text-sm resize-none"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-default)',
                    }}
                  />
                </div>
              )}

              {/* View Default Prompt */}
              <div>
                <button
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="flex items-center gap-2 text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPromptEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showPromptEditor ? '隐藏' : '查看'} 默认 Prompt 模板
                </button>
                {showPromptEditor && (
                  <div className="mt-3 p-4 rounded-xl" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
                    <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                      {DEFAULT_SYSTEM_PROMPT}
                    </pre>
                  </div>
                )}
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  额外指令 (可选)
                </label>
                <textarea
                  value={promptSettings.userInstructions}
                  onChange={(e) => onUpdatePromptSettings({ userInstructions: e.target.value })}
                  placeholder="添加额外的生成指令，例如设计风格、颜色偏好等..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl focus:outline-none text-sm resize-none"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4" style={{ borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 font-medium rounded-xl transition-colors text-white"
            style={{ background: 'var(--accent)' }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
