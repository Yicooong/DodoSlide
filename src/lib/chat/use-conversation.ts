/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 对话状态管理 Hook - React 状态桥接层
 *
 * 功能说明：
 * - 将 ConversationManager（命令式）桥接到 React 状态（声明式）
 * - 通过 stateVersion 强制组件重新渲染
 * - 使用 useRef 保持 Manager 实例在整个组件生命周期内持久化
 * - 使用 useCallback 缓存回调函数，避免不必要的子组件重渲染
 * - 使用 useMemo 缓存计算结果（对话列表、消息链）
 *
 * 状态更新机制：
 * 1. 每次修改对话数据后调用 update() 函数
 * 2. update() 递增 stateVersion 触发重新渲染
 * 3. 所有派生数据（conversations、currentChain）依赖 stateVersion
 *
 * 性能优化：
 * - Manager 实例用 useRef 存储，避免重复创建
 * - 流式追加（appendToMessage）不触发更新，由调用者控制
 * - 对话列表和消息链使用 useMemo 缓存
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import type { ChatMessage, Conversation, ConversationSummary } from './types';
import type { CanvasRatio } from '../canvas-config';
import type { Slide } from '../../hooks/use-slides';
import { ConversationStorage } from './conversation-storage';
import { ConversationManager } from './conversation-manager';

/**
 * useConversation Hook 返回值接口
 *
 * 提供对话系统的完整状态和操作方法。
 * 分为三大类：状态数据、对话 CRUD、消息操作、幻灯片管理。
 */
export interface UseConversationReturn {
  // ========== 状态数据 ==========

  /** 对话摘要列表，用于侧边栏展示（按 order 顺序排列） */
  conversations: ConversationSummary[];
  /** 当前活跃的对话对象（完整数据），无则返回 null */
  activeConversation: Conversation | null;
  /** 当前活跃对话的 ID，无则返回 null */
  activeId: string | null;
  /**
   * 当前消息链（从根消息到当前消息）
   * 按时间顺序排列：根消息 → ... → 当前消息
   * 用于展示当前对话上下文和构建 API 请求历史
   */
  currentChain: ChatMessage[];
  /** 是否存在任何对话（用于条件渲染） */
  hasConversations: boolean;

  // ========== 对话 CRUD 操作 ==========

  /**
   * 创建新对话
   * @param title 对话标题（为空使用 '新对话'）
   * @param styleId 样式模板 ID（可选）
   * @param canvasRatio 画布比例（可选）
   * @param slides 初始幻灯片数据（可选）
   * @returns 新创建的对话对象
   */
  createConversation: (title: string, styleId?: string, canvasRatio?: CanvasRatio, slides?: Slide[]) => Conversation;
  /**
   * 删除指定对话
   * @param id 要删除的对话 ID
   */
  deleteConversation: (id: string) => void;
  /**
   * 重命名对话
   * @param id 对话 ID
   * @param title 新标题
   */
  renameConversation: (id: string, title: string) => void;
  /**
   * 切换到指定对话（设置为活跃对话）
   * @param id 目标对话 ID
   */
  switchConversation: (id: string) => void;
  /**
   * 清空所有对话数据（重置到初始状态）
   */
  clearAll: () => void;

  // ========== 消息操作 ==========

  /**
   * 添加用户消息到指定对话
   * @param conversationId 对话 ID
   * @param content 消息内容
   * @returns 新创建的用户消息对象
   */
  addUserMessage: (conversationId: string, content: string) => ChatMessage;
  /**
   * 添加助手（AI）消息到指定对话
   * @param conversationId 对话 ID
   * @param parentId 父消息 ID（通常是用户消息）
   * @param content 初始内容（流式开始时可能为空）
   * @returns 新创建的助手消息对象（状态为 streaming）
   */
  addAssistantMessage: (conversationId: string, parentId: string, content: string) => ChatMessage;
  /**
   * 更新消息内容（支持部分更新）
   * @param conversationId 对话 ID
   * @param messageId 消息 ID
   * @param updates 要更新的字段（Partial）
   */
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  /**
   * 追加消息内容（用于流式传输，不触发重渲染）
   * @param conversationId 对话 ID
   * @param messageId 消息 ID
   * @param delta 要追加的内容片段
   * @note 此方法不调用 update()，避免频繁重渲染
   */
  appendToMessage: (conversationId: string, messageId: string, delta: string) => void;
  /**
   * 提交消息更改（流式完成后调用，触发持久化）
   * @param conversationId 对话 ID
   */
  commitMessage: (conversationId: string) => void;

  // ========== 幻灯片管理 ==========

  /**
   * 更新对话关联的幻灯片数据
   * @param conversationId 对话 ID
   * @param slides 幻灯片数组
   */
  updateSlides: (conversationId: string, slides: Slide[]) => void;
  /**
   * 获取对话关联的幻灯片数据
   * @param conversationId 对话 ID
   * @returns 幻灯片数组或 undefined
   */
  getSlides: (conversationId: string) => Slide[] | undefined;
}

