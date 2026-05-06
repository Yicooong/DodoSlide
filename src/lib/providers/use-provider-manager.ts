/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import type { Provider, ProviderManagerState, ValidationResult, ConnectionTestResult, ModelListResult } from './types';
import { ProviderManager } from './provider-manager';
import { providerValidator } from './provider-validator';
import { providerStorage } from './provider-storage';
import { apiStrategyRegistry } from './api-strategy';

/**
 * useProviderManager - React hook that bridges ProviderManager business logic
 * with React component state. Provides reactive state and actions for provider management.
 */
export function useProviderManager() {
  const [state, setState] = useState<ProviderManagerState>(() => providerStorage.load());
  const managerRef = useRef<ProviderManager>(new ProviderManager(state));

  // Keep manager in sync with state
  const getManager = useCallback((): ProviderManager => {
    managerRef.current.setState(state);
    return managerRef.current;
  }, [state]);

  // Helper: persist and update state after mutation
  const persistAndUpdate = useCallback((manager: ProviderManager) => {
    const newState = manager.getState();
    providerStorage.save(newState);
    setState(newState);
  }, []);

  // === Query ===

  const getAllProviders = useCallback((): Provider[] => {
    return getManager().getAllProviders();
  }, [getManager]);

  const getCurrentProvider = useCallback((): Provider | undefined => {
    return getManager().getCurrentProvider();
  }, [getManager]);

  const getCurrentProviderId = useCallback((): string => {
    return state.currentProviderId;
  }, [state.currentProviderId]);

  const getProvider = useCallback((id: string): Provider | undefined => {
    return getManager().getProvider(id);
  }, [getManager]);

  // === Mutation ===

  const addProvider = useCallback((provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>): Provider => {
    const manager = getManager();
    const newProvider = manager.addProvider(provider);
    persistAndUpdate(manager);
    return newProvider;
  }, [getManager, persistAndUpdate]);

  const updateProvider = useCallback((id: string, updates: Partial<Provider>): Provider | undefined => {
    const manager = getManager();
    const updated = manager.updateProvider(id, updates);
    if (updated) {
      persistAndUpdate(manager);
    }
    return updated;
  }, [getManager, persistAndUpdate]);

  const deleteProvider = useCallback((id: string): boolean => {
    const manager = getManager();
    const deleted = manager.deleteProvider(id);
    if (deleted) {
      persistAndUpdate(manager);
    }
    return deleted;
  }, [getManager, persistAndUpdate]);

  const switchProvider = useCallback((id: string): boolean => {
    const manager = getManager();
    const switched = manager.switchProvider(id);
    if (switched) {
      persistAndUpdate(manager);
    }
    return switched;
  }, [getManager, persistAndUpdate]);

  const updateSortOrder = useCallback((updates: Array<{ id: string; sortIndex: number }>): void => {
    const manager = getManager();
    manager.updateSortOrder(updates);
    persistAndUpdate(manager);
  }, [getManager, persistAndUpdate]);

  // === API Operations ===

  const testConnection = useCallback(async (providerId: string): Promise<ConnectionTestResult> => {
    const provider = getManager().getProvider(providerId);
    if (!provider) {
      return { success: false, message: '提供商不存在' };
    }

    const apiFormat = provider.meta?.apiFormat ?? 'openai_compatible';
    const strategy = apiStrategyRegistry.getStrategy(apiFormat);

    try {
      const result = await strategy.listModels(provider.settingsConfig);
      if (result.success) {
        return {
          success: true,
          message: '连接成功',
          models: result.models,
        };
      }
      return {
        success: false,
        message: result.error || '连接失败',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '连接测试失败';
      return { success: false, message };
    }
  }, [getManager]);

  const listModels = useCallback(async (providerId: string): Promise<ModelListResult> => {
    const provider = getManager().getProvider(providerId);
    if (!provider) {
      return { success: false, error: '提供商不存在' };
    }

    const apiFormat = provider.meta?.apiFormat ?? 'openai_compatible';
    const strategy = apiStrategyRegistry.getStrategy(apiFormat);
    return strategy.listModels(provider.settingsConfig);
  }, [getManager]);

  // === Validation ===

  const validate = useCallback((provider: Partial<Provider>): ValidationResult => {
    return providerValidator.validateProvider(provider);
  }, []);

  return {
    // State
    providers: getManager().getAllProviders(),
    currentProvider: getManager().getCurrentProvider(),
    currentProviderId: state.currentProviderId,
    state,

    // Query
    getAllProviders,
    getCurrentProvider,
    getCurrentProviderId,
    getProvider,

    // Mutation
    addProvider,
    updateProvider,
    deleteProvider,
    switchProvider,
    updateSortOrder,

    // API operations
    testConnection,
    listModels,

    // Validation
    validate,
  };
}

export type UseProviderManagerReturn = ReturnType<typeof useProviderManager>;
