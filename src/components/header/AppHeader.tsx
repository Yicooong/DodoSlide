/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
// 导入图标：Settings(设置)、Sparkles(AI)、Upload(上传)、Download(下载)、Monitor(显示器)
import {
  Settings,
  Sparkles,
  Upload,
  Download,
  Monitor,
} from 'lucide-react';
// 导入 cn 工具函数：合并 Tailwind 类名
import { cn } from '../../lib/utils';
// 导入画布配置类型
import { CanvasConfig } from '../../lib/canvas-config';
// 导入主题配置类型
import { ThemeConfig } from '../../lib/theme-config';

/** 应用头部组件属性接口 */
interface AppHeaderProps {
  activeTab: 'preview' | 'code';              // 当前激活的标签
  setActiveTab: (tab: 'preview' | 'code') => void;  // 设置标签回调
  canvasRatio: string;                        // 当前画布比例
  setCanvasRatio: (ratio: string) => void;    // 设置画布比例
  canvasConfigs: CanvasConfig[];              // 画布配置列表
  appTheme: string;                           // 当前主题
  setAppTheme: (theme: string) => void;       // 设置主题
  themeConfigs: ThemeConfig[];                // 主题配置列表
  isGenerating: boolean;                      // 是否正在生成
  showSettings: boolean;                      // 是否显示设置
  setShowSettings: (show: boolean) => void;   // 设置显示状态
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;  // 上传文件回调
  onExport: () => void;                       // 导出回调
  onNavigateToAi?: () => void;                // 导航到 AI 生成页（可选）
}

/**
 * 应用头部导航组件
 * 功能：
 * - 显示应用 Logo 和名称
 * - 提供编辑器/预览标签切换
 * - 画布比例选择器
 * - 主题切换器
 * - AI 生成按钮（导航到 AI 生成页）
 * - 设置按钮
 * - 上传 JSX 文件按钮
 * - 导出 PPTX 按钮
 */
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
        {/* 应用 Logo 和名称 */}
        <h1 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Slide <span style={{ color: 'var(--accent)' }}>Playground</span>
        </h1>

        {/* 编辑器/预览标签切换 */}
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

        {/* 画布比例选择器 */}
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

        {/* 主题切换器：循环显示所有可用主题 */}
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

      {/* 右侧操作按钮区 */}
      <div className="flex items-center gap-3">
         {/* AI 生成按钮：导航到 AI 生成页 */}
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
         {/* 设置按钮：切换设置弹窗显隐 */}
         <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border active:scale-95 hover:opacity-90"
            style={{ background: 'var(--bg-button)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
         >
            <Settings size={16} />
            设置
         </button>
         {/* 上传 JSX 文件按钮：隐藏的 file input 触发文件选择 */}
         <label className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 border active:scale-95 hover:opacity-90" style={{ background: 'var(--bg-button)', borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
            <Upload size={16} />
            上传 JSX
            <input type="file" accept=".jsx,.tsx,.js,.ts" className="hidden" onChange={onUpload} />
         </label>
         {/* 导出 PPTX 按钮 */}
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
