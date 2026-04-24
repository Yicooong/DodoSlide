/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported AI API Providers
 */
export type ApiProvider = 'custom';

/**
 * API Provider configuration
 */
export interface ApiProviderConfig {
  id: ApiProvider;
  name: string;
  description: string;
  endpoint: string;
  apiKeyEnvVar: string;
  modelParam: string;
  defaultModel: string;
  supportedModels: string[];
}

/**
 * Available API providers configuration
 */
export const API_PROVIDERS: Record<ApiProvider, ApiProviderConfig> = {
  custom: {
    id: 'custom',
    name: '自定义 API',
    description: '自定义 OpenAI 兼容的 API 端点',
    endpoint: '',
    apiKeyEnvVar: 'CUSTOM_API_KEY',
    modelParam: 'model',
    defaultModel: '',
    supportedModels: [],
  },
};

/**
 * Get API key from environment variable or localStorage
 */
export const getApiKey = (provider: ApiProvider): string => {
  // First try localStorage (user-set values)
  const storedKey = localStorage.getItem(`api_key_${provider}`);
  if (storedKey) return storedKey;
  
  // Fall back to environment variable
  const envKey = (import.meta as any).env?.[`VITE_${API_PROVIDERS[provider].apiKeyEnvVar}`];
  return envKey || '';
};

/**
 * Store API key in localStorage
 */
export const setApiKey = (provider: ApiProvider, key: string): void => {
  if (key) {
    localStorage.setItem(`api_key_${provider}`, key);
  } else {
    localStorage.removeItem(`api_key_${provider}`);
  }
};

/**
 * API settings stored in localStorage
 */
export interface ApiSettings {
  provider: ApiProvider;
  customEndpoint: string;
  customModel: string;
  customApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
}

export const DEFAULT_API_SETTINGS: ApiSettings = {
  provider: 'custom',
  customEndpoint: '',
  customModel: '',
  customApiKey: '',
  geminiApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
};

/**
 * List available models for a provider
 * Improved implementation similar to Cherry Studio
 */
export const listModels = async (
  provider: ApiProvider,
  apiKey: string,
  customEndpoint?: string
): Promise<{ success: boolean; models?: string[]; error?: string }> => {
  if (!apiKey) {
    return { success: false, error: '请先输入 API Key' };
  }

  try {
    switch (provider) {
      case 'custom': {
        const endpoint = customEndpoint || '';
        if (!endpoint) {
          return { success: false, error: '请先输入 API 端点' };
        }

        // Ensure endpoint doesn't have /chat/completions suffix, then append /models
        const baseUrl = endpoint.replace(/\/chat\/completions\/?$/, '').replace(/\/v1\/chat\/completions\/?$/, '/v1').replace(/\/$/, '');

        const response = await fetch(`${baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();

        // Handle different response formats
        let models: string[] = [];
        if (data.data && Array.isArray(data.data)) {
          // OpenAI format
          models = data.data.map((m: any) => m.id).filter((id: string) => id);
        } else if (data.models && Array.isArray(data.models)) {
          // Alternative format
          models = data.models.map((m: any) => m.id || m.name).filter((id: string) => id);
        } else if (Array.isArray(data)) {
          // Direct array format
          models = data.map((m: any) => m.id || m.name).filter((id: string) => id);
        }

        // Sort models alphabetically and filter out empty/invalid ones
        models = models
          .filter((m: string) => m && typeof m === 'string' && m.length > 0)
          .sort((a: string, b: string) => a.localeCompare(b));

        if (models.length === 0) {
          return { success: false, error: '未找到可用模型，请检查 API 配置' };
        }

        return { success: true, models };
      }

      default:
        return { success: false, error: '不支持的提供商' };
    }
  } catch (error: any) {
    console.error('Model listing error:', error);
    return { success: false, error: error.message || '连接测试失败' };
  }
};

/**
 * Load API settings from localStorage
 */
export const loadApiSettings = (): ApiSettings => {
  try {
    const stored = localStorage.getItem('api_settings');
    if (stored) {
      return { ...DEFAULT_API_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load API settings:', e);
  }
  return DEFAULT_API_SETTINGS;
};

/**
 * Save API settings to localStorage
 */
export const saveApiSettings = (settings: ApiSettings): void => {
  localStorage.setItem('api_settings', JSON.stringify(settings));
};
