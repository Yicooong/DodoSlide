/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, Component } from 'react';
import * as Babel from '@babel/standalone';
import * as LucideIcons from 'lucide-react';
import React from 'react';

/**
 * Error Boundary to catch runtime errors in rendered slides
 */
export class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error?.message || String(error) };
  }

  render() {
    if (this.state.hasError) {
      return <div className="text-red-500 font-mono p-4">渲染错误: {this.state.error}</div>;
    }
    return this.props.children;
  }
}

export const ErrorBoundaryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);

/**
 * Hook for transpiling and rendering slide code
 */
export const useSlideRenderer = (code: string) => {
  const [transpiledCode, setTranspiledCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Transpile JSX to JS
  useEffect(() => {
    try {
      const result = Babel.transform(code, {
        presets: ['react', ['env', { modules: 'commonjs' }]],
        filename: 'slide.tsx'
      }).code;

      if (result) {
        // Wrap transpiled code to handle CommonJS exports and mock require
        const wrappedCode = `
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
        setTranspiledCode(wrappedCode);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    }
  }, [code]);

  /**
   * Safe Rendering of User Component
   */
  const RenderedSlide = useCallback(() => {
    if (!transpiledCode) return null;
    try {
      // Create a function from the transpiled code
      const dependencies = {
        React,
        icons: LucideIcons
      };
      const renderFn = new Function('dependencies', transpiledCode);
      const Component = renderFn(dependencies);

      if (typeof Component !== 'function') {
         return <div className="text-red-500 font-mono p-4">Code must export a default component.</div>;
      }

      return <ErrorBoundaryWrapper><Component /></ErrorBoundaryWrapper>;
    } catch (err: any) {
      return <div className="text-red-500 font-mono p-4">Runtime Error: {err.message}</div>;
    }
  }, [transpiledCode]);

  return {
    transpiledCode,
    error,
    RenderedSlide,
  };
};
