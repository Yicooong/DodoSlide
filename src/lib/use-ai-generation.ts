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
 * AI generation state
 */
export interface AiGenerationState {
  isGenerating: boolean;
  error: string | null;
  lastGeneratedCode: string | null;
}

/**
 * AI generation result
 */
export interface AiGenerationResult {
  success: boolean;
  code?: string;
  error?: string;
}

/**
 * Hook for AI-powered slide generation.
 * Uses the new provider system for API calls.
 */
export const useAiGeneration = () => {
  const [state, setState] = useState<AiGenerationState>({
    isGenerating: false,
    error: null,
    lastGeneratedCode: null,
  });

  const [promptSettings, setPromptSettings] = useState<PromptSettings>(() => loadPromptSettings());
  const providerManager = useProviderManager();
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Update prompt settings
   */
  const updatePromptSettings = useCallback((newSettings: Partial<PromptSettings>) => {
    setPromptSettings(prev => {
      const updated = { ...prev, ...newSettings };
      savePromptSettings(updated);
      return updated;
    });
  }, []);

  /**
   * Extract JSX code from AI response
   */
  const extractCodeFromResponse = (text: string): string | null => {
    // Try to find code block
    const codeBlockMatch = text.match(/```(?:jsx|tsx|javascript)?\n?([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    
    // Try to find export default
    const exportMatch = text.match(/export\s+default\s+function\s+(\w+)\s*\([\s\S]*?\{[\s\S]*?\}/);
    if (exportMatch) {
      return text;
    }
    
    // Try to find any function that could be a React component
    const functionMatch = text.match(/function\s+\w+\s*\([\s\S]*?\}\s*$/m);
    if (functionMatch) {
      return text;
    }

    // If no code block found, try to use the entire response
    const lines = text.split('\n');
    const codeLines: string[] = [];
    let inCodeBlock = false;
    
    for (const line of lines) {
      if (line.includes('```')) {
        inCodeBlock = !inCodeBlock;
        continue;
      }
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
   * Generate slide code using AI.
   * Uses the current provider from the provider manager.
   */
  const generate = useCallback(async (userInput: string, canvasRatio?: CanvasRatio): Promise<AiGenerationResult> => {
    if (!userInput.trim()) {
      return { success: false, error: '请输入幻灯片描述' };
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState({ isGenerating: true, error: null, lastGeneratedCode: null });

    try {
      const currentProvider = providerManager.getCurrentProvider();
      if (!currentProvider) throw new Error('请先配置 API 提供商');
      if (!currentProvider.settingsConfig.apiKey) throw new Error('请先配置 API Key');
      if (!currentProvider.settingsConfig.endpoint) throw new Error('请先配置 API 端点');
      if (!currentProvider.settingsConfig.model) throw new Error('请先选择模型');

      if (abortController.signal.aborted) throw new Error('已取消');

      const fullPrompt = buildFullPrompt(userInput, promptSettings, canvasRatio);
      const apiFormat = currentProvider.meta?.apiFormat ?? 'openai_compatible';
      const strategy = apiStrategyRegistry.getStrategy(apiFormat);
      const responseText = await strategy.callApi(fullPrompt, currentProvider.settingsConfig);

      if (abortController.signal.aborted) throw new Error('已取消');

      const extractedCode = extractCodeFromResponse(responseText);

      if (!extractedCode) {
        throw new Error('无法从 AI 响应中提取代码');
      }

      setState({
        isGenerating: false,
        error: null,
        lastGeneratedCode: extractedCode,
      });

      return { success: true, code: extractedCode };
    } catch (error: unknown) {
      if (error instanceof Error && error.message === '已取消') {
        setState({ isGenerating: false, error: null, lastGeneratedCode: null });
        return { success: false, error: '已取消' };
      }
      const errorMessage = error instanceof Error ? error.message : '生成失败，请重试';
      setState({
        isGenerating: false,
        error: errorMessage,
        lastGeneratedCode: null,
      });
      return { success: false, error: errorMessage };
    }
  }, [providerManager, promptSettings]);

  const stopGenerate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState({ isGenerating: false, error: null, lastGeneratedCode: null });
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generate,
    stopGenerate,
    clearError,
    providerManager,
    promptSettings,
    updatePromptSettings,
  };
};
