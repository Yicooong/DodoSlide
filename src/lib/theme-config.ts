/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppTheme = 'dark' | 'light' | 'system';

export interface ThemeConfig {
  id: AppTheme;
  label: string;
  icon: string;
  description: string;
  rootClass: string;
  monacoTheme: string;
}

export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  dark: {
    id: 'dark',
    label: '深色',
    icon: '🌙',
    description: '深色主题',
    rootClass: 'dark',
    monacoTheme: 'vs-dark',
  },
  light: {
    id: 'light',
    label: '浅色',
    icon: '☀️',
    description: '浅色主题',
    rootClass: 'light',
    monacoTheme: 'vs',
  },
  system: {
    id: 'system',
    label: '系统',
    icon: '💻',
    description: '跟随系统设置',
    rootClass: '',
    monacoTheme: 'vs-dark',
  },
};

export const getThemeConfig = (theme: AppTheme): ThemeConfig => {
  return THEME_CONFIGS[theme] || THEME_CONFIGS['dark'];
};
