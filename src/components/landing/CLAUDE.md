# Landing Page Components

Hero page with gradient background and feature cards.

## LandingPage.tsx

Main landing page with animated entry effects.

**Props:**
```typescript
{
  onNavigate: (view: ViewType) => void;
}
```

**Features:**
- Radial gradient background effect
- Animated logo with gradient shadow
- Two main action buttons:
  - **开始创作** → AI generation page (phase-based UI with conversation system)
  - **代码编辑器** → Monaco editor workspace
- Four feature cards with glassmorphism:
  - AI 智能生成 (AI-powered generation with multi-slide support)
  - 多种风格模板 (5 preset style templates)
  - 实时预览 (Live preview with Babel transpilation)
  - 一键导出 (One-click PPTX export)
- Footer with canvas ratio info (16:9 / 4:3)

**Styling:**
- Uses `motion` for entrance animations
- Feature cards use `var(--glass-bg)` and `var(--glass-border)` for glassmorphism
- Main button has gradient background (`var(--accent)`)
- All colors use CSS variables for theme support
- Responsive design for different screen sizes

**Animation:**
- Logo: scale + fade in
- Feature cards: stagger animation
- Buttons: hover scale effect

**Navigation:**
- `onNavigate('ai-generate')` → AI generation page (EntryPhase → WorkspacePhase)
- `onNavigate('code')` → Monaco editor workspace (SlideSidebar + CodeEditor + SlidePreview)
