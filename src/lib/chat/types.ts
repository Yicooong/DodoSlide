/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 聊天系统类型定义模块
 *
 * 本模块定义了对话系统的核心数据类型，包括：
 * - 消息状态枚举（流式状态管理）
 * - 聊天消息结构（支持树形分支结构）
 * - 对话数据结构（包含消息映射）
 * - 对话摘要（用于侧边栏展示）
 * - 持久化存储结构（localStorage 数据格式）
 *
 * 树结构说明：
 * 消息通过 parentId 和 childrenIds 实现树形结构，支持对话分支。
 * - parentId: 指向父消息 ID，根消息为 null
 * - childrenIds: 子消息 ID 数组，支持多个分支
 * - currentId: 对话中当前活动的消息链末端
 */

import type { CanvasRatio } from '../canvas-config';
import type { Slide } from '../../hooks/use-slides';

/**
 * 消息状态枚举
 *
 * 状态流转：
 * pending → streaming → complete
 *                  ↓
 *                error
 *
 * - pending: 消息已创建但未开始处理（用户消息通常直接为 complete）
 * - streaming: AI 正在生成响应，内容逐步追加
 * - complete: 消息处理完成
 * - error: 处理过程中发生错误
 */
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';

/**
 * 单条聊天消息接口
 *
 * 消息采用树形结构设计，支持对话分支：
 * - 每条消息通过 parentId 指向父消息，形成消息链
 * - 每条消息通过 childrenIds 数组存储子消息，支持多分支
 * - 通过遍历 parentId 可以从任意消息回溯到根消息
 * - 通过遍历 childrenIds 可以从根消息获取所有分支
 *
 * 典型消息链：user → assistant → user → assistant ...
 * 分支场景：用户对同一条助理消息发起多个不同追问
 */
export interface ChatMessage {
  /** 消息唯一标识符，使用 nanoid 生成 */
  id: string;
  /** 消息角色：user(用户) | assistant(助手) | system(系统提示，仅用于 API 调用) */
  role: 'user' | 'assistant' | 'system';
  /** 消息内容文本（用户问题或 AI 响应内容） */
  content: string;
  /** 消息状态：pending | streaming | complete | error */
  status: MessageStatus;
  /** 消息创建时间戳（Unix 毫秒） */
  timestamp: number;
  /**
   * 父消息 ID
   * - 第一条消息（根消息）的 parentId 为 null
   * - 后续消息指向其回复的那条消息
   * - 用于构建消息树和回溯消息链
   */
  parentId: string | null;
  /**
   * 子消息 ID 数组
   * - 存储所有直接回复此消息的子消息
   * - 支持实现对话分支（如用户对同一回复提出不同问题）
   * - 数组顺序反映子消息的创建顺序
   */
  childrenIds: string[];
  /** 使用的 AI 模型名称（仅 assistant 消息） */
  model?: string;
  /** 从 AI 响应中提取的 JSX 代码（仅 assistant 消息且包含代码时） */
  code?: string;
  /** 错误信息（仅 status 为 error 时） */
  error?: string;
  /** 生成此消息时使用的样式模板 ID */
  styleId?: string;
  /** 生成此消息时使用的画布比例（16:9 或 4:3） */
  canvasRatio?: CanvasRatio;
}

/**
 * 对话接口
 *
 * 表示一个完整的对话会话，包含：
 * - 对话元信息（标题、时间等）
 * - 消息映射表（通过 ID 快速查找消息）
 * - 当前消息链指针
 * - 关联的幻灯片数据
 */
export interface Conversation {
  /** 对话唯一标识符，使用 nanoid 生成 */
  id: string;
  /** 对话标题，通常由第一条用户消息自动生成（截取前 30 字符） */
  title: string;
  /**
   * 消息映射表（ID → 消息对象）
   * 使用 Record 而非数组，便于：
   * 1. 通过 ID 快速查找任意消息
   * 2. 支持消息树形结构的随机访问
   * 3. 易于实现消息更新和分支操作
   */
  messages: Record<string, ChatMessage>;
  /**
   * 当前消息链末端消息 ID
   * - 指向当前活动的消息链的最新消息
   * - 用于确定"当前位置"和继续对话的起点
   * - 切换分支时此值会变化
   */
  currentId: string | null;
  /** 对话创建时间戳（Unix 毫秒） */
  createdAt: number;
  /** 对话最后更新时间戳（Unix 毫秒），发送/接收消息时更新 */
  updatedAt: number;
  /** 此对话使用的样式模板 ID */
  styleId?: string;
  /** 此对话使用的画布比例 */
  canvasRatio?: CanvasRatio;
  /** 此对话关联的幻灯片数组（存储生成的幻灯片数据） */
  slides?: Slide[];
}

/**
 * 对话摘要接口
 *
 * 用于侧边栏展示对话列表，只包含必要的摘要信息，
 * 避免加载完整对话数据带来的性能开销。
 */
export interface ConversationSummary {
  /** 对话 ID */
  id: string;
  /** 对话标题 */
  title: string;
  /** 最后更新时间戳（用于排序） */
  updatedAt: number;
  /** 消息总数 */
  messageCount: number;
  /** 最后一条消息的内容预览（截取前 60 字符） */
  lastMessage?: string;
}

/**
 * 持久化存储结构接口
 *
 * 定义 localStorage 中存储的数据结构。
 * localStorage Key: 'gemini_conversations'
 * 最多存储：50 个对话（超出自动清理最旧的）
 *
 * 数据结构设计理由：
 * - conversations 使用 Record 便于按 ID 快速查找
 * - order 数组维护对话的显示顺序（最新在前）
 * - activeId 记录当前活跃的对话，避免额外的查找逻辑
 */
export interface ConversationStore {
  /** 对话映射表（ID → 对话对象），使用 Record 便于快速查找 */
  conversations: Record<string, Conversation>;
  /** 对话 ID 顺序数组（最新在前），用于侧边栏列表展示和 LRU 清理 */
  order: string[];
  /** 当前活跃的对话 ID，为 null 时表示无活跃对话 */
  activeId: string | null;
}
