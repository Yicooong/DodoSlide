/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Settings,
  Sparkles,
  Download,
  Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';

/** 应用头部组件属性接口 */
interface AppHeaderProps {
  activeTab: 'preview' | 'code';
  setActiveTab: (tab: 'preview' | 'code') => void;
  isGenerating: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onExport: () => void;
  onNavigateToAi?: () => void;
  onPresent?: () => void;
}

/**
 * 应用头部导航组件
 * 功能：
 * - 显示应用 Logo 和名称
 * - 提供编辑器/预览标签切换
 * - AI 生成按钮（导航到 AI 生成页）
 * - 设置按钮
 * - 导出 PPTX 按钮
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  isGenerating,
  showSettings,
  setShowSettings,
  onExport,
  onNavigateToAi,
  onPresent,
}) => {
  return (
    <header className="h-16 border-b px-6 flex items-center justify-between gap-4 overflow-hidden" style={{ background: 'var(--bg-header)', borderColor: 'var(--border-subtle)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-4 min-w-0 overflow-hidden">
        {/* 应用 Logo 和名称 */}
        <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Slide <span style={{ color: 'var(--accent)' }}>Playground</span>
        </h1>

        {/* 编辑器/预览标签切换 */}
        <nav className="flex items-center p-1 rounded-lg border h-9" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
       <button
            onClick={() => setActiveTab('code')}
            className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all h-full active:scale-95 whitespace-nowrap", activeTab === 'code' ? "shadow-sm" : "hover:opacity-80")}
            style={{
              background: activeTab === 'code' ? 'var(--bg-button)' : 'transparent',
              color: activeTab === 'code' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
         >
           编辑器
         </button>
         <button
            onClick={() => setActiveTab('preview')}
            className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all h-full active:scale-95 whitespace-nowrap", activeTab === 'preview' ? "shadow-sm" : "hover:opacity-80")}
            style={{
              background: activeTab === 'preview' ? 'var(--bg-button)' : 'transparent',
              color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
         >
           预览
         </button>
        </nav>

      </div>

      {/* 右侧操作按钮区 */}
      <div className="flex items-center gap-2 shrink-0">
         {/* AI 生成按钮：导航到 AI 生成页 */}
         {onNavigateToAi && (
           <button
              onClick={onNavigateToAi}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95 hover:shadow-xl hover:brightness-110 whitespace-nowrap"
              style={{
                background: 'linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))',
                color: 'white',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)'
              }}
           >
              <Sparkles size={16} />
              AI 生成
           </button>
         )}
         {/* 设置按钮：切换设置弹窗显隐 */}
          <button
             onClick={() => setShowSettings(!showSettings)}
             className="px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 border active:scale-95 hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
             style={{ background: 'var(--bg-button)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
          >
             <Settings size={15} />
             设置
          </button>
          {/* 演示按钮：进入全屏演示模式 */}
          {onPresent && (
            <button
               onClick={onPresent}
               className="px-3 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 border active:scale-95 hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
               style={{ background: 'var(--bg-button)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
               <Play size={15} />
               演示
            </button>
          )}
         {/* 导出 PPTX 按钮 */}
          <button
             onClick={onExport}
             className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all active:scale-95 hover:brightness-110 hover:shadow-lg whitespace-nowrap"
             style={{
               background: 'var(--accent)',
               color: 'var(--text-inverse)',
               boxShadow: '0 4px 14px var(--accent-bg)'
             }}
          >
             <Download size={15} />
             导出 PPTX
          </button>
      </div>
    </header>
  );
};
