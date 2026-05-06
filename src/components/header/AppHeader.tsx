/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Settings,
  Sparkles,
  Upload,
  Download,
  Monitor,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CanvasConfig } from '../../lib/canvas-config';
import { ThemeConfig } from '../../lib/theme-config';

interface AppHeaderProps {
  activeTab: 'preview' | 'code';
  setActiveTab: (tab: 'preview' | 'code') => void;
  canvasRatio: string;
  setCanvasRatio: (ratio: string) => void;
  canvasConfigs: CanvasConfig[];
  appTheme: string;
  setAppTheme: (theme: string) => void;
  themeConfigs: ThemeConfig[];
  isGenerating: boolean;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onNavigateToAi?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeTab,
  setActiveTab,
  canvasRatio,
  setCanvasRatio,
  canvasConfigs,
  appTheme,
  setAppTheme,
  themeConfigs,
  isGenerating,
  showSettings,
  setShowSettings,
  onUpload,
  onExport,
  onNavigateToAi,
}) => {
  return (
    <header className="h-16 border-b px-6 flex items-center justify-between" style={{ background: 'var(--bg-header)', borderColor: 'var(--border-subtle)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-6">
        <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Slide <span style={{ color: 'var(--accent)' }}>Playground</span>
        </h1>

        <nav className="flex items-center p-1 rounded-lg border h-9" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
           <button
              onClick={() => setActiveTab('code')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all h-full", activeTab === 'code' ? "shadow-sm" : "hover:opacity-80")}
              style={{
                background: activeTab === 'code' ? 'var(--bg-button)' : 'transparent',
                color: activeTab === 'code' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
           >
              编辑器
           </button>
           <button
              onClick={() => setActiveTab('preview')}
              className={cn("px-4 py-1.5 rounded-md text-xs font-bold transition-all h-full", activeTab === 'preview' ? "shadow-sm" : "hover:opacity-80")}
              style={{
                background: activeTab === 'preview' ? 'var(--bg-button)' : 'transparent',
                color: activeTab === 'preview' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
           >
              预览
           </button>
        </nav>

        {/* Canvas Ratio Selector */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border h-9" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          <Monitor size={14} style={{ color: 'var(--text-muted)' }} />
          <select
            value={canvasRatio}
            onChange={(e) => setCanvasRatio(e.target.value)}
            className="text-xs font-medium bg-transparent outline-none cursor-pointer h-full"
            style={{ color: 'var(--text-secondary)' }}
          >
            {canvasConfigs.map((config) => (
              <option key={config.ratio} value={config.ratio}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg border h-9" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-default)' }}>
          {themeConfigs.map((theme) => (
            <button
              key={theme.id}
              onClick={() => setAppTheme(theme.id)}
              title={theme.description}
              className={cn("p-1.5 rounded-md transition-all h-full flex items-center justify-center", appTheme === theme.id ? "shadow-sm" : "hover:opacity-80")}
              style={{
                background: appTheme === theme.id ? 'var(--bg-button)' : 'transparent',
              }}
            >
              <span className="text-sm">{theme.icon}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
         {onNavigateToAi && (
           <button
              onClick={onNavigateToAi}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
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
         <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border active:scale-95 hover:opacity-90"
            style={{ background: 'var(--bg-button)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
         >
            <Settings size={16} />
            设置
         </button>
         <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border active:scale-95 hover:opacity-90" style={{ background: 'var(--bg-button)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            <Upload size={16} />
            上传 JSX
            <input type="file" accept=".jsx,.tsx,.js,.ts" className="hidden" onChange={onUpload} />
         </label>
         <button
            onClick={onExport}
            className="px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all active:scale-95"
            style={{
              background: 'var(--accent)',
              color: 'var(--text-inverse)',
              boxShadow: '0 4px 14px var(--accent-bg)'
            }}
         >
            <Download size={16} />
            导出 PPTX
         </button>
      </div>
    </header>
  );
};
