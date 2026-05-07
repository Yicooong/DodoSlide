/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview API 策略注册表
 * @description 实现策略模式，根据 API 格式类型选择对应的调用策略
 * 支持不同提供商的 API 格式（目前仅 OpenAI 兼容格式）
 * 使用注册表模式管理策略实例，便于未来扩展其他 API 格式
 */

import type { ApiFormat, ApiCallOptions, ProviderSettingsConfig, ModelListResult } from './types';
import { OpenAiCompatibleStrategy } from './openai-strategy';

/**
 * API 调用策略接口
 * 定义所有 API 策略必须实现的方法，实现请求/响应格式的抽象
 * 不同的 API 提供商可能有不同的请求格式和响应结构，通过此接口统一
 */
export interface ApiCallStrategy {
  /**
   * 调用 API（非流式）
   * @param prompt - 用户提示词
   * @param config - 提供商设置配置
   * @returns 完整的响应内容字符串
   */
  callApi(prompt: string, config: ProviderSettingsConfig): Promise<string>;
  
  /**
   * 调用 API（流式传输）
   * @param options - API 调用选项，包含消息列表、回调等
   * @param config - 提供商设置配置
   * @returns 完整的响应内容字符串
   */
  callApiStream(options: ApiCallOptions, config: ProviderSettingsConfig): Promise<string>;
  
  /**
   * 列出可用模型
   * @param config - 提供商设置配置
   * @returns 模型列表查询结果
   */
  listModels(config: ProviderSettingsConfig): Promise<ModelListResult>;
}

/**
 * API 策略注册表
 * 根据提供商的 apiFormat 选择适当的策略实现
 * 预注册了 OpenAI 兼容策略，支持运行时动态注册新策略
 */
export class ApiStrategyRegistry {
  /** 策略映射表，key 为 API 格式类型，value 为策略实例 */
  private strategies: Map<ApiFormat, ApiCallStrategy> = new Map();

  /**
   * 构造函数
   * 初始化注册表并预注册 OpenAI 兼容策略
   */
  constructor() {
    // 预注册 OpenAI 兼容策略（目前唯一支持的格式）
    this.registerStrategy('openai_compatible', new OpenAiCompatibleStrategy());
  }

  /**
   * 注册策略
   * 为指定的 API 格式注册对应的策略实现
   * @param format - API 格式类型
   * @param strategy - 策略实例
   */
  registerStrategy(format: ApiFormat, strategy: ApiCallStrategy): void {
    this.strategies.set(format, strategy);
  }

  /**
   * 获取策略
   * 根据 API 格式类型返回对应的策略实例
   * 如果未找到匹配的策略，默认返回 OpenAI 兼容策略
   * @param format - API 格式类型
   * @returns 对应的策略实例
   */
  getStrategy(format: ApiFormat): ApiCallStrategy {
    return this.strategies.get(format) ?? this.strategies.get('openai_compatible')!;
  }
}

/** 单例注册表实例，全局共享 */
export const apiStrategyRegistry = new ApiStrategyRegistry();
