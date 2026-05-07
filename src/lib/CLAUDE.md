# Libraries and Utilities

Core libraries, configuration files, utility functions, and system modules.

## Core Modules

### pptx-exporter.ts
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

### canvas-config.ts
Canvas ratio configurations.

```typescript
type CanvasRatio = '16:9' | '4:3';

// 16:9: 1280×720, pptxWidthIn: 10, pptxHeightIn: 5.625
// 4:3:  1024×768, pptxWidthIn: 10, pptxHeightIn: 7.5
```

### theme-config.ts
Dark/light theme definitions.

```typescript
type AppTheme = 'dark' | 'light';
// Default: 'light'
```

### use-ai-generation.ts
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

### prompt-manager.ts
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

### api-providers.ts (Deprecated)
Custom API provider configuration and model fetching.
**Note:** Use `providers/` modules instead.

```typescript
listModels(provider, apiKey, customEndpoint?)  // Fetch available models
loadApiSettings() / saveApiSettings()          // localStorage persistence
```

### utils.ts
```typescript
cn(...inputs)  // Merge classnames with Tailwind conflict resolution
```

## Chat System (`chat/`)

### types.ts
Chat message and conversation types.

```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status: MessageStatus;  // 'pending' | 'streaming' | 'complete' | 'error'
  parentId: string | null;
  childrenIds: string[];
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Record<string, ChatMessage>;
  currentId: string | null;  // Current message chain
  createdAt: number;
  updatedAt: number;
}

type MessageStatus = 'pending' | 'streaming' | 'complete' | 'error';
```

### conversation-storage.ts
localStorage persistence for conversations.

```typescript
saveConversations(conversations: ConversationSummary[])  // Save to localStorage
loadConversations(): ConversationSummary[]              // Load from localStorage
clearConversations()                                   // Clear all conversations
```

**Storage Key:** `dodoslide_conversations`
**Max Conversations:** 50 (auto-trim)

### conversation-manager.ts
Conversation CRUD logic with tree structure support.

```typescript
createConversation(): Conversation
deleteConversation(id: string)
addMessage(conversationId: string, message: ChatMessage)
updateMessage(conversationId: string, messageId: string, updates: Partial<ChatMessage>)
appendStreamingContent(conversationId: string, messageId: string, delta: string)  // For streaming
commitStreaming(conversationId: string, messageId: string)  // Finalize streaming message
getMessagesChain(conversationId: string): ChatMessage[]  // Get message chain from root to leaf
```

### use-conversation.ts
React hook for conversation state management.

```typescript
{
  conversations: ConversationSummary[];
  activeConversation: Conversation | null;
  activeConversationId: string | null;
  createConversation: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
}
```

### use-streaming.ts
SSE streaming hook for API calls.

```typescript
{
  isStreaming: boolean;
  error: string | null;
  stream: (messages: Message[], onDelta: (text: string) => void) => Promise<string>;
  abort: () => void;
}
```

### code-extractor.ts
Extract JSX code from AI responses.

```typescript
extractCodeFromResponse(response: string): string | null
// Uses regex patterns to find JSX code blocks
```

## Providers System (`providers/`)

### types.ts
Provider and API call types.

```typescript
interface Provider {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  meta?: ProviderMeta;
  createdAt: number;
  sortIndex: number;
}

interface ApiCallOptions {
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}

interface CustomEndpoint {
  name: string;
  url: string;
  description?: string;
}
```

### api-strategy.ts
Strategy registry for different API formats.

```typescript
registerStrategy(provider: Provider, strategy: ApiStrategy)
getStrategy(provider: Provider): ApiStrategy
```

### openai-strategy.ts
OpenAI-compatible API strategy with streaming support.

```typescript
callApi(options: ApiCallOptions): Promise<string>  // Non-streaming call
callApiStream(options: ApiCallOptions): Promise<string>  // Streaming call with onDelta
listModels(provider: Provider): Promise<string[]>  // Fetch available models
```

**Features:**
- SSE streaming via ReadableStream
- Proper OpenAI messages array format
- AbortController support
- onDelta callback for real-time token updates

### provider-manager.ts
Provider CRUD operations.

```typescript
createProvider(data: Omit<Provider, 'id' | 'createdAt' | 'sortIndex'>): Provider
updateProvider(id: string, updates: Partial<Provider>): Provider
deleteProvider(id: string)
switchProvider(id: string)
listProviders(): Provider[]
getCurrentProvider(): Provider | null
```

### provider-storage.ts
localStorage persistence for providers.

```typescript
saveProviders(providers: Provider[])
loadProviders(): Provider[]
```

**Storage Key:** `api_providers`

### provider-validator.ts
Provider validation utilities.

```typescript
validateProvider(provider: Partial<Provider>): ValidationResult
testConnection(provider: Provider): Promise<ConnectionTestResult>
normalizeEndpointUrl(url: string): string  // Strip /chat/completions suffixes
```

### use-provider-manager.ts
React hook bridge for provider management.

```typescript
{
  providers: Provider[];
  currentProvider: Provider | null;
  createProvider: (data) => void;
  updateProvider: (id, updates) => void;
  deleteProvider: (id) => void;
  switchProvider: (id) => void;
  testConnection: (provider) => Promise<ConnectionTestResult>;
  listModels: (provider) => Promise<string[]>;
}
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

### Scaling System
Preview scales to fit viewport via ResizeObserver. Export coordinates are unscaled:
```javascript
pxToIn = (px / currentScale) * canvasConfig.pptxWidthIn / canvasConfig.width
```
