/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CanvasRatio, getCanvasConfig } from '../lib/canvas-config';
import { AppTheme, getThemeConfig } from '../lib/theme-config';

/**
 * Hook for managing app-wide state
 */
export const useAppState = () => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('code');
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>('16:9');
  const [appTheme, setAppTheme] = useState<AppTheme>('dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const themeConfig = getThemeConfig(appTheme);
  const canvasConfig = getCanvasConfig(canvasRatio);

  return {
    activeTab,
    setActiveTab,
    canvasRatio,
    setCanvasRatio,
    appTheme,
    setAppTheme,
    sidebarCollapsed,
    setSidebarCollapsed,
    themeConfig,
    canvasConfig,
  };
};
