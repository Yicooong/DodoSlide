/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview 提供商管理器
 * @description 提供商管理的核心协调器，负责 CRUD 操作、切换和状态管理
 * 灵感来源于 Rust cc-switch 的 ProviderService 模式
 * 所有状态修改都通过此类的方法进行，确保数据一致性
 */

import type { Provider, ProviderManagerState, ProviderMeta } from './types';
import { DEFAULT_PROVIDER_META, DEFAULT_PROVIDER_SETTINGS_CONFIG } from './types';

/**
 * ProviderManager - 提供商管理的核心类
 * 负责所有提供商相关的业务逻辑：增删改查、排序、切换等
 * 内部维护状态，通过方法修改状态确保一致性
 */
export class ProviderManager {
  /** 内部状态，存储所有提供商数据和排序信息 */
  private state: ProviderManagerState;

  /**
   * 构造函数
   * @param initialState - 初始状态，通常从持久化存储加载
   */
  constructor(initialState: ProviderManagerState) {
    this.state = { ...initialState };
  }

  // ==========================================================================
  // 查询方法 (Query Methods)
  // ==========================================================================

  /**
   * 获取所有提供商（按显示顺序排列）
   * 根据 providerOrder 的顺序返回提供商数组
   * @returns 按排序顺序排列的提供商数组
   */
  getAllProviders(): Provider[] {
    return this.state.providerOrder
      .map(id => this.state.providers[id])
      .filter((p): p is Provider => p !== undefined);
  }

  /**
   * 根据 ID 获取单个提供商
   * @param id - 提供商的唯一标识符
   * @returns 提供商对象，如果未找到返回 undefined
   */
  getProvider(id: string): Provider | undefined {
    return this.state.providers[id];
  }

  /**
   * 获取当前选中的提供商对象
   * @returns 当前提供商对象，如果没有选中返回 undefined
   */
  getCurrentProvider(): Provider | undefined {
    if (!this.state.currentProviderId) return undefined;
    return this.state.providers[this.state.currentProviderId];
  }

  /**
   * 获取当前选中的提供商 ID
   * @returns 当前提供商 ID 字符串
   */
  getCurrentProviderId(): string {
    return this.state.currentProviderId;
  }

  /**
   * 获取提供商总数
   * @returns 提供商数量
   */
  getProviderCount(): number {
    return this.state.providerOrder.length;
  }

  // ==========================================================================
  // 修改方法 (Mutation Methods)
  // ==========================================================================

  /**
   * 添加新提供商
   * 自动生成 UUID、设置创建时间戳、分配排序索引
   * 如果是第一个提供商，自动设为当前选中
   * 
   * @param provider - 提供商数据（排除自动生成的字段：id, createdAt, sortIndex）
   * @returns 新创建的提供商对象（包含生成的字段）
   */
  addProvider(provider: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>): Provider {
    // 生成唯一 ID 和时间戳
    const id = crypto.randomUUID();
    const now = Date.now();
    const sortIndex = this.state.providerOrder.length;

    // 构建完整的提供商对象
    const newProvider: Provider = {
      ...provider,
      id,
      createdAt: now,
      sortIndex,
    };

    // 添加到状态中
    this.state.providers[id] = newProvider;
    this.state.providerOrder.push(id);

    // 如果是第一个提供商，自动设为当前选中
    if (this.state.providerOrder.length === 1) {
      this.state.currentProviderId = id;
    }

    return newProvider;
  }

  /**
   * 更新现有提供商
   * Meta 合并语义：
   *   - 如果 updates.meta 提供了新值，完全替换
   *   - 如果 updates.meta 为 undefined（未提供），保留现有 meta
   * 
   * 注意：ID 和 createdAt 是不可变的，不会被更新
   * 
   * @param id - 要更新的提供商 ID
   * @param updates - 要更新的字段（部分更新）
   * @returns 更新后的提供商对象，如果未找到返回 undefined
   */
  updateProvider(id: string, updates: Partial<Provider>): Provider | undefined {
    const existing = this.state.providers[id];
    if (!existing) return undefined;

    // 处理 meta 合并语义
    let mergedMeta: ProviderMeta | undefined = existing.meta;
    if (updates.meta !== undefined) {
      // 提供了新 meta - 完全替换
      mergedMeta = updates.meta;
    }
    // 如果 updates.meta 为 undefined（未提供），保留现有 meta

    // 构建更新后的对象（保留不可变字段）
    const updated: Provider = {
      ...existing,
      ...updates,
      id: existing.id, // ID 不可变
      createdAt: existing.createdAt, // 创建时间不可变
      meta: mergedMeta,
    };

    this.state.providers[id] = updated;
    return updated;
  }

  /**
   * 删除提供商
   * 如果删除的是当前选中的提供商，自动切换到第一个剩余提供商或清空选择
   * 同时重新索引所有剩余提供商的 sortIndex
   * 
   * @param id - 要删除的提供商 ID
   * @returns 是否删除成功
   */
  deleteProvider(id: string): boolean {
    if (!this.state.providers[id]) return false;

    // 从映射表中删除
    delete this.state.providers[id];
    // 从排序列表中移除
    this.state.providerOrder = this.state.providerOrder.filter(pid => pid !== id);

    // 重新索引 sortIndex 值（保持连续性）
    this.state.providerOrder.forEach((pid, idx) => {
      const p = this.state.providers[pid];
      if (p) p.sortIndex = idx;
    });

    // 处理当前提供商重新分配
    if (this.state.currentProviderId === id) {
      this.state.currentProviderId = this.state.providerOrder[0] || '';
    }

    return true;
  }

  /**
   * 切换当前选中的提供商
   * 验证目标 ID 是否存在
   * 
   * @param id - 要切换到的提供商 ID
   * @returns 是否切换成功
   */
  switchProvider(id: string): boolean {
    if (!this.state.providers[id]) return false;
    this.state.currentProviderId = id;
    return true;
  }

  /**
   * 更新提供商的排序顺序
   * 应用新的 sortIndex 并重新排序 providerOrder
   * 
   * @param updates - 排序更新数组，每个元素包含 id 和新的 sortIndex
   */
  updateSortOrder(updates: Array<{ id: string; sortIndex: number }>): void {
    // 应用 sortIndex 更新
    for (const { id, sortIndex } of updates) {
      const provider = this.state.providers[id];
      if (provider) {
        provider.sortIndex = sortIndex;
      }
    }

    // 根据 sortIndex 重新排序 providerOrder
    this.state.providerOrder.sort((a, b) => {
      const pa = this.state.providers[a];
      const pb = this.state.providers[b];
      return (pa?.sortIndex ?? 0) - (pb?.sortIndex ?? 0);
    });
  }

  // ==========================================================================
  // 状态访问 (State Access)
  // ==========================================================================

  /**
   * 获取完整状态快照
   * 返回状态的浅拷贝，防止外部直接修改内部状态
   * @returns 当前状态的副本
   */
  getState(): ProviderManagerState {
    return { ...this.state };
  }

  /**
   * 设置完整状态（用于从存储加载）
   * 通常用于初始化或从持久化存储恢复状态
   * @param state - 新的状态对象
   */
  setState(state: ProviderManagerState): void {
    this.state = { ...state };
  }
}
