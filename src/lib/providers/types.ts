/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview API 提供商类型定义文件
 * @description 定义提供商管理系统中使用的所有类型、接口和常量
 * 包括 API 格式、提供商配置、设置、状态管理等相关类型
 */

// ============================================================================
// API 格式标识符
// ============================================================================

/**
 * API 格式类型 - 决定请求/响应的数据结构
 * 目前仅支持 OpenAI 兼容格式，未来可扩展其他格式
 */
export type ApiFormat = 'openai_compatible';
// 未来扩展: | 'anthropic_native' | 'gemini_native';

// ============================================================================
// 提供商分类
// ============================================================================

/**
 * 提供商分类标识符
 * 用于区分不同类型的 API 提供商
 */
export type ProviderCategory = 'custom';
// 未来扩展: | 'claude' | 'gemini' | 'openai';

// ============================================================================
// 自定义端点
// ============================================================================

/**
 * 提供商内的自定义端点配置
 * 允许为同一提供商配置多个不同的 API URL
 */
export interface CustomEndpoint {
  /** 端点名称，用于显示和识别 */
  name: string;
  /** API 端点 URL 地址 */
  url: string;
  /** 端点描述（可选） */
  description?: string;
}

// ============================================================================
// 提供商测试配置
// ============================================================================

/**
 * 提供商连接测试配置
 * 定义如何测试 API 连接的有效性和性能
 */
export interface ProviderTestConfig {
  /** 是否启用连接测试 */
  enabled: boolean;
  /** 用于测试的模型名称（可选） */
  testModel?: string;
  /** 测试超时时间（秒） */
  timeoutSecs?: number;
  /** 测试使用的提示词（可选） */
  testPrompt?: string;
  /** 降级阈值（毫秒），超过此时间认为性能降级 */
  degradedThresholdMs?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

// ============================================================================
// 提供商元数据
// ============================================================================

/**
 * 提供商元数据 - 运营配置，与显示属性分离
 * 包含 API 格式、端点配置、测试设置等运营相关信息
 */
export interface ProviderMeta {
  /** API 格式类型，决定使用哪种策略进行 API 调用 */
  apiFormat: ApiFormat;
  /** 自定义端点映射表，key 为端点标识，value 为端点配置 */
  customEndpoints: Record<string, CustomEndpoint>;
  /** 是否自动选择端点（可选） */
  endpointAutoSelect?: boolean;
  /** 成本倍数，用于成本计算（可选） */
  costMultiplier?: number;
  /** 连接测试配置（可选） */
  testConfig?: ProviderTestConfig;
  /** 提供商类型标识（可选） */
  providerType?: string;
}

// ============================================================================
// 提供商设置配置
// ============================================================================

/**
 * 提供商设置配置 - 存储在提供商内部的 API 相关设置
 * 包含调用 API 所需的所有配置信息
 */
export interface ProviderSettingsConfig {
  /** API 端点 URL 地址 */
  endpoint: string;
  /** API 密钥，用于身份验证 */
  apiKey: string;
  /** 使用的模型名称 */
  model: string;
  /** 自定义请求头（可选），可添加额外 HTTP 头 */
  customHeaders?: Record<string, string>;
  /** 温度参数（可选），控制生成随机性，范围 0-2 */
  temperature?: number;
  /** 最大生成令牌数（可选），限制响应长度 */
  maxTokens?: number;
}

// ============================================================================
// 提供商核心结构
// ============================================================================

/**
 * 提供商核心结构 - 表示一个已配置的 AI API 端点
 * 这是系统中最核心的数据结构，包含提供商的所有信息
 */
export interface Provider {
  /** 唯一标识符，使用 UUID 生成 */
  id: string;
  /** 显示名称，用于 UI 展示 */
  name: string;
  /** API 设置配置，包含端点、密钥、模型等 */
  settingsConfig: ProviderSettingsConfig;
  /** 提供商官网 URL（可选） */
  websiteUrl?: string;
  /** 提供商分类，目前仅支持 'custom' */
  category: ProviderCategory;
  /** 创建时间戳（毫秒） */
  createdAt: number;
  /** 排序索引，用于确定显示顺序 */
  sortIndex: number;
  /** 备注信息（可选） */
  notes?: string;
  /** 元数据配置（可选），包含运营相关设置 */
  meta?: ProviderMeta;
  /** 图标名称或 URL（可选） */
  icon?: string;
  /** 图标颜色（可选） */
  iconColor?: string;
}

// ============================================================================
// 提供商管理器状态
// ============================================================================

/**
 * 提供商管理器状态 - 完整的持久化状态
 * 包含所有的提供商数据、排序和当前选择
 */
export interface ProviderManagerState {
  /** 提供商映射表，key 为提供商 ID，value 为提供商对象 */
  providers: Record<string, Provider>;
  /** 提供商排序列表，按显示顺序排列的 ID 数组 */
  providerOrder: string[];
  /** 当前选中的提供商 ID */
  currentProviderId: string;
}

// ============================================================================
// API 调用选项
// ============================================================================

/**
 * API 调用选项
 * 支持单提示词和基于消息列表的调用方式
 */
export interface ApiCallOptions {
  /** 消息列表，包含角色和内容，支持 system/user/assistant 三种角色 */
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  /** 中止信号，用于取消请求（可选） */
  signal?: AbortSignal;
  /** 是否启用流式传输（可选） */
  stream?: boolean;
  /** 流式传输时的增量回调，每次收到新内容时调用（可选） */
  onDelta?: (delta: string) => void;
  /** 温度参数（可选），覆盖设置中的默认值 */
  temperature?: number;
  /** 最大令牌数（可选），覆盖设置中的默认值 */
  maxTokens?: number;
}

// ============================================================================
// 结果类型
// ============================================================================

/**
 * 验证结果
 * 用于返回数据验证的状态和错误信息
 */
export interface ValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误列表，包含所有验证失败的原因 */
  errors: string[];
}

