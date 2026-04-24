/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ExportMode = 'all' | 'current' | 'range';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  exportMode: ExportMode;
  setExportMode: (mode: ExportMode) => void;
  exportRangeStart: number;
  setExportRangeStart: (value: number) => void;
  exportRangeEnd: number;
  setExportRangeEnd: (value: number) => void;
  exportSpecificPage: number;
  setExportSpecificPage: (value: number) => void;
  currentSlideIndex: number;
  totalSlides: number;
  currentSlideName: string;
  onExport: () => void;
}

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="rounded-xl shadow-2xl w-[480px] max-w-[90vw] overflow-hidden"
        style={{ background: 'var(--bg-modal)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Download size={20} style={{ color: 'var(--accent)' }} />
            导出 PPTX
          </h3>
          <button
            onClick={onClose}
            className="transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Export Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>导出范围</label>

            {/* Option 1: Export All */}
            <label className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              exportMode === 'all'
                ? ""
                : ""
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

            {/* Option 2: Export Current */}
            <label className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              exportMode === 'current'
                ? ""
                : ""
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

            {/* Option 3: Export Range */}
            <label className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              exportMode === 'range'
                ? ""
                : ""
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

            {/* Range Input Fields */}
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
                      const val = parseInt(e.target.value) || 1;
                      setExportRangeStart(Math.max(1, Math.min(val, totalSlides)));
                    }}
                    className="w-16 px-2 py-1.5 rounded text-sm text-center focus:outline-none"
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
                    className="w-16 px-2 py-1.5 rounded text-sm text-center focus:outline-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                  />
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>共 {totalSlides} 页</span>
              </div>
            )}

            {/* Specific Page Input */}
            {exportMode === 'current' && (
              <div className="flex items-center gap-3 pl-7 mt-2">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>指定页码:</span>
                <input
                  type="number"
                  min={1}
                  max={totalSlides}
                  value={exportSpecificPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setExportSpecificPage(Math.max(1, Math.min(val, totalSlides)));
                  }}
                  className="w-16 px-2 py-1.5 rounded text-sm text-center focus:outline-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                />
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {totalSlides}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 flex justify-end gap-3" style={{ borderColor: 'var(--border-subtle)', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--text-secondary)', background: 'var(--bg-button)' }}
          >
            取消
          </button>
          <button
            onClick={onExport}
            disabled={isExporting || (exportMode === 'range' && exportRangeStart > exportRangeEnd)}
            className="px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
