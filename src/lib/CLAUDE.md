# Libraries and Utilities

这个文件夹包含核心库、配置文件和工具函数。

## 文件说明

### pptx-exporter.ts
PPTX 导出核心逻辑，将 DOM 元素转换为 PPTX 格式。

**主要函数:**

#### `exportSingleSlide()`
导出单个已渲染的 DOM 元素到 PPTX。

```typescript
export const exportSingleSlide = async (
  pres: pptxgen,                              // pptxgen 实例
  slideCode: string,                          // 幻灯片代码
  slideName: string,                          // 幻灯片名称
  containerRef: HTMLDivElement | null,        // DOM 容器引用
  canvasConfig: { width, height, pptxWidthIn }, // 画布配置
  scale: number                               // 当前缩放比例
): Promise<void>
```

**功能特性:**
- DOM 遍历和元素提取
- 颜色解析（支持 oklch, color-mix, rgba 等）
- SVG 图标处理（序列化、base64 编码）
- 形状绘制（矩形、圆角、边框）
- 富文本导出（字体、颜色、对齐）

#### `exportSlideByCode()`
通过代码渲染并导出幻灯片。

```typescript
export const exportSlideByCode = async (
  pres: pptxgen,                              // pptxgen 实例
  slideCode: string,                          // 幻灯片代码
  slideName: string,                          // 幻灯片名称
  canvasConfig: { width, height, pptxWidthIn } // 画布配置
): Promise<void>
```

**功能特性:**
- 创建临时 DOM 容器
- 使用 React 渲染幻灯片
- 调用 `exportSingleSlide` 导出
- 自动清理临时资源

### canvas-config.ts
画布配置和比例定义。

**类型定义:**
```typescript
export type CanvasRatio = '16:9' | '4:3';

export interface CanvasConfig {
  ratio: CanvasRatio;
  label: string;
  icon: string;
  width: number;
  height: number;
  pptxWidthIn: number;
  pptxHeightIn: number;
  pptxLayout: string;
}
```

**配置示例:**
```typescript
export const CANVAS_CONFIGS: Record<CanvasRatio, CanvasConfig> = {
  '16:9': {
    ratio: '16:9',
    label: '16:9',
    icon: '📺',
    width: 1280,
    height: 720,
    pptxWidthIn: 10,
    pptxHeightIn: 5.625,
    pptxLayout: 'LAYOUT_16x9'
  },
  '4:3': {
    ratio: '4:3',
    label: '4:3',
    icon: '📱',
    width: 1024,
    height: 768,
    pptxWidthIn: 10,
    pptxHeightIn: 7.5,
    pptxLayout: 'LAYOUT_4x3'
  }
};
```

**辅助函数:**
```typescript
export const getCanvasConfig = (ratio: CanvasRatio): CanvasConfig => {
  return CANVAS_CONFIGS[ratio];
};
```

### theme-config.ts
主题配置和样式定义。

**类型定义:**
```typescript
export type AppTheme = 'dark' | 'light';

export interface ThemeConfig {
  id: AppTheme;
  label: string;
  icon: string;
  description: string;
  rootClass: string;
  monacoTheme: string;
}
```

**配置示例:**
```typescript
export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  dark: {
    id: 'dark',
    label: '深色',
    icon: '🌙',
    description: '深蓝灰色调，适合长时间使用',
    rootClass: 'dark',
    monacoTheme: 'vs-dark'
  },
  light: {
    id: 'light',
    label: '浅色',
    icon: '☀️',
    description: '明亮简洁，适合演示环境',
    rootClass: 'light',
    monacoTheme: 'vs'
  }
};
```

**辅助函数:**
```typescript
export const getThemeConfig = (theme: AppTheme): ThemeConfig => {
  return THEME_CONFIGS[theme];
};
```

### api-providers.ts
API 提供商配置和模型获取。

