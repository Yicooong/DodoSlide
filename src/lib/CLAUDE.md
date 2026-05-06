# Libraries and Utilities

Core libraries, configuration files, and utility functions.

## pptx-exporter.ts

DOM-to-PPTX conversion pipeline.

**Main Functions:**

```typescript
// Export a rendered DOM element to PPTX
exportSingleSlide(pres, slideCode, slideName, containerRef, canvasConfig, scale)

// Render slide code to temp DOM, then export
exportSlideByCode(pres, slideCode, slideName, canvasConfig)
```

**Features:**
- TreeWalker DOM traversal
- Color parsing (oklch, color-mix, rgba via canvas trick)
- SVG icon handling (serialize, base64 encode)
- Shape drawing (rect, roundRect, border lines)
- Rich text export (font size px→pt ×0.75, bold, italic, color)

## canvas-config.ts

Canvas ratio configurations.

```typescript
type CanvasRatio = '16:9' | '4:3';

// 16:9: 1280×720, pptxWidthIn: 10, pptxHeightIn: 5.625
// 4:3:  1024×768, pptxWidthIn: 10, pptxHeightIn: 7.5
```

## theme-config.ts

Dark/light theme definitions.

```typescript
type AppTheme = 'dark' | 'light';
// Default: 'light'
```

## use-ai-generation.ts

AI generation hook with abort support.

**Returns:**
```typescript
{
  isGenerating: boolean;
  error: string | null;
  lastGeneratedCode: string | null;
  generate: (userInput: string, canvasRatio?: CanvasRatio) => Promise<AiGenerationResult>;
  stopGenerate: () => void;    // Abort current request
  clearError: () => void;
  providerManager: UseProviderManagerReturn;
  promptSettings: PromptSettings;
  updatePromptSettings: (settings: Partial<PromptSettings>) => void;
}
```

**Key Features:**
- AbortController for cancellation
- Code extraction from AI responses (regex patterns)
- Provider manager for API calls
- Prompt settings persistence

## prompt-manager.ts

System prompt and style prompt management with bundle support.

**Functions:**
```typescript
buildFullPrompt(userInput, settings, canvasRatio?)                    // Build complete prompt (legacy)
buildStylePrompt(userInput, stylePrompt, settings, canvasRatio?)     // Build prompt with style section
buildMessages(systemPrompt, history, input, styleOrBundle, settings?) // Build messages array (supports bundle)
buildMultiSlidePrompt(input, index, total, summary, styleOrBundle?)   // Multi-slide prompt (supports bundle)
```

**StylePromptBundle** (from templates/index.ts):
- `stylePrompt` — Visual style rules from style.txt (required)
- `workflowPrompt` — Design methodology from workflow.md (optional, goes in system message)
- `referenceExamples` — Reference JSX examples (optional, goes in system message as few-shot)

**PromptAssemblyOptions:**
- `includeWorkflow` — Include workflow.md in system message (default: true)
- `includeReferences` — Include reference JSX in system message (default: true)
- `maxReferences` — Limit number of references (default: all)

## api-providers.ts

Custom API provider configuration and model fetching.

```typescript
listModels(provider, apiKey, customEndpoint?)  // Fetch available models
loadApiSettings() / saveApiSettings()          // localStorage persistence
```

## utils.ts

```typescript
cn(...inputs)  // Merge classnames with Tailwind conflict resolution
```

## Key Algorithms

### Color Resolution (Canvas Trick)
```typescript
const parseColor = (colorStr, opacityStr = '1') => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = colorStr;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  // Returns hex color, transparency, alpha
};
```

### Opacity Inheritance
```typescript
const getEffectiveOpacity = (el, stopAt) => {
  // Walk up DOM tree, multiply opacity values
};
```
