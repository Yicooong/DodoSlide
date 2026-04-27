/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Save, X, Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { Provider, ProviderSettingsConfig, ProviderMeta, ConnectionTestResult } from '../../lib/providers/types';
import { DEFAULT_PROVIDER_SETTINGS_CONFIG, DEFAULT_PROVIDER_META, normalizeEndpointUrl } from '../../lib/providers/types';
import { ApiKeyInput } from './ApiKeyInput';
import { ModelSelectInput } from './ModelSelectInput';
import { CustomEndpointEditor } from './CustomEndpointEditor';

interface ProviderDetailEditorProps {
  provider?: Provider; // undefined = add mode
  onSave: (provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>) => void;
  onUpdate?: (id: string, updates: Partial<Provider>) => void;
  onCancel: () => void;
  onTestConnection: (providerId: string) => Promise<ConnectionTestResult>;
  onListModels: (endpoint: string, apiKey: string) => Promise<{ success: boolean; models?: string[]; error?: string }>;
}

export const ProviderDetailEditor: React.FC<ProviderDetailEditorProps> = ({
  provider,
  onSave,
  onUpdate,
  onCancel,
  onTestConnection,
  onListModels,
}) => {
  const isEditMode = !!provider;

  // Form state
  const [name, setName] = useState(provider?.name || '');
  const [settingsConfig, setSettingsConfig] = useState<ProviderSettingsConfig>(
    provider?.settingsConfig || { ...DEFAULT_PROVIDER_SETTINGS_CONFIG }
  );
  const [meta, setMeta] = useState<ProviderMeta>(
    provider?.meta || { ...DEFAULT_PROVIDER_META }
  );
  const [notes, setNotes] = useState(provider?.notes || '');
  const [websiteUrl, setWebsiteUrl] = useState(provider?.websiteUrl || '');

  // UI state
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Update form when provider changes
  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setSettingsConfig(provider.settingsConfig);
      setMeta(provider.meta || { ...DEFAULT_PROVIDER_META });
      setNotes(provider.notes || '');
      setWebsiteUrl(provider.websiteUrl || '');
    }
  }, [provider]);

  // Normalize endpoint on blur
  const handleEndpointBlur = () => {
    const normalized = normalizeEndpointUrl(settingsConfig.endpoint);
    if (normalized !== settingsConfig.endpoint) {
      setSettingsConfig(prev => ({ ...prev, endpoint: normalized }));
    }
  };

  // Test connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus(null);

    try {
      const result = await onListModels(settingsConfig.endpoint, settingsConfig.apiKey);
      if (result.success && result.models) {
        setAvailableModels(result.models);
        setConnectionStatus({ success: true, message: '连接成功', models: result.models });
      } else {
        setConnectionStatus({ success: false, message: result.error || '连接失败' });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '连接测试失败';
      setConnectionStatus({ success: false, message });
    } finally {
      setIsTesting(false);
    }
  };

  // Validate and save
  const handleSave = () => {
    const errors: string[] = [];
    if (!name.trim()) errors.push('提供商名称不能为空');
    if (!settingsConfig.endpoint.trim()) errors.push('API 端点不能为空');
    if (!settingsConfig.apiKey.trim()) errors.push('API Key 不能为空');

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);

    const providerData: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'> = {
      name: name.trim(),
      settingsConfig,
      category: 'custom',
      meta,
      notes: notes.trim() || undefined,
      websiteUrl: websiteUrl.trim() || undefined,
    };

    if (isEditMode && provider && onUpdate) {
      onUpdate(provider.id, providerData);
    } else {
      onSave(providerData);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {isEditMode ? '编辑提供商' : '添加提供商'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {validationErrors.map((err, i) => (
            <div key={i} className="text-xs" style={{ color: '#fca5a5' }}>{err}</div>
          ))}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          提供商名称
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如: OpenAI, DeepSeek, 本地模型"
          className="w-full px-4 py-3 rounded-xl focus:outline-none"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        />
      </div>

      {/* Endpoint */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          API 端点
        </label>
        <input
          type="text"
          value={settingsConfig.endpoint}
          onChange={(e) => setSettingsConfig(prev => ({ ...prev, endpoint: e.target.value }))}
          onBlur={handleEndpointBlur}
          placeholder="https://api.example.com/v1"
          className="w-full px-4 py-3 rounded-xl focus:outline-none"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        />
        {settingsConfig.endpoint && (
          <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            完整地址: <span style={{ color: 'var(--text-secondary)' }}>{normalizeEndpointUrl(settingsConfig.endpoint)}/chat/completions</span>
          </div>
        )}
      </div>

      {/* API Key */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          API Key
        </label>
        <ApiKeyInput
          value={settingsConfig.apiKey}
          onChange={(value) => setSettingsConfig(prev => ({ ...prev, apiKey: value }))}
        />
      </div>

      {/* Model */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
          选择模型
        </label>
        <ModelSelectInput
          value={settingsConfig.model}
          onChange={(value) => setSettingsConfig(prev => ({ ...prev, model: value }))}
          availableModels={availableModels}
          onRefresh={handleTestConnection}
          isTesting={isTesting}
        />
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div className="p-3 rounded-xl" style={{
          background: connectionStatus.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${connectionStatus.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        }}>
          <div className="flex items-center gap-2">
            {connectionStatus.success ? (
              <Wifi size={14} style={{ color: '#22c55e' }} />
            ) : (
              <WifiOff size={14} style={{ color: '#ef4444' }} />
            )}
            <span className="text-xs" style={{ color: connectionStatus.success ? '#22c55e' : '#ef4444' }}>
              {connectionStatus.message}
            </span>
          </div>
        </div>
      )}

      {/* Temperature & MaxTokens */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Temperature
          </label>
          <input
            type="number"
            value={settingsConfig.temperature ?? 0.7}
            onChange={(e) => setSettingsConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) || 0.7 }))}
            min={0}
            max={2}
            step={0.1}
            className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Max Tokens
          </label>
          <input
            type="number"
            value={settingsConfig.maxTokens ?? 8192}
            onChange={(e) => setSettingsConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 8192 }))}
            min={1}
            step={1024}
            className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          />
        </div>
      </div>

      {/* Custom Endpoints */}
      <CustomEndpointEditor
        endpoints={meta.customEndpoints}
        onChange={(endpoints) => setMeta(prev => ({ ...prev, customEndpoints: endpoints }))}
      />

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
          备注 (可选)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="添加备注..."
          rows={2}
          className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm resize-none"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl transition-colors text-sm"
          style={{ background: 'var(--bg-button)', color: 'var(--text-secondary)' }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors text-white text-sm"
          style={{ background: 'var(--accent)' }}
        >
          <Save size={14} />
          保存
        </button>
      </div>
    </div>
  );
};
