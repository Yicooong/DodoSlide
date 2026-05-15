# Header Components

Application top navigation bar.

## AppHeader.tsx

Top navigation with tabs and action buttons. Canvas ratio and theme settings moved to SettingsModal.

**Props:**
```typescript
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
```

**Button Actions:**
1. **AI 生成** — Navigates to AI generation page (`ai-generate` view)
2. **设置** — Opens settings modal (通用/ API / Prompt)
3. **演示** — Enter fullscreen presentation mode
4. **导出 PPTX** — Opens export modal (all/current/range modes)

**Layout:**
- Left: Logo + Tab switcher (编辑器/预览)
- Right: Action buttons (AI 生成, 设置, 演示, 导出 PPTX)
