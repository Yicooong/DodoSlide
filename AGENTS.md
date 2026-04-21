# AI Coding Agent Instructions

## Project Overview

This is a React 19 + Vite 6 + TypeScript app that lets users write JSX slide code in a Monaco editor, transpiles it client-side with Babel, and exports to PPTX using `pptxgenjs`. A custom Express server serves the app with Vite middleware.

## Build Commands

| Command | Action |
|---------|--------|
| `npm run dev` | Start Express server + Vite dev (`tsx server.ts`) |
| `npm run build` | Production build (`vite build`) |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript check (`tsc --noEmit`) |
| `npm run clean` | Remove dist folder |

## Architecture

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Server**: `server.ts` (Express + Vite middleware, port 3000)
- **Pattern**: Single-page app — Monaco code editor (left) + live preview iframe (right)
- **Transpilation**: `@babel/standalone` transpiles JSX → JS client-side, then executed in sandbox with mocked React/lucide-react
- **Export**: `pptxgenjs` generates `.pptx` files

## Key Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | Main UI — code editor, preview iframe, export button, file upload |
| `src/constants.ts` | `DEFAULT_CODE` — sample slide component |
| `src/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |

## Conventions

- **Styling**: Tailwind CSS v4 (uses `@theme` block in CSS, no `tailwind.config.js`)
- **Motion**: `motion/react` (framer-motion wrapper)
- **Icons**: `lucide-react`
- **Class merging**: `cn()` from `lib/utils.ts`
- **Path alias**: `@/*` maps to project root
- **No routing** — single page app, no React Router

## Potential Pitfalls

- Babel transpilation happens client-side — code runs in a sandboxed iframe
- When adding npm packages, remember both server (Node) and client (browser) environments — server imports pptxgenjs directly