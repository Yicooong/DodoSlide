# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Name:** DodoSlide
**Type:** Browser-based slide editor with AI generation
**Summary:** A React app where users write JSX code in a Monaco editor, see live slide previews in multiple aspect ratios, and export the result as a `.pptx` file using `pptxgenjs`. Features AI-powered slide generation with glassmorphism UI, phase-based transitions, conversation system, and comprehensive theme support.

---

## Build, Test, and Run

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite + Express, port 3000)
npm run build        # Production build
npm start            # Start production server
npm run lint         # TypeScript type check
```

### Chrome Extension
```bash
cd chrome-extension
npm install          # Install extension dependencies
npm run build        # Build extension to dist/
```

---

## Tech Stack

| Layer | Tech |
|---|---|
| UI framework | React 19 + Tailwind CSS v4 |
| Code editor | `@monaco-editor/react` |
| JSX transpiler | `@babel/standalone` (browser-side) |
| AST parsing | `@babel/parser` + `@babel/types` (Inspector edit system) |
| PPTX generation | `pptxgenjs` |
| Animations | `motion` (Framer Motion) |
| Icons | `lucide-react` |
| Resizable panels | `react-resizable-panels` |
| ID generation | `nanoid` |
| Streaming | SSE via ReadableStream |
| Server | Express + Vite (dev) / static serve (prod) |

---

## Architecture

### View System
The app has three main views managed by `useAppState().viewType`:
- **`landing`** — Hero page with feature cards and action buttons
- **`ai-generate`** — AI-powered slide generation with phase-based UI and conversation system
- **`code`** / **`preview`** — Monaco editor + live preview workspace

### AI Generation Page (Phase-Based)
The AI generation page uses internal phase state (`'entry' | 'workspace'`) within a single component:

1. **Entry Phase** (`EntryPhase.tsx`):
   - Centered glassmorphism chat box
   - Quick prompt cards (产品发布, 技术分享, 商业路演, 季度汇报)
   - Style template selection (15 presets with category filtering: business/creative/tech/editorial/general)
   - Canvas ratio selector (16:9 / 4:3)

2. **Workspace Phase** (`WorkspacePhase.tsx`):
   - Left: Conversation list sidebar (collapsible, default 15%, search/rename support)
   - Middle: AI assistant sidebar (resizable, default 25%, message history)
   - Right: Preview/code area (resizable, default 60%) with tab switching
   - Drag handle between panels for custom sizing (persisted to localStorage)
   - Stop button during generation (red, uses AbortController)
   - Export button triggers PPTX download (not navigation)

3. **Phase Transition**: Uses `motion` `AnimatePresence` for smooth morphing animation

### Chat System
The chat system provides conversation management with tree-structured messages and history persistence:

1. **Data Model** (`lib/chat/types.ts`):
   - `ChatMessage`: Messages with tree structure (parentId/childrenIds), supports branching
   - `Conversation`: Contains messages map, currentId for active chain, title
   - `MessageStatus`: pending → streaming → complete/error
   - `ConversationSummary`: Lightweight summary for list display

2. **Storage Layer** (`lib/chat/conversation-storage.ts`):
   - localStorage persistence under `dodoslide_conversations` key
   - Auto-trim to 50 conversations max
   - Functions: `saveConversations()`, `loadConversations()`, `clearConversations()`

3. **Conversation Manager** (`lib/chat/conversation-manager.ts`):
   - CRUD operations for conversations and messages
   - Message chain traversal from root to leaf
   - Streaming append support with `appendStreamingContent()` and `commitStreaming()`
   - Branch support via parentId/childrenIds

4. **Streaming Support** (`lib/providers/openai-strategy.ts`):
   - `callApiStream()`: SSE streaming via ReadableStream
   - `onDelta` callback for real-time token updates
   - Proper system role usage in messages array
   - AbortController support for cancellation

5. **Hooks**:
   - `useConversation`: React hook for conversation state management
   - `useStreaming`: Hook for SSE streaming API calls
   - `useMultiGeneration`: Hook for multi-slide generation with context preservation

### Theme System
- **Default theme**: Light mode (set in `use-app-state.ts`)
- **CSS Variables**: Defined in `index.css` for both `.dark` and `.light` scopes
- **Preview independence**: `--bg-preview-canvas` is always white regardless of theme
- **Glassmorphism**: `--glass-bg`, `--glass-border`, `--glass-shadow` for translucent effects

### Inspector System (Preview-to-Code Editing)
Allows users to click elements in the preview and edit styles/text that auto-syncs to JSX code. Inspector mode is **always active** when viewing the preview (no toggle button).

**Architecture:**
- `injectLocTags()` — Babel AST transform that injects `data-slide-loc="line:column"` on host JSX elements before transpilation
- `findSlideSource()` — Uses `el.closest('[data-slide-loc]')` to find source location from DOM elements
- `applyEdit()` — Pure function: JSX string + line/col + ops → modified JSX string. Handles `set-style`, `set-text`, `set-attr-asset`, `replace-placeholder-with-image`
- `InspectorProvider` — Edit buffering with optimistic DOM updates, commits to source on save
- `HistoryProvider` — Undo/redo with 500ms coalesce window
- `InspectOverlay` — Pointer event capture + blue highlight frame (selection + hover dual frame)
- `DesignPanel` — Element editing controls (font, color, alignment, text content). Pure element-editing panel without global design tokens.

**Right Panel Design:**
- Shows **"请点击元素进行风格设置"** placeholder when no element is selected
- When an element is clicked, displays element tag + editable properties (Content, Typography, Colors)
- Content editing available for elements with direct text children (including `<h1>`-`<h3>` with icons)
- Save/Cancel buttons rendered in the center preview area (not the design panel)
- Panel width: default 18% of viewport (min 12%, max 25%), collapsible to 48px

**Data Flow:**
1. User clicks element → `findSlideSource()` reads `data-slide-loc` → returns `{line, column, anchor}`
2. Anchor looked up fresh from DOM (not stored in state) via `[data-slide-loc]` query
3. User edits in DesignPanel → `bufferOps()` applies to DOM immediately (optimistic)
4. Edits buffered in buckets keyed by `"line:column"`
5. User clicks Save → `commitEdits()` calls `applyEdit()` for each bucket → `onCodeChange(newCode)`
6. Babel re-transpiles → React re-renders → fresh DOM with updated `data-slide-loc`

**Key Files:**
- `src/lib/inspector/loc-tags.ts` — `injectLocTags()`
- `src/lib/inspector/find-source.ts` — `findSlideSource()`
- `src/lib/inspector/apply-edit.ts` — `applyEdit()` (~700 lines)
- `src/lib/inspector/babel-walk.ts` — AST walker helpers
- `src/components/inspector/HistoryProvider.tsx` — Undo/redo
- `src/components/inspector/InspectorProvider.tsx` — Edit buffering (active defaults to true)
- `src/components/inspector/InspectOverlay.tsx` — Click capture + highlight (dual-frame)
- `src/components/design/DesignPanel.tsx` — Element editing UI

### AI Generation Flow
**Single Slide Generation:**
1. User enters prompt in EntryPhase (direct or guided mode)
2. Style prompt bundle is assembled via `getStylePromptBundle(styleId)` (style.txt + workflow.md + reference JSX)
3. `buildMessages()` places workflow & references in system message, style.txt in user message
4. `useAiGeneration().generate()` calls the API
5. Response is extracted via regex patterns
6. Code is applied to current slide via `slidesHook.updateCurrentSlideCode()`
7. Phase transitions to workspace for preview and refinement
8. User can send follow-up messages to modify the slide

**Multi-Slide Generation:**
1. User specifies page count in prompt (e.g., "Generate 5 slides about...")
2. `useMultiGeneration().generateSlides()` is called
3. For each slide, `buildMultiSlidePrompt()` creates prompt with context from previous slides
4. Slides are generated sequentially with progress tracking
5. All slides are applied via `slidesHook.setSlidesBulk()`
6. User can stop generation at any time

---

## Directory Structure

```
src/
├── main.tsx                    — React root mount
├── App.tsx                     — Main orchestrator: view routing, export logic
├── constants.ts                — DEFAULT_CODE: sample slide JSX
├── index.css                   — Tailwind imports + theme variables
├── hooks/
│   ├── use-slides.ts           — Slide CRUD, bulk operations
│   ├── use-app-state.ts        — View type, theme, canvas ratio, tabs
│   ├── use-slide-renderer.tsx  — JSX transpilation via Babel
│   └── use-multi-generation.ts — Multi-slide generation hook
├── components/
│   ├── landing/
│   │   └── LandingPage.tsx     — Hero page with feature cards
│   ├── ai-generate/
│   │   ├── AiGeneratePage.tsx  — Phase orchestrator (entry ↔ workspace)
│   │   ├── EntryPhase.tsx      — Glassmorphism chat + style cards
│   │   ├── WorkspacePhase.tsx  — Conversation list + AI sidebar + preview/code
│   │   ├── AiAssistantSidebar.tsx — Conversation UI with MessageBubble
│   │   ├── ConversationListSidebar.tsx — Conversation list with search/rename
│   │   ├── MessageBubble.tsx   — Message rendering with streaming/status support
│   │   ├── TemplateCard.tsx    — Style preset card with thumbnail
│   │   ├── ConversationPanel.tsx — Legacy panel (unused)
│   │   └── StylePanel.tsx      — Legacy panel (unused)
│   ├── slide/
│   │   ├── SlideSidebar.tsx    — Collapsible slide list
│   │   └── SlideThumbnail.tsx  — Mini preview with ResizeObserver
│   ├── editor/
│   │   └── CodeEditor.tsx      — Monaco editor wrapper
│   ├── preview/
│   │   └── SlidePreview.tsx    — Live preview with error display
│   ├── inspector/
│   │   ├── HistoryProvider.tsx  — Undo/redo system with coalescing
│   │   ├── InspectorProvider.tsx — Edit buffering and commit system
│   │   ├── InspectOverlay.tsx   — Click capture and highlight frame
│   │   ├── InspectorPanel.tsx   — Editing controls UI
│   │   └── index.ts            — Barrel exports
│   ├── header/
│   │   └── AppHeader.tsx       — Top nav (editor/preview tabs, controls)
│   ├── export/
│   │   └── ExportModal.tsx     — PPTX export dialog
│   ├── design/
│   │   ├── DesignPanel.tsx     — Element editing panel (Inspector mode UI)
│   │   └── DesignProvider.tsx  — Design tokens context (CSS variable injection)
│   ├── settings/
│   │   ├── ProviderList.tsx    — Provider list view
│   │   ├── ProviderListItem.tsx — Single provider row
│   │   ├── ProviderDetailEditor.tsx — Add/edit provider form
│   │   ├── ApiKeyInput.tsx     — Password input with show/hide
│   │   ├── ModelSelectInput.tsx — Combobox model selector
│   │   └── CustomEndpointEditor.tsx — Collapsible custom endpoints
│   ├── SettingsModal.tsx        — API configuration + Prompt settings
│   └── AiGenerationPanel.tsx    — Legacy panel (unused)
├── lib/
│   ├── canvas-config.ts        — 16:9 and 4:3 configurations
│   ├── theme-config.ts         — Dark/light theme definitions
│   ├── api-providers.ts        — Custom API provider + model fetching
│   ├── prompt-manager.ts       — System prompt + style prompt building
│   ├── use-ai-generation.ts    — AI generation hook with abort support
│   ├── pptx-exporter.ts        — DOM-to-PPTX conversion pipeline
│   ├── utils.ts                — cn() utility (clsx + tailwind-merge)
│   ├── inspector/
│   │   ├── loc-tags.ts         — injectLocTags() source location injection
│   │   ├── find-source.ts      — findSlideSource() element lookup
│   │   ├── apply-edit.ts       — applyEdit() AST-level source patching
│   │   ├── babel-walk.ts       — AST walker helpers (walkJsx, walkAll)
│   │   └── index.ts            — Barrel exports
│   ├── chat/
│   │   ├── types.ts            — ChatMessage, Conversation types
│   │   ├── conversation-storage.ts — localStorage persistence
│   │   ├── conversation-manager.ts — Conversation CRUD logic
│   │   ├── use-conversation.ts — React hook for conversations
│   │   ├── use-streaming.ts    — SSE streaming hook
│   │   └── code-extractor.ts   — Extract JSX from AI responses
│   └── providers/
│       ├── types.ts            — Provider, ApiCallOptions types
│       ├── api-strategy.ts     — Strategy registry
│       ├── openai-strategy.ts  — OpenAI-compatible API (streaming)
│       ├── provider-manager.ts — Provider CRUD
│       ├── provider-storage.ts — localStorage persistence
│       ├── provider-validator.ts — Provider validation
│       └── use-provider-manager.ts — React hook bridge
└── prompts/
    └── templates/
        ├── index.ts            — Template registry (15 styles) + category system + bundle accessors
        └── {style}/
            ├── style.txt       — Visual style prompt (required, ?raw import)
            ├── workflow.md      — Design methodology SOP (optional, ?raw import)
            └── reference_*.jsx  — Reference slide examples (optional, glob auto-discovery)
