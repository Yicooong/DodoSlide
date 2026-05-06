/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import type { ProviderSettingsConfig } from '../providers/types';
import { apiStrategyRegistry } from '../providers/api-strategy';

export interface StreamGenerateParams {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  config: ProviderSettingsConfig;
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
  onDone: (fullContent: string) => void;
  onError: (error: string) => void;
}

export interface UseStreamingReturn {
  isStreaming: boolean;
  streamGenerate: (params: StreamGenerateParams) => Promise<void>;
}

export const useStreaming = (): UseStreamingReturn => {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const streamGenerate = useCallback(async (params: StreamGenerateParams) => {
    setIsStreaming(true);

    try {
      const strategy = apiStrategyRegistry.getStrategy('openai_compatible');
      const fullContent = await strategy.callApiStream(
        {
          messages: params.messages,
          signal: params.signal,
          stream: true,
          onDelta: params.onDelta,
        },
        params.config,
      );

      if (params.signal?.aborted) {
        params.onError('已取消');
      } else {
        params.onDone(fullContent);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError' || err.message === '已取消') {
          params.onError('已取消');
        } else {
          params.onError(err.message);
        }
      } else {
        params.onError('生成失败，请重试');
      }
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { isStreaming, streamGenerate };
};