/**
 * 模型列表查询结果
 * 用于返回可用模型列表或错误信息
 */
export interface ModelListResult {
  /** 是否成功 */
  success: boolean;
  /** 模型名称列表（成功时返回） */
  models?: string[];
  /** 错误信息（失败时返回） */
  error?: string;
}

/**
 * 连接测试结果
 * 用于返回 API 连接测试的状态和详细信息
 */
export interface ConnectionTestResult {
  /** 是否成功 */
  success: boolean;
  /** 结果消息，描述测试结果 */
  message: string;
  /** 可用模型列表（成功时返回，可选） */
  models?: string[];
}

// ============================================================================
// 默认值常量
// ============================================================================

/**
 * 默认提供商设置配置
 * 新创建提供商时使用的初始设置值
 */
export const DEFAULT_PROVIDER_SETTINGS_CONFIG: ProviderSettingsConfig = {
  endpoint: '',
  apiKey: '',
  model: '',
  temperature: 0.7,
  maxTokens: 8192,
};

/**
 * 默认提供商元数据
 * 新创建提供商时使用的初始元数据
 */
export const DEFAULT_PROVIDER_META: ProviderMeta = {
  apiFormat: 'openai_compatible',
  customEndpoints: {},
};

/**
 * 默认提供商模板（排除自动生成的字段）
 * 用于创建新提供商时的基础数据
 */
export const DEFAULT_PROVIDER: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'> = {
  name: '',
  settingsConfig: { ...DEFAULT_PROVIDER_SETTINGS_CONFIG },
  category: 'custom',
  meta: { ...DEFAULT_PROVIDER_META },
};

/**
 * 默认提供商管理器状态
 * 初始状态，没有任何提供商
 */
export const DEFAULT_PROVIDER_MANAGER_STATE: ProviderManagerState = {
  providers: {},
  providerOrder: [],
  currentProviderId: '',
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 规范化端点 URL
 * 去除常见的 API 路径后缀和尾部斜杠，防止路径重复
 * 
 * @param url - 用户输入的原始 URL
 * @returns 规范化后的 URL
 * 
 * @example
 * normalizeEndpointUrl('https://api.example.com/v1/chat/completions') 
 * // 返回: 'https://api.example.com/v1'
 */
export const normalizeEndpointUrl = (url: string): string => {
  let normalized = url.trim();
  // 去除 /chat/completions 后缀（常见错误粘贴）
  normalized = normalized.replace(/\/chat\/completions\/?$/, '');
  // 去除 /v1/chat/completions 后缀，保留 /v1
  normalized = normalized.replace(/\/v1\/chat\/completions\/?$/, '/v1');
  // 去除尾部斜杠
  normalized = normalized.replace(/\/$/, '');
  return normalized;
};
