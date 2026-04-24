/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { ApiProvider, API_PROVIDERS, ApiSettings, loadApiSettings, saveApiSettings } from './api-providers';
import { PromptSettings, loadPromptSettings, savePromptSettings, buildFullPrompt } from './prompt-manager';

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
 * Hook for AI-powered slide generation
 */
export const useAiGeneration = () => {
  const [state, setState] = useState<AiGenerationState>({
    isGenerating: false,
    error: null,
    lastGeneratedCode: null,
  });

  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => loadApiSettings());
  const [promptSettings, setPromptSettings] = useState<PromptSettings>(() => loadPromptSettings());

  /**
   * Update API settings
   */
  const updateApiSettings = useCallback((newSettings: Partial<ApiSettings>) => {
    setApiSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveApiSettings(updated);
      return updated;
    });
  }, []);

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
   * Call Custom OpenAI-compatible API
   */
  const callCustomApi = async (prompt: string, apiKey: string, model: string, endpoint: string): Promise<string> => {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  };

  /**
   * Generate slide code using AI
   */
  const generate = useCallback(async (userInput: string): Promise<AiGenerationResult> => {
    if (!userInput.trim()) {
      return { success: false, error: '请输入幻灯片描述' };
    }

    setState({ isGenerating: true, error: null, lastGeneratedCode: null });

    try {
      const fullPrompt = buildFullPrompt(userInput, promptSettings);
      let responseText = '';

      const apiKey = apiSettings.customApiKey || localStorage.getItem('api_key_custom') || '';
      if (!apiKey) throw new Error('请先配置 API Key');
      if (!apiSettings.customEndpoint) throw new Error('请先配置 API 端点');
      if (!apiSettings.customModel) throw new Error('请先选择模型');

      responseText = await callCustomApi(fullPrompt, apiKey, apiSettings.customModel, apiSettings.customEndpoint);

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
    } catch (error: any) {
      const errorMessage = error.message || '生成失败，请重试';
      setState({
        isGenerating: false,
        error: errorMessage,
        lastGeneratedCode: null,
      });
      return { success: false, error: errorMessage };
    }
  }, [apiSettings, promptSettings]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generate,
    clearError,
    apiSettings,
    updateApiSettings,
    promptSettings,
    updatePromptSettings,
  };
};
