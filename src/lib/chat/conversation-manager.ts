/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 对话管理模块 - 核心业务逻辑层
 *
 * 功能说明：
 * - 管理对话的完整生命周期（创建、删除、重命名、切换）
 * - 管理消息的树形结构（parentId/childrenIds 实现对话分支）
 * - 提供消息链的遍历和查询功能
 * - 处理流式消息的追加和提交
 * - 管理对话关联的幻灯片数据
 * - 自动持久化变更到 localStorage
 *
 * 树形消息系统说明：
 * 消息通过 parentId 和 childrenIds 构建树形结构，支持对话分支：
 * - parentId: 指向父消息 ID，根消息为 null
 * - childrenIds: 子消息 ID 数组，支持多个分支（如用户对同一回复提出不同问题）
 * - currentId: 对话中当前活动的消息链末端
 *
 * 消息状态流转（流式）：
 * pending → streaming → complete
 *                  ↓
 *                error
 *
 * 持久化策略：
 * - 每次修改后自动调用 persist() 持久化到 localStorage
 * - 流式追加时使用 appendToMessage（不立即持久化，避免频繁写入）
 * - 流式完成后调用 commitMessage() 统一持久化
 */
import { nanoid } from 'nanoid';
import type { ChatMessage, Conversation, ConversationSummary, ConversationStore, MessageStatus } from './types';
import type { CanvasRatio } from '../canvas-config';
import type { Slide } from '../../hooks/use-slides';
import { ConversationStorage } from './conversation-storage';

/**
 * 对话管理器类
 *
 * 核心业务逻辑层，封装所有对话和消息的操作。
 * 通过 ConversationStorage 实现数据持久化。
 */
export class ConversationManager {
  /** 存储层实例，负责 localStorage 读写 */
  private storage: ConversationStorage;
  /** 内存中的存储状态，避免频繁读取 localStorage */
  private store: ConversationStore;

  /**
   * 构造函数
   * @param storage 对话存储实例，用于持久化操作
   */
  constructor(storage: ConversationStorage) {
    this.storage = storage;
    this.store = storage.loadAll();
  }

  /**
   * 获取当前完整的存储状态
   *
   * @returns 完整的 ConversationStore 对象（conversations + order + activeId）
   * @note 返回的是引用，修改会影响内部状态
   */
  getState(): ConversationStore {
    return this.store;
  }

  // ========== 对话 CRUD 操作 ==========

  /**
   * 创建新对话
   *
   * @param title 对话标题，为空时使用 '新对话'
   * @param styleId 样式模板 ID（可选）
   * @param canvasRatio 画布比例（可选）
   * @param slides 初始幻灯片数据（可选）
   * @returns 新创建的对话对象
   *
   * 执行逻辑：
   * 1. 生成唯一 ID（nanoid）
   * 2. 初始化空消息映射表和当前消息指针
   * 3. 将对话添加到 store 并更新 order（移到最前）
   * 4. 设置为活跃对话
   * 5. 持久化到 localStorage
   */
  createConversation(title: string, styleId?: string, canvasRatio?: CanvasRatio, slides?: Slide[]): Conversation {
    const now = Date.now();
    const conversation: Conversation = {
      id: nanoid(),
      title: title || '新对话',
      messages: {},
      currentId: null,
      createdAt: now,
      updatedAt: now,
      styleId,
      canvasRatio,
      slides,
    };

    this.store.conversations[conversation.id] = conversation;
    this.store.order = [conversation.id, ...this.store.order];
    this.store.activeId = conversation.id;
    this.persist();
    return conversation;
  }

  /**
   * 删除指定对话
   *
   * @param id 要删除的对话 ID
   *
   * 执行逻辑：
   * 1. 从 conversations 映射表中删除
   * 2. 从 order 数组中移除
   * 3. 如果删除的是活跃对话，则切换到下一个对话或清空
   * 4. 持久化更改
   */
  deleteConversation(id: string): void {
    delete this.store.conversations[id];
    this.store.order = this.store.order.filter(cid => cid !== id);

    if (this.store.activeId === id) {
      this.store.activeId = this.store.order[0] || null;
    }

    this.persist();
  }

  /**
   * 重命名对话
   *
   * @param id 对话 ID
   * @param title 新标题
   */
  renameConversation(id: string, title: string): void {
    const conv = this.store.conversations[id];
    if (!conv) return;
    conv.title = title;
    conv.updatedAt = Date.now();
    this.persist();
  }

  /**
   * 设置活跃对话
   *
   * @param id 对话 ID 或 null（null 表示无活跃对话）
   */
  setActiveId(id: string | null): void {
    this.store.activeId = id;
    this.persist();
  }

  /**
   * 获取指定对话
   *
   * @param id 对话 ID
   * @returns 对话对象或 null（不存在时）
   */
  getConversation(id: string): Conversation | null {
    return this.store.conversations[id] || null;
  }

