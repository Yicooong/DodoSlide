/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
// 导入画布配置相关类型和函数
import { CanvasRatio, getCanvasConfig } from '../lib/canvas-config';
// 导入主题配置相关类型和函数
import { AppTheme, getThemeConfig } from '../lib/theme-config';

// 视图类型定义：着陆页、AI生成页、代码编辑器、预览
export type ViewType = 'landing' | 'ai-generate' | 'code' | 'preview';

/**
 * 管理应用全局状态的 Hook
 * 负责视图路由、主题、画布比例、侧边栏状态等
 */
export const useAppState = () => {
  // 当前视图类型，默认为着陆页
  const [viewType, setViewType] = useState<ViewType>('landing');
  // 当前激活的标签页（代码编辑器或预览）
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  // 画布比例，默认为 16:9
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>('16:9');
  // 应用主题，默认为浅色
  const [appTheme, setAppTheme] = useState<AppTheme>('light');
  // 侧边栏是否折叠
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // 是否处于演示模式
  const [presenting, setPresenting] = useState(false);

  // 根据当前主题获取主题配置
  const themeConfig = getThemeConfig(appTheme);
  // 根据当前画布比例获取画布配置
  const canvasConfig = getCanvasConfig(canvasRatio);

  // 将主题类应用到 html 标签上
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(appTheme);
  }, [appTheme]);

  // 返回所有状态和对应的更新函数
  return {
    viewType,
    setViewType,
    activeTab,
    setActiveTab,
    canvasRatio,
    setCanvasRatio,
    appTheme,
    setAppTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    presenting,
    setPresenting,
    themeConfig,
    canvasConfig,
  };
};
