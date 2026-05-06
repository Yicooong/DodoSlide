/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview OpenAI 兼容 API 策略实现
 * @description 实现 OpenAI Chat Completions API 格式的调用策略
 * 支持非流式和流式两种调用方式，以及模型列表获取
 * 流式传输使用 Server-Sent Events (SSE) 协议通过 ReadableStream 解析
 */

import type { ProviderSettingsConfig, ApiCallOptions, ModelListResult } from './types';
import { normalizeEndpointUrl } from './types';
import type { ApiCallStrategy } from './api-strategy';

/**
 * OpenAI 兼容 API 策略实现类
 * 调用 /chat/completions 端点，使用 OpenAI Chat Completions 格式
 * 这是目前唯一正式支持的 API 格式策略
 */
export class OpenAiCompatibleStrategy implements ApiCallStrategy {
  /**
   * 调用 OpenAI 兼容的聊天补全 API（非流式）
   * @param prompt - 用户提示词，将作为 user 角色消息发送
   * @param config - 提供商设置配置，包含端点、密钥、模型等
   * @returns 完整的响应内容字符串
   * @throws 当 API 返回错误时抛出包含错误信息的异常
   */
  async callApi(prompt: string, config: ProviderSettingsConfig): Promise<string> {
    // 规范化端点 URL，去除可能的路径后缀
    const baseUrl = normalizeEndpointUrl(config.endpoint);

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    // 合并自定义请求头（如果提供）
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    // 发送 POST 请求到 /chat/completions 端点
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

    // 处理 HTTP 错误响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = this.getHttpErrorMessage(response.status, errorData);
      throw new Error(errorMessage);
    }

    // 解析响应 JSON 并提取内容
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  /**
   * 调用 OpenAI 兼容 API（支持流式传输）
   * 使用 ReadableStream 解析 SSE (Server-Sent Events) 事件
   * 每个 token 通过 onDelta 回调实时返回
   * 
   * @param options - API 调用选项
   *   - messages: 消息列表（支持多轮对话）
   *   - signal: 中止信号，用于取消请求
   *   - temperature/maxTokens: 可选参数，覆盖默认值
   *   - onDelta: 流式回调，每次收到新内容时调用
   * @param config - 提供商设置配置
   * @returns 完整的响应内容字符串（流式结束后拼接的结果）
   * @throws 当 API 返回错误时抛出包含错误信息的异常
   */
  async callApiStream(options: ApiCallOptions, config: ProviderSettingsConfig): Promise<string> {
    // 规范化端点 URL
    const baseUrl = normalizeEndpointUrl(config.endpoint);

    // 构建请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    };

    // 合并自定义请求头
    if (config.customHeaders) {
      Object.assign(headers, config.customHeaders);
    }

    // 发送流式请求，设置 stream: true
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: options.messages,
        temperature: options.temperature ?? config.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? config.maxTokens ?? 8192,
        stream: true, // 启用流式传输
      }),
      signal: options.signal, // 传递中止信号
    });

    // 处理 HTTP 错误响应
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = this.getHttpErrorMessage(response.status, errorData);
      throw new Error(errorMessage);
    }

    // ========================================================================
    // SSE 流式解析逻辑
    // ========================================================================
    
    const reader = response.body!.getReader(); // 获取响应体的读取器
    const decoder = new TextDecoder(); // 用于解码二进制数据为文本
    let fullContent = ''; // 完整内容拼接
    let buffer = ''; // 缓冲区，处理不完整的行

    // 循环读取流式数据
    while (true) {
      const { done, value } = await reader.read();
      if (done) break; // 流式传输结束

      // 解码接收到的数据块并添加到缓冲区
      buffer += decoder.decode(value, { stream: true });
      
      // 按行分割，处理完整的 SSE 事件
      const lines = buffer.split('\n');
      buffer = lines.pop()!; // 最后一行可能不完整，保留到下次处理

      // 逐行解析 SSE 事件
      for (const line of lines) {
        const trimmed = line.trim();
        // 跳过空行和非 data 行
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        // 提取 data 字段内容（去掉 'data: ' 前缀）
        const data = trimmed.slice(6);
        
        // 检查是否为结束标记
        if (data === '[DONE]') break;

        try {
          // 解析 JSON 数据
          const parsed = JSON.parse(data);
          // 提取增量内容（delta）
          const delta = parsed.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullContent += delta; // 拼接到完整内容
            options.onDelta?.(delta); // 触发增量回调
          }
        } catch {
          // 跳过格式错误的 JSON 行（某些提供商可能有非标准格式）
        }
      }
    }

    return fullContent;
  }

  /**
   * 列出提供商的可用模型
   * 从 /models 端点获取模型列表
   * 支持三种常见的响应格式：OpenAI 标准格式、替代格式、直接数组格式
   * 
   * @param config - 提供商设置配置
   * @returns 模型列表查询结果，包含成功状态和模型名称数组或错误信息
   */
  async listModels(config: ProviderSettingsConfig): Promise<ModelListResult> {
    // 验证必要参数
    if (!config.apiKey) {
      return { success: false, error: '请先输入 API Key' };
    }

    const baseUrl = normalizeEndpointUrl(config.endpoint);
    if (!baseUrl) {
      return { success: false, error: '请先输入 API 端点' };
    }

    try {
      // 构建请求头
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      };

      if (config.customHeaders) {
        Object.assign(headers, config.customHeaders);
      }

      // 请求 /models 端点
      const response = await fetch(`${baseUrl}/models`, { headers });

      // 处理 HTTP 错误
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // ========================================================================
      // 处理不同的响应格式
      // ========================================================================
      
      let models: string[] = [];
      
      if (data.data && Array.isArray(data.data)) {
        // OpenAI 标准格式: { data: [{ id: "model-name" }, ...] }
        models = data.data
          .map((m: { id?: string }) => m.id)
          .filter((id: string | undefined): id is string => !!id);
          
      } else if (data.models && Array.isArray(data.models)) {
        // 替代格式: { models: [{ id: "model-name" }, ...] }
        models = data.models
          .map((m: { id?: string; name?: string }) => m.id || m.name)
          .filter((id: string | undefined): id is string => !!id);
          
      } else if (Array.isArray(data)) {
        // 直接数组格式: [{ id: "model-name" }, ...]
        models = data
          .map((m: { id?: string; name?: string }) => m.id || m.name)
          .filter((id: string | undefined): id is string => !!id);
      }

      // 过滤空值并按字母顺序排序
      models = models
        .filter((m: string) => m && typeof m === 'string' && m.length > 0)
        .sort((a: string, b: string) => a.localeCompare(b));

      // 检查是否找到模型
      if (models.length === 0) {
        return { success: false, error: '未找到可用模型，请检查 API 配置' };
      }

      return { success: true, models };
    } catch (error: unknown) {
      // 捕获并处理所有错误
      const message = error instanceof Error ? error.message : '连接测试失败';
      return { success: false, error: message };
    }
  }

  /**
   * 生成用户友好的 HTTP 错误消息
   * 根据状态码和 API 返回的错误信息生成中文错误提示
   * 
   * @param status - HTTP 状态码
   * @param errorData - API 返回的错误数据
   * @returns 格式化的错误消息字符串
   */
  private getHttpErrorMessage(status: number, errorData: Record<string, unknown>): string {
    // 提取 API 返回的错误消息
    const apiMessage = (errorData.error as Record<string, string>)?.message 
      || (errorData.message as string) 
      || '';

    // 根据状态码返回对应的错误提示
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
