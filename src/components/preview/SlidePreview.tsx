/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
// 导入动画组件：AnimatePresence(进出场动画容器)、motion(动画元素)
import { AnimatePresence, motion } from 'motion/react';
// 导入警告图标
import { AlertCircle } from 'lucide-react';
// 导入画布配置类型
import { CanvasConfig } from '../../lib/canvas-config';

/** 幻灯片预览组件属性接口 */
interface SlidePreviewProps {
  canvasConfig: CanvasConfig;                        // 画布配置（宽高、比例等）
  scale: number;                                     // 当前缩放比例
  error: string | null;                              // 错误信息
  children: React.ReactNode;                         // 幻灯片渲染内容
  containerRef: React.RefObject<HTMLDivElement>;     // 容器 DOM 引用
  previewRef: React.RefObject<HTMLDivElement>;       // 预览区域 DOM 引用
  onScaleChange: (scale: number) => void;            // 缩放比例变化回调
}

/**
 * 幻灯片预览组件
 * 功能：
 * - 使用 ResizeObserver 自动计算最佳缩放比例
 * - 通过 CSS transform 缩放幻灯片以适配容器
 * - 提供 CSS 变量（--vh、--vw）供幻灯片内容使用
 * - 覆盖 Tailwind 的 screen 相关类，确保尺寸正确
 * - 使用动画显示代码解析错误
 *
 * 缩放原理：
 * 1. ResizeObserver 监听容器宽度变化
 * 2. 计算 scale = 容器宽度 / 画布宽度
 * 3. 使用 transform: scale() 进行 GPU 加速缩放
 * 4. transformOrigin 设为 top-left 确保从左上角缩放
 */
export const SlidePreview: React.FC<SlidePreviewProps> = ({
  canvasConfig,
  scale,
  error,
  children,
  containerRef,
  previewRef,
  onScaleChange,
}) => {
  // 使用 ResizeObserver 自动计算缩放比例
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 缩放比例 = 容器实际宽度 / 画布原始宽度
        onScaleChange(entry.contentRect.width / canvasConfig.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();  // 组件卸载时清理 observer
  }, [canvasConfig, containerRef, onScaleChange]);

  return (
    <div className="flex-grow flex items-center justify-center p-12 overflow-hidden">
      {/* 幻灯片外层容器：自适应宽度，保持画布比例 */}
      <div
        ref={containerRef}
        className="bg-white rounded-sm overflow-hidden relative"
        style={{
          width: '100%',
          // 根据画布比例设置最大宽度
          maxWidth: canvasConfig.ratio === '16:9' ? '1100px' : '900px',
          // 使用 aspect-ratio 保持固定宽高比
          aspectRatio: canvasConfig.ratio === '16:9' ? '16/9' : '4/3',
          boxShadow: 'var(--shadow-preview)'
        }}
      >
        {/* 缩放变换层：使用 transform 进行 GPU 加速缩放 */}
        <div
          ref={previewRef}
          className="origin-top-left overflow-hidden bg-white selection:bg-indigo-100"
          style={{
            width: `${canvasConfig.width}px`,
            height: `${canvasConfig.height}px`,
            transform: `scale(${scale})`
          }}
        >
          {/* 幻灯片根容器：提供 CSS 变量和 Tailwind 覆盖 */}
          <div
            className="logical-slide-root relative overflow-hidden"
            style={{
              width: `${canvasConfig.width}px`,
              height: `${canvasConfig.height}px`,
              // @ts-ignore
              // 定义 CSS 变量：1vh 和 1vw 对应的像素值
              '--vh': `${canvasConfig.height / 100}px`,
              '--vw': `${canvasConfig.width / 100}px`,
            }}
          >
            {/* 覆盖 Tailwind 的 screen 相关类，使其使用画布的实际尺寸 */}
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
            {/* 渲染的幻灯片内容 */}
            {children}
          </div>
        </div>
      </div>

      {/* 错误覆盖层：使用 AnimatePresence 实现滑入/滑出动画 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}  // 从下方 20px 处淡入
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}     // 向下方 20px 处淡出
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
