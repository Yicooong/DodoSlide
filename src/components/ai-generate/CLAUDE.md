# AI Generate Components

Phase-based AI slide generation interface with glassmorphism UI.

## Architecture

The AI generation page uses internal phase state within a single component:

```
AiGeneratePage (phase orchestrator)
├── EntryPhase (phase: 'entry')
│   ├── Quick prompt cards
│   ├── Glassmorphism chat box
│   │   ├── Direct input mode
│   │   └── Guided input mode
│   ├── Canvas ratio selector
│   └── Style template cards
└── WorkspacePhase (phase: 'workspace')
    ├── AiAssistantSidebar (30%)
    │   ├── Message history
    │   ├── Quick action buttons
    │   └── Input field
    └── Content area (70%)
        ├── Tab switcher (preview/code)
        ├── Preview with white background
        └── Code display
```

## Key Components

### AiGeneratePage.tsx
Phase orchestrator that manages transitions between entry and workspace.

**Props:**
```typescript
{
  onNavigate: (view: ViewType) => void;
  onExport: () => void;           // Trigger PPTX export
  onStopGenerate: () => void;     // Abort AI request
  aiGen: AiGenerationState;
  canvasRatio: CanvasRatio;
  slidesHook: SlidesHook;
}
```

**State:**
- `phase: 'entry' | 'workspace'` — Current UI phase
- `context: GenerationContext` — User input and selections
- `messages: ChatMessage[]` — Conversation history

### EntryPhase.tsx
Entry state UI with centered glassmorphism chat box.

**Features:**
- Quick prompt cards (产品发布, 技术分享, 商业路演, 季度汇报)
- Direct input mode (free text)
- Guided input mode (purpose, scenario, tone fields)
- Canvas ratio selector (16:9 / 4:3)
- Style template cards with selection

### WorkspacePhase.tsx
Workspace state with AI sidebar and content area.

**Props:**
```typescript
{
  slides: Slide[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  updateCurrentSlideCode: (code: string) => void;
  canvasRatio: CanvasRatio;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating: boolean;
  error: string | null;
  onRetry: () => void;
  onBack: () => void;
  onExport: () => void;
  onStopGenerate: () => void;
}
```

**Features:**
- Stop button during generation (red, calls onStopGenerate)
- Export button triggers PPTX download (not navigation)
- Preview uses `--bg-preview-canvas` (always white)

### AiAssistantSidebar.tsx
Compact conversation sidebar for AI interaction.

**Features:**
- Message history with user/AI avatars
- Quick action buttons (把背景调深一点, 增加数据图表, etc.)
- Input field for follow-up instructions
- Error display with retry button

### TemplateCard.tsx
Style preset card with mini preview thumbnail.

**Props:**
```typescript
{
  template: StyleTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

## Flow

1. User enters prompt in EntryPhase
2. `handleStartGenerate()` builds prompt with style
3. Phase transitions to workspace with animation
4. `aiGen.generate()` calls API
5. Response extracted and applied to slide
6. User can preview and send follow-up messages
7. Export button triggers PPTX download

## Animation

Uses `motion` `AnimatePresence` for phase transitions:
- Entry → Workspace: scale up + fade in
- Workspace → Entry: scale down + fade out

## Styling

- Glassmorphism: `backdrop-blur-xl bg-white/10 dark:bg-black/10`
- Preview background: `var(--bg-preview-canvas)` (always white)
- Accent color: `var(--accent)` (#6366f1)
- Stop button: `#EF4444` (red)
