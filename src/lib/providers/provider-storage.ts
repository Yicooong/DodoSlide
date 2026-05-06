/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview 提供商存储管理
 * @description 负责 ProviderManagerState 的持久化和恢复
 * 使用 localStorage 进行数据持久化，支持从旧格式迁移
 * 提供加载、保存、清除和迁移等功能
 */

import type { Provider, ProviderManagerState } from './types';
import { DEFAULT_PROVIDER_META, DEFAULT_PROVIDER_SETTINGS_CONFIG, DEFAULT_PROVIDER_MANAGER_STATE } from './types';

/**
 * ProviderStorage - 提供商状态持久化管理类
 * 负责将提供商状态保存到 localStorage 并从 localStorage 恢复
 * 同时处理从旧版 api_settings 格式的迁移逻辑
 */
export class ProviderStorage {
  /** 新格式存储键名 - 存储 ProviderManagerState */
  static STORAGE_KEY = 'provider_manager_state';
  
  /** 旧格式存储键名 - 用于迁移检测 */
  static LEGACY_KEY = 'api_settings';

  /**
   * 从 localStorage 加载提供商状态
   * 加载策略：
   *   1. 优先尝试新格式（provider_manager_state）
   *   2. 如果新格式无效或不存在，尝试从旧格式迁移
   *   3. 如果都没有，返回默认空状态
   * 
   * @returns 加载的状态对象
   */
  load(): ProviderManagerState {
    // ========================================================================
    // 步骤 1: 尝试加载新格式
    // ========================================================================
    try {
      const raw = localStorage.getItem(ProviderStorage.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProviderManagerState;
        // 验证状态结构是否有效
        if (this.validateStateShape(parsed)) {
          return parsed;
        }
        console.warn('ProviderStorage: stored state has invalid shape, falling back');
      }
    } catch (e) {
      console.warn('ProviderStorage: failed to parse stored state:', e);
    }

    // ========================================================================
    // 步骤 2: 尝试从旧格式迁移
    // ========================================================================
    const migrated = this.migrateFromLegacy();
    if (migrated) {
      return migrated;
    }

    // ========================================================================
    // 步骤 3: 返回默认空状态
    // ========================================================================
    return { ...DEFAULT_PROVIDER_MANAGER_STATE };
  }

  /**
   * 保存提供商状态到 localStorage
   * 使用 JSON 序列化后存储
   * 如果存储失败（如超出配额），会输出警告但不会抛出异常
   * 
   * @param state - 要保存的状态对象
   */
  save(state: ProviderManagerState): void {
    try {
      localStorage.setItem(ProviderStorage.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('ProviderStorage: failed to save state:', e);
    }
  }

  /**
   * 从旧版 api_settings 格式迁移
   * 将旧的单个 API 配置转换为新的提供商系统
   * 创建一个名为"自定义 API"的提供商
   * 
   * 注意：出于安全考虑，不会删除旧格式的键
   * 
   * @returns 迁移后的状态，如果没有旧数据则返回 null
   */
  migrateFromLegacy(): ProviderManagerState | null {
    try {
      // 检查是否存在旧格式数据
      const raw = localStorage.getItem(ProviderStorage.LEGACY_KEY);
      if (!raw) return null;

      // 解析旧格式数据
      const legacy = JSON.parse(raw) as {
        customEndpoint?: string;
        customApiKey?: string;
        customModel?: string;
        provider?: string;
      };

      // 只有当存在有意义的数据时才进行迁移
      if (!legacy.customEndpoint && !legacy.customApiKey && !legacy.customModel) {
        return null;
      }

      const now = Date.now();
      
      // 创建迁移后的提供商对象
      const migratedProvider: Provider = {
        id: 'migrated-custom',
        name: '自定义 API',
        settingsConfig: {
          ...DEFAULT_PROVIDER_SETTINGS_CONFIG,
          endpoint: legacy.customEndpoint || '',
          apiKey: legacy.customApiKey || '',
          model: legacy.customModel || '',
        },
        category: 'custom',
        createdAt: now,
        sortIndex: 0,
        meta: { ...DEFAULT_PROVIDER_META },
      };

      // 构建状态对象
      const state: ProviderManagerState = {
        providers: { 'migrated-custom': migratedProvider },
        providerOrder: ['migrated-custom'],
        currentProviderId: 'migrated-custom',
      };

      // 保存迁移后的状态
      this.save(state);
      console.info('ProviderStorage: migrated legacy api_settings to new format');
      return state;
    } catch (e) {
      console.warn('ProviderStorage: failed to migrate legacy format:', e);
      return null;
    }
  }

  /**
   * 清除 localStorage 中的提供商状态
   * 仅清除新格式的数据，不影响旧格式（如果存在）
   */
  clear(): void {
    localStorage.removeItem(ProviderStorage.STORAGE_KEY);
  }

  /**
   * 验证解析后的状态对象的基本结构
   * 确保对象包含必要的字段且类型正确
   * 
   * @param obj - 要验证的对象
   * @returns 是否为有效的 ProviderManagerState
   */
  private validateStateShape(obj: unknown): obj is ProviderManagerState {
    if (!obj || typeof obj !== 'object') return false;
    const state = obj as Record<string, unknown>;
    return (
      typeof state.providers === 'object' &&
      state.providers !== null &&
      Array.isArray(state.providerOrder) &&
      typeof state.currentProviderId === 'string'
    );
  }
}

/** 单例存储实例，全局共享 */
export const providerStorage = new ProviderStorage();
