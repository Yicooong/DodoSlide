# Hooks Layer

这个文件夹包含自定义 React Hooks，用于封装状态管理和业务逻辑。

## 文件说明

### use-slides.ts
管理幻灯片数组的 CRUD 操作和当前幻灯片选择。

**返回值:**
```typescript
{
  slides: Slide[];              // 所有幻灯片数组
  currentSlideIndex: number;    // 当前选中的幻灯片索引
  setCurrentSlideIndex: (index: number) => void;  // 设置当前幻灯片
  updateCurrentSlideCode: (code: string) => void; // 更新当前幻灯片代码
  addNewSlide: () => void;      // 添加新幻灯片
  deleteSlide: (index: number) => void;  // 删除指定幻灯片
  renameSlide: (index: number, name: string) => void; // 重命名幻灯片
  duplicateSlide: (index: number) => void; // 复制幻灯片
}
```

**使用示例:**
```typescript
const {
  slides,
  currentSlideIndex,
  updateCurrentSlideCode,
  addNewSlide
} = useSlides();
```

### use-app-state.ts
管理应用范围的 UI 状态，包括主题、画布比例、标签页切换等。

**返回值:**
```typescript
{
  activeTab: 'preview' | 'code';     // 当前激活的标签页
  setActiveTab: (tab: 'preview' | 'code') => void;
  canvasRatio: CanvasRatio;           // 当前画布比例 ('16:9' | '4:3')
  setCanvasRatio: (ratio: CanvasRatio) => void;
  appTheme: AppTheme;                 // 当前主题 ('dark' | 'light')
  setAppTheme: (theme: AppTheme) => void;
  sidebarCollapsed: boolean;          // 侧边栏是否折叠
  setSidebarCollapsed: (collapsed: boolean) => void;
  themeConfig: ThemeConfig;           // 当前主题配置对象
  canvasConfig: CanvasConfig;         // 当前画布配置对象
}
```

**使用示例:**
```typescript
const {
  activeTab,
  setActiveTab,
  appTheme,
  themeConfig
} = useAppState();
```

### use-slide-renderer.tsx
处理 JSX 代码的转译和安全渲染，包含错误边界组件。

**输入:**
- `code: string` - 要渲染的 JSX 代码字符串

**返回值:**
```typescript
{
  transpiledCode: string;    // 转译后的代码
  error: string | null;      // 渲染错误信息
  RenderedSlide: React.FC;  // 安全渲染的组件
}
```

**内置组件:**
- `ErrorBoundary` - 捕获子组件渲染错误
- `ErrorBoundaryWrapper` - ErrorBoundary 的包装器

**使用示例:**
```typescript
const {
  transpiledCode,
  error,
  RenderedSlide
} = useSlideRenderer(currentCode);

// 在 JSX 中使用
<RenderedSlide />
```

## 设计原则

1. **单一职责**: 每个 hook 只负责一个特定的功能领域
2. **状态封装**: 复杂的状态逻辑隐藏在 hook 内部
3. **复用性**: hook 可以在多个组件中复用
4. **类型安全**: 所有 hook 都有完整的 TypeScript 类型定义

## 常见使用模式

### 在组件中组合多个 hooks
```typescript
const slidesHook = useSlides();
const appState = useAppState();
const renderer = useSlideRenderer(slidesHook.slides[slidesHook.currentSlideIndex]?.code || '');
```

### 与组件交互
```typescript
// 状态更新会自动触发组件重渲染
const handleAddSlide = () => {
  slidesHook.addNewSlide();
};

// 状态改变影响 UI
const showPreview = appState.activeTab === 'preview';
```

## 注意事项

1. **依赖管理**: 确保 hook 的依赖项正确，避免无限循环
2. **性能优化**: 对于复杂的计算，考虑使用 `useMemo` 和 `useCallback`
3. **错误处理**: 所有 hook 都应该妥善处理错误情况
4. **类型安全**: 使用 TypeScript 类型检查确保数据流正确
