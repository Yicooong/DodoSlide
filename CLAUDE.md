# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Name:** gemini-canvas-ppt-download
**Type:** Browser-based slide editor
**Summary:** A React app where users write JSX code in a Monaco editor, see live slide previews in multiple aspect ratios, and export the result as a `.pptx` file using `pptxgenjs`. Features AI-powered slide generation with custom style presets and comprehensive theme support.

---

## Tech Stack

| Layer | Tech |
|---|---|
| UI framework | React 19 + Tailwind CSS v4 |
| Code editor | `@monaco-editor/react` |
| JSX transpiler | `@babel/standalone` (browser-side — no build step on edit) |
| PPTX generation | `pptxgenjs` |
| Animations | `motion` |
| Icons | `lucide-react` |
| Server | Express + Vite (dev) / static serve (prod) |

---

## Build, Test, and Run

### Install dependencies
```bash
npm install
```

### Development (with hot reload + Express server)
```bash
npm run dev
```
Vite middleware serves the app; changes reload instantly.

### Production build
```bash
npm run build
npm start          # Express serves ./dist as static files
```

### Lint
```bash
npm run lint
```

---

## Key Architecture Decisions

### 1. Multi-Slide Management with Dynamic Aspect Ratios
- **Slide System**: Array-based slide management with thumbnails in collapsible sidebar
- **Aspect Ratios**: Supports both 16:9 (1280×720) and 4:3 (1024×768) canvas configurations
- **Thumbnail Rendering**: `SlideThumbnail` component dynamically scales based on canvas config using ResizeObserver
- **Sidebar**: Collapsible interface that toggles between full width (256px) and minimal width (48px)

### 2. Theme System
- **Themes**: Only supports dark/light modes (removed system theme)
- **CSS Variables**: Comprehensive theme variables cover all UI elements (backgrounds, borders, text, shadows)
- **Application**: Theme variables applied consistently across all components (modals, panels, inputs, buttons)
- **Configuration**: `theme-config.ts` defines theme properties and Monaco editor themes

### 3. Browser-Side JSX Transpilation
Babel runs in the browser to avoid a build step when the user edits code. The transpiled code is wrapped in a self-executing function that injects `React` and `lucide-react` as dependencies, simulating a CommonJS `require`.

### 4. AI Generation System
- **Custom API Only**: Simplified to support only custom OpenAI-compatible API endpoints
- **Style Presets**: 5 predefined design styles (Modern, Tech, Creative, Professional, Elegant)
- **Enhanced Panel**: Large modal (900px) with prompt input, style selection, and advanced settings
- **Model Fetching**: Improved `listModels()` function with multiple format support and error handling
- **Code Display**: Generated React code shown with copy and "apply to editor" buttons

### 5. DOM-to-PPTX Export Pipeline
On export, a `TreeWalker` traverses the rendered slide DOM and reconstructs it in `pptxgenjs`:

- **Shapes** → background fills, borders (symmetrical as `roundRect`/`rect`, asymmetrical as individual `line` shapes)
- **SVG icons** → serialized, base64-encoded, embedded as images with resolved colors
- **Text** → grouped by nearest block-level ancestor, mapped to `pptxgenjs` rich text objects with font size (px→pt ×0.75), bold, italic, color
- **Colors** → resolved via a 1×1 canvas trick to handle `oklch`, `color-mix`, `rgba`, etc.

### 6. Scaling System
The preview scales to fit the viewport via `ResizeObserver`. Export coordinates are unscaled using canvas-specific ratios:
```js
pxToIn = (px / currentScale) * canvasConfig.pptxWidthIn / canvasConfig.width
```

### 7. Unified UI Components
- **Button Sizes**: All header buttons unified to h-9 (36px) height
- **Consistent Styling**: All interactive elements use theme variables for consistent appearance
- **Modal System**: Reusable modal patterns with backdrop blur and consistent spacing

---

## Directory Structure

```
/
├── index.html          — Entry HTML with Tailwind v4 browser runtime
├── server.ts           — Express server (Vite middleware in dev, static in prod)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── metadata.json       — AI Studio metadata
└── src/
    ├── main.tsx        — React root mount
    ├── App.tsx         — Main app: editor + preview + export + AI (~1000+ lines)
    ├── constants.ts    — DEFAULT_CODE: the sample slide JSX
    ├── index.css       — Tailwind imports + theme variables + fonts
    ├── components/
    │   ├── SettingsModal.tsx       — API configuration (custom only)
    │   ├── AiGenerationPanel.tsx  — Large AI generation panel with styles
    │   ├── AiInputModal.tsx       — Legacy AI modal (deprecated)
    │   └── AiInputBar.tsx         — Bottom AI input bar (deprecated)
    └── lib/
        ├── canvas-config.ts       — Canvas ratio configurations (16:9, 4:3)
        ├── theme-config.ts        — Theme configurations (dark, light)
        ├── api-providers.ts       — Custom API provider and model fetching
        ├── prompt-manager.ts      — System prompt management
        ├── use-ai-generation.ts   — AI generation hook
        └── utils.ts               — cn() utility (clsx + tailwind-merge)
```

---

## Important Implementation Details

### Canvas Configuration
- Canvas configs are centralized in `canvas-config.ts` with width, height, and PPTX dimensions
- All canvas-dependent components receive `canvasRatio` prop and use `getCanvasConfig()`
- Thumbnail rendering must update when canvas ratio changes (use ResizeObserver with config dependencies)

### Theme Implementation
- All colors defined in `index.css` as CSS variables with `--var-` naming convention
- Components access theme variables via inline styles: `style={{ color: 'var(--text-primary)' }}`
- Theme switching updates the root class (`dark` or `light`) which activates corresponding CSS variables

### AI Integration
- Only custom OpenAI-compatible APIs are supported (gemini, openai, anthropic providers removed)
- API settings stored in localStorage under `api_settings`
- Model list fetching handles multiple response formats (OpenAI, direct arrays, etc.)
- Style instructions are prepended to user prompts in `handleAiGenerate()`

### Export System
- Supports three modes: all slides, current slide, or range export
- Export uses temporary DOM rendering with React roots for each slide
- The root container is **skipped** in shape drawing to avoid duplicate backgrounds
- Opacity inheritance is tracked by walking up the DOM tree per element
- Text whitespace is collapsed and bounding boxes expanded with buffer to prevent wrapping issues

### Sidebar State
- `sidebarCollapsed` state controls sidebar width and content visibility
- Chevron icon indicates current state (left/right arrow)
- Slide list and actions hidden when collapsed, only header and collapse button visible

---

## Development Guidelines

### Adding New Canvas Ratios
1. Update `CanvasRatio` type in `canvas-config.ts`
2. Add configuration to `CANVAS_CONFIGS` object
3. Update slide thumbnail container aspect-ratio calculation in `App.tsx`
4. Test thumbnail rendering and export functionality

### Adding New AI Styles
1. Add style to `PROMPT_STYLES` array in `AiGenerationPanel.tsx`
2. Include style instruction mapping in `handleAiGenerate()` function
3. Test style application with different prompts

### Theme Extensions
1. Add new CSS variables to both `.dark` and `.light` sections in `index.css`
2. Ensure variables follow naming convention: `--category-property`
3. Test in both light and dark modes across all components

### API Integration
- Always use the improved `listModels()` function for model fetching
- Handle multiple response formats and provide clear error messages
- Validate API configuration before attempting connections
- Store API settings in localStorage for persistence
