/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Supported AI API Providers
 */
export type ApiProvider = 'gemini' | 'openai' | 'anthropic' | 'custom';

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
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Google Gemini AI via AI Studio',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeyEnvVar: 'GEMINI_API_KEY',
    modelParam: 'models',
    defaultModel: 'gemini-2.0-flash',
    supportedModels: [
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.5-flash-lite',
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    description: 'OpenAI GPT models',
    endpoint: 'https://api.openai.com/v1',
    apiKeyEnvVar: 'OPENAI_API_KEY',
    modelParam: 'model',
    defaultModel: 'gpt-4o-mini',
    supportedModels: [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Anthropic Claude via API',
    endpoint: 'https://api.anthropic.com/v1',
    apiKeyEnvVar: 'ANTHROPIC_API_KEY',
    modelParam: 'model',
    defaultModel: 'claude-3-5-haiku-20241024',
    supportedModels: [
      'claude-3-5-haiku-20241024',
      'claude-3-5-sonnet-20241024',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
  },
  custom: {
    id: 'custom',
    name: 'Custom API',
    description: 'Custom OpenAI-compatible API endpoint',
    endpoint: '',
    apiKeyEnvVar: 'CUSTOM_API_KEY',
    modelParam: 'model',
    defaultModel: 'custom-model',
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
  const envKey = import.meta.env[`VITE_${API_PROVIDERS[provider].apiKeyEnvVar}`];
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
  provider: 'gemini',
  customEndpoint: '',
  customModel: '',
  customApiKey: '',
  geminiApiKey: '',
  openaiApiKey: '',
  anthropicApiKey: '',
};

/**
 * List available models for a provider
 */
export const listModels = async (
  provider: ApiProvider,
  apiKey: string,
  customEndpoint?: string
): Promise<{ success: boolean; models?: string[]; error?: string }> => {
  try {
    switch (provider) {
      case 'gemini': {
        const response = await fetch(
          `${API_PROVIDERS.gemini.endpoint}?key=${apiKey}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name.replace('models/', '')) || [];
        return { success: true, models };
      }

      case 'openai':
      case 'custom': {
        const endpoint = customEndpoint || API_PROVIDERS.openai.endpoint;
        // Ensure endpoint doesn't have /chat/completions suffix, then append /models
        const baseUrl = endpoint.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '');
        const response = await fetch(`${baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const models = data.data?.map((m: any) => m.id) || [];
        return { success: true, models };
      }

      case 'anthropic': {
        const response = await fetch(`${API_PROVIDERS.anthropic.endpoint}/models`, {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}`);
        }
        const data = await response.json();
        const models = data.models?.map((m: any) => m.name) || [];
        return { success: true, models };
      }

      default:
        return { success: false, error: 'Unsupported provider' };
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Connection test failed' };
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
