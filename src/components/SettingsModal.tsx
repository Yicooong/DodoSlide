/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// 导入图标：X(关闭)、Key(API 密钥)、Settings(设置)、Sparkles(AI)、ChevronDown(下箭头)、ChevronUp(上箭头)
import { X, Key, Settings, Sparkles, ChevronDown, ChevronUp, Monitor, Palette } from 'lucide-react';
// 导入提供商和连接测试类型
import type { Provider, ConnectionTestResult } from '../lib/providers/types';
// 导入默认系统 prompt
import { DEFAULT_SYSTEM_PROMPT } from '../lib/prompt-manager';
// 导入提供商管理器返回值类型
import type { UseProviderManagerReturn } from '../lib/providers/use-provider-manager';
// 导入 OpenAI 兼容策略（用于获取模型列表）
import { OpenAiCompatibleStrategy } from '../lib/providers/openai-strategy';
// 导入提供商列表组件
import { ProviderList } from './settings/ProviderList';
// 导入提供商详情编辑器组件
import { ProviderDetailEditor } from './settings/ProviderDetailEditor';
// 导入画布配置和主题配置类型
import type { CanvasConfig } from '../lib/canvas-config';
import type { ThemeConfig } from '../lib/theme-config';

/** 设置弹窗组件属性接口 */
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
  canvasRatio: string;
  setCanvasRatio: (ratio: string) => void;
  canvasConfigs: CanvasConfig[];
  appTheme: string;
  setAppTheme: (theme: string) => void;
  themeConfigs: ThemeConfig[];
}

/** 设置标签页类型 */
type SettingsTab = 'general' | 'api' | 'prompt';

