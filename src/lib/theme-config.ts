/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 应用主题类型：深色或浅色
export type AppTheme = 'dark' | 'light';

// 主题配置接口定义
export interface ThemeConfig {
  id: AppTheme;        // 主题唯一标识
  label: string;       // 显示标签
  icon: string;        // 图标
  description: string; // 主题描述
  rootClass: string;   // 根元素 CSS 类名（用于切换主题）
  monacoTheme: string; // Monaco 编辑器主题名称
}

// 主题配置对象，包含所有支持的主题
export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  // 深色主题
  dark: {
    id: 'dark',
    label: '深色',
    icon: '🌙',
    description: '深色主题',
    rootClass: 'dark',
    monacoTheme: 'vs-dark',
  },
  // 浅色主题（默认）
  light: {
    id: 'light',
    label: '浅色',
    icon: '☀️',
    description: '浅色主题',
    rootClass: 'light',
    monacoTheme: 'vs',
  },
};

/**
 * 根据主题名称获取对应的主题配置
 * 如果主题不存在，则返回默认的深色主题配置
 * @param theme 主题名称
 * @returns 主题配置对象
 */
export const getThemeConfig = (theme: AppTheme): ThemeConfig => {
  return THEME_CONFIGS[theme] || THEME_CONFIGS['dark'];
};
