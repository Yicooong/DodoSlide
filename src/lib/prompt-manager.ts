/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CanvasRatio, CANVAS_CONFIGS } from './canvas-config';
import type { StylePromptBundle } from '../prompts/templates/index';

/**
 * 默认系统提示词
 * 用于引导 AI 生成幻灯片 React JSX 代码
 * 定义了输出格式、代码规范、幻灯片规格等要求
 */
export const DEFAULT_SYSTEM_PROMPT = `You are an expert React developer specializing in creating slide presentations.

You generate React JSX code for slides with the following specifications:

## Output Format - STRICTLY FOLLOW THIS TEMPLATE
You MUST return code in this exact format, no deviations:

\`\`\`jsx
import React from 'react';
import { IconName1, IconName2 } from 'lucide-react';

const App = () => {
  return (
    <div className="xxx xxx">
      <h1 className="xxx">Title</h1>
      <div className="xxx xxx">Content here</div>
    </div>
    xxx
    xxx
  );
};

export default App;
\`\`\`

## Code Format Rules (MANDATORY)
1. MUST start with \`import React from 'react';\`
2. MUST import icons from lucide-react as: \`import { IconName } from 'lucide-react';\`
3. MUST use \`const App = () => { ... };\` arrow function syntax
4. MUST end with \`export default App;\`
5. Do NOT use \`export default function\` syntax
6. Do NOT use \`function App()\` syntax
7. Do NOT use \`export { App }\` syntax
8. Return ONLY the code, no explanations, no markdown formatting outside code

## Slide Specifications
{{CANVAS_SPECS}}
- Use Tailwind CSS classes for styling
- You can use lucide-react icons

Generate a slide based on the user's request. Return only the code in the exact format shown above.`.trim();

/**
 * 根据画布比例获取系统提示词
 * 动态替换 {{CANVAS_SPECS}} 占位符为实际的画布尺寸
 * @param canvasRatio 画布比例（如 '16:9' 或 '4:3'）
 * @returns 包含具体画布规格的系统提示词
 */
export const getDefaultSystemPrompt = (canvasRatio: CanvasRatio): string => {
  const config = CANVAS_CONFIGS[canvasRatio] || CANVAS_CONFIGS['16:9'];
  const canvasSpecs = `- The slide should be ${config.width}x${config.height} pixels (${config.ratio} aspect ratio)
- The outer container must use w-[${config.width}px] h-[${config.height}px]
- IMPORTANT: You MUST use the exact canvas size specified above. Do NOT copy sizes from reference examples.
- Reference examples may use different canvas sizes - always adapt to the specified dimensions.`;
  return DEFAULT_SYSTEM_PROMPT.replace('{{CANVAS_SPECS}}', canvasSpecs);
};

/**
 * 提示词设置接口
 * 用于管理用户的提示词偏好配置
 */
export interface PromptSettings {
  /** 用户自定义的系统提示词 */
  customPrompt: string;
  /** 是否使用默认系统提示词，false 时使用 customPrompt */
  useDefaultPrompt: boolean;
  /** 用户附加指令，会追加到最终提示词末尾 */
  userInstructions: string;
}

/**
 * 默认提示词设置
 * 未配置时使用此默认值：启用默认提示词，无自定义内容
 */
export const DEFAULT_PROMPT_SETTINGS: PromptSettings = {
  customPrompt: '',
  useDefaultPrompt: true,
  userInstructions: '',
};

/**
 * 从 localStorage 加载提示词设置
 * 若加载失败或无缓存则返回默认设置
 * @returns 提示词设置对象
 */
