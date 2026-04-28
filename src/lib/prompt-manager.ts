/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CanvasRatio, CANVAS_CONFIGS } from './canvas-config';

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
    <div className="w-[1280px] h-[720px] bg-white p-12 flex flex-col">
      <h1 className="text-6xl font-bold text-gray-900">Title</h1>
      <div className="mt-8 text-2xl text-gray-600">Content here</div>
    </div>
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
