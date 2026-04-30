/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ProviderSettingsConfig, ApiCallOptions, ModelListResult } from './types';
import { normalizeEndpointUrl } from './types';
import type { ApiCallStrategy } from './api-strategy';

/**
 * OpenAI-compatible API strategy implementation.
 * Calls /chat/completions endpoint with OpenAI Chat Completions format.
 */
export class OpenAiCompatibleStrategy implements ApiCallStrategy {
  /**
   * Call the OpenAI-compatible chat completions API.
   */
  async callApi(prompt: string, config: ProviderSettingsConfig): Promise<string> {
    const baseUrl = normalizeEndpointUrl(config.endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    // Merge custom headers if provided
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 8192,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = this.getHttpErrorMessage(response.status, errorData);
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * Call the OpenAI-compatible API with streaming support.
   * Uses ReadableStream to parse SSE events and call onDelta for each token.
   */
  async callApiStream(options: ApiCallOptions, config: ProviderSettingsConfig): Promise<string> {
    const baseUrl = normalizeEndpointUrl(config.endpoint);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: options.messages,
        temperature: options.temperature ?? config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? config.maxTokens ?? 8192,
        stream: true,
      }),
      signal: options.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = this.getHttpErrorMessage(response.status, errorData);
      throw new Error(errorMessage);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop()!;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullContent += delta;
            options.onDelta?.(delta);
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }

    return fullContent;
  }

  /**
   * List available models from the provider's /models endpoint.
   * Supports three response formats: OpenAI, alternative, and direct array.
   */
  async listModels(config: ProviderSettingsConfig): Promise<ModelListResult> {
    if (!config.apiKey) {
      return { success: false, error: '请先输入 API Key' };
    }

    const baseUrl = normalizeEndpointUrl(config.endpoint);
    if (!baseUrl) {
      return { success: false, error: '请先输入 API 端点' };
    }

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      };

      if (config.customHeaders) {
        Object.assign(headers, config.customHeaders);
      }

      const response = await fetch(`${baseUrl}/models`, { headers });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Handle different response formats
      let models: string[] = [];
      if (data.data && Array.isArray(data.data)) {
        // OpenAI format: { data: [{ id: "model-name" }, ...] }
        models = data.data.map((m: { id?: string }) => m.id).filter((id: string | undefined): id is string => !!id);
      } else if (data.models && Array.isArray(data.models)) {
        // Alternative format: { models: [{ id: "model-name" }, ...] }
        models = data.models.map((m: { id?: string; name?: string }) => m.id || m.name).filter((id: string | undefined): id is string => !!id);
      } else if (Array.isArray(data)) {
        // Direct array format: [{ id: "model-name" }, ...]
        models = data.map((m: { id?: string; name?: string }) => m.id || m.name).filter((id: string | undefined): id is string => !!id);
      }

      // Sort models alphabetically and filter out empty/invalid ones
      models = models
        .filter((m: string) => m && typeof m === 'string' && m.length > 0)
        .sort((a: string, b: string) => a.localeCompare(b));

      if (models.length === 0) {
        return { success: false, error: '未找到可用模型，请检查 API 配置' };
      }

      return { success: true, models };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '连接测试失败';
      return { success: false, error: message };
    }
  }

  /**
   * Get a user-friendly error message for HTTP error responses.
   */
  private getHttpErrorMessage(status: number, errorData: Record<string, unknown>): string {
    const apiMessage = (errorData.error as Record<string, string>)?.message || (errorData.message as string) || '';

    switch (status) {
      case 401:
      case 403:
        return apiMessage || 'API Key 无效或无权限';
      case 429:
        return apiMessage || '请求过于频繁，请稍后重试';
      default:
        if (status >= 500) {
          return apiMessage || `服务器错误: ${status}`;
        }
        return apiMessage || `API 错误: ${status}`;
    }
  }
}
