/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Conversation, ConversationStore } from './types';

const STORAGE_KEY = 'gemini_conversations';
const MAX_STORED_CONVERSATIONS = 50;

export class ConversationStorage {
  private cache: ConversationStore | null = null;

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

    this.cache = { conversations: {}, order: [], activeId: null };
    return this.cache;
  }

  save(conversation: Conversation): void {
    const store = this.loadAll();
    store.conversations[conversation.id] = conversation;

    // Update order: move to front if exists, otherwise prepend
    store.order = [conversation.id, ...store.order.filter(id => id !== conversation.id)];
    store.activeId = conversation.id;

    // Trim old conversations
    if (store.order.length > MAX_STORED_CONVERSATIONS) {
      const removed = store.order.splice(MAX_STORED_CONVERSATIONS);
      for (const id of removed) {
        delete store.conversations[id];
      }
    }

    this.persist(store);
  }

  delete(id: string): void {
    const store = this.loadAll();
    delete store.conversations[id];
    store.order = store.order.filter(cid => cid !== id);

    if (store.activeId === id) {
      store.activeId = store.order[0] || null;
    }

    this.persist(store);
  }

  setActiveId(id: string | null): void {
    const store = this.loadAll();
    store.activeId = id;
    this.persist(store);
  }

  getActiveId(): string | null {
    return this.loadAll().activeId;
  }

  clear(): void {
    this.cache = { conversations: {}, order: [], activeId: null };
    localStorage.removeItem(STORAGE_KEY);
  }

  private persist(store: ConversationStore): void {
    this.cache = store;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to persist conversations:', e);
    }
  }
}