**类型定义:**
```typescript
export type ApiProvider = 'custom';

export interface ApiProviderConfig {
  id: ApiProvider;
  name: string;
  description: string;
  endpoint: string;
  apiKeyEnvVar: string;
  modelParam: string;
  defaultModel: string;
  supportedModels: string[];
}

export interface ApiSettings {
  provider: ApiProvider;
  customEndpoint: string;
  customModel: string;
  customApiKey: string;
  geminiApiKey: string;
  openaiApiKey: string;
  anthropicApiKey: string;
}
```

**主要函数:**

#### `listModels()`
获取可用模型列表。

```typescript
export const listModels = async (
  provider: ApiProvider,
  apiKey: string,
  customEndpoint?: string
): Promise<{ success: boolean; models?: string[]; error?: string }>
```

**功能特性:**
- 支持多种响应格式（OpenAI、直接数组等）
- 完善的错误处理
- 模型列表排序和过滤

#### `loadApiSettings() / saveApiSettings()`
API 设置的持久化。

```typescript
export const loadApiSettings = (): ApiSettings => {
  const stored = localStorage.getItem('api_settings');
  return stored ? { ...DEFAULT_API_SETTINGS, ...JSON.parse(stored) } : DEFAULT_API_SETTINGS;
};

export const saveApiSettings = (settings: ApiSettings): void => {
  localStorage.setItem('api_settings', JSON.stringify(settings));
};
```

### prompt-manager.ts
系统提示词管理。

**类型定义:**
```typescript
export interface PromptSettings {
  customPrompt: string;
  useDefaultPrompt: boolean;
  userInstructions: string;
}
```

**默认提示词:**
```typescript
export const DEFAULT_SYSTEM_PROMPT = `
你是一个专业的幻灯片设计师和 React 开发者。
你的任务是根据用户的需求生成高质量的 React 组件代码，
用于创建幻灯片内容。

要求：
1. 使用 TypeScript 或 JavaScript
2. 导出默认组件
3. 使用 Tailwind CSS 进行样式设计
4. 支持 lucide-react 图标
5. 代码应该简洁、清晰、易于维护
...
`.trim();
```

**主要函数:**

#### `buildFullPrompt()`
构建完整的 AI 提示词。

```typescript
export const buildFullPrompt = (
  userInput: string,
  settings: PromptSettings
): string => {
  const systemPrompt = settings.useDefaultPrompt
    ? DEFAULT_SYSTEM_PROMPT
    : settings.customPrompt;

  return `${systemPrompt}

${settings.userInstructions ? `额外要求：${settings.userInstructions}` : ''}

用户需求：${userInput}`;
};
```

### use-ai-generation.ts
AI 生成功能的 Hook。

**返回值:**
```typescript
{
  isGenerating: boolean;
  error: string | null;
  lastGeneratedCode: string | null;
  generate: (userInput: string) => Promise<AiGenerationResult>;
  clearError: () => void;
  apiSettings: ApiSettings;
  updateApiSettings: (settings: Partial<ApiSettings>) => void;
  promptSettings: PromptSettings;
  updatePromptSettings: (settings: Partial<PromptSettings>) => void;
}
```

**主要功能:**
- 代码提取和解析
- 自定义 API 调用
- 错误处理
- 设置持久化

### utils.ts
工具函数。

#### `cn()`
合并 classnames，支持 Tailwind CSS 类名冲突解决。

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**使用示例:**
```typescript
cn('px-4 py-2', isActive && 'bg-blue-500', 'rounded-lg')
// 结果: 'px-4 py-2 bg-blue-500 rounded-lg'
```

## 核心算法

### DOM 遍历算法
```typescript
const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
let node = walker.nextNode() as HTMLElement;

while (node) {
  // 处理每个元素
  processElement(node);
  node = walker.nextNode() as HTMLElement;
}
```

### 颜色解析算法
```typescript
const parseColor = (colorStr: string, opacityStr = '1') => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1; tempCanvas.height = 1;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = colorStr;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  const alpha = (a / 255) * parseFloat(opacityStr || '1');

  return {
    color: [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join(''),
    transparency: Math.round((1 - alpha) * 100),
    isTransparent: alpha < 0.05,
    alpha: alpha,
    rgba: `rgba(${r}, ${g}, ${b}, ${alpha})`
  };
};
```

