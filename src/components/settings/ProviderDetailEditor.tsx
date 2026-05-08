/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
// 导入图标：Save(保存)、X(取消)、Wifi(连接成功)、WifiOff(连接失败)、Loader2(加载中)
import { Save, X, Wifi, WifiOff, Loader2 } from 'lucide-react';
// 导入提供商相关类型
import type { Provider, ProviderSettingsConfig, ProviderMeta, ConnectionTestResult } from '../../lib/providers/types';
// 导入默认配置和 URL 标准化函数
import { DEFAULT_PROVIDER_SETTINGS_CONFIG, DEFAULT_PROVIDER_META, normalizeEndpointUrl } from '../../lib/providers/types';
// 导入子组件
import { ApiKeyInput } from './ApiKeyInput';
import { ModelSelectInput } from './ModelSelectInput';
import { CustomEndpointEditor } from './CustomEndpointEditor';

/** 提供商详情编辑器组件属性接口 */
interface ProviderDetailEditorProps {
  provider?: Provider;  // 编辑时传入提供商数据，undefined 表示添加模式
  onSave: (provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>) => void;  // 保存新提供商
  onUpdate?: (id: string, updates: Partial<Provider>) => void;  // 更新已有提供商
  onCancel: () => void;  // 取消编辑
  onTestConnection: (providerId: string) => Promise<ConnectionTestResult>;  // 测试连接
  onListModels: (endpoint: string, apiKey: string) => Promise<{ success: boolean; models?: string[]; error?: string }>;  // 获取模型列表
}

/**
 * 提供商详情编辑器组件
 * 功能：
 * - 支持添加和编辑两种模式
 * - 表单字段：名称、端点、API Key、模型、Temperature、Max Tokens、自定义端点、备注
 * - 表单验证：名称、端点、API Key 不能为空
 * - 连接测试：测试 API 端点和 Key 是否有效，获取可用模型
 * - 失焦时自动标准化端点 URL
 * - 编辑模式下，provider 变化时自动重置表单
 */
export const ProviderDetailEditor: React.FC<ProviderDetailEditorProps> = ({
  provider,
  onSave,
  onUpdate,
  onCancel,
  onTestConnection,
  onListModels,
}) => {
  // 是否为编辑模式
  const isEditMode = !!provider;

  // 表单状态
  const [name, setName] = useState(provider?.name || '');
  const [settingsConfig, setSettingsConfig] = useState<ProviderSettingsConfig>(
    provider?.settingsConfig || { ...DEFAULT_PROVIDER_SETTINGS_CONFIG }
  );
  const [meta, setMeta] = useState<ProviderMeta>(
    provider?.meta || { ...DEFAULT_PROVIDER_META }
  );
  const [notes, setNotes] = useState(provider?.notes || '');
  const [websiteUrl, setWebsiteUrl] = useState(provider?.websiteUrl || '');

  // UI 状态
  const [availableModels, setAvailableModels] = useState<string[]>([]);  // 可用模型列表
  const [isTesting, setIsTesting] = useState(false);  // 是否正在测试连接
  const [connectionStatus, setConnectionStatus] = useState<ConnectionTestResult | null>(null);  // 连接测试结果
  const [validationErrors, setValidationErrors] = useState<string[]>([]);  // 表单验证错误

  // 当 provider 变化时（进入编辑模式），重置表单数据
  useEffect(() => {
    if (provider) {
      setName(provider.name);
      setSettingsConfig(provider.settingsConfig);
      setMeta(provider.meta || { ...DEFAULT_PROVIDER_META });
      setNotes(provider.notes || '');
      setWebsiteUrl(provider.websiteUrl || '');
    }
  }, [provider]);

  /** 失焦时标准化端点 URL */
  const handleEndpointBlur = () => {
    const normalized = normalizeEndpointUrl(settingsConfig.endpoint);
    if (normalized !== settingsConfig.endpoint) {
      setSettingsConfig(prev => ({ ...prev, endpoint: normalized }));
    }
  };

  /**
   * 测试连接：调用 API 获取模型列表
   * 成功后显示绿色状态和模型列表
   * 失败后显示红色错误信息
   */
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

  /**
   * 验证并保存
   * 验证规则：名称、端点、API Key 不能为空
   * 验证通过后调用 onSave（添加模式）或 onUpdate（编辑模式）
   */
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
      {/* 头部：标题和关闭按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          {isEditMode ? '编辑提供商' : '添加提供商'}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg transition-all active:scale-90"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* 验证错误提示 */}
      {validationErrors.length > 0 && (
        <div className="p-3 rounded-xl" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          {validationErrors.map((err, i) => (
            <div key={i} className="text-xs" style={{ color: '#fca5a5' }}>{err}</div>
          ))}
        </div>
      )}

      {/* 提供商名称 */}
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

      {/* API 端点 */}
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
        {/* 显示完整的 API 调用地址 */}
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

      {/* 模型选择 */}
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

      {/* 连接状态显示 */}
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

      {/* Temperature 和 Max Tokens 并排输入 */}
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

      {/* 自定义端点编辑器 */}
      <CustomEndpointEditor
        endpoints={meta.customEndpoints}
        onChange={(endpoints) => setMeta(prev => ({ ...prev, customEndpoints: endpoints }))}
      />

      {/* 备注（可选） */}
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

      {/* 操作按钮：取消和保存 */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl transition-all text-sm active:scale-[0.98]"
          style={{ background: 'var(--bg-button)', color: 'var(--text-secondary)' }}
        >
          取消
        </button>
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-white text-sm active:scale-[0.98] hover:brightness-110"
          style={{ background: 'var(--accent)' }}
        >
          <Save size={14} />
          保存
        </button>
      </div>
    </div>
  );
};
