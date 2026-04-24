/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { CanvasConfig } from '../../lib/canvas-config';

interface SlidePreviewProps {
  canvasConfig: CanvasConfig;
  scale: number;
  error: string | null;
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  previewRef: React.RefObject<HTMLDivElement>;
  onScaleChange: (scale: number) => void;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  canvasConfig,
  scale,
  error,
  children,
  containerRef,
  previewRef,
  onScaleChange,
}) => {
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onScaleChange(entry.contentRect.width / canvasConfig.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasConfig, containerRef, onScaleChange]);

  return (
    <div className="flex-grow flex items-center justify-center p-12 overflow-hidden">
      <div
        ref={containerRef}
        className="bg-white rounded-sm overflow-hidden relative"
        style={{
          width: '100%',
          maxWidth: canvasConfig.ratio === '16:9' ? '1100px' : '900px',
          aspectRatio: canvasConfig.ratio === '16:9' ? '16/9' : '4/3',
          boxShadow: 'var(--shadow-preview)'
        }}
      >
        <div
          ref={previewRef}
          className="origin-top-left overflow-hidden bg-white selection:bg-indigo-100"
          style={{
            width: `${canvasConfig.width}px`,
            height: `${canvasConfig.height}px`,
            transform: `scale(${scale})`
          }}
        >
          <div
            className="logical-slide-root relative overflow-hidden"
            style={{
              width: `${canvasConfig.width}px`,
              height: `${canvasConfig.height}px`,
              // @ts-ignore
              '--vh': `${canvasConfig.height / 100}px`,
              '--vw': `${canvasConfig.width / 100}px`,
            }}
          >
            <style>{`
              .logical-slide-root * {
                box-sizing: border-box;
              }
              .logical-slide-root .min-h-screen,
              .logical-slide-root .h-screen {
                min-height: ${canvasConfig.height}px !important;
                height: ${canvasConfig.height}px !important;
              }
              .logical-slide-root .min-w-screen,
              .logical-slide-root .w-screen {
                min-width: ${canvasConfig.width}px !important;
                width: ${canvasConfig.width}px !important;
              }
            `}</style>
            {children}
          </div>
        </div>
      </div>

      {/* Error Overlay */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] backdrop-blur-md border p-4 rounded-xl shadow-2xl font-mono text-xs z-50"
            style={{
              background: 'rgba(127, 29, 29, 0.9)',
              borderColor: 'rgba(127, 29, 29, 0.5)',
              color: '#fecaca'
            }}
          >
            <div className="font-bold flex items-center gap-2 mb-2" style={{ color: '#f87171' }}>
              <AlertCircle size={14} /> 代码解析错误
            </div>
            <div className="opacity-80 leading-relaxed">{error}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
