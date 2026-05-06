/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * AI 响应代码提取模块
 *
 * 功能说明：
 * 从 AI 生成的响应文本中提取 JSX 代码。
 * AI 的响应可能包含：
 * - Markdown 代码块（```jsx ... ```）
 * - 直接的 JSX/JavaScript 代码
 * - 混合的文本和代码
 *
 * 提取策略（按优先级）：
 * 1. 查找 Markdown 代码块（支持 jsx、tsx、javascript 或无语言标记）
 * 2. 查找包含 export default function 的完整函数
 * 3. 查找任何可能是 React 组件的函数
 * 4. 逐行扫描，提取看起来像代码的行
 *
 * 正则表达式说明：
 * - /```(?:jsx|tsx|javascript)?\n?([\s\S]*?)```/
 *   匹配 Markdown 代码块，捕获代码内容（非贪婪模式）
 * - /export\s+default\s+function\s+(\w+)\s*\([\s\S]*?\{[\s\S]*?\}/
 *   匹配 export default function 形式的 React 组件
 * - /function\s+\w+\s*\([\s\S]*?\}\s*$/m
 *   匹配任何函数定义（多行匹配）
 */

/**
 * 从 AI 响应文本中提取 JSX 代码
 *
 * @param text AI 生成的响应文本
 * @returns 提取的 JSX 代码字符串，未找到则返回 null
 *
 * 提取流程：
 * 1. 空值检查：如果 text 为空，直接返回 null
 * 2. 策略一：查找 Markdown 代码块
 *    - 匹配 ```jsx、```tsx、```javascript 或 ``` 开头的代码块
 *    - 提取代码块内容并 trim
 * 3. 策略二：查找 export default 函数
 *    - 如果响应包含 export default function 形式的组件
 *    - 返回整个响应文本（假设整段都是代码）
 * 4. 策略三：查找函数定义
 *    - 匹配 function 关键字开头的函数
 *    - 返回整个响应文本
 * 5. 策略四：逐行扫描
 *    - 处理可能未正确闭合的代码块标记
 *    - 提取包含代码特征（export default、function、箭头函数）的行
 *    - 也提取在代码块标记内的行
 * 6. 如果所有策略都失败，返回 null
 */
export const extractCodeFromResponse = (text: string): string | null => {
  if (!text) return null;

  // ========== 策略一：查找 Markdown 代码块 ==========
  // 正则表达式说明：
  // ```           - 代码块开始标记
  // (?:jsx|tsx|javascript)? - 可选的语言标记（非捕获组）
  // \n?           - 可选换行符
  // ([\s\S]*?)    - 捕获代码内容（非贪婪模式，匹配到第一个 ``` 停止）
  // ```           - 代码块结束标记
  const codeBlockMatch = text.match(/```(?:jsx|tsx|javascript)?\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // ========== 策略二：查找 export default 函数 ==========
  // 正则表达式说明：
  // export\s+default\s+function - 匹配 export default function
  // \s+(\w+)\s*\(              - 函数名和参数开始
  // [\s\S]*?\{                 - 函数体开始（非贪婪）
  // [\s\S]*?\}                 - 函数体结束（非贪婪）
  // 注意：这个正则可能匹配不完整，但在实际应用中通常足够
  const exportMatch = text.match(/export\s+default\s+function\s+(\w+)\s*\([\s\S]*?\{[\s\S]*?\}/);
  if (exportMatch) {
    // 如果找到 export default function，认为整个文本都是代码
    return text;
  }

  // ========== 策略三：查找任何可能是 React 组件的函数 ==========
  // 正则表达式说明：
  // function\s+\w+ - 匹配 function 关键字和函数名
  // \s*\([\s\S]*?\}\s*$ - 函数体直到文本末尾（多行模式）
  // m 标志：多行模式，^ 和 $ 匹配每一行
  const functionMatch = text.match(/function\s+\w+\s*\([\s\S]*?\}\s*$/m);
  if (functionMatch) {
    // 如果找到函数定义，认为整个文本都是代码
    return text;
  }

  // ========== 策略四：逐行扫描（处理未正确格式化的响应） ==========
  // 如果前面的策略都失败，尝试逐行扫描
  // 处理场景：代码块标记未正确闭合
  const lines = text.split('\n');
  const codeLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    // 检测代码块标记（开始或结束）
    if (line.includes('```')) {
      inCodeBlock = !inCodeBlock;
      continue; // 跳过代码块标记行
    }

    // 收集代码行：
    // 1. 在代码块内的行
    // 2. 包含 'export default' 的行（React 组件导出）
    // 3. 包含 'function' 的行（函数定义）
    // 4. 包含 'const' + '=' + '=>' 的行（箭头函数组件）
    if (
      inCodeBlock ||
      line.includes('export default') ||
      line.includes('function') ||
      (line.includes('const ') && line.includes('=') && line.includes('=>'))
    ) {
      codeLines.push(line);
    }
  }

  // 如果收集到代码行，返回合并后的代码
  if (codeLines.length > 0) {
    return codeLines.join('\n');
  }

  // 所有策略都失败，返回 null
  return null;
};
