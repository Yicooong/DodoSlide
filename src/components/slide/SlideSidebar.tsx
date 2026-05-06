/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// 导入图标：Layout(布局)、ChevronLeft(左箭头)、ChevronRight(右箭头)
import { Layout, ChevronLeft, ChevronRight } from 'lucide-react';
// 导入 cn 工具函数：合并 Tailwind 类名
import { cn } from '../../lib/utils';
// 导入画布比例类型
import { CanvasRatio } from '../../lib/canvas-config';
// 导入幻灯片类型
import { Slide } from '../../hooks/use-slides';
// 导入幻灯片缩略图组件
import { SlideThumbnail } from './SlideThumbnail';

/** 幻灯片侧边栏组件属性接口 */
interface SlideSidebarProps {
  slides: Slide[];                        // 所有幻灯片数组
  currentSlideIndex: number;              // 当前选中的幻灯片索引
  canvasRatio: CanvasRatio;               // 画布比例
  collapsed: boolean;                     // 是否折叠
  onToggleCollapse: () => void;           // 切换折叠状态
  onSelectSlide: (index: number) => void; // 选择幻灯片
  onAddSlide: () => void;                 // 添加新幻灯片
  onDeleteSlide: (index: number) => void; // 删除幻灯片
  onRenameSlide: (index: number, newName: string) => void;  // 重命名幻灯片
  onDuplicateSlide: (index: number) => void;  // 复制幻灯片
}

/**
 * 幻灯片侧边栏组件
 * 功能：
 * - 显示所有幻灯片的缩略图列表
 * - 支持折叠/展开（折叠后只显示图标）
 * - 支持幻灯片操作：选择、添加、删除、重命名、复制
 * - 双击名称进入重命名模式
 * - 悬停显示操作按钮（复制、删除）
 * - 当前幻灯片高亮显示
 */
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
  // 正在重命名的幻灯片 ID
  const [editingSlideName, setEditingSlideName] = useState<string | null>(null);

  return (
    <div className="w-full h-full border-r flex flex-col relative" style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-subtle)' }}>
      {/* 头部区域：Logo + 标题 + 折叠按钮 */}
      <div className="h-16 border-b flex items-center justify-between px-2" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''}`}>
          {/* 图标：带阴影的渐变方块 */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: 'var(--accent)', boxShadow: '0 4px 14px var(--accent-bg)' }}>
            <Layout className="text-white" size={18} />
          </div>
          {/* 标题：折叠时隐藏 */}
          {!collapsed && <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>幻灯片</span>}
        </div>
        {/* 折叠按钮：未折叠时显示 */}
        {!collapsed && (
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg transition-colors flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
            title="收缩侧边栏"
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* 展开按钮：折叠时显示在中间位置 */}
      {collapsed && (
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors z-10"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
          title="展开侧边栏"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* 幻灯片列表：折叠时隐藏 */}
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
            {/* 幻灯片编号（左上角） */}
            <div className="absolute top-1 left-1.5 text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
              {index + 1}
            </div>

            {/* 缩略图预览区域 */}
            <div className="bg-white m-1 mt-4 mb-1 rounded overflow-hidden relative" style={{ aspectRatio: canvasRatio === '16:9' ? '16/9' : '4/3' }}>
              <SlideThumbnail code={slide.code} isActive={currentSlideIndex === index} canvasRatio={canvasRatio} />
            </div>

            {/* 幻灯片名称区域 */}
            <div className="px-2 pb-1.5">
              {editingSlideName === slide.id ? (
                /* 重命名模式：显示输入框 */
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
                /* 普通模式：显示名称和操作按钮 */
                <div className="flex items-center justify-between">
                  {/* 名称：双击进入编辑 */}
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

                  {/* 操作按钮：悬停时显示 */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* 复制按钮 */}
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
                    {/* 删除按钮：至少保留一张幻灯片 */}
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

      {/* 底部操作区：新建幻灯片按钮 */}
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
