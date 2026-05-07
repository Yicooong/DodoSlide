/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 流式传输 Hook - SSE (Server-Sent Events) 流式 API 调用
 *
 * 功能说明：
 * - 封装 SSE 流式 API 调用逻辑
 * - 使用 ReadableStream 处理流式响应
 * - 支持取消请求（通过 AbortController）
 * - 提供流式状态（isStreaming）给 UI 层
 *
 * 流式状态管理：
 * - 开始调用时设置 isStreaming = true
 * - 收到 delta 时通过 onDelta 回调实时更新 UI
 * - 完成时调用 onDone 回调，传入完整内容
 * - 错误时调用 onError 回调
 * - 无论成功失败，finally 中设置 isStreaming = false
 *
 * 取消机制：
 * - 使用 AbortController 取消请求
 * - 检查 signal?.aborted 判断是否为取消操作
 * - 捕获 AbortError 异常
 */
import { useState, useCallback, useRef } from 'react';
import type { ProviderSettingsConfig } from '../providers/types';
import { apiStrategyRegistry } from '../providers/api-strategy';

/**
 * 流式生成参数接口
 *
 * 封装了流式 API 调用所需的所有参数。
 */
export interface StreamGenerateParams {
  /**
   * 消息历史数组，用于构建 API 请求
   * 包含 system、user、assistant 三种角色
   * 通常包含：系统提示 + 最近 N 条消息历史 + 当前用户消息
   */
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  /**
   * API 提供商配置
   * 包含：baseURL、apiKey、model 等配置项
   */
  config: ProviderSettingsConfig;
  /**
   * 取消信号（可选）
   * 传入 AbortController.signal 以支持取消请求
   */
  signal?: AbortSignal;
  /**
   * 增量回调
   * 每次收到新的 token 时调用，传入增量内容
   * 用于实时更新 UI（如更新消息内容）
   */
  onDelta: (delta: string) => void;
  /**
   * 完成回调
   * 流式传输完成时调用，传入完整内容
   * 用于将最终状态更新为 complete
   */
  onDone: (fullContent: string) => void;
  /**
   * 错误回调
   * 发生错误时调用，传入错误信息
   * 用于将消息状态更新为 error
   */
  onError: (error: string) => void;
}

/**
 * useStreaming Hook 返回值接口
 */
export interface UseStreamingReturn {
  /** 是否正在流式传输中（用于 UI 状态：禁用按钮、显示加载动画等） */
  isStreaming: boolean;
  /** 触发流式生成的函数 */
  streamGenerate: (params: StreamGenerateParams) => Promise<void>;
}

/**
 * useStreaming Hook
 *
 * 提供流式 API 调用功能，基于 SSE (Server-Sent Events) 实现。
 *
 * @returns 包含 isStreaming 状态和 streamGenerate 方法的对象
 *
 * 使用流程：
 * 1. 调用 streamGenerate 并传入参数
 * 2. 等待 onDelta 回调接收增量内容
 * 3. 完成后 onDone 回调接收完整内容
 * 4. 错误时 onError 回调接收错误信息
 * 5. isStreaming 反映当前流式状态
 */
export const useStreaming = (): UseStreamingReturn => {
  /** 流式状态：是否正在传输中 */
  const [isStreaming, setIsStreaming] = useState(false);
  /**
   * AbortController 引用
   * 用于取消正在进行的流式请求
   * @deprecated 当前使用传入的 signal，此 ref 保留供未来扩展
   */
  const abortRef = useRef<AbortController | null>(null);

  /**
   * 触发流式生成
   *
   * @param params 流式生成参数（消息、配置、回调等）
   *
   * 执行流程：
   * 1. 设置 isStreaming = true
   * 2. 获取 OpenAI 兼容策略
   * 3. 调用 callApiStream 发起流式请求
   * 4. 通过 onDelta 实时回调增量内容
   * 5. 完成后通过 onDone 回调完整内容
   * 6. 错误时通过 onError 回调错误信息
   * 7. 无论成败，finally 中设置 isStreaming = false
   *
   * 取消处理：
   * - 检查 signal?.aborted 判断是否为取消
   * - 捕获 AbortError 异常
   * - 取消时调用 onError('已取消')
   */
  const streamGenerate = useCallback(async (params: StreamGenerateParams) => {
    setIsStreaming(true);

    try {
      // 获取 OpenAI 兼容的 API 策略
      const strategy = apiStrategyRegistry.getStrategy('openai_compatible');

      // 发起流式请求，等待完整内容返回
      const fullContent = await strategy.callApiStream(
        {
          messages: params.messages,
          signal: params.signal, // 用于取消请求
          stream: true,
          onDelta: params.onDelta, // 增量回调
        },
        params.config, // API 配置（baseURL, apiKey, model 等）
      );

      // 检查是否为取消操作
      if (params.signal?.aborted) {
        params.onError('已取消');
      } else {
        // 成功完成，返回完整内容
        params.onDone(fullContent);
      }
    } catch (err: unknown) {
      // 错误处理
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message === '已取消') {
          // 取消操作的特殊处理
          params.onError('已取消');
        } else {
          // 其他错误，返回错误消息
          params.onError(err.message);
        }
      } else {
        // 未知错误
        params.onError('生成失败，请重试');
      }
    } finally {
      // 无论成功失败，都要重置流式状态
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, streamGenerate };
};
