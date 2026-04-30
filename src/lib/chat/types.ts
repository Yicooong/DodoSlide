/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CanvasRatio } from '../canvas-config';
import type { Slide } from '../../hooks/use-slides';

/** 消息状态 */
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

/** 单条消息 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: MessageStatus;
  timestamp: number;
  parentId: string | null;
  childrenIds: string[];
  model?: string;
  code?: string;
  error?: string;
  styleId?: string;
  canvasRatio?: CanvasRatio;
}

/** 对话 */
export interface Conversation {
  id: string;
  title: string;
  messages: Record<string, ChatMessage>;
  currentId: string | null;
  createdAt: number;
  updatedAt: number;
  styleId?: string;
  canvasRatio?: CanvasRatio;
  slides?: Slide[];
}

/** 对话列表项摘要 */
export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  lastMessage?: string;
}

/** 持久化存储结构 */
export interface ConversationStore {
  conversations: Record<string, Conversation>;
  order: string[];
  activeId: string | null;
}
