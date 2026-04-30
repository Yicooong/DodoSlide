import { useState, useCallback } from 'react';
import { CanvasRatio } from '../lib/canvas-config';
import { buildMultiSlidePrompt, PromptSettings } from '../lib/prompt-manager';
import { getStylePromptBundle } from '../prompts/templates/index';

export interface MultiSlideGenerationState {
  isGenerating: boolean;
  currentSlide: number;
  totalSlides: number;
  generatedSlides: Array<{ index: number; code: string }>;
  error: string | null;
}

export interface SlideGenerationCallbacks {
  onSlideGenerated: (index: number, code: string) => void;
  onGenerationComplete: (slides: Array<{ index: number; code: string }>) => void;
  onError: (error: string) => void;
}

/**
 * Hook for orchestrating multi-slide generation.
 * Generates slides one by one with context accumulation.
 */
export const useMultiGeneration = () => {
  const [state, setState] = useState<MultiSlideGenerationState>({
    isGenerating: false,
    currentSlide: 0,
    totalSlides: 0,
    generatedSlides: [],
    error: null,
  });

  const generateSlides = useCallback(async (
    userInput: string,
    pageCount: number,
    styleId: string,
    canvasRatio: CanvasRatio,
    promptSettings: PromptSettings,
    apiCall: (prompt: string) => Promise<string>,
    callbacks: SlideGenerationCallbacks
  ) => {
    setState({
      isGenerating: true,
      currentSlide: 0,
      totalSlides: pageCount,
      generatedSlides: [],
      error: null,
    });

    const styleBundle = getStylePromptBundle(styleId);
    const generated: Array<{ index: number; code: string }> = [];
    const summaries: string[] = [];

    try {
      for (let i = 0; i < pageCount; i++) {
        setState(prev => ({ ...prev, currentSlide: i }));

        const previousSummary = summaries.length > 0
          ? summaries.map((s, idx) => `Slide ${idx + 1}: ${s}`).join('\n')
          : '';

        const prompt = buildMultiSlidePrompt(
          userInput,
          i,
          pageCount,
          previousSummary,
          styleBundle,
          promptSettings,
          canvasRatio
        );

        const responseText = await apiCall(prompt);

        // Extract code from response
        const codeBlockMatch = responseText.match(/```(?:jsx|tsx|javascript)?\n?([\s\S]*?)```/);
        const code = codeBlockMatch
          ? codeBlockMatch[1].trim()
          : responseText;

        if (!code) {
          throw new Error(`无法从第 ${i + 1} 页的 AI 响应中提取代码`);
        }

        generated.push({ index: i, code });

        // Create a brief summary for context accumulation
        const componentNameMatch = code.match(/const\s+(\w+)\s*=/);
        const componentName = componentNameMatch?.[1] || 'Slide';
        summaries.push(`"${componentName}" slide with content about: ${userInput.substring(0, 50)}...`);

        // Notify UI of progress
        callbacks.onSlideGenerated(i, code);

        setState(prev => ({
          ...prev,
          generatedSlides: [...generated],
        }));
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
      }));

      callbacks.onGenerationComplete(generated);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '多页生成失败';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
      callbacks.onError(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    generateSlides,
    clearError,
  };
};
