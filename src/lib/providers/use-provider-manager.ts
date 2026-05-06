/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview useProviderManager - React Hook 桥接层
 * @description 将 ProviderManager 业务逻辑与 React 组件状态桥接
 * 提供响应式状态和操作用于提供商管理
 * 自动处理状态持久化（通过 localStorage）和状态同步
 */

import { useState, useCallback, useRef } from 'react';
import type { Provider, ProviderManagerState, ValidationResult, ConnectionTestResult, ModelListResult } from './types';
import { ProviderManager } from './provider-manager';
import { providerValidator } from './provider-validator';
import { providerStorage } from './provider-storage';
import { apiStrategyRegistry } from './api-strategy';

/**
 * useProviderManager - React Hook
 * 
 * 功能：
 * - 管理提供商状态的响应式更新
 * - 桥接 ProviderManager 的命令式 API 与 React 的声明式状态
 * - 自动持久化到 localStorage
 * - 提供查询、修改、API 操作等完整功能
 * 
 * @returns 包含状态和操作的对象
 */
export function useProviderManager() {
  // ==========================================================================
  // 状态初始化
  // ==========================================================================
  
  /**
   * React 状态：从 localStorage 加载初始状态
   * 使用惰性初始化，仅在首次渲染时执行
   */
  const [state, setState] = useState<ProviderManagerState>(() => providerStorage.load());
  
  /**
   * ProviderManager 实例引用
   * 使用 useRef 保持实例稳定，避免重新创建
   */
  const managerRef = useRef<ProviderManager>(new ProviderManager(state));

  // ==========================================================================
  // 辅助函数
  // ==========================================================================

  /**
   * 获取同步后的 ProviderManager 实例
   * 确保 manager 的内部状态与 React 状态同步
   */
  const getManager = useCallback((): ProviderManager => {
    managerRef.current.setState(state);
    return managerRef.current;
  }, [state]);

  /**
   * 持久化并更新状态
   * 在执行修改操作后调用，保存状态到 localStorage 并更新 React 状态
   * @param manager - 已执行操作的 ProviderManager 实例
   */
  const persistAndUpdate = useCallback((manager: ProviderManager) => {
    const newState = manager.getState();
    providerStorage.save(newState); // 持久化到 localStorage
    setState(newState); // 更新 React 状态触发重新渲染
  }, []);

  // ==========================================================================
  // 查询操作 (Query)
  // ==========================================================================

  /**
   * 获取所有提供商（按排序顺序）
   */
  const getAllProviders = useCallback((): Provider[] => {
    return getManager().getAllProviders();
  }, [getManager]);

  /**
   * 获取当前选中的提供商
   */
  const getCurrentProvider = useCallback((): Provider | undefined => {
    return getManager().getCurrentProvider();
  }, [getManager]);

  /**
   * 获取当前选中的提供商 ID
   */
  const getCurrentProviderId = useCallback((): string => {
    return state.currentProviderId;
  }, [state.currentProviderId]);

  /**
   * 根据 ID 获取提供商
   * @param id - 提供商 ID
   */
  const getProvider = useCallback((id: string): Provider | undefined => {
    return getManager().getProvider(id);
  }, [getManager]);

  // ==========================================================================
  // 修改操作 (Mutation)
  // ==========================================================================

  /**
   * 添加新提供商
   * @param provider - 提供商数据（排除自动生成的字段）
   * @returns 新创建的提供商对象
   */
  const addProvider = useCallback((provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>): Provider => {
    const manager = getManager();
    const newProvider = manager.addProvider(provider);
    persistAndUpdate(manager); // 持久化并更新状态
    return newProvider;
  }, [getManager, persistAndUpdate]);

  /**
   * 更新现有提供商
   * @param id - 提供商 ID
   * @param updates - 要更新的字段
   * @returns 更新后的提供商对象，如果未找到返回 undefined
   */
  const updateProvider = useCallback((id: string, updates: Partial<Provider>): Provider | undefined => {
    const manager = getManager();
    const updated = manager.updateProvider(id, updates);
    if (updated) {
      persistAndUpdate(manager); // 仅在成功更新时持久化
    }
    return updated;
  }, [getManager, persistAndUpdate]);

  /**
   * 删除提供商
   * @param id - 要删除的提供商 ID
   * @returns 是否删除成功
   */
  const deleteProvider = useCallback((id: string): boolean => {
    const manager = getManager();
    const deleted = manager.deleteProvider(id);
    if (deleted) {
      persistAndUpdate(manager); // 仅在成功删除时持久化
    }
    return deleted;
  }, [getManager, persistAndUpdate]);

  /**
   * 切换当前选中的提供商
   * @param id - 要切换到的提供商 ID
   * @returns 是否切换成功
   */
  const switchProvider = useCallback((id: string): boolean => {
    const manager = getManager();
    const switched = manager.switchProvider(id);
    if (switched) {
      persistAndUpdate(manager); // 仅在成功切换时持久化
    }
    return switched;
  }, [getManager, persistAndUpdate]);

  /**
   * 更新提供商的排序顺序
   * @param updates - 排序更新数组
   */
  const updateSortOrder = useCallback((updates: Array<{ id: string; sortIndex: number }>): void => {
    const manager = getManager();
    manager.updateSortOrder(updates);
    persistAndUpdate(manager);
  }, [getManager, persistAndUpdate]);

  // ==========================================================================
  // API 操作 (API Operations)
  // ==========================================================================

  /**
   * 测试 API 连接
   * 通过尝试列出模型来测试连接的有效性
   * @param providerId - 要测试的提供商 ID
   * @returns 连接测试结果
   */
  const testConnection = useCallback(async (providerId: string): Promise<ConnectionTestResult> => {
    const provider = getManager().getProvider(providerId);
    if (!provider) {
      return { success: false, message: '提供商不存在' };
    }

    // 根据提供商的 API 格式获取对应的策略
    const apiFormat = provider.meta?.apiFormat ?? 'openai_compatible';
    const strategy = apiStrategyRegistry.getStrategy(apiFormat);

    try {
      // 尝试列出模型以测试连接
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

  /**
   * 列出提供商的可用模型
   * @param providerId - 提供商 ID
   * @returns 模型列表查询结果
   */
  const listModels = useCallback(async (providerId: string): Promise<ModelListResult> => {
    const provider = getManager().getProvider(providerId);
    if (!provider) {
      return { success: false, error: '提供商不存在' };
    }

    // 根据 API 格式获取策略并列出模型
    const apiFormat = provider.meta?.apiFormat ?? 'openai_compatible';
    const strategy = apiStrategyRegistry.getStrategy(apiFormat);
    return strategy.listModels(provider.settingsConfig);
  }, [getManager]);

  // ==========================================================================
  // 验证操作 (Validation)
  // ==========================================================================

  /**
   * 验证提供商数据
   * @param provider - 要验证的提供商数据（部分）
   * @returns 验证结果
   */
  const validate = useCallback((provider: Partial<Provider>): ValidationResult => {
    return providerValidator.validateProvider(provider);
  }, []);

  // ==========================================================================
  // 返回接口
  // ==========================================================================

  return {
    // 状态 (State)
    providers: getManager().getAllProviders(),
    currentProvider: getManager().getCurrentProvider(),
    currentProviderId: state.currentProviderId,
    state,

    // 查询 (Query)
    getAllProviders,
    getCurrentProvider,
    getCurrentProviderId,
    getProvider,

    // 修改 (Mutation)
    addProvider,
    updateProvider,
    deleteProvider,
    switchProvider,
    updateSortOrder,

    // API 操作 (API operations)
    testConnection,
    listModels,

    // 验证 (Validation)
    validate,
  };
}

/**
 * useProviderManager Hook 的返回类型
 * 用于类型推导和导出
 */
export type UseProviderManagerReturn = ReturnType<typeof useProviderManager>;
