/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// 导入 Monaco Editor React 包装组件
import Editor from '@monaco-editor/react';

/** 代码编辑器组件属性接口 */
interface CodeEditorProps {
  code: string;                    // 编辑器中的代码内容
  onChange: (value: string) => void;  // 代码变更回调函数
  monacoTheme: string;             // Monaco 编辑器主题（如 'vs' 或 'vs-dark'）
}

/**
 * 代码编辑器组件
 * 功能：
 * - 基于 Monaco Editor（VS Code 核心）提供代码编辑能力
 * - 支持 JavaScript/JSX 语法高亮
 * - 支持主题切换（浅色/深色）
 * - 自动布局适配容器大小
 *
 * 编辑器配置说明：
 * - fontSize: 14 - 字体大小
 * - minimap: 禁用缩略图，节省空间
 * - scrollBeyondLastLine: 禁止滚动到最后一行之外
 * - lineNumbers: 显示行号
 * - roundedSelection: 禁用圆角选择效果
 * - padding: 顶部内边距 20px
 * - fontFamily: 使用 JetBrains Mono 等宽字体
 * - automaticLayout: 自动调整大小以适应容器
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, monacoTheme }) => {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="javascript"  // 默认语言为 JavaScript（兼容 JSX）
        value={code}                   // 编辑器内容
        onChange={(value) => onChange(value || '')}  // 内容变更回调
        theme={monacoTheme}            // 主题：由父组件传入
        options={{
          fontSize: 14,                // 字体大小
          minimap: { enabled: false }, // 禁用右侧代码缩略图
          scrollBeyondLastLine: false, // 不允许滚动到最后一行之外
          lineNumbers: 'on',           // 显示行号
          roundedSelection: false,     // 选区不使用圆角
          padding: { top: 20 },        // 顶部内边距
          fontFamily: 'JetBrains Mono', // 使用等宽字体
          automaticLayout: true,       // 自动适配容器大小变化
        }}
      />
    </div>
  );
};
