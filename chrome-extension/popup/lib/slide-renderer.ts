/**
 * JSX transpilation and slide code execution.
 * Extracted from src/hooks/use-slide-renderer.tsx — standalone functions, no React hooks.
 */

import * as Babel from '@babel/standalone';
import * as LucideIcons from 'lucide-react';
import React from 'react';

/**
 * Transpile JSX code string to executable JavaScript (CommonJS wrapped).
 * Throws on syntax errors.
 */
export function transpileCode(code: string): string {
  const result = Babel.transform(code, {
    presets: ['react', ['env', { modules: 'commonjs' }]],
    filename: 'slide.tsx',
  }).code;

  if (!result) {
    throw new Error('Babel 转译返回空结果');
  }

  return `
    return (function(dependencies) {
      const __react_lib__ = dependencies.React;
      const __icons_lib__ = dependencies.icons;

      const exports = {};
      const module = { exports };
      const require = (name) => {
        if (name === 'react') return __react_lib__;
        if (name === 'react/jsx-runtime') return __react_lib__;
        if (name === 'lucide-react') return __icons_lib__;
        return {};
      };

      ${result}

      return module.exports.default || module.exports.MySlide || module.exports;
    })(dependencies)
  `;
}

/**
 * Execute transpiled code and return a React component.
 * Throws on runtime errors.
 */
export function executeSlideCode(wrappedCode: string): React.ComponentType {
  const dependencies = { React, icons: LucideIcons };
  const renderFn = new Function('dependencies', wrappedCode);
  const Component = renderFn(dependencies);

  if (typeof Component !== 'function') {
    throw new Error('代码必须导出一个默认组件 (export default function MySlide() {...})');
  }

  return Component;
}

/**
 * Simple ErrorBoundary for catching rendering errors in the offscreen DOM.
 */
export class SlideErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }

  render() {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: { color: 'red', fontFamily: 'monospace', padding: 16 },
      }, `渲染错误: ${this.state.error}`);
    }
    return this.props.children;
  }
}
