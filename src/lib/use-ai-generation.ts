/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';
import { PromptSettings, loadPromptSettings, savePromptSettings, buildFullPrompt } from './prompt-manager';
import { useProviderManager } from './providers/use-provider-manager';
import { apiStrategyRegistry } from './providers/api-strategy';
import type { UseProviderManagerReturn } from './providers/use-provider-manager';
import { CanvasRatio } from './canvas-config';

/**
 * AI 生成状态接口
 */
export interface AiGenerationState {
  isGenerating: boolean;       // 是否正在生成
  error: string | null;        // 错误信息
  lastGeneratedCode: string | null;  // 最近生成的代码
}

/**
 * AI 生成结果接口
 */
export interface AiGenerationResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * AI 幻灯片生成 Hook
 * 管理 AI 生成的状态和逻辑，包括：
 * - 提示词设置管理
 * - 代码提取
 * - API 调用
 * - 取消生成
 */
export const useAiGeneration = () => {
  // 生成状态：是否正在生成、错误信息、最近生成的代码
  const [state, setState] = useState<AiGenerationState>({
    isGenerating: false,
    error: null,
    lastGeneratedCode: null,
  });

  // 提示词设置（从 localStorage 加载初始值）
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(() => loadPromptSettings());
  // API 提供商管理器，用于调用 AI API
  const providerManager = useProviderManager();
  // AbortController 引用，用于取消正在进行的请求
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 更新提示词设置
   * 同时持久化到 localStorage
   * @param newSettings 需要更新的设置字段
   */
  const updatePromptSettings = useCallback((newSettings: Partial<PromptSettings>) => {
    setPromptSettings(prev => {
      const updated = { ...prev, ...newSettings };
      savePromptSettings(updated);
      return updated;
    });
  }, []);

  /**
   * 从 AI 响应中提取 JSX 代码
   * 使用多种策略，按优先级依次尝试：
   * 1. 匹配代码块（```jsx/tsx/javascript）
   * 2. 匹配 export default function 结构
   * 3. 匹配任意 React 组件函数
   * 4. 逐行提取包含代码特征的行
   * @param text AI 的完整响应文本
   * @returns 提取的代码，失败返回 null
   */
  const extractCodeFromResponse = (text: string): string | null => {
    // 策略 1：匹配代码块（```jsx、```tsx、```javascript 或 ```）
    const codeBlockMatch = text.match(/```(?: jsx|tsx|javascript)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // 策略 2：匹配 export default function 格式的 React 组件
    const exportMatch = text.match(/export\s+default\s+function\s+(\w+)\s*\([\s\S]*?\{[\s\S]*?\}/);
    if (exportMatch) {
      return text;
    }
    
    // 策略 3：匹配任意 function 开头的函数（可能是 React 组件）
    const functionMatch = text.match(/function\s+\w+\s*\([\s\S]*?\}\s*$/m);
    if (functionMatch) {
      return text;
    }

    // 策略 4：逐行扫描，提取包含代码特征的行
    const lines = text.split('\n');
    const codeLines: string[] = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      if (line.includes('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
      // 在代码块内，或行中包含导出/函数/箭头函数等特征
      if (inCodeBlock || line.includes('export default') || line.includes('function') || line.includes('const ') && line.includes('=') && line.includes('=>')) {
        codeLines.push(line);
      }
    }

    if (codeLines.length > 0) {
      return codeLines.join('\n');
    }

    return null;
  };

  /**
   * 使用 AI 生成幻灯片代码
   * 完整流程：验证参数 → 构建提示词 → 调用 API → 提取代码 → 更新状态
   * @param userInput 用户对幻灯片的描述
   * @param canvasRatio 画布比例（16:9 或 4:3），可选
   * @returns 生成结果，包含成功状态和代码/错误信息
   */
  const generate = useCallback(async (userInput: string, canvasRatio?: CanvasRatio): Promise<AiGenerationResult> => {
    // 验证输入是否为空
    if (!userInput.trim()) {
      return { success: false, error: '请输入幻灯片描述' };
    }

    // 如果之前有请求正在进行，先取消
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // 创建新的 AbortController
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // 更新状态为生成中
    setState({ isGenerating: true, error: null, lastGeneratedCode: null });

    try {
      // 获取当前配置的 API 提供商
      const currentProvider = providerManager.getCurrentProvider();
      // 检查提供商和必要配置项
      if (!currentProvider) throw new Error('请先配置 API 提供商');
      if (!currentProvider.settingsConfig.apiKey) throw new Error('请先配置 API Key');
      if (!currentProvider.settingsConfig.endpoint) throw new Error('请先配置 API 端点');
      if (!currentProvider.settingsConfig.model) throw new Error('请先选择模型');

      // 检查是否已被取消
      if (abortController.signal.aborted) throw new Error('已取消');

      // 构建完整的提示词
      const fullPrompt = buildFullPrompt(userInput, promptSettings, canvasRatio);
      // 获取 API 格式（默认 openai_compatible）
      const apiFormat = currentProvider.meta?.apiFormat ?? 'openai_compatible';
      // 获取对应的 API 策略
      const strategy = apiStrategyRegistry.getStrategy(apiFormat);
      // 调用 API，等待响应
      const responseText = await strategy.callApi(fullPrompt, currentProvider.settingsConfig);

      // API 调用后再次检查是否已被取消
      if (abortController.signal.aborted) throw new Error('已取消');

      // 从 AI 响应中提取代码
      const extractedCode = extractCodeFromResponse(responseText);

      // 如果无法提取代码，抛出错误
      if (!extractedCode) {
        throw new Error('无法从 AI 响应中提取代码');
      }

      // 更新状态：生成成功，保存代码
      setState({
        isGenerating: false,
        error: null,
        lastGeneratedCode: extractedCode,
      });

      return { success: true, code: extractedCode };
    } catch (error: unknown) {
      // 如果是用户主动取消，不视为错误
      if (error instanceof Error && error.message === '已取消') {
        setState({ isGenerating: false, error: null, lastGeneratedCode: null });
        return { success: false, error: '已取消' };
      }
      // 其他错误：提取错误信息并更新状态
      const errorMessage = error instanceof Error ? error.message : '生成失败，请重试';
      setState({
        isGenerating: false,
        error: errorMessage,
        lastGeneratedCode: null,
      });
      return { success: false, error: errorMessage };
    }
  }, [providerManager, promptSettings]);

  /**
   * 停止当前正在进行的 AI 生成请求
   * 通过 AbortController 取消请求，并重置状态
   */
  const stopGenerate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({ isGenerating: false, error: null, lastGeneratedCode: null });
  }, []);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // 生成状态（展开）
    ...state,
    // 生成相关方法
    generate,           // 发起生成请求
    stopGenerate,       // 取消生成请求
    clearError,         // 清除错误状态
    // 提供商管理
    providerManager,    // API 提供商管理器实例
    // 提示词设置
    promptSettings,     // 当前提示词设置
    updatePromptSettings, // 更新提示词设置
  };
};
