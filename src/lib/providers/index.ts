/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Public API re-exports for the provider system

// Types
export type {
  ApiFormat,
  ProviderCategory,
  CustomEndpoint,
  ProviderTestConfig,
  ProviderMeta,
  ProviderSettingsConfig,
  Provider,
  ProviderManagerState,
  ValidationResult,
  ModelListResult,
  ConnectionTestResult,
} from './types';

export {
  DEFAULT_PROVIDER_SETTINGS_CONFIG,
  DEFAULT_PROVIDER_META,
  DEFAULT_PROVIDER,
  DEFAULT_PROVIDER_MANAGER_STATE,
  normalizeEndpointUrl,
} from './types';

// Provider Manager
export { ProviderManager } from './provider-manager';

// Provider Validator
export { ProviderValidator, providerValidator } from './provider-validator';

// Provider Storage
export { ProviderStorage, providerStorage } from './provider-storage';

// API Strategy
export type { ApiCallStrategy } from './api-strategy';
export { ApiStrategyRegistry, apiStrategyRegistry } from './api-strategy';

// OpenAI Strategy
export { OpenAiCompatibleStrategy } from './openai-strategy';

// React Hook
export { useProviderManager } from './use-provider-manager';
export type { UseProviderManagerReturn } from './use-provider-manager';
