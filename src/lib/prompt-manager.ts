/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CanvasRatio, CANVAS_CONFIGS } from './canvas-config';
import type { StylePromptBundle } from '../prompts/templates/index';

/**
 * Default system prompt for slide generation
 * This prompt guides the AI to generate React JSX code for slides
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
- The slide should be 1280x720 pixels (16:9 aspect ratio)
- Use Tailwind CSS classes for styling
- You can use lucide-react icons

## Design Guidelines
- Use modern, clean design aesthetics
- Ensure good visual hierarchy
- Use appropriate spacing and typography
- Support Chinese characters with 'Microsoft YaHei' font

## Technical Constraints
- Use only React and lucide-react (pre-installed)
- Do not use external images or assets
- SVG icons from lucide-react are available
- All colors should be web-safe or use Tailwind's color palette

Generate a slide based on the user's request. Return only the code in the exact format shown above.`.trim();

/**
 * Get system prompt for slide generation based on canvas ratio.
 * Dynamically replaces width/height/ratio in the prompt to match the selected ratio.
 */
export const getDefaultSystemPrompt = (canvasRatio: CanvasRatio): string => {
  const config = CANVAS_CONFIGS[canvasRatio] || CANVAS_CONFIGS['16:9'];
  return DEFAULT_SYSTEM_PROMPT
    .replace('w-[1280px] h-[720px]', `w-[${config.width}px] h-[${config.height}px]`)
    .replace('1280x720 pixels (16:9 aspect ratio)', `${config.width}x${config.height} pixels (${config.ratio} aspect ratio)`);
};

/**
 * Prompt settings interface
 */
export interface PromptSettings {
  customPrompt: string;
  useDefaultPrompt: boolean;
  userInstructions: string;
}

/**
 * Default prompt settings
 */
export const DEFAULT_PROMPT_SETTINGS: PromptSettings = {
  customPrompt: '',
  useDefaultPrompt: true,
  userInstructions: '',
};

/**
 * Load prompt settings from localStorage
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
 * Save prompt settings to localStorage
 */
export const savePromptSettings = (settings: PromptSettings): void => {
  localStorage.setItem('prompt_settings', JSON.stringify(settings));
};

/**
 * Build the full prompt for AI request
 */
export const buildFullPrompt = (
  userInput: string,
  settings: PromptSettings = DEFAULT_PROMPT_SETTINGS,
  canvasRatio?: CanvasRatio
): string => {
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  const basePrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  return `${basePrompt}

## User Request
${userInput}

${settings.userInstructions ? `\n## Additional Instructions\n${settings.userInstructions}` : ''}`;
};

/**
 * Build prompt with style template applied
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

/** Message in OpenAI messages format */
export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Options for controlling prompt assembly (token budget, etc.) */
export interface PromptAssemblyOptions {
  includeWorkflow?: boolean;
  includeReferences?: boolean;
  maxReferences?: number;
}

function formatReferences(references: string[]): string {
  return references
    .map((ref, i) => `### Example ${i + 1}\n\`\`\`jsx\n${ref}\n\`\`\``)
    .join('\n\n');
}

/** Normalize styleOrBundle to a bundle object. */
function normalizeBundle(styleOrBundle?: string | StylePromptBundle): StylePromptBundle {
  if (!styleOrBundle) return { stylePrompt: '' };
  if (typeof styleOrBundle === 'string') return { stylePrompt: styleOrBundle };
  return styleOrBundle;
}

/**
 * Build messages array for OpenAI-compatible API with conversation history.
 * Uses proper system role and includes conversation context.
 *
 * The fourth parameter accepts either a plain style prompt string (backward compatible)
 * or a StylePromptBundle containing style, workflow, and reference examples.
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
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  const baseSystemPrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  const bundle = normalizeBundle(styleOrBundle);
  const opts: PromptAssemblyOptions = {
    includeWorkflow: true,
    includeReferences: true,
    ...assemblyOptions,
  };

  // Build system message: base + workflow + references
  let systemContent = baseSystemPrompt;
  if (opts.includeWorkflow && bundle.workflowPrompt) {
    systemContent += `\n\n## Design Methodology\n${bundle.workflowPrompt}`;
  }
  if (opts.includeReferences && bundle.referenceExamples && bundle.referenceExamples.length > 0) {
    const refs = opts.maxReferences
      ? bundle.referenceExamples.slice(0, opts.maxReferences)
      : bundle.referenceExamples;
    systemContent += `\n\n## Reference Examples\n\nHere are example slides demonstrating the target quality and patterns:\n\n${formatReferences(refs)}`;
  }

  const messages: PromptMessage[] = [
    { role: 'system', content: systemContent },
  ];

  // Add conversation history (last 10 messages to avoid token overflow)
  const recentHistory = conversationHistory.slice(-10);
  for (const msg of recentHistory) {
    const role = msg.role === 'ai' ? 'assistant' : msg.role as 'user' | 'assistant';
    messages.push({ role, content: msg.content });
  }

  // Build user message with optional style and instructions
  let userContent = currentUserInput;
  if (bundle.stylePrompt) {
    userContent += `\n\n设计要求：\n${bundle.stylePrompt}`;
  }
  if (settings.userInstructions) {
    userContent += `\n\n## Additional Instructions\n${settings.userInstructions}`;
  }
  messages.push({ role: 'user', content: userContent });

  return messages;
};

/**
 * Build prompt for multi-slide generation
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
  const defaultPrompt = canvasRatio ? getDefaultSystemPrompt(canvasRatio) : DEFAULT_SYSTEM_PROMPT;
  const basePrompt = settings.useDefaultPrompt
    ? defaultPrompt
    : settings.customPrompt || defaultPrompt;

  const bundle = normalizeBundle(styleOrBundle);
  const opts: PromptAssemblyOptions = {
    includeWorkflow: true,
    includeReferences: true,
    ...assemblyOptions,
  };

  let promptContent = basePrompt;

  if (opts.includeWorkflow && bundle.workflowPrompt) {
    promptContent += `\n\n## Design Methodology\n${bundle.workflowPrompt}`;
  }
  if (opts.includeReferences && bundle.referenceExamples && bundle.referenceExamples.length > 0) {
    const refs = opts.maxReferences
      ? bundle.referenceExamples.slice(0, opts.maxReferences)
      : bundle.referenceExamples;
    promptContent += `\n\n## Reference Examples\n\nHere are example slides demonstrating the target quality and patterns:\n\n${formatReferences(refs)}`;
  }

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
