# AI Generate Components

Phase-based AI slide generation interface with glassmorphism UI and conversation system.

## Architecture

The AI generation page uses internal phase state within a single component:

```
AiGeneratePage (phase orchestrator)
├── EntryPhase (phase: 'entry')
│   ├── Quick prompt cards (产品发布, 技术分享, 商业路演, 季度汇报)
│   ├── Glassmorphism chat box
│   │   ├── Direct input mode (free text)
│   │   └── Guided input mode (purpose, scenario, tone fields)
│   ├── Canvas ratio selector (16:9 / 4:3)
│   └── Style template cards (5 presets with thumbnails)
└── WorkspacePhase (phase: 'workspace')
    ├── ConversationListSidebar (left, collapsible, default 15%)
    │   ├── Search bar
    │   ├── Conversation list with rename/delete
    │   └── Create new conversation button
    ├── AiAssistantSidebar (middle, resizable, default 25%)
    │   ├── Message history (MessageBubble components)
    │   ├── Quick action buttons
    │   └── Input field for follow-up instructions
    └── Content area (right, resizable, default 60%)
        ├── Tab switcher (preview/code)
        ├── Preview with white background (--bg-preview-canvas)
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
- `conversations: ConversationSummary[]` — All conversations
- `activeConversationId: string | null` — Current conversation

### EntryPhase.tsx
Entry state UI with centered glassmorphism chat box.

**Features:**
- Quick prompt cards (产品发布, 技术分享, 商业路演, 季度汇报)
- Direct input mode (free text)
- Guided input mode (purpose, scenario, tone fields)
- Canvas ratio selector (16:9 / 4:3)
- Style template cards with selection (5 presets)

### WorkspacePhase.tsx
Workspace state with conversation list, AI sidebar, and content area.

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
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSwitchConversation: (id: string) => void;
  onCreateConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
}
```

**Features:**
- Left: ConversationListSidebar (collapsible, search/rename/delete)
- Middle: AiAssistantSidebar (resizable, message history)
- Right: Preview/code area (resizable, tab switching)
- Stop button during generation (red, calls onStopGenerate)
- Export button triggers PPTX download (not navigation)
- Preview uses `--bg-preview-canvas` (always white)
- Panel sizes persisted to localStorage via `react-resizable-panels`

### ConversationListSidebar.tsx
Conversation list sidebar with search and management.

**Props:**
```typescript
{
  conversations: ConversationSummary[];  // All conversations
  activeId: string | null;               // Current active conversation
  onSwitch: (id: string) => void;        // Switch conversation
  onCreate: () => void;                  // Create new conversation
  onDelete: (id: string) => void;        // Delete conversation
  onRename: (id: string, title: string) => void;  // Rename conversation
}
```

**Features:**
- Search bar to filter conversations
- Displays conversation title, message count, relative time
- Hover-revealed delete and rename buttons
- Active conversation highlighted
- "New Conversation" button at top

### AiAssistantSidebar.tsx
AI conversation sidebar with message history.

**Props:**
```typescript
{
  messages: ChatMessage[];          // Message history
  isGenerating: boolean;           // Whether AI is generating
  error: string | null;            // Error message
  onSendMessage: (msg: string) => void;  // Send message callback
  onRetry: (messageId: string) => void;   // Retry callback
  onStopGenerate: () => void;      // Stop generation callback
}
```

**Features:**
- Message history with user/AI avatars (MessageBubble components)
- Quick action buttons (把背景调深一点, 增加数据图表, etc.)
- Input field for follow-up instructions
- Error display with retry button
- Stop button during generation (red, uses AbortController)

### MessageBubble.tsx
Message rendering component with streaming and status support.

**Props:**
```typescript
{
  message: ChatMessage;          // Message object
  onRetry?: (messageId: string) => void;  // Retry callback (optional)
}
```

**Features:**
- Displays user and AI messages with avatars
- Streaming animation for AI responses (typing indicator)
- Status indicators: pending → streaming → complete/error
- Design summary extraction (background color, layout type, icons used)
- Retry button for failed messages
- Copy code button for AI responses
- Timestamp display

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

**Features:**
- Displays style name, description, thumbnail preview
- Selected state with accent border and background
- Hover effects
- Thumbnail shows actual rendered JSX example

## Flow

### Single Slide Generation:
1. User enters prompt in EntryPhase (direct or guided mode)
2. Selects style template and canvas ratio
3. `handleStartGenerate()` builds prompt with style bundle
4. Phase transitions to workspace with animation
5. `aiGen.generate()` calls API with streaming
6. Response extracted and applied to current slide
7. User can preview and send follow-up messages
8. Export button triggers PPTX download

### Multi-Slide Generation:
1. User specifies page count in prompt (e.g., "Generate 5 slides about...")
2. `useMultiGeneration().generateSlides()` is called
3. For each slide, `buildMultiSlidePrompt()` creates prompt with context
4. Slides generated sequentially with progress tracking
5. All slides applied via `slidesHook.setSlidesBulk()`
6. User can stop generation at any time

## Animation

Uses `motion` `AnimatePresence` for phase transitions:
- Entry → Workspace: scale up + fade in
- Workspace → Entry: scale down + fade out
- Message bubbles: slide in from left/right

## Styling

- Glassmorphism: `backdrop-blur-xl bg-white/10 dark:bg-black/10`
- Preview background: `var(--bg-preview-canvas)` (always white)
- Accent color: `var(--accent)` (#6366f1)
- Stop button: `#EF4444` (red)
- Glass effects: `--glass-bg`, `--glass-border`, `--glass-shadow`
