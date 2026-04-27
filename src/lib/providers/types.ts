/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// === API Format Identifiers ===

/** API format identifiers - determines request/response structure */
export type ApiFormat = 'openai_compatible';
// Future: | 'anthropic_native' | 'gemini_native';

// === Provider Category ===

/** Provider category identifiers */
export type ProviderCategory = 'custom';
// Future: | 'claude' | 'gemini' | 'openai';

// === Custom Endpoint ===

/** Custom endpoint within a provider - alternative API URL */
export interface CustomEndpoint {
  name: string;
  url: string;
  description?: string;
}

// === Provider Test Config ===

/** Provider-specific test configuration for connection testing */
export interface ProviderTestConfig {
  enabled: boolean;
  testModel?: string;
  timeoutSecs?: number;
  testPrompt?: string;
  degradedThresholdMs?: number;
  maxRetries?: number;
}

// === Provider Meta ===

/** Provider metadata - operational configuration separate from display properties */
export interface ProviderMeta {
  apiFormat: ApiFormat;
  customEndpoints: Record<string, CustomEndpoint>;
  endpointAutoSelect?: boolean;
  costMultiplier?: number;
  testConfig?: ProviderTestConfig;
  providerType?: string;
}

// === Provider Settings Config ===

/** Provider settings config - API-specific settings stored within provider */
export interface ProviderSettingsConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  customHeaders?: Record<string, string>;
  temperature?: number;
  maxTokens?: number;
}

// === Provider ===

/** Provider core structure - represents a configured AI API endpoint */
export interface Provider {
  id: string;
  name: string;
  settingsConfig: ProviderSettingsConfig;
  websiteUrl?: string;
  category: ProviderCategory;
  createdAt: number;
  sortIndex: number;
  notes?: string;
  meta?: ProviderMeta;
  icon?: string;
  iconColor?: string;
}

// === Provider Manager State ===

/** Provider manager state - the full persisted state */
export interface ProviderManagerState {
  providers: Record<string, Provider>;
  providerOrder: string[];
  currentProviderId: string;
}

// === Result Types ===

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Model listing result */
export interface ModelListResult {
  success: boolean;
  models?: string[];
  error?: string;
}

/** Connection test result */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  models?: string[];
}

// === Default Values ===

export const DEFAULT_PROVIDER_SETTINGS_CONFIG: ProviderSettingsConfig = {
  endpoint: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 8192,
};

export const DEFAULT_PROVIDER_META: ProviderMeta = {
  apiFormat: 'openai_compatible',
  customEndpoints: {},
};

export const DEFAULT_PROVIDER: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'> = {
  name: '',
  settingsConfig: { ...DEFAULT_PROVIDER_SETTINGS_CONFIG },
  category: 'custom',
  meta: { ...DEFAULT_PROVIDER_META },
};

export const DEFAULT_PROVIDER_MANAGER_STATE: ProviderManagerState = {
  providers: {},
  providerOrder: [],
  currentProviderId: '',
};

// === Utility Functions ===

/**
 * Normalize endpoint URL by stripping common API path suffixes and trailing slashes.
 * Users may paste full URLs including /chat/completions; this prevents double-path issues.
 */
export const normalizeEndpointUrl = (url: string): string => {
  let normalized = url.trim();
  // Strip /chat/completions suffix
  normalized = normalized.replace(/\/chat\/completions\/?$/, '');
  // Strip /v1/chat/completions suffix, keep /v1
  normalized = normalized.replace(/\/v1\/chat\/completions\/?$/, '/v1');
  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');
  return normalized;
};
