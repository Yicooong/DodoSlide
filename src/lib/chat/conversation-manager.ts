/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { nanoid } from 'nanoid';
import type { ChatMessage, Conversation, ConversationSummary, ConversationStore, MessageStatus } from './types';
import type { CanvasRatio } from '../canvas-config';
import type { Slide } from '../../hooks/use-slides';
import { ConversationStorage } from './conversation-storage';

export class ConversationManager {
  private storage: ConversationStorage;
  private store: ConversationStore;

  constructor(storage: ConversationStorage) {
    this.storage = storage;
    this.store = storage.loadAll();
  }

  getState(): ConversationStore {
    return this.store;
  }

  // === Conversation CRUD ===

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

  deleteConversation(id: string): void {
    delete this.store.conversations[id];
    this.store.order = this.store.order.filter(cid => cid !== id);

    if (this.store.activeId === id) {
      this.store.activeId = this.store.order[0] || null;
    }

    this.persist();
  }

  renameConversation(id: string, title: string): void {
    const conv = this.store.conversations[id];
    if (!conv) return;
    conv.title = title;
    conv.updatedAt = Date.now();
    this.persist();
  }

  setActiveId(id: string | null): void {
    this.store.activeId = id;
    this.persist();
  }

  getConversation(id: string): Conversation | null {
    return this.store.conversations[id] || null;
  }

  getActiveConversation(): Conversation | null {
    return this.store.activeId ? this.store.conversations[this.store.activeId] || null : null;
  }

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

  // === Message Operations ===

  addUserMessage(conversationId: string, content: string): ChatMessage {
    const conv = this.store.conversations[conversationId];
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const msg: ChatMessage = {
      id: nanoid(),
      role: 'user',
      content,
      status: 'complete',
      timestamp: Date.now(),
      parentId: conv.currentId,
      childrenIds: [],
    };

    // Link parent
    if (msg.parentId && conv.messages[msg.parentId]) {
      conv.messages[msg.parentId].childrenIds.push(msg.id);
    }

    conv.messages[msg.id] = msg;
    conv.currentId = msg.id;
    conv.updatedAt = Date.now();
    this.persist();
    return msg;
  }

  addAssistantMessage(conversationId: string, parentId: string, content: string): ChatMessage {
    const conv = this.store.conversations[conversationId];
    if (!conv) throw new Error(`Conversation ${conversationId} not found`);

    const msg: ChatMessage = {
      id: nanoid(),
      role: 'assistant',
      content,
      status: 'streaming',
      timestamp: Date.now(),
      parentId,
      childrenIds: [],
    };

    // Link parent
    if (conv.messages[parentId]) {
      conv.messages[parentId].childrenIds.push(msg.id);
    }

    conv.messages[msg.id] = msg;
    conv.currentId = msg.id;
    conv.updatedAt = Date.now();
    this.persist();
    return msg;
  }

  updateMessage(conversationId: string, messageId: string, updates: Partial<ChatMessage>): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;

    const msg = conv.messages[messageId];
    if (!msg) return;

    Object.assign(msg, updates);
    conv.updatedAt = Date.now();
    this.persist();
  }

  appendToMessage(conversationId: string, messageId: string, delta: string): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;

    const msg = conv.messages[messageId];
    if (!msg) return;

    msg.content += delta;
    // Don't persist on every delta to avoid excessive writes
  }

  /** Force persist after streaming completes */
  commitMessage(conversationId: string): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;
    conv.updatedAt = Date.now();
    this.persist();
  }

  // === Slides Management ===

  updateSlides(conversationId: string, slides: Slide[]): void {
    const conv = this.store.conversations[conversationId];
    if (!conv) return;
    conv.slides = slides;
    conv.updatedAt = Date.now();
    this.persist();
  }

  getSlides(conversationId: string): Slide[] | undefined {
    const conv = this.store.conversations[conversationId];
    return conv?.slides;
  }

  // === Message Chain ===

  getCurrentChain(conversationId: string): ChatMessage[] {
    const conv = this.store.conversations[conversationId];
    if (!conv || !conv.currentId) return [];

    const chain: ChatMessage[] = [];
    let currentId: string | null = conv.currentId;

    while (currentId) {
      const msg = conv.messages[currentId];
      if (!msg) break;
      chain.unshift(msg);
      currentId = msg.parentId;
    }

    return chain;
  }

  // === Utility ===

  generateTitle(firstMessage: string): string {
    const cleaned = firstMessage.trim().replace(/\n/g, ' ');
    if (cleaned.length <= 30) return cleaned;
    return cleaned.slice(0, 30) + '...';
  }

  private persist(): void {
    this.storage.save(this.getActiveConversation() || {
      id: '',
      title: '',
      messages: {},
      currentId: null,
      createdAt: 0,
      updatedAt: 0,
    });
    // Actually we need to persist the whole store, not just active
    this.persistStore();
  }

  private persistStore(): void {
    // Persist the entire store
    const store = this.store;
    try {
      localStorage.setItem('gemini_conversations', JSON.stringify(store));
    } catch (e) {
      console.error('Failed to persist conversations:', e);
    }
  }
}