### 不透明度计算
```typescript
const getEffectiveOpacity = (el: HTMLElement, stopAt: HTMLElement) => {
  let op = 1;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    op *= parseFloat(style.opacity || '1');
    if (current === stopAt) break;
    current = current.parentElement;
  }

  return op;
};
```

## 使用示例

### 导出单个幻灯片
```typescript
import { exportSingleSlide } from './lib/pptx-exporter';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';

await exportSingleSlide(
  pres,
  slideCode,
  'Slide 1',
  previewRef.current,
  canvasConfig,
  scale
);

await pres.writeFile({ fileName: 'slide1.pptx' });
```

### 获取画布配置
```typescript
import { getCanvasConfig, CANVAS_CONFIGS } from './lib/canvas-config';

const config = getCanvasConfig('16:9');
console.log(config.width, config.height); // 1280, 720

const allConfigs = Object.values(CANVAS_CONFIGS);
```

### 获取主题配置
```typescript
import { getThemeConfig, THEME_CONFIGS } from './lib/theme-config';

const theme = getThemeConfig('dark');
console.log(theme.monacoTheme); // 'vs-dark'

const allThemes = Object.values(THEME_CONFIGS);
```

### API 模型获取
```typescript
import { listModels } from './lib/api-providers';

const result = await listModels('custom', apiKey, endpoint);
if (result.success) {
  console.log('Available models:', result.models);
} else {
  console.error('Error:', result.error);
}
```

### 构建提示词
```typescript
import { buildFullPrompt } from './lib/prompt-manager';

const prompt = buildFullPrompt(
  '创建一个关于人工智能的幻灯片',
  {
    customPrompt: '',
    useDefaultPrompt: true,
    userInstructions: '使用蓝色主题，包含图标'
  }
);
```

## 扩展指南

### 添加新的画布比例
```typescript
// 1. 更新类型
export type CanvasRatio = '16:9' | '4:3' | '1:1';

// 2. 添加配置
export const CANVAS_CONFIGS: Record<CanvasRatio, CanvasConfig> = {
  '16:9': { /* ... */ },
  '4:3': { /* ... */ },
  '1:1': {
    ratio: '1:1',
    label: '1:1',
    icon: '🔲',
    width: 1080,
    height: 1080,
    pptxWidthIn: 10,
    pptxHeightIn: 10,
    pptxLayout: 'LAYOUT_16x9' // 使用最接近的布局
  }
};
```

### 添加新的主题
```typescript
// 1. 更新类型
export type AppTheme = 'dark' | 'light' | 'auto';

// 2. 添加配置
export const THEME_CONFIGS: Record<AppTheme, ThemeConfig> = {
  'dark': { /* ... */ },
  'light': { /* ... */ },
  'auto': {
    id: 'auto',
    label: '自动',
    icon: '🌓',
    description: '根据系统设置自动切换',
    rootClass: 'dark', // 默认值
    monacoTheme: 'vs-dark'
  }
};
```

### 添加新的 API 提供商
```typescript
// 1. 更新类型
export type ApiProvider = 'custom' | 'newProvider';

// 2. 添加配置
export const API_PROVIDERS: Record<ApiProvider, ApiProviderConfig> = {
  'custom': { /* ... */ },
  'newProvider': {
    id: 'newProvider',
    name: 'New Provider',
    description: 'Description',
    endpoint: 'https://api.example.com',
    apiKeyEnvVar: 'NEW_PROVIDER_API_KEY',
    modelParam: 'model',
    defaultModel: 'default-model',
    supportedModels: []
  }
};
```

## 注意事项

1. **性能优化**: DOM 遍历和颜色解析可能较慢，考虑使用 Web Worker
2. **内存管理**: 临时 DOM 容器使用后及时清理
3. **错误处理**: 所有外部 API 调用都需要完善的错误处理
4. **类型安全**: 使用 TypeScript 严格模式确保类型安全
5. **兼容性**: PPTX 导出功能需要考虑不同 Office 版本的兼容性
