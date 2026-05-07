import { useState, useCallback } from 'react';
// 导入画布比例类型
import { CanvasRatio } from '../lib/canvas-config';
// 导入多页幻灯片提示词构建函数和提示词设置类型
import { buildMultiSlidePrompt, PromptSettings } from '../lib/prompt-manager';
// 导入样式提示词包获取函数
import { getStylePromptBundle } from '../prompts/templates/index';

// 多页幻灯片生成状态接口
export interface MultiSlideGenerationState {
  isGenerating: boolean;                     // 是否正在生成
  currentSlide: number;                      // 当前正在生成的幻灯片索引
  totalSlides: number;                       // 总共需要生成的幻灯片数量
  generatedSlides: Array<{ index: number; code: string }>;  // 已生成的幻灯片数组
  error: string | null;                      // 错误信息
}

// 幻灯片生成回调函数接口
export interface SlideGenerationCallbacks {
  onSlideGenerated: (index: number, code: string) => void;   // 单张幻灯片生成完成回调
  onGenerationComplete: (slides: Array<{ index: number; code: string }>) => void;  // 全部生成完成回调
  onError: (error: string) => void;                          // 错误回调
}

/**
 * 多页幻灯片生成 Hook
 * 负责逐张生成幻灯片，并累积上下文信息以保持风格一致性
 */
export const useMultiGeneration = () => {
  // 生成状态管理
  const [state, setState] = useState<MultiSlideGenerationState>({
    isGenerating: false,
    currentSlide: 0,
    totalSlides: 0,
    generatedSlides: [],
    error: null,
  });

  /**
   * 执行多页幻灯片生成
   * @param userInput 用户输入的提示词
   * @param pageCount 需要生成的页数
   * @param styleId 样式模板 ID
   * @param canvasRatio 画布比例
   * @param promptSettings 提示词设置
   * @param apiCall API 调用函数
   * @param callbacks 回调函数集合
   */
  const generateSlides = useCallback(async (
    userInput: string,
    pageCount: number,
    styleId: string,
    canvasRatio: CanvasRatio,
    promptSettings: PromptSettings,
    apiCall: (prompt: string) => Promise<string>,
    callbacks: SlideGenerationCallbacks
  ) => {
    // 初始化生成状态
    setState({
      isGenerating: true,
      currentSlide: 0,
      totalSlides: pageCount,
      generatedSlides: [],
      error: null,
    });

    // 获取样式提示词包（包含样式规则、工作流、参考示例）
    const styleBundle = getStylePromptBundle(styleId);
    // 存储已生成的幻灯片
    const generated: Array<{ index: number; code: string }> = [];
    // 存储已生成幻灯片的摘要，用于上下文累积
    const summaries: string[] = [];

    try {
      // 逐张生成幻灯片
      for (let i = 0; i < pageCount; i++) {
        // 更新当前生成进度
        setState(prev => ({ ...prev, currentSlide: i }));

        // 构建已生成幻灯片的摘要文本，用于后续幻灯片的上下文
        const previousSummary = summaries.length > 0
          ? summaries.map((s, idx) => `Slide ${idx + 1}: ${s}`).join('\n')
          : '';

        // 构建当前幻灯片的提示词
        const prompt = buildMultiSlidePrompt(
          userInput,
          i,                    // 当前页码（0 基）
          pageCount,            // 总页数
          previousSummary,      // 之前幻灯片的摘要
          styleBundle,          // 样式提示词包
          promptSettings,       // 提示词设置
          canvasRatio           // 画布比例
        );

        // 调用 AI API 生成幻灯片代码
        const responseText = await apiCall(prompt);

        // 从响应中提取代码块（支持 jsx/tsx/javascript 标记）
        const codeBlockMatch = responseText.match(/```(?: jsx|tsx|javascript)?\n?([\s\S]*?)```/);
        const code = codeBlockMatch
          ? codeBlockMatch[1].trim()
          : responseText;

        // 验证是否成功提取代码
        if (!code) {
          throw new Error(`无法从第 ${i + 1} 页的 AI 响应中提取代码`);
        }

        // 保存生成的代码
        generated.push({ index: i, code });

        // 创建简短摘要用于上下文累积
        // 提取组件名称或使用默认名称
        const componentNameMatch = code.match(/const\s+(\w+)\s*=/);
        const componentName = componentNameMatch?.[1] || 'Slide';
        summaries.push(`"${componentName}" slide with content about: ${userInput.substring(0, 50)}...`);

        // 通知 UI 单张幻灯片生成完成
        callbacks.onSlideGenerated(i, code);

        // 更新已生成幻灯片列表
        setState(prev => ({
          ...prev,
          generatedSlides: [...generated],
        }));
      }

      // 全部生成完成，更新状态
      setState(prev => ({
        ...prev,
        isGenerating: false,
      }));

      // 调用全部生成完成回调
      callbacks.onGenerationComplete(generated);
    } catch (error: unknown) {
      // 处理生成错误
      const errorMessage = error instanceof Error ? error.message : '多页生成失败';
      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage,
      }));
      callbacks.onError(errorMessage);
    }
  }, []);

  /**
   * 清除错误状态
   */
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // 返回状态和操作方法
  return {
    ...state,
    generateSlides,
    clearError,
  };
};
