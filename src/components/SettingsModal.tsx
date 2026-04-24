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
  appTheme: string;
  onAppThemeChange: (theme: any) => void;
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
    gemini: false,
    openai: false,
    anthropic: false,
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
      case 'gemini': return apiSettings.geminiApiKey;
      case 'openai': return apiSettings.openaiApiKey;
      case 'anthropic': return apiSettings.anthropicApiKey;
      case 'custom': return apiSettings.customApiKey;
      default: return '';
    }
  };

  const setCurrentApiKey = (provider: ApiProvider, value: string) => {
    switch (provider) {
      case 'gemini': onUpdateApiSettings({ geminiApiKey: value }); break;
      case 'openai': onUpdateApiSettings({ openaiApiKey: value }); break;
      case 'anthropic': onUpdateApiSettings({ anthropicApiKey: value }); break;
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
      <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-lg">
              <Settings className="text-indigo-400" size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">设置</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'api' 
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-600/10' 
                : 'text-slate-400 hover:text-white'
            }`}
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
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-600/10' 
                : 'text-slate-400 hover:text-white'
            }`}
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
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  API 提供商
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(API_PROVIDERS) as ApiProvider[]).map(providerId => {
                    const provider = API_PROVIDERS[providerId];
                    const isSelected = apiSettings.provider === providerId;
                    return (
                      <button
                        key={providerId}
                        onClick={() => onUpdateApiSettings({ provider: providerId })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-600/20' 
                            : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                        }`}
                      >
                        <div className="font-medium text-white">{provider.name}</div>
                        <div className="text-xs text-slate-400 mt-1">{provider.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey[apiSettings.provider] ? 'text' : 'password'}
                    value={getCurrentApiKey(apiSettings.provider)}
                    onChange={(e) => setCurrentApiKey(apiSettings.provider, e.target.value)}
                    placeholder="输入 API Key"
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-12"
                  />
                  <button
                    onClick={() => toggleShowApiKey(apiSettings.provider)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showApiKey[apiSettings.provider] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Check size={12} className={getCurrentApiKey(apiSettings.provider) ? 'text-green-400' : 'text-slate-600'} />
                  当前: {renderMaskedKey(getCurrentApiKey(apiSettings.provider))}
                </div>
              </div>

              {/* Custom Endpoint Settings */}
              {(apiSettings.provider === 'custom' || apiSettings.provider === 'openai') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    {apiSettings.provider === 'custom' ? '自定义 API 端点' : 'OpenAI 兼容端点'}
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
                    placeholder={apiSettings.provider === 'custom' ? 'https://api.example.com/v1' : 'https://api.openai.com/v1'}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {apiSettings.customEndpoint && (
                    <div className="mt-2 text-xs text-slate-500">
                      完整地址: <span className="text-slate-300">{apiSettings.customEndpoint}/chat/completions</span>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Model Dropdown */}
              {(apiSettings.provider === 'custom') && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    自定义模型名称
                  </label>
                  <select
                    value={apiSettings.customModel}
                    onChange={(e) => onUpdateApiSettings({ customModel: e.target.value })}
                    onFocus={() => {
                      // Auto-test connection when dropdown is opened
                      if (!connectionStatus && getCurrentApiKey(apiSettings.provider)) {
                        testConnection();
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                  >
                    <option value="">请先测试连接获取模型列表</option>
                    {connectionStatus?.models?.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                  <div className="mt-2 text-xs text-slate-500">
                    点击模型选择器时会自动测试连接并获取可用模型
                  </div>
                </div>
              )}

              {/* Provider Info & Test Connection */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                  <div className="text-sm">
                    <span className="text-slate-400">当前使用: </span>
                    <span className="text-white font-medium">{API_PROVIDERS[apiSettings.provider].name}</span>
                    <span className="text-slate-500 ml-2">({API_PROVIDERS[apiSettings.provider].defaultModel})</span>
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="flex gap-3">
                  <button
                    onClick={testConnection}
                    disabled={testingConnection || !getCurrentApiKey(apiSettings.provider)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-500 text-white rounded-xl transition-colors"
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
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors"
                  >
                    <Check size={16} />
                    保存
                  </button>
                </div>

                {/* Connection Status */}
                {connectionStatus && (
                  <div className={`p-4 rounded-xl border ${
                    connectionStatus.success
                      ? 'bg-green-900/20 border-green-500/30'
                      : 'bg-red-900/20 border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {connectionStatus.success ? (
                        <Wifi size={16} className="text-green-400" />
                      ) : (
                        <WifiOff size={16} className="text-red-400" />
                      )}
                      <span className={connectionStatus.success ? 'text-green-400' : 'text-red-400'}>
                        {connectionStatus.message}
                      </span>
                    </div>
                    {connectionStatus.success && connectionStatus.models && connectionStatus.models.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-400 mb-2">可用模型 (点击选择):</div>
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
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
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
                  <div className="font-medium text-white">使用默认 Prompt</div>
                  <div className="text-sm text-slate-400 mt-1">使用内置的系统 Prompt 生成幻灯片</div>
                </div>
                <button
                  onClick={() => onUpdatePromptSettings({ useDefaultPrompt: !promptSettings.useDefaultPrompt })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    promptSettings.useDefaultPrompt ? 'bg-indigo-600' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    promptSettings.useDefaultPrompt ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Custom Prompt Editor */}
              {!promptSettings.useDefaultPrompt && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    自定义系统 Prompt
                  </label>
                  <textarea
                    value={promptSettings.customPrompt}
                    onChange={(e) => onUpdatePromptSettings({ customPrompt: e.target.value })}
                    placeholder="输入自定义的 system prompt..."
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm resize-none"
                  />
                </div>
              )}

              {/* View Default Prompt */}
              <div>
                <button
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  {showPromptEditor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {showPromptEditor ? '隐藏' : '查看'} 默认 Prompt 模板
                </button>
                {showPromptEditor && (
                  <div className="mt-3 p-4 bg-slate-800/50 rounded-xl border border-white/5">
                    <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {DEFAULT_SYSTEM_PROMPT}
                    </pre>
                  </div>
                )}
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  额外指令 (可选)
                </label>
                <textarea
                  value={promptSettings.userInstructions}
                  onChange={(e) => onUpdatePromptSettings({ userInstructions: e.target.value })}
                  placeholder="添加额外的生成指令，例如设计风格、颜色偏好等..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-950/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
