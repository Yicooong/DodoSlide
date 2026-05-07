/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
// 导入 Babel 用于在浏览器中实时转译 JSX 代码
import * as Babel from '@babel/standalone';
// 导入所有 lucide-react 图标，作为转译后代码的依赖注入
import * as LucideIcons from 'lucide-react';
// 导入画布比例类型和配置获取函数
import { CanvasRatio, getCanvasConfig } from '../../lib/canvas-config';
// 导入错误边界包装组件：防止幻灯片代码错误导致整个应用崩溃
import { ErrorBoundaryWrapper } from '../../hooks/use-slide-renderer';

/** 幻灯片缩略图组件属性接口 */
interface SlideThumbnailProps {
  code: string;              // 幻灯片的 JSX 代码
  isActive: boolean;         // 是否为当前活跃的幻灯片
  canvasRatio: CanvasRatio;  // 画布比例
}

/**
 * 幻灯片缩略图组件
 * 功能：
 * - 使用 Babel 在浏览器中转译 JSX 代码
 * - 通过 Function 构造器创建沙箱环境执行转译后的代码
 * - 注入 React 和 lucide-react 作为依赖
 * - 使用 ResizeObserver 自动计算缩放比例
 * - 错误处理：代码解析失败时显示错误提示
 *
 * 转译流程：
 * 1. Babel.transform 将 JSX 代码转为 JavaScript
 * 2. 包装为自执行函数，注入依赖（React、lucide-react）
 * 3. 使用 Function 构造器创建可执行函数
 * 4. 执行函数获取 React 组件
 * 5. 渲染组件为缩略图
 */
export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ code, isActive, canvasRatio }) => {
  // 渲染后的缩略图内容
  const [thumbnailContent, setThumbnailContent] = useState<React.ReactNode>(null);
  // 是否有解析错误
  const [hasError, setHasError] = useState(false);
  // 容器引用：用于计算缩放比例
  const containerRef = useRef<HTMLDivElement>(null);
  // 当前缩放比例
  const [scale, setScale] = useState(0.15);
  // 获取画布配置
  const config = getCanvasConfig(canvasRatio);

  // 使用 Babel 转译 JSX 代码并渲染为 React 组件
  useEffect(() => {
    try {
      // 将 JSX 代码转译为 JavaScript
      const result = Babel.transform(code, {
        presets: ['react', ['env', { modules: 'commonjs' }]],
        filename: 'slide.tsx'
      }).code;

      if (result) {
        // 包装为自执行函数，注入 React 和 lucide-react 依赖
        const wrappedCode = `
          return (function(dependencies) {
            const __react_lib__ = dependencies.React;
            const __icons_lib__ = dependencies.icons;

            const exports = {};
            const module = { exports };
            // 自定义 require 函数：拦截模块导入
            const require = (name) => {
              if (name === 'react') return __react_lib__;
              if (name === 'react/jsx-runtime') return __react_lib__;
              if (name === 'lucide-react') return __icons_lib__;
              return {};
            };

            ${result}

            // 返回导出的组件（支持 default 导出或 MySlide 导出）
            return module.exports.default || module.exports.MySlide || module.exports;
          })(dependencies)
        `;

        // 注入依赖并执行
        const dependencies = { React, icons: LucideIcons };
        const renderFn = new Function('dependencies', wrappedCode);
        const Component = renderFn(dependencies);

        // 如果是函数组件，则渲染
        if (typeof Component === 'function') {
          setThumbnailContent(<Component />);
          setHasError(false);
        }
      }
    } catch (err) {
      // 转译或执行出错
      setHasError(true);
    }
  }, [code]);

  // 使用 ResizeObserver 自动计算缩放比例，使幻灯片适配缩略图容器
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        // 缩放比例取宽高中较小的比例，确保完整显示
        const newScale = Math.min(containerWidth / config.width, containerHeight / config.height);
        setScale(newScale);
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();  // 组件卸载时清理
  }, [canvasRatio, config.width, config.height]);

  // 错误状态：显示简单的错误提示
  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <span className="text-[8px] text-red-400">错误</span>
      </div>
    );
  }

  // 计算缩放后的尺寸
  const scaledWidth = config.width * scale;
  const scaledHeight = config.height * scale;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-white"
    >
      {/* 外层容器：限制缩略图显示区域 */}
      <div
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        {/* 缩放的幻灯片内容 */}
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `scale(${scale})`,
            width: `${config.width}px`,
            height: `${config.height}px`,
          }}
        >
          {/* 幻灯片根容器：提供 CSS 变量和 Tailwind 覆盖 */}
          <div
            className="logical-slide-root relative overflow-hidden bg-white"
            style={{
              width: `${config.width}px`,
              height: `${config.height}px`,
              // @ts-ignore
              '--vh': `${config.height / 100}px`,
              '--vw': `${config.width / 100}px`,
            }}
          >
            {/* 覆盖 Tailwind 的 screen 相关类 */}
            <style>{`
              .logical-slide-root * {
                box-sizing: border-box;
              }
              .logical-slide-root .min-h-screen,
              .logical-slide-root .h-screen {
                min-height: ${config.height}px !important;
                height: ${config.height}px !important;
              }
              .logical-slide-root .min-w-screen,
              .logical-slide-root .w-screen {
                min-width: ${config.width}px !important;
                width: ${config.width}px !important;
              }
            `}</style>
            {/* 使用错误边界包装：防止渲染错误导致崩溃 */}
            <ErrorBoundaryWrapper>
              {thumbnailContent}
            </ErrorBoundaryWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};