```

### Chrome Extension Directory
```
chrome-extension/
├── manifest.json               — Extension manifest
├── popup/                      — Popup window files
├── dist/                       — Build output
├── react-slide-to-pptx.zip     — Packaged extension
└── vite.config.ts              — Vite configuration
```

---

## Key Implementation Details

### Browser-Side JSX Transpilation
Babel runs in the browser to avoid a build step when the user edits code. The transpiled code is wrapped in a self-executing function that injects `React` and `lucide-react` as dependencies.

### DOM-to-PPTX Export Pipeline
On export, a `TreeWalker` traverses the rendered slide DOM and reconstructs it in `pptxgenjs`:
- Shapes → background fills, borders (symmetrical as `roundRect`/`rect`)
- SVG icons → serialized, base64-encoded, embedded as images
- Text → grouped by block-level ancestor, mapped to rich text objects
- Colors → resolved via 1×1 canvas trick (handles `oklch`, `color-mix`, `rgba`)

### Scaling System
Preview scales to fit viewport via `ResizeObserver`. Export coordinates are unscaled:
```js
pxToIn = (px / currentScale) * canvasConfig.pptxWidthIn / canvasConfig.width
```

### AI Provider System
- Only custom OpenAI-compatible APIs supported
- API settings stored in localStorage under `api_settings`
- Provider manager pattern with strategy registry for API formats
- AbortController support for cancelling generation
- **Streaming support**: `callApiStream()` uses SSE via ReadableStream for real-time token delivery
- **Message format**: Uses OpenAI messages array with proper system role (not single prompt)

### Prompt Assembly System
- **StylePromptBundle**: Combines style.txt (visual rules), workflow.md (design methodology), and reference JSX (few-shot examples)
- **Placement**: workflow.md & references go in system message; style.txt stays in user message
- **Backward compatible**: `buildMessages()` accepts either a plain string or a `StylePromptBundle`
- **Token control**: `PromptAssemblyOptions` allows disabling workflow/references per call
- **Auto-discovery**: Reference JSX files are loaded via `import.meta.glob('./**/reference_*.jsx')` — adding files to any style directory requires no code changes

### Resizable Panel System
- Uses `react-resizable-panels` library for drag-to-resize functionality
- **Editor view**: SlideSidebar (8-35%, collapsible) + Main content + Design panel (12-25%, collapsible)
- **AI workspace**: AI sidebar (20-45%) + Content area (55-100%)
- Panel sizes are automatically persisted to localStorage via `id` prop
- `Separator` component provides visual drag handle with hover effects
- `Group` component wraps panels with `orientation="horizontal"` for layout

---

## Development Guidelines

### Adding New Canvas Ratios
1. Update `CanvasRatio` type in `lib/canvas-config.ts`
2. Add configuration to `CANVAS_CONFIGS`
3. Test thumbnail rendering and export

### Adding New AI Styles
1. Create `src/prompts/templates/{name}/style.txt` with standardized 7-section format (required): color scheme table, typography system, layout patterns (6+), component patterns, decorative elements, prohibitions, quality checklist (P0/P1/P2)
2. Optionally add `workflow.md` (design methodology SOP with 6 phases) and `reference_*.jsx` (example slides)
3. Register in `src/prompts/templates/index.ts`: add style.txt import, workflow.md import if present, and template entry with `category` field (`business | creative | tech | editorial | general`)
4. Reference JSX files are auto-discovered via `import.meta.glob` — no import needed
5. Style is automatically available in EntryPhase template cards with category filtering

### Theme Extensions
1. Add CSS variables to both `.dark` and `.light` in `index.css`
2. Follow `--category-property` naming convention
3. Test in both modes across all components

### Adding New Hooks
- Extract complex state logic from components
- Share state between multiple components
- Encapsulate side effects (API calls, localStorage)

### Adding New Components
- Group related components in feature folders
- Keep components focused on single responsibility
- Use theme CSS variables for all colors

---

## Important Notes

1. **Default theme is light** — set in `use-app-state.ts`
2. **Preview background is always white** — uses `--bg-preview-canvas` variable
3. **Export triggers PPTX download** — not navigation to code editor
4. **Stop button available** — uses AbortController to cancel AI requests
5. **Multi-slide generation supported** — use `useMultiGeneration()` hook for sequential generation
6. **Settings button is global** — available in both editor and AI generation pages
7. **Panel sizes persist** — `react-resizable-panels` saves layout to localStorage automatically
8. **Conversation system** — Messages use tree structure with parentId/childrenIds for branching
9. **Streaming responses** — AI responses stream token-by-token via SSE (ReadableStream)
10. **Conversation history** — Last 10 messages sent as context for follow-up requests
11. **localStorage persistence** — Conversations stored under `dodoslide_conversations` key (max 50)
12. **Provider management** — Multiple API providers supported, managed via `useProviderManager()`
13. **Inspector auto-expand** — Clicking an element in the preview auto-expands the design panel if it's collapsed
14. **Design panel** — Purely element-specific editing (no global design tokens); shows placeholder when no element selected

## 自动化文档更新规则

每次完成重大任务（包括但不限于：新增功能、修改架构、添加新组件、
修改构建流程、新增依赖等）后，你必须：

1. 检查 README.md 是否需要更新（项目功能说明、使用方法、依赖变化等）
2. 检查 CLAUDE.md 是否需要更新（架构变化、新组件说明、开发指南等）
3. 如果需要，直接修改对应文件，确保文档与代码保持同步

## 端口清理规则

每次完成任务后，必须清理可能占用的端口：
```bash
kill $(lsof -t -i:3000) 2>/dev/null; kill $(lsof -t -i:24678) 2>/dev/null
```
- 端口 3000：Vite 开发服务器
- 端口 24678：Vite WebSocket 热更新服务
