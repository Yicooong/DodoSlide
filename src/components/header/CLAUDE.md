# Header Components

Application top navigation bar.

## AppHeader.tsx

Top navigation with tabs, canvas ratio selector, theme switcher, and action buttons.

**Props:**
```typescript
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
  onNavigateToAi?: () => void;  // Navigate to AI generation page
}
```

**Button Actions:**
1. **AI 生成** — Navigates to AI generation page (not modal)
2. **设置** — Opens settings modal
3. **上传 JSX** — File upload for local JSX files
4. **导出 PPTX** — Opens export modal

**Styling:**
- All buttons unified to h-9 (36px) height
- Theme variables for all colors
- AI button has gradient background
- Active tab has shadow effect

## Key Changes from Previous Version

- `showAiInput`/`setShowAiInput` props removed
- `onNavigateToAi` prop added for page navigation
- AI button now navigates to dedicated AI page instead of toggling modal
