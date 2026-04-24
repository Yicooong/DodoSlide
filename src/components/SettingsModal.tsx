/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Key, Settings, Sparkles, ChevronDown, ChevronUp, Eye, EyeOff, Check, Loader2, Wifi, WifiOff } from 'lucide-react';
import { ApiProvider, API_PROVIDERS, listModels } from '../lib/api-providers';
import { DEFAULT_SYSTEM_PROMPT } from '../lib/prompt-manager';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiSettings: {
    provider: ApiProvider;
    customEndpoint: string;
    customModel: string;
    customApiKey: string;
    geminiApiKey: string;
    openaiApiKey: string;
    anthropicApiKey: string;
  };
  onUpdateApiSettings: (settings: any) => void;
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
  apiSettings,
  onUpdateApiSettings,
  promptSettings,
  onUpdatePromptSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [showApiKey, setShowApiKey] = useState<Record<ApiProvider, boolean>>({
    custom: false,
  });
  const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<{
      success: boolean;
      message: string;
      models?: string[];
    } | null>(null);

    const testConnection = async () => {
      const apiKey = getCurrentApiKey(apiSettings.provider);
      if (!apiKey) {
        setConnectionStatus({ success: false, message: '请先输入 API Key' });
        return;
      }

      setTestingConnection(true);
      setConnectionStatus(null);

      try {
        const result = await listModels(
          apiSettings.provider,
          apiKey,
          apiSettings.provider === 'custom' || apiSettings.provider === 'openai'
            ? apiSettings.customEndpoint
            : undefined
        );

        if (result.success) {
          setConnectionStatus({
            success: true,
            message: '连接成功',
            models: result.models,
          });
        } else {
          setConnectionStatus({
            success: false,
            message: result.error || '连接失败',
          });
        }
      } catch (error: any) {
        setConnectionStatus({
          success: false,
          message: error.message || '连接测试失败',
        });
      } finally {
        setTestingConnection(false);
      }
    };
  if (!isOpen) return null;

  const toggleShowApiKey = (provider: ApiProvider) => {
    setShowApiKey(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getCurrentApiKey = (provider: ApiProvider): string => {
    switch (provider) {
      case 'custom': return apiSettings.customApiKey;
      default: return '';
    }
  };

  const setCurrentApiKey = (provider: ApiProvider, value: string) => {
    switch (provider) {
      case 'custom': onUpdateApiSettings({ customApiKey: value }); break;
    }
  };

  const renderMaskedKey = (key: string) => {
    if (!key) return '未设置';
    if (key.length < 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
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
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'api'
                ? ''
                : ''
            }`}
            style={{
              color: activeTab === 'api' ? 'var(--accent)' : 'var(--text-muted)',
              borderColor: 'var(--border-active)',
              background: activeTab === 'api' ? 'var(--accent-bg)' : 'transparent',
              borderBottom: activeTab === 'api' ? '2px solid var(--accent)' : 'none'
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Key size={16} />
              API 配置
            </div>
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'prompt'
                ? ''
                : ''
            }`}
            style={{
              color: activeTab === 'prompt' ? 'var(--accent)' : 'var(--text-muted)',
              borderColor: 'var(--border-active)',
              background: activeTab === 'prompt' ? 'var(--accent-bg)' : 'transparent',
              borderBottom: activeTab === 'prompt' ? '2px solid var(--accent)' : 'none'
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
            <div className="space-y-6">
              {/* API Endpoint Configuration */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  API 端点
                </label>
                <input
                  type="text"
                  value={apiSettings.customEndpoint}
                  onChange={(e) => {
                    let value = e.target.value.trim();
                    // Auto-correct: strip trailing paths like /chat/completions, /v1/chat/completions
                    value = value.replace(/\/chat\/completions\/?$/, '');
                    value = value.replace(/\/v1\/chat\/completions\/?$/, '/v1');
                    // Remove trailing slash
                    value = value.replace(/\/$/, '');
                    onUpdateApiSettings({ customEndpoint: value });
                  }}
                  placeholder="https://api.example.com/v1"
                  className="w-full px-4 py-3 rounded-xl focus:outline-none"
                  style={{
                    background: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-default)'
                  }}
                />
                {apiSettings.customEndpoint && (
                  <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    完整地址: <span style={{ color: 'var(--text-secondary)' }}>{apiSettings.customEndpoint}/chat/completions</span>
                  </div>
                )}
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey['custom'] ? 'text' : 'password'}
                    value={apiSettings.customApiKey}
                    onChange={(e) => setCurrentApiKey('custom', e.target.value)}
                    placeholder="输入 API Key"
                    className="w-full px-4 py-3 rounded-xl focus:outline-none pr-12"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-default)'
                    }}
                  />
                  <button
                    onClick={() => toggleShowApiKey('custom')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showApiKey['custom'] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <Check size={12} style={{ color: apiSettings.customApiKey ? '#22c55e' : 'var(--text-muted)' }} />
                  当前: {renderMaskedKey(apiSettings.customApiKey)}
                </div>
              </div>

              {/* Custom Model Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                  选择模型
                </label>
                <div className="space-y-3">
                  <select
                    value={apiSettings.customModel}
                    onChange={(e) => onUpdateApiSettings({ customModel: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none appearance-none cursor-pointer"
                    style={{
                      background: 'var(--bg-input)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    <option value="">请选择模型</option>
                    {connectionStatus?.models?.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    点击下方"测试连接"按钮获取可用模型列表
                  </div>
                </div>
              </div>

              {/* Test Connection & Save */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <button
                    onClick={testConnection}
                    disabled={testingConnection || !apiSettings.customApiKey || !apiSettings.customEndpoint}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'var(--bg-button)' }}
                  >
                    {testingConnection ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        测试中...
                      </>
                    ) : (
                      <>
                        <Wifi size={16} />
                        测试连接
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onUpdateApiSettings({ ...apiSettings })}
                    className="flex items-center justify-center gap-2 py-3 px-4 text-white rounded-xl transition-colors"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Check size={16} />
                    保存
                  </button>
                </div>

                {/* Connection Status */}
                {connectionStatus && (
                  <div className={`p-4 rounded-xl border ${
                    connectionStatus.success
                      ? ''
                      : ''
                  }`}
                  style={{
                    background: connectionStatus.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderColor: connectionStatus.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                  }}
                  >
                    <div className="flex items-center gap-2">
                      {connectionStatus.success ? (
                        <Wifi size={16} style={{ color: '#22c55e' }} />
                      ) : (
                        <WifiOff size={16} style={{ color: '#ef4444' }} />
                      )}
                      <span style={{ color: connectionStatus.success ? '#22c55e' : '#ef4444' }}>
                        {connectionStatus.message}
                      </span>
                    </div>
                    {connectionStatus.success && connectionStatus.models && connectionStatus.models.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>可用模型 (点击选择):</div>
                        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                          {connectionStatus.models.map((model) => (
                            <button
                              key={model}
                              onClick={() => {
                                onUpdateApiSettings({ customModel: model });
                                setConnectionStatus(prev => prev ? {
                                  ...prev,
                                  message: `已选择: ${model}`
                                } : null);
                              }}
                              className={`px-2 py-1 rounded text-xs transition-colors ${
                                apiSettings.customModel === model
                                  ? 'text-white'
                                  : ''
                              }`}
                              style={{
                                background: apiSettings.customModel === model ? 'var(--accent)' : 'var(--bg-input)',
                                color: apiSettings.customModel === model ? 'var(--text-inverse)' : 'var(--text-secondary)'
                              }}
                            >
                              {model}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  className={`w-12 h-6 rounded-full transition-colors ${
                    promptSettings.useDefaultPrompt ? '' : ''
                  }`}
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
                      border: '1px solid var(--border-default)'
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
                    border: '1px solid var(--border-default)'
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
