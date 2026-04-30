/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { ChatMessage, Conversation, ConversationSummary } from './types';
import type { CanvasRatio } from '../canvas-config';
import type { Slide } from '../../hooks/use-slides';
import { ConversationStorage } from './conversation-storage';
import { ConversationManager } from './conversation-manager';

export interface UseConversationReturn {
  /** Conversation list summaries for sidebar */
  conversations: ConversationSummary[];
  /** Currently active conversation */
  activeConversation: Conversation | null;
  /** Active conversation ID */
  activeId: string | null;
  /** Current message chain (root → leaf) */
  currentChain: ChatMessage[];
  /** Whether any conversation exists */
  hasConversations: boolean;

  // Conversation CRUD
  createConversation: (title: string, styleId?: string, canvasRatio?: CanvasRatio, slides?: Slide[]) => Conversation;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  switchConversation: (id: string) => void;
  clearAll: () => void;

  // Message operations
  addUserMessage: (conversationId: string, content: string) => ChatMessage;
  addAssistantMessage: (conversationId: string, parentId: string, content: string) => ChatMessage;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (conversationId: string, messageId: string, delta: string) => void;
  commitMessage: (conversationId: string) => void;

  // Slides management
  updateSlides: (conversationId: string, slides: Slide[]) => void;
  getSlides: (conversationId: string) => Slide[] | undefined;
}

export const useConversation = (): UseConversationReturn => {
  const managerRef = useRef(new ConversationManager(new ConversationStorage()));
  const [stateVersion, setStateVersion] = useState(0);

  // Force re-render by bumping version
  const update = useCallback(() => {
    setStateVersion(v => v + 1);
  }, []);

  const manager = managerRef.current;
  const store = manager.getState();

  const activeId = store.activeId;
  const activeConversation = activeId ? store.conversations[activeId] || null : null;

  const conversations = useMemo(() => {
    return store.order
      .map(id => store.conversations[id])
      .filter((conv): conv is Conversation => !!conv)
      .map(conv => {
        const messages = Object.values(conv.messages) as ChatMessage[];
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

  const currentChain = useMemo(() => {
    if (!activeId) return [];
    return manager.getCurrentChain(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, activeConversation?.currentId, stateVersion]);

  const createConversation = useCallback((title: string, styleId?: string, canvasRatio?: CanvasRatio, slides?: Slide[]): Conversation => {
    const conv = manager.createConversation(title, styleId, canvasRatio, slides);
    update();
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

  const clearAll = useCallback(() => {
    const storage = new ConversationStorage();
    storage.clear();
    managerRef.current = new ConversationManager(storage);
    update();
  }, [update]);

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

  const appendToMessage = useCallback((conversationId: string, messageId: string, delta: string) => {
    manager.appendToMessage(conversationId, messageId, delta);
    // Don't call update() on every delta for performance — caller should handle state
  }, [manager]);

  const commitMessage = useCallback((conversationId: string) => {
    manager.commitMessage(conversationId);
    update();
  }, [manager, update]);

  const updateSlides = useCallback((conversationId: string, slides: Slide[]) => {
    manager.updateSlides(conversationId, slides);
  }, [manager]);

  const getSlides = useCallback((conversationId: string): Slide[] | undefined => {
    return manager.getSlides(conversationId);
  }, [manager]);

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
