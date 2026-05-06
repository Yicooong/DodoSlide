/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 对话存储模块 - localStorage 持久化层
 *
 * 功能说明：
 * - 负责将对话数据持久化到浏览器的 localStorage
 * - 使用内存缓存（cache）减少 localStorage 的读写频率
 * - 自动管理对话数量上限（最多 50 个），超出时删除最旧的
 * - localStorage Key: 'gemini_conversations'
 *
 * 存储策略：
 * 1. 内存缓存：首次加载后缓存数据，减少解析开销
 * 2. LRU 顺序：更新对话时将其移到 order 数组最前面
 * 3. 自动清理：超出 MAX_STORED_CONVERSATIONS 时删除尾部对话
 * 4. 错误处理：localStorage 读写失败时捕获异常，避免应用崩溃
 */
import type { Conversation, ConversationStore } from './types';

/** localStorage 存储键名 */
const STORAGE_KEY = 'gemini_conversations';

/** 最大存储对话数量，超出时自动清理最旧的对话 */
const MAX_STORED_CONVERSATIONS = 50;

/**
 * 对话存储类
 *
 * 提供对话数据的加载、保存、删除和清空操作。
 * 内部使用内存缓存优化性能，避免频繁解析 JSON。
 */
export class ConversationStorage {
  /** 内存缓存，避免重复解析 localStorage JSON */
  private cache: ConversationStore | null = null;

  /**
   * 加载所有对话数据
   *
   * @returns 完整的存储结构（conversations + order + activeId）
   *
   * 逻辑说明：
   * 1. 如果缓存存在，直接返回缓存（避免重复解析）
   * 2. 从 localStorage 读取并解析 JSON
   * 3. 解析失败时返回空存储结构
   * 4. 首次加载后数据会缓存在内存中
   */
  loadAll(): ConversationStore {
    if (this.cache) return this.cache;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.cache = JSON.parse(stored);
        return this.cache!;
      }
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }

    // 返回空存储结构作为默认值
    this.cache = { conversations: {}, order: [], activeId: null };
    return this.cache;
  }

  /**
   * 保存对话到存储
   *
   * @param conversation 要保存的对话对象
   *
   * 执行逻辑：
   * 1. 将对话存入 conversations 映射表
   * 2. 更新 order 数组，将当前对话移到最前面（LRU 策略）
   * 3. 设置当前对话为活跃对话
   * 4. 检查对话数量，超出限制时删除最旧的对话
   * 5. 持久化到 localStorage
   */
  save(conversation: Conversation): void {
    const store = this.loadAll();
    store.conversations[conversation.id] = conversation;

    // 更新顺序：如果已存在则移到前面，否则添加到前面
    store.order = [conversation.id, ...store.order.filter(id => id !== conversation.id)];
    store.activeId = conversation.id;

    // 超出限制时，删除最旧的对话（order 数组尾部）
    if (store.order.length > MAX_STORED_CONVERSATIONS) {
      const removed = store.order.splice(MAX_STORED_CONVERSATIONS);
      for (const id of removed) {
        delete store.conversations[id];
      }
    }

    this.persist(store);
  }

  /**
   * 删除指定对话
   *
   * @param id 要删除的对话 ID
   *
   * 执行逻辑：
   * 1. 从 conversations 映射表中删除
   * 2. 从 order 数组中移除
   * 3. 如果删除的是活跃对话，则设置新的活跃对话（取 order 第一个或 null）
   * 4. 持久化更改
   */
  delete(id: string): void {
    const store = this.loadAll();
    delete store.conversations[id];
    store.order = store.order.filter(cid => cid !== id);

    // 如果删除的是当前活跃对话，则切换到下一个对话或清空
    if (store.activeId === id) {
      store.activeId = store.order[0] || null;
    }

    this.persist(store);
  }

  /**
   * 设置活跃对话 ID
   *
   * @param id 对话 ID 或 null（null 表示无活跃对话）
   */
  setActiveId(id: string | null): void {
    const store = this.loadAll();
    store.activeId = id;
    this.persist(store);
  }

  /**
   * 获取当前活跃对话 ID
   *
   * @returns 活跃对话 ID，无则返回 null
   */
  getActiveId(): string | null {
    return this.loadAll().activeId;
  }

  /**
   * 清空所有对话数据
   *
   * 执行逻辑：
   * 1. 重置内存缓存为空结构
   * 2. 从 localStorage 中移除存储项
   */
  clear(): void {
    this.cache = { conversations: {}, order: [], activeId: null };
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * 持久化存储数据到 localStorage
   *
   * @param store 要持久化的存储结构
   *
   * 内部逻辑：
   * 1. 更新内存缓存
   * 2. 将存储结构序列化为 JSON 并写入 localStorage
   * 3. 捕获可能的异常（如 localStorage 已满）
   */
  private persist(store: ConversationStore): void {
    this.cache = store;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to persist conversations:', e);
    }
  }
}