export const loadPromptSettings = (): PromptSettings => {
  try {
    const stored = localStorage.getItem('prompt_settings');
    if (stored) {
      return { ...DEFAULT_PROMPT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load prompt settings:', e);
  }
  return DEFAULT_PROMPT_SETTINGS;
};

/**
 * 保存提示词设置到 localStorage
 * @param settings 要保存的提示词设置
 */
export const savePromptSettings = (settings: PromptSettings): void => {
  localStorage.setItem('prompt_settings', JSON.stringify(settings));
};

/**
 * 构建完整的提示词（旧版单字符串格式）
 * 将基础系统提示词、用户请求和附加指令组合成完整提示词
 * @param userInput 用户输入的幻灯片生成需求
 * @param settings 提示词设置（可选，默认使用 DEFAULT_PROMPT_SETTINGS）
 * @param canvasRatio 画布比例（可选，用于动态获取对应尺寸的系统提示词）
 * @returns 组合后的完整提示词字符串
 */
export const buildFullPrompt = (
  userInput: string,
  settings: PromptSettings = DEFAULT_PROMPT_SETTINGS,
  canvasRatio?: CanvasRatio
): string => {
  // 根据画布比例获取系统提示词，未提供则使用默认
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  // 根据设置选择使用默认或自定义基础提示词
  const basePrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  return `${basePrompt}

## User Request
${userInput}

${settings.userInstructions ? `\n## Additional Instructions\n${settings.userInstructions}` : ''}`;
};

/**
 * 构建带设计风格模板的提示词（旧版单字符串格式）
 * 在基础提示词中插入设计风格描述
 * @param userInput 用户输入的幻灯片生成需求
 * @param stylePrompt 设计风格描述文本
 * @param settings 提示词设置（可选，默认使用 DEFAULT_PROMPT_SETTINGS）
 * @param canvasRatio 画布比例（可选）
 * @returns 包含设计风格的完整提示词字符串
 */
export const buildStylePrompt = (
  userInput: string,
  stylePrompt: string,
  settings: PromptSettings = DEFAULT_PROMPT_SETTINGS,
  canvasRatio?: CanvasRatio
): string => {
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  const basePrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  return `${basePrompt}

## Design Style
${stylePrompt}

## User Request
${userInput}

${settings.userInstructions ? `\n## Additional Instructions\n${settings.userInstructions}` : ''}`;
};

/**
 * OpenAI 消息格式接口
 * 用于构建符合 OpenAI 兼容 API 的消息数组
 */
export interface PromptMessage {
  /** 消息角色：系统/用户/助手 */
  role: 'system' | 'user' | 'assistant';
  /** 消息内容 */
  content: string;
}

/**
 * 提示词组装选项
 * 用于控制提示词的组成部分，管理 token 预算
 */
export interface PromptAssemblyOptions {
  /** 是否包含工作流提示词（设计方法论），默认 true */
  includeWorkflow?: boolean;
  /** 是否包含参考示例代码，默认 true */
  includeReferences?: boolean;
  /** 参考示例最大数量，不限制则包含全部 */
  maxReferences?: number;
}

/**
 * 格式化参考示例为 Markdown 代码块
 * @param references 参考示例 JSX 代码数组
 * @returns 格式化后的 Markdown 字符串
 */
function formatReferences(references: string[]): string {
  return references
    .map((ref, i) => `### Example ${i + 1}\n\`\`\`jsx\n${ref}\n\`\`\``)
    .join('\n\n');
}

/**
 * 将样式提示词或 Bundle 统一规范化为 StylePromptBundle 对象
 * 支持向后兼容：接受纯字符串或完整 Bundle 对象
 * @param styleOrBundle 样式提示词字符串或 StylePromptBundle 对象
 * @returns 规范化后的 StylePromptBundle 对象
 */
function normalizeBundle(styleOrBundle?: string | StylePromptBundle): StylePromptBundle {
  if (!styleOrBundle) return { stylePrompt: '' };
  if (typeof styleOrBundle === 'string') return { stylePrompt: styleOrBundle };
  return styleOrBundle;
}

/**
 * 构建用于 OpenAI 兼容 API 的消息数组（支持对话历史）
 * 使用正确的系统角色，包含对话上下文，支持 StylePromptBundle
 *
 * 消息构建流程：
 * 1. 系统消息：基础提示词 + 工作流（可选）+ 参考示例（可选）
 * 2. 对话历史：最近 10 条消息，避免 token 溢出
 * 3. 用户消息：当前输入 + 设计要求 + 附加指令
 *
 * @param systemPrompt 系统提示词（兼容旧版参数，实际使用 settings 构建）
 * @param conversationHistory 对话历史数组，role 为 'user' | 'assistant' | 'ai'
 * @param currentUserInput 当前用户的输入内容
 * @param styleOrBundle 样式提示词字符串或 StylePromptBundle 对象（支持向后兼容）
 * @param settings 提示词设置（可选，默认使用 DEFAULT_PROMPT_SETTINGS）
 * @param canvasRatio 画布比例（可选）
 * @param assemblyOptions 提示词组装选项（可选）
 * @returns OpenAI 格式的消息数组
 */
export const buildMessages = (
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant' | 'ai'; content: string }>,
  currentUserInput: string,
  styleOrBundle?: string | StylePromptBundle,
  settings: PromptSettings = DEFAULT_PROMPT_SETTINGS,
  canvasRatio?: CanvasRatio,
  assemblyOptions?: PromptAssemblyOptions,
): PromptMessage[] => {
  // 获取基础系统提示词
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  const baseSystemPrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  // 规范化 Bundle，合并组装选项（默认包含工作流和参考示例）
  const bundle = normalizeBundle(styleOrBundle);
  const opts: PromptAssemblyOptions = {
    includeWorkflow: true,
    includeReferences: true,
    ...assemblyOptions,
  };

  // === 构建系统消息 ===
  let systemContent = baseSystemPrompt;

  // 可选：添加设计方法论（工作流）
  if (opts.includeWorkflow && bundle.workflowPrompt) {
    systemContent += `\n\n## Design Methodology\n${bundle.workflowPrompt}`;
  }

  // 可选：添加参考示例（few-shot 示例代码）
  if (opts.includeReferences && bundle.referenceExamples && bundle.referenceExamples.length > 0) {
    const refs = opts.maxReferences
      ? bundle.referenceExamples.slice(0, opts.maxReferences)
      : bundle.referenceExamples;
    systemContent += `\n\n## Reference Examples\n\nHere are example slides demonstrating the target quality and patterns:\n\n${formatReferences(refs)}`;
  }

  const messages: PromptMessage[] = [
    { role: 'system', content: systemContent },
  ];

  // === 添加对话历史（保留最近 10 条，避免 token 溢出）===
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    // 将 'ai' 角色统一转换为 'assistant'
    const role = msg.role === 'ai' ? 'assistant' : msg.role as 'user' | 'assistant';
    messages.push({ role, content: msg.content });
  }

  // === 构建用户消息 ===
  let userContent = currentUserInput;

  // 附加设计要求（来自 Bundle）
  if (bundle.stylePrompt) {
    userContent += `\n\n设计要求：\n${bundle.stylePrompt}`;
  }

  // 附加用户自定义指令
  if (settings.userInstructions) {
    userContent += `\n\n## Additional Instructions\n${settings.userInstructions}`;
  }

  messages.push({ role: 'user', content: userContent });

  return messages;
};

/**
 * 构建多页幻灯片生成的提示词
 * 用于批量生成多张幻灯片时，为每张幻灯片提供上下文信息
 *
 * @param userInput 用户输入的幻灯片生成需求
 * @param slideIndex 当前幻灯片索引（从 0 开始）
 * @param totalSlides 幻灯片总数
 * @param previousSlidesSummary 前面幻灯片的摘要，用于保持风格一致性
 * @param styleOrBundle 样式提示词字符串或 StylePromptBundle 对象
 * @param settings 提示词设置（可选，默认使用 DEFAULT_PROMPT_SETTINGS）
 * @param canvasRatio 画布比例（可选）
 * @param assemblyOptions 提示词组装选项（可选）
 * @returns 多页幻灯片提示词字符串
 */
export const buildMultiSlidePrompt = (
  userInput: string,
  slideIndex: number,
  totalSlides: number,
  previousSlidesSummary: string,
  styleOrBundle: string | StylePromptBundle,
  settings: PromptSettings = DEFAULT_PROMPT_SETTINGS,
  canvasRatio?: CanvasRatio,
  assemblyOptions?: PromptAssemblyOptions,
): string => {
  // 获取基础系统提示词
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  const basePrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  // 规范化 Bundle，合并组装选项
  const bundle = normalizeBundle(styleOrBundle);
  const opts: PromptAssemblyOptions = {
    includeWorkflow: true,
    includeReferences: true,
    ...assemblyOptions,
  };

  let promptContent = basePrompt;

  // 可选：添加设计方法论（工作流）
  if (opts.includeWorkflow && bundle.workflowPrompt) {
    promptContent += `\n\n## Design Methodology\n${bundle.workflowPrompt}`;
  }

  // 可选：添加参考示例
  if (opts.includeReferences && bundle.referenceExamples && bundle.referenceExamples.length > 0) {
    const refs = opts.maxReferences
      ? bundle.referenceExamples.slice(0, opts.maxReferences)
      : bundle.referenceExamples;
    promptContent += `\n\n## Reference Examples\n\nHere are example slides demonstrating the target quality and patterns:\n\n${formatReferences(refs)}`;
  }

  // 添加设计风格
  promptContent += `\n\n## Design Style
${bundle.stylePrompt}

## Multi-Slide Context
This is slide ${slideIndex + 1} of ${totalSlides} total slides.
${previousSlidesSummary ? `\n### Previous Slides Summary\n${previousSlidesSummary}` : ''}

## User Request
${userInput}

Generate ONLY this single slide (slide ${slideIndex + 1}). Do not generate other slides.
${settings.userInstructions ? `\n## Additional Instructions\n${settings.userInstructions}` : ''}`;

  return promptContent;
};