/**
 * 设置弹窗组件
 * 功能：
 * - 两个标签页：API 配置和 Prompt 配置
 * - API 配置：管理 API 提供商（增删改查、切换、测试连接）
 * - Prompt 配置：自定义系统 Prompt、额外指令、查看默认 Prompt
 * - 使用模态框形式展示，带半透明背景遮罩
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  providerManager,
  promptSettings,
  onUpdatePromptSettings,
  canvasRatio,
  setCanvasRatio,
  canvasConfigs,
  appTheme,
  setAppTheme,
  themeConfigs,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  // 是否展开默认 Prompt 查看
  const [showPromptEditor, setShowPromptEditor] = useState(false);

  // 提供商编辑状态
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [isAddingProvider, setIsAddingProvider] = useState(false);

  // 未打开时不渲染
  if (!isOpen) return null;

  // 获取正在编辑的提供商数据
  const editingProvider = editingProviderId ? providerManager.getProvider(editingProviderId) : undefined;
  // 是否处于编辑或添加模式
  const isEditingOrAdding = isAddingProvider || editingProviderId !== null;

  /** 进入添加提供商模式 */
  const handleAddProvider = () => {
    setIsAddingProvider(true);
    setEditingProviderId(null);
  };

  /** 进入编辑指定提供商模式 */
  const handleEditProvider = (id: string) => {
    setEditingProviderId(id);
    setIsAddingProvider(false);
  };

  /** 删除提供商：确认后删除 */
  const handleDeleteProvider = (id: string) => {
    if (window.confirm('确定要删除此提供商吗？')) {
      providerManager.deleteProvider(id);
      // 如果正在编辑被删除的提供商，退出编辑模式
      if (editingProviderId === id) {
        setEditingProviderId(null);
      }
    }
  };

  /** 保存新提供商 */
  const handleSaveProvider = (provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>) => {
    providerManager.addProvider(provider);
    setIsAddingProvider(false);
  };

  /** 更新已有提供商 */
  const handleUpdateProvider = (id: string, updates: Partial<Provider>) => {
    providerManager.updateProvider(id, updates);
    setEditingProviderId(null);
  };

  /** 取消编辑：退出添加/编辑模式 */
  const handleCancelEdit = () => {
    setIsAddingProvider(false);
    setEditingProviderId(null);
  };

  /** 测试指定提供商的连接 */
  const handleTestConnection = async (providerId: string): Promise<ConnectionTestResult> => {
    return providerManager.testConnection(providerId);
  };

  /** 获取模型列表：直接使用 OpenAI 兼容策略 */
  const handleListModels = async (endpoint: string, apiKey: string): Promise<{ success: boolean; models?: string[]; error?: string }> => {
    const strategy = new OpenAiCompatibleStrategy();
    return strategy.listModels({ endpoint, apiKey, model: '' });
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* 全屏透明事件拦截层：阻止所有鼠标/指针事件穿透到背后元素 */}
      <div className="absolute inset-0" />

      {/* 视觉背景遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-none" />

      {/* 弹窗主体容器：pointer-events-none 让事件穿透到拦截层 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative rounded-2xl shadow-2xl w-[700px] max-h-[80vh] overflow-hidden pointer-events-auto" style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-subtle)', border: '1px solid var(--border-subtle)' }}>
        {/* 弹窗头部：标题和关闭按钮 */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--accent-bg)' }}>
              <Settings size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>设置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all active:scale-90"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* 标签页切换按钮 */}
        <div className="flex" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('general')}
            className="flex-1 px-6 py-3 text-sm font-medium transition-all active:scale-95 whitespace-nowrap"
            style={{
              color: activeTab === 'general' ? 'var(--accent)' : 'var(--text-muted)',
              background: activeTab === 'general' ? 'var(--accent-bg)' : 'transparent',
              borderBottom: activeTab === 'general' ? '2px solid var(--accent)' : 'none',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings size={16} />
              通用
            </div>
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className="flex-1 px-6 py-3 text-sm font-medium transition-all active:scale-95 whitespace-nowrap"
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
            className="flex-1 px-6 py-3 text-sm font-medium transition-all active:scale-95 whitespace-nowrap"
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

        {/* 内容区域：根据标签页显示不同内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-130px)]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* 画布比例 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Monitor size={16} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>画布比例</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {canvasConfigs.map((config) => (
                    <button
                      key={config.ratio}
                      onClick={() => setCanvasRatio(config.ratio)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-95"
                      style={{
                        background: canvasRatio === config.ratio ? 'var(--accent-bg)' : 'var(--bg-input)',
                        borderColor: canvasRatio === config.ratio ? 'var(--accent)' : 'var(--border-default)',
                      }}
                    >
                      <span className="text-lg">{config.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{config.label}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{config.width}×{config.height}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 主题切换 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette size={16} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>界面主题</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {themeConfigs.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setAppTheme(theme.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all active:scale-95"
                      style={{
                        background: appTheme === theme.id ? 'var(--accent-bg)' : 'var(--bg-input)',
                        borderColor: appTheme === theme.id ? 'var(--accent)' : 'var(--border-default)',
                      }}
                    >
                      <span className="text-lg">{theme.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{theme.label}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{theme.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                /* 列表模式：显示所有提供商 */
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
              {/* Prompt 配置标签页：使用默认 Prompt 开关 */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium" style={{ color: 'var(--text-primary)' }}>使用默认 Prompt</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>使用内置的系统 Prompt 生成幻灯片</div>
                </div>
                {/* 开关按钮：切换 useDefaultPrompt 状态 */}
                <button
                  onClick={() => onUpdatePromptSettings({ useDefaultPrompt: !promptSettings.useDefaultPrompt })}
                  className="w-12 h-6 rounded-full transition-all active:scale-90"
                  style={{ background: promptSettings.useDefaultPrompt ? 'var(--accent)' : 'var(--bg-button)' }}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                    promptSettings.useDefaultPrompt ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* 自定义 Prompt 编辑器：仅在未使用默认 Prompt 时显示 */}
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

              {/* 查看默认 Prompt 模板（可展开） */}
              <div>
                <button
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="flex items-center gap-2 text-sm transition-all active:scale-95"
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

              {/* 额外指令输入框 */}
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

        {/* 底部完成按钮 */}
        <div className="px-6 py-4" style={{ borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 font-medium rounded-xl transition-all text-white active:scale-[0.98] hover:brightness-110 whitespace-nowrap"
            style={{ background: 'var(--accent)' }}
          >
            完成
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