  /**
   * 获取当前活跃对话
   *
   * @returns 活跃对话对象或 null（无活跃对话时）
   */
  getActiveConversation(): Conversation | null {
    return this.store.activeId ? this.store.conversations[this.store.activeId] || null : null;
  }

  /**
   * 获取对话摘要列表（用于侧边栏展示）
   *
   * @returns 按 order 顺序的对话摘要数组
   *
   * 摘要包含：
   * - id: 对话 ID
   * - title: 对话标题
   * - updatedAt: 最后更新时间
   * - messageCount: 消息总数
   * - lastMessage: 最后一条消息的内容预览（前 60 字符）
   *
   * 最后消息规则：
   * - 优先取用户消息
   * - 助理消息只取状态为 complete 的
   * - 按时间戳降序排列取最新
   */
  getSummaries(): ConversationSummary[] {
    return this.store.order
      .map(id => this.store.conversations[id])
      .filter(Boolean)
      .map(conv => {
        const messages = Object.values(conv.messages);
        const lastMsg = messages
          .filter(m => m.role === 'user' || (m.role === 'assistant' && m.status === 'complete'))
          .sort((a, b) => b.timestamp - a.timestamp)[0];
        return {
          id: conv.id,
          title: conv.title,
          updatedAt: conv.updatedAt,
          messageCount: messages.length,
          lastMessage: lastMsg?.content?.slice(0, 60),
        };
      });
  }

  // ========== 消息操作 ==========

  /**
   * 添加用户消息
   *
   * @param conversationId 对话 ID
   * @param content 消息内容
   * @returns 新创建的用户消息对象
   *
   * 执行逻辑：
   * 1. 创建新消息，role 为 'user'，状态直接为 'complete'
   * 2. 设置 parentId 为当前对话的 currentId（根消息为 null）
   * 3. 将新消息 ID 添加到父消息的 childrenIds（构建树形结构）
   * 4. 更新 currentId 指向新消息
   * 5. 持久化更改
   *
   * 树形结构说明：
   * - 用户消息回复当前活动消息（currentId）
   * - 通过 parentId 建立消息间的父子关系
   * - 支持后续创建分支（不同回复指向同一父消息）
   */
  addUserMessage(conversationId: string, content: string): ChatMessage {
    const conv = this.store.conversations[conversationId];
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const msg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content,
      status: 'complete', // 用户消息直接标记为完成
      timestamp: Date.now(),
      parentId: conv.currentId, // 指向当前消息链末端
      childrenIds: [], // 初始无子消息
    };

    // 链接到父消息：将新消息 ID 添加到父消息的 childrenIds
    if (msg.parentId && conv.messages[msg.parentId]) {
      conv.messages[msg.parentId].childrenIds.push(msg.id);
    }

