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
1. **AI 生成** — Navigates to AI generation page (`ai-generate` view)
2. **设置** — Opens settings modal (API configuration + Prompt settings)
3. **上传 JSX** — File upload for local JSX files (import slides)
4. **导出 PPTX** — Opens export modal (all/current/range modes)

**Styling:**
- All buttons unified to h-9 (36px) height
- Theme variables for all colors (`--bg-button`, `--text-primary`, etc.)
- AI button has gradient background (`var(--accent)`)
- Active tab has shadow effect and accent border
- Settings button is globally available (editor and AI generation pages)

**Layout:**
- Left: Tab switcher (预览/代码)
- Center: Canvas ratio selector (16:9 / 4:3)
- Right: Action buttons (AI 生成, 设置, 上传, 导出)

## Key Changes from Previous Version

- `showAiInput`/`setShowAiInput` props removed
- `onNavigateToAi` prop added for page navigation
- AI button now navigates to dedicated AI page instead of toggling modal
- Settings button available in both editor and AI generation views
- Export button triggers PPTX download directly (not navigation)
