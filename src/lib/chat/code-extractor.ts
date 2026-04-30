/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extract JSX code from AI response text.
 * Uses multiple fallback strategies to find code blocks.
 */
export const extractCodeFromResponse = (text: string): string | null => {
  if (!text) return null;

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
    if (
      inCodeBlock ||
      line.includes('export default') ||
      line.includes('function') ||
      (line.includes('const ') && line.includes('=') && line.includes('=>'))
    ) {
      codeLines.push(line);
    }
  }

  if (codeLines.length > 0) {
    return codeLines.join('\n');
  }

  return null;
};