    conv.messages[msg.id] = msg;
    conv.currentId = msg.id; // 更新当前消息指针
    conv.updatedAt = Date.now();
    this.persist();
    return msg;
  }

  /**
   * 添加助手（AI）消息
   *
   * @param conversationId 对话 ID
   * @param parentId 父消息 ID（通常是用户消息）
   * @param content 初始内容（流式开始时可能为空）
   * @returns 新创建的助手消息对象
   *
   * 执行逻辑：
   * 1. 创建新消息，role 为 'assistant'，状态为 'streaming'
   * 2. 链接到父消息（构建树形结构）
   * 3. 更新 currentId 指向新消息
   * 4. 持久化更改
   *
   * 流式状态管理：
   * - 初始状态为 'streaming'
   * - 通过 appendToMessage 逐步追加内容
   * - 流式完成后调用 commitMessage 更新状态为 'complete'
   */
  addAssistantMessage(conversationId: string, parentId: string, content: string): ChatMessage {
    const conv = this.store.conversations[conversationId];
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const msg: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content,
      status: 'streaming', // 初始状态为流式传输中
      timestamp: Date.now(),
      parentId,
      childrenIds: [],
    };

    // 链接到父消息
    if (conv.messages[parentId]) {
      conv.messages[parentId].childrenIds.push(msg.id);
    }

    conv.messages[msg.id] = msg;
    conv.currentId = msg.id;
    conv.updatedAt = Date.now();
    this.persist();
    return msg;
  }

  /**
   * 更新消息内容
   *
   * @param conversationId 对话 ID
   * @param messageId 消息 ID
   * @param updates 要更新的字段（Partial，只更新提供的字段）
   *
   * 常用更新场景：
   * - 更新状态：{ status: 'complete' } 或 { status: 'error' }
   * - 添加代码：{ code: extractedCode }
   * - 添加错误信息：{ error: '错误信息', status: 'error' }
   */
  updateMessage(conversationId: string, messageId: string, updates: Partial<ChatMessage>): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;

    const msg = conv.messages[messageId];
    if (!msg) return;

    Object.assign(msg, updates);
    conv.updatedAt = Date.now();
    this.persist();
  }

  /**
   * 追加消息内容（用于流式传输）
   *
   * @param conversationId 对话 ID
   * @param messageId 消息 ID
   * @param delta 要追加的内容片段
   *
   * 注意：
   * - 此方法不触发持久化，避免流式传输期间频繁写入 localStorage
   * - 流式完成后应调用 commitMessage() 统一持久化
   * - 直接修改 msg.content，性能优化
   */
  appendToMessage(conversationId: string, messageId: string, delta: string): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;

    const msg = conv.messages[messageId];
    if (!msg) return;

    msg.content += delta;
    // 不在每次追加时持久化，避免频繁写入影响性能
  }

  /**
   * 提交消息更改（流式完成后调用）
   *
   * @param conversationId 对话 ID
   *
   * 执行逻辑：
   * 1. 更新对话的 updatedAt 时间戳
   * 2. 持久化整个存储到 localStorage
   *
   * 使用场景：
   * - 流式传输完成后调用
   * - 确保最终状态被持久化
   */
  /** 流式传输完成后强制持久化 */
  commitMessage(conversationId: string): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;
    conv.updatedAt = Date.now();
    this.persist();
  }

  // ========== 幻灯片管理 ==========

  /**
   * 更新对话关联的幻灯片数据
   *
   * @param conversationId 对话 ID
   * @param slides 幻灯片数组
   */
  updateSlides(conversationId: string, slides: Slide[]): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;
    conv.slides = slides;
    conv.updatedAt = Date.now();
    this.persist();
  }

  /**
   * 获取对话关联的幻灯片数据
   *
   * @param conversationId 对话 ID
   * @returns 幻灯片数组或 undefined（无数据时）
   */
  getSlides(conversationId: string): Slide[] | undefined {
    const conv = this.store.conversations[conversationId];
    return conv?.slides;
  }

  // ========== 消息链遍历 ==========

  /**
   * 获取当前消息链（从根到叶）
   *
   * @param conversationId 对话 ID
   * @returns 消息数组，按从根消息到当前消息的顺序排列
   *
   * 消息链说明：
   * - 通过 currentId 找到消息链末端
   * - 沿着 parentId 回溯到根消息（parentId 为 null）
   * - 返回顺序：根消息 → ... → 当前消息
   *
   * 用途：
   * - 展示当前对话的完整上下文
   * - 构建 API 请求的消息历史（最近 10 条）
   * - 支持用户在不同分支间切换
   */
  getCurrentChain(conversationId: string): ChatMessage[] {
    const conv = this.store.conversations[conversationId];
    if (!conv || !conv.currentId) return [];

    const chain: ChatMessage[] = [];
    let currentId: string | null = conv.currentId;

    // 从当前消息回溯到根消息
    while (currentId) {
      const msg = conv.messages[currentId];
      if (!msg) break;
      chain.unshift(msg); // 插入到数组开头，保持根→叶顺序
      currentId = msg.parentId;
    }

    return chain;
  }

  // ========== 工具方法 ==========

  /**
   * 根据第一条消息生成对话标题
   *
   * @param firstMessage 第一条用户消息内容
   * @returns 生成的标题（最多 30 字符 + '...'）
   *
   * 生成规则：
   * 1. 去除首尾空白
   * 2. 将换行符替换为空格
   * 3. 超过 30 字符时截断并添加省略号
   */
  generateTitle(firstMessage: string): string {
    const cleaned = firstMessage.trim().replace(/\n/g, ' ');
    if (cleaned.length <= 30) return cleaned;
    return cleaned.slice(0, 30) + '...';
  }

  /**
   * 持久化当前状态到 localStorage
   *
   * @deprecated 实际调用 persistStore() 持久化整个 store
   * 注意：此方法会持久化所有对话，不仅仅是活跃对话
   */
  private persist(): void {
    this.storage.save(this.getActiveConversation() || {
      id: '',
      title: '',
      messages: {},
      currentId: null,
      createdAt: 0,
      updatedAt: 0,
    });
    // 实际上我们需要持久化整个 store，而不仅仅是活跃对话
    this.persistStore();
  }

  /**
   * 持久化整个存储到 localStorage
   *
   * 内部逻辑：
   * 1. 将完整的 store 对象序列化为 JSON
   * 2. 写入 localStorage 的 'gemini_conversations' 键
   * 3. 捕获可能的异常（如 localStorage 已满）
   */
  private persistStore(): void {
    // 持久化整个存储
    const store = this.store;
    try {
      localStorage.setItem('gemini_conversations', JSON.stringify(store));
    } catch (e) {
      console.error('Failed to persist conversations:', e);
    }
  }
}