/**
 * useConversation Hook
 *
 * 对话状态管理的核心 Hook，提供对话系统的完整功能。
 *
 * @returns UseConversationReturn 对象，包含状态和方法
 *
 * 实现要点：
 * 1. 使用 useRef 持久化 Manager 实例（避免重复创建）
 * 2. 使用 stateVersion 控制重渲染（不可变 state 的替代方案）
 * 3. 所有修改操作调用 update() 触发重渲染
 * 4. 流式追加除外（appendToMessage 不触发更新）
 */
export const useConversation = (): UseConversationReturn => {
  /**
   * Manager 实例引用
   * 使用 useRef 确保在组件重新渲染时 Manager 实例保持不变
   * 初始化时创建 Storage → Manager 的实例链
   */
  const managerRef = useRef(new ConversationManager(new ConversationStorage()));
  /**
   * 状态版本号
   * 每次对话数据变更时递增，触发组件重新渲染
   * 这是命令式（Manager）到声明式（React）的桥接机制
   */
  const [stateVersion, setStateVersion] = useState(0);

  /**
   * 触发重新渲染
   * 递增 stateVersion，使所有依赖此值的 useMemo 和 useCallback 重新计算
   */
  const update = useCallback(() => {
    setStateVersion(v => v + 1);
  }, []);

  const manager = managerRef.current;
  const store = manager.getState();

  // 派生状态：当前活跃对话 ID 和对象
  const activeId = store.activeId;
  const activeConversation = activeId ? store.conversations[activeId] || null : null;

  /**
   * 对话摘要列表（用于侧边栏）
   * 依赖：store 对象和 stateVersion
   * 当对话数据变化时（stateVersion 递增），重新计算
   */
  const conversations = useMemo(() => {
    return store.order
      .map(id => store.conversations[id])
      .filter((conv): conv is Conversation => !!conv)
      .map(conv => {
        const messages = Object.values(conv.messages) as ChatMessage[];
        // 获取最后一条消息（用户消息或完成的助手消息）
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, stateVersion]);

  /**
   * 当前消息链（从根到叶）
   * 依赖：activeId、currentId（消息链末端）、stateVersion
   * 切换对话或消息链变化时重新计算
   */
  const currentChain = useMemo(() => {
    if (!activeId) return [];
    return manager.getCurrentChain(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, activeConversation?.currentId, stateVersion]);

  // ========== 对话操作方法（使用 useCallback 缓存） ==========

  const createConversation = useCallback((title: string, styleId?: string, canvasRatio?: CanvasRatio, slides?: Slide[]): Conversation => {
    const conv = manager.createConversation(title, styleId, canvasRatio, slides);
    update(); // 触发重渲染
    return conv;
  }, [manager, update]);

  const deleteConversation = useCallback((id: string) => {
    manager.deleteConversation(id);
    update();
  }, [manager, update]);

  const renameConversation = useCallback((id: string, title: string) => {
    manager.renameConversation(id, title);
    update();
  }, [manager, update]);

  const switchConversation = useCallback((id: string) => {
    manager.setActiveId(id);
    update();
  }, [manager, update]);

  /**
   * 清空所有对话
   * 创建新的 Storage 和 Manager 实例，完全重置状态
   */
  const clearAll = useCallback(() => {
    const storage = new ConversationStorage();
    storage.clear();
    managerRef.current = new ConversationManager(storage);
    update();
  }, [update]);

  // ========== 消息操作方法 ==========

  const addUserMessage = useCallback((conversationId: string, content: string): ChatMessage => {
    const msg = manager.addUserMessage(conversationId, content);
    update();
    return msg;
  }, [manager, update]);

  const addAssistantMessage = useCallback((conversationId: string, parentId: string, content: string): ChatMessage => {
    const msg = manager.addAssistantMessage(conversationId, parentId, content);
    update();
    return msg;
  }, [manager, update]);

  const updateMessage = useCallback((conversationId: string, messageId: string, updates: Partial<ChatMessage>) => {
    manager.updateMessage(conversationId, messageId, updates);
    update();
  }, [manager, update]);

  /**
   * 追加消息内容（流式传输专用）
   * 不调用 update()，避免流式期间频繁重渲染
   * 由调用者负责在流式完成后调用 commitMessage 并更新状态
   */
  const appendToMessage = useCallback((conversationId: string, messageId: string, delta: string) => {
    manager.appendToMessage(conversationId, messageId, delta);
    // 不在每次追加时调用 update()，避免性能问题
  }, [manager]);

  const commitMessage = useCallback((conversationId: string) => {
    manager.commitMessage(conversationId);
    update();
  }, [manager, update]);

  // ========== 幻灯片管理方法 ==========

  const updateSlides = useCallback((conversationId: string, slides: Slide[]) => {
    manager.updateSlides(conversationId, slides);
  }, [manager]);

  const getSlides = useCallback((conversationId: string): Slide[] | undefined => {
    return manager.getSlides(conversationId);
  }, [manager]);

  // 返回所有状态和方法
  return {
    conversations,
    activeConversation,
    activeId,
    currentChain,
    hasConversations: conversations.length > 0,
    createConversation,
    deleteConversation,
    renameConversation,
    switchConversation,
    clearAll,
    addUserMessage,
    addAssistantMessage,
    updateMessage,
    appendToMessage,
    commitMessage,
    updateSlides,
    getSlides,
  };
};
