/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// 导入 motion 动画库：用于弹窗进出场动画
import { motion } from 'motion/react';
// 导入图标：Download(下载)、Loader2(加载中)
import { Download, Loader2 } from 'lucide-react';
// 导入 cn 工具函数：合并 Tailwind 类名
import { cn } from '../../lib/utils';

/** 导出模式类型：all(全部)、current(当前)、range(指定范围) */
export type ExportMode = 'all' | 'current' | 'range';

/** 导出弹窗组件属性接口 */
interface ExportModalProps {
  isOpen: boolean;                     // 是否显示弹窗
  onClose: () => void;                 // 关闭弹窗回调
  isExporting: boolean;                // 是否正在导出
  exportMode: ExportMode;              // 当前导出模式
  setExportMode: (mode: ExportMode) => void;  // 设置导出模式
  exportRangeStart: number;            // 范围导出起始页
  setExportRangeStart: (value: number) => void;  // 设置起始页
  exportRangeEnd: number;              // 范围导出结束页
  setExportRangeEnd: (value: number) => void;  // 设置结束页
  exportSpecificPage: number;          // 指定导出页码
  setExportSpecificPage: (value: number) => void;  // 设置指定页码
  currentSlideIndex: number;           // 当前幻灯片索引
  totalSlides: number;                 // 幻灯片总数
  currentSlideName: string;            // 当前幻灯片名称
  onExport: () => void;                // 确认导出回调
}

/**
 * 导出弹窗组件
 * 功能：
 * - 提供三种导出模式：全部导出、当前幻灯片、指定范围
 * - 范围模式支持输入起始页和结束页
 * - 当前模式支持指定任意页码
 * - 导出过程中显示加载状态
 * - 使用 Framer Motion 实现弹窗动画
 */
export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  isExporting,
  exportMode,
  setExportMode,
  exportRangeStart,
  setExportRangeStart,
  exportRangeEnd,
  setExportRangeEnd,
  exportSpecificPage,
  setExportSpecificPage,
  currentSlideIndex,
  totalSlides,
  currentSlideName,
  onExport,
}) => {
  // 未打开时不渲染
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* 弹窗主体：使用 motion 实现缩放淡入动画 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden"
        style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-subtle)' }}
      >
        {/* 弹窗头部：标题和关闭按钮 */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Download size={20} style={{ color: 'var(--accent)' }} />
            导出 PPTX
          </h3>
          <button
            onClick={onClose}
            className="transition-all active:scale-90"
            style={{ color: 'var(--text-muted)' }}
          >
            {/* 关闭图标：X 形 SVG */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* 弹窗主体：导出模式选择 */}
        <div className="px-6 py-5 space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>导出范围</label>

            {/* 选项 1：全部导出 */}
            <label className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              exportMode === 'all' ? "" : "hover:opacity-80"
            )}
            style={{
              background: exportMode === 'all' ? 'var(--accent-bg)' : 'var(--bg-card)',
              borderColor: exportMode === 'all' ? 'var(--border-active)' : 'var(--border-default)'
            }}>
              <input
                type="radio"
                name="exportMode"
                value="all"
                checked={exportMode === 'all'}
                onChange={(e) => setExportMode(e.target.value as ExportMode)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>全部导出</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>导出所有 {totalSlides} 张幻灯片</div>
              </div>
            </label>

            {/* 选项 2：导出当前幻灯片 */}
            <label className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              exportMode === 'current' ? "" : "hover:opacity-80"
            )}
            style={{
              background: exportMode === 'current' ? 'var(--accent-bg)' : 'var(--bg-card)',
              borderColor: exportMode === 'current' ? 'var(--border-active)' : 'var(--border-default)'
            }}>
              <input
                type="radio"
                name="exportMode"
                value="current"
                checked={exportMode === 'current'}
                onChange={(e) => setExportMode(e.target.value as ExportMode)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>导出当前幻灯片</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>仅导出第 {currentSlideIndex + 1} 张: {currentSlideName}</div>
              </div>
            </label>

            {/* 选项 3：导出指定范围 */}
            <label className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              exportMode === 'range' ? "" : "hover:opacity-80"
            )}
            style={{
              background: exportMode === 'range' ? 'var(--accent-bg)' : 'var(--bg-card)',
              borderColor: exportMode === 'range' ? 'var(--border-active)' : 'var(--border-default)'
            }}>
              <input
                type="radio"
                name="exportMode"
                value="range"
                checked={exportMode === 'range'}
                onChange={(e) => setExportMode(e.target.value as ExportMode)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--accent)' }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>导出指定范围</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>导出连续的多个幻灯片</div>
              </div>
            </label>

            {/* 范围输入框：仅在 range 模式下显示 */}
            {exportMode === 'range' && (
              <div className="flex items-center gap-3 pl-7 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>从</span>
                  <input
                    type="number"
                    min={1}
                    max={totalSlides}
                    value={exportRangeStart}
                    onChange={(e) => {
                      // 解析输入值并限制在有效范围内
                      const val = parseInt(e.target.value) || 1;
                      setExportRangeStart(Math.max(1, Math.min(val, totalSlides)));
                    }}
                    className="w-16 px-2 py-1.5 rounded-lg text-sm text-center"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>到</span>
                  <input
                    type="number"
                    min={1}
                    max={totalSlides}
                    value={exportRangeEnd}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setExportRangeEnd(Math.max(1, Math.min(val, totalSlides)));
                    }}
                    className="w-16 px-2 py-1.5 rounded-lg text-sm text-center"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>共 {totalSlides} 页</span>
              </div>
            )}

            {/* 指定页码输入框：仅在 current 模式下显示 */}
            {exportMode === 'current' && (
              <div className="flex items-center gap-3 pl-7 mt-2">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>指定页码:</span>
                <input
                  type="number"
                  min={1}
                  max={totalSlides}
                  value={exportSpecificPage}
                  onChange={(e) => {
                    // 解析输入值并限制在有效范围内
                    const val = parseInt(e.target.value) || 1;
                    setExportSpecificPage(Math.max(1, Math.min(val, totalSlides)));
                  }}
                    className="w-16 px-2 py-1.5 rounded-lg text-sm text-center"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  />
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {totalSlides}</span>
              </div>
            )}
          </div>
        </div>

        {/* 弹窗底部按钮区 */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
          {/* 取消按钮 */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 whitespace-nowrap"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-button)' }}
          >
            取消
          </button>
          {/* 确认导出按钮：导出中时禁用，range 模式下起始页大于结束页时禁用 */}
          <button
            onClick={onExport}
            disabled={isExporting || (exportMode === 'range' && exportRangeStart > exportRangeEnd)}
            className="px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:brightness-110 whitespace-nowrap"
            style={{ background: 'var(--accent)' }}
          >
            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {isExporting ? '导出中...' : '确认导出'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
