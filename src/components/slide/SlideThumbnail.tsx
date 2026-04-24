/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import * as Babel from '@babel/standalone';
import * as LucideIcons from 'lucide-react';
import { CanvasRatio, getCanvasConfig } from '../../lib/canvas-config';
import { ErrorBoundaryWrapper } from '../../hooks/use-slide-renderer';

interface SlideThumbnailProps {
  code: string;
  isActive: boolean;
  canvasRatio: CanvasRatio;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ code, isActive, canvasRatio }) => {
  const [thumbnailContent, setThumbnailContent] = useState<React.ReactNode>(null);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);
  const config = getCanvasConfig(canvasRatio);

  useEffect(() => {
    try {
      const result = Babel.transform(code, {
        presets: ['react', ['env', { modules: 'commonjs' }]],
        filename: 'slide.tsx'
      }).code;

      if (result) {
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

        const dependencies = { React, icons: LucideIcons };
        const renderFn = new Function('dependencies', wrappedCode);
        const Component = renderFn(dependencies);

        if (typeof Component === 'function') {
          setThumbnailContent(<Component />);
          setHasError(false);
        }
      }
    } catch (err) {
      setHasError(true);
    }
  }, [code]);

  // Calculate scale based on container size - use ResizeObserver for accurate sizing
  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const newScale = Math.min(containerWidth / config.width, containerHeight / config.height);
        setScale(newScale);
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasRatio, config.width, config.height]);

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100">
        <span className="text-[8px] text-red-400">错误</span>
      </div>
    );
  }

  // Calculate scaled dimensions
  const scaledWidth = config.width * scale;
  const scaledHeight = config.height * scale;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative bg-white"
    >
      <div
        className="absolute top-0 left-0 overflow-hidden"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      >
        <div
          className="absolute top-0 left-0 origin-top-left"
          style={{
            transform: `scale(${scale})`,
            width: `${config.width}px`,
            height: `${config.height}px`,
          }}
        >
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
            <ErrorBoundaryWrapper>
              {thumbnailContent}
            </ErrorBoundaryWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};
