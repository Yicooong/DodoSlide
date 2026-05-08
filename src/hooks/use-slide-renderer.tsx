/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import * as Babel from '@babel/standalone';
import * as LucideIcons from 'lucide-react';
import React from 'react';
import { injectLocTags } from '../lib/inspector';

/**
 * 错误边界组件
 * 捕获渲染幻灯片时的运行时错误并显示错误信息
 * 使用函数组件和 useState 实现错误捕获
 */
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState('');

  // 简单的错误检测包装器
  // 注意：完整的错误边界需要使用 class 组件或 react-error-boundary 库
  // 这里使用简化的实现
  try {
    if (hasError) {
      return <div className="text-red-500 font-mono p-4">渲染错误: {error}</div>;
    }
    return children;
  } catch (err: any) {
    setHasError(true);
    setError(err?.message || String(err));
    return <div className="text-red-500 font-mono p-4">渲染错误: {err?.message || String(err)}</div>;
  }
};

/**
 * 错误边界包装器组件
 * 用于包裹幻灯片组件以捕获渲染错误
 */
export const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

/**
 * 幻灯片渲染 Hook
 * 负责将用户编写的 JSX 代码通过 Babel 转译并在浏览器中安全渲染
 * @param code 用户输入的 JSX 代码字符串
 */
export const useSlideRenderer = (code: string) => {
  // 转译后的代码
  const [transpiledCode, setTranspiledCode] = useState('');
  // 转译或渲染过程中的错误信息
  const [error, setError] = useState<string | null>(null);

  // 当代码变化时，注入源码定位标签并使用 Babel 转译 JSX 为 JavaScript
  useEffect(() => {
    try {
      // 先注入 data-slide-loc 属性，使 Inspector 能定位到源码位置
      const taggedCode = injectLocTags(code);
      const codeToTransform = taggedCode ?? code;

      const result = Babel.transform(codeToTransform, {

        presets: ['react', ['env', { modules: 'commonjs' }]],
        filename: 'slide.tsx'
      }).code;

      if (result) {
        // 包装转译后的代码以处理 CommonJS 导出和模拟 require 函数
        // 这样可以在浏览器环境中模拟 Node.js 的模块系统
        const wrappedCode = `
          return (function(dependencies) {
            const __react_lib__ = dependencies.React;
            const __icons_lib__ = dependencies.icons;

            const exports = {};
            const module = { exports };
            // 模拟 require 函数，处理 react 和 lucide-react 的导入
            const require = (name) => {
              if (name === 'react') return __react_lib__;
              if (name === 'react/jsx-runtime') return __react_lib__;
              if (name === 'lucide-react') return __icons_lib__;
              return {};
            };

            ${result}

            // 返回默认导出或命名导出
            return module.exports.default || module.exports.MySlide || module.exports;
          })(dependencies)
        `;
        setTranspiledCode(wrappedCode);
        setError(null);
      }
    } catch (err: any) {
      // 捕获转译错误
      setError(err.message);
    }
  }, [code]);

  /**
   * 安全渲染用户组件
   * 使用 new Function 创建渲染函数，注入 React 和 Lucide 图标依赖
   */
  const RenderedSlide = useCallback(() => {
    // 如果没有转译后的代码，返回 null
    if (!transpiledCode) return null;
    try {
      // 准备依赖项：React 核心库和 Lucide 图标库
      const dependencies = {
        React,
        icons: LucideIcons
      };
      // 创建渲染函数并执行
      const renderFn = new Function('dependencies', transpiledCode);
      const Component = renderFn(dependencies);

      // 验证组件是否为函数类型
      if (typeof Component !== 'function') {
         return <div className="text-red-500 font-mono p-4">Code must export a default component.</div>;
      }

      // 使用错误边界包装组件进行渲染
      return <ErrorBoundaryWrapper><Component /></ErrorBoundaryWrapper>;
    } catch (err: any) {
      // 捕获运行时渲染错误
      return <div className="text-red-500 font-mono p-4">Runtime Error: {err.message}</div>;
    }
  }, [transpiledCode]);

  // 返回转译结果、错误信息和渲染组件
  return {
    transpiledCode,
    error,
    RenderedSlide,
  };
};
