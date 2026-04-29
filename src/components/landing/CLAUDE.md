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
  - **开始创作** → AI generation page
  - **代码编辑器** → Monaco editor
- Four feature cards with glassmorphism:
  - AI 智能生成
  - 多种风格模板
  - 实时预览
  - 一键导出
- Footer with canvas ratio info

**Styling:**
- Uses `motion` for entrance animations
- Feature cards use `var(--glass-bg)` and `var(--glass-border)`
- Main button has gradient background
- All colors use CSS variables

**Navigation:**
- `onNavigate('ai-generate')` → AI generation page
- `onNavigate('code')` → Monaco editor workspace
