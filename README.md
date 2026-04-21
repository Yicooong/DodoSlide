# CLAUDE.md — Project Documentation

## Project Overview

**Name:** gemini-canvas-ppt-download
**Type:** Browser-based slide editor (runs inside Google AI Studio)
**Summary:** A React app where users write JSX code in a Monaco editor, see a live 1280×720 (16:9) slide preview, and export the result as a `.pptx` file using `pptxgenjs`.

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
| AI SDK | `@google/genai` (installed but not actively used) |

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

### 1. Two-Tab Interface
- **code tab**: Full Monaco editor for writing JSX slide code.
- **preview tab**: Live render of the slide at 1280×720 logical pixels.
- Toggled by sidebar/header buttons.

### 2. Browser-Side JSX Transpilation
Babel runs in the browser to avoid a build step when the user edits code. The transpiled code is wrapped in a self-executing function that injects `React` and `lucide-react` as dependencies, simulating a CommonJS `require`.

### 3. DOM-to-PPTX Export Pipeline
On export, a `TreeWalker` traverses the rendered slide DOM and reconstructs it in `pptxgenjs`:

- **Shapes** → background fills, borders (symmetrical as `roundRect`/`rect`, asymmetrical as individual `line` shapes)
- **SVG icons** → serialized, base64-encoded, embedded as images with resolved colors
- **Text** → grouped by nearest block-level ancestor, mapped to `pptxgenjs` rich text objects with font size (px→pt ×0.75), bold, italic, color
- **Colors** → resolved via a 1×1 canvas trick to handle `oklch`, `color-mix`, `rgba`, etc.

### 4. Scaling
The preview scales to fit the viewport via `ResizeObserver`. Export coordinates are unscaled using:
```js
pxToIn = (px / currentScale) * 13.33 / 1280
```

### 5. Font Fallback
All exported text uses `Microsoft YaHei` (a CJK-compatible font) to ensure Chinese characters render in the PPTX.

---

## Directory Structure

```
/
├── index.html          — Entry HTML with Tailwind v4 browser runtime
├── server.ts           — Express server (Vite middleware in dev, static in prod)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── metadata.json       — AI Studio metadata
└── src/
    ├── main.tsx        — React root mount
    ├── App.tsx         — Main app: editor + preview + export logic (~590 lines)
    ├── constants.ts    — DEFAULT_CODE: the sample slide JSX
    ├── index.css       — Tailwind imports + Inter/JetBrains Mono fonts + @theme
    └── lib/utils.ts    — cn() utility (clsx + tailwind-merge)
```

---

## Important Notes

- The root container is **skipped** in shape drawing to avoid a duplicate background shape during export.
- Opacity inheritance is tracked by walking up the DOM tree per element.
- Tailwind gradient fallbacks are extracted from `background-image` when `background-color` is transparent.
- Text whitespace is collapsed via `textContent.replace(/\n/g, ' ')` and bounding boxes are expanded with buffer inches (`0.25` wide, `0.05` tall) to prevent line-wrapping from kerning differences.
- `@google/genai` is installed but not actively used in the current codebase — it may be used in future AI-assisted features.