/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CanvasRatio } from '../../lib/canvas-config';
import { Slide } from '../../hooks/use-slides';
import { SlideThumbnail } from './SlideThumbnail';

interface SlideSidebarProps {
  slides: Slide[];
  currentSlideIndex: number;
  canvasRatio: CanvasRatio;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectSlide: (index: number) => void;
  onAddSlide: () => void;
  onDeleteSlide: (index: number) => void;
  onRenameSlide: (index: number, newName: string) => void;
  onDuplicateSlide: (index: number) => void;
}

export const SlideSidebar: React.FC<SlideSidebarProps> = ({
  slides,
  currentSlideIndex,
  canvasRatio,
  collapsed,
  onToggleCollapse,
  onSelectSlide,
  onAddSlide,
  onDeleteSlide,
  onRenameSlide,
  onDuplicateSlide,
}) => {
  const [editingSlideName, setEditingSlideName] = useState<string | null>(null);

  return (
    <div className={`${collapsed ? 'w-12' : 'w-64'} border-r flex flex-col transition-all duration-300`} style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-subtle)' }}>
      {/* Header */}
      <div className="h-16 border-b flex items-center px-4" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'var(--accent)', boxShadow: '0 4px 14px var(--accent-bg)' }}>
            <Layout className="text-white" size={18} />
          </div>
          {!collapsed && <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>幻灯片</span>}
        </div>
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title={collapsed ? '展开侧边栏' : '收缩侧边栏'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Slide List */}
      <div className={`${collapsed ? 'hidden' : 'flex-1 overflow-y-auto p-3 space-y-2'}`}>
        {slides.map((slide: Slide, index: number) => (
          <div
            key={slide.id}
            onClick={() => onSelectSlide(index)}
            className={cn(
              "group relative rounded-lg border-2 transition-all cursor-pointer overflow-hidden",
              currentSlideIndex === index
                ? "border-[var(--border-active)]"
                : "hover:border-[var(--border-default)]"
            )}
            style={{
              background: currentSlideIndex === index ? 'var(--accent-bg)' : 'var(--bg-card)',
              borderColor: currentSlideIndex === index ? 'var(--border-active)' : 'var(--border-default)',
            }}
          >
            {/* Slide Number */}
            <div className="absolute top-1 left-1.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {index + 1}
            </div>

            {/* Slide Thumbnail Preview */}
            <div className="bg-white m-1 mt-4 mb-1 rounded overflow-hidden relative" style={{ aspectRatio: canvasRatio === '16:9' ? '16/9' : '4/3' }}>
              <SlideThumbnail code={slide.code} isActive={currentSlideIndex === index} canvasRatio={canvasRatio} />
            </div>

            {/* Slide Name */}
            <div className="px-2 pb-1.5">
              {editingSlideName === slide.id ? (
                <input
                  type="text"
                  defaultValue={slide.name}
                  onBlur={(e) => onRenameSlide(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onRenameSlide(index, e.currentTarget.value);
                    } else if (e.key === 'Escape') {
                      setEditingSlideName(null);
                    }
                  }}
                  className="w-full text-[11px] rounded px-1 py-0.5 outline-none"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border-active)', color: 'var(--text-primary)' }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] truncate flex-1"
                    style={{ color: 'var(--text-secondary)' }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setEditingSlideName(slide.id);
                    }}
                  >
                    {slide.name}
                  </span>

                  {/* Actions Menu */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSlide(index);
                      }}
                      className="p-0.5 rounded transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      title="复制"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSlide(index);
                      }}
                      className="p-0.5 rounded transition-colors hover:text-red-400"
                      title="删除"
                      disabled={slides.length <= 1}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className={`${collapsed ? 'hidden' : 'p-3 border-t'}`} style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={onAddSlide}
          className="w-full py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-medium"
          style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          新建幻灯片
        </button>
      </div>
    </div>
  );
};
