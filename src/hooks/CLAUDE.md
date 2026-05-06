# Hooks Layer

Custom React Hooks for state management and business logic.

## use-slides.ts

Manages slide array CRUD operations and current slide selection.

**Key Methods:**
```typescript
{
  slides: Slide[];
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  updateCurrentSlideCode: (code: string) => void;
  addNewSlide: () => void;
  deleteSlide: (index: number) => void;
  renameSlide: (index: number, name: string) => void;
  duplicateSlide: (index: number) => void;
  setSlidesBulk: (slides: Slide[]) => void;      // Replace all slides
  setSlideCode: (index: number, code: string) => void; // Update specific slide
}
```

**Usage:**
```typescript
const { slides, currentSlideIndex, updateCurrentSlideCode, addNewSlide } = useSlides();
```

## use-app-state.ts

Manages app-wide UI state including view routing, theme, and canvas ratio.

**Key Properties:**
```typescript
{
  viewType: 'landing' | 'ai-generate' | 'code' | 'preview'; // Current view
  setViewType: (view: ViewType) => void;
  activeTab: 'preview' | 'code';
  canvasRatio: CanvasRatio;
  appTheme: AppTheme;        // Default: 'light'
  sidebarCollapsed: boolean;
  themeConfig: ThemeConfig;
  canvasConfig: CanvasConfig;
}
```

**View Routing:**
- `landing` → LandingPage with hero section
- `ai-generate` → AI generation with phase-based UI
- `code` / `preview` → Monaco editor + live preview

## use-slide-renderer.tsx

Handles JSX code transpilation via Babel and safe component rendering.

**Input:** `code: string` — JSX code to render

**Returns:**
```typescript
{
  transpiledCode: string;
  error: string | null;
  RenderedSlide: React.FC;
}
```

**Built-in Components:**
- `ErrorBoundary` — Catches rendering errors
- `ErrorBoundaryWrapper` — ErrorBoundary wrapper

## Design Principles

1. **Single Responsibility**: Each hook manages one domain
2. **State Encapsulation**: Complex logic hidden inside hooks
3. **Reusability**: Hooks can be used across multiple components
4. **Type Safety**: Full TypeScript type definitions

## Common Patterns

```typescript
// Combine multiple hooks
const slidesHook = useSlides();
const appState = useAppState();
const renderer = useSlideRenderer(slidesHook.slides[slidesHook.currentSlideIndex]?.code || '');

// State updates trigger re-renders automatically
const handleAddSlide = () => slidesHook.addNewSlide();
```
