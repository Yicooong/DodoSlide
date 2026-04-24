# Preview Components

这个文件夹包含幻灯片预览相关的 UI 组件。

## 文件说明

### SlidePreview.tsx
幻灯片预览组件，提供实时预览和错误显示功能。

**Props:**
```typescript
interface SlidePreviewProps {
  canvasConfig: CanvasConfig;        // 画布配置对象
  scale: number;                     // 当前缩放比例
  error: string | null;              // 错误信息
  children: React.ReactNode;         // 渲染的幻灯片内容
  containerRef: React.RefObject<HTMLDivElement>;   // 容器引用
  previewRef: React.RefObject<HTMLDivElement>;     // 预览区域引用
  onScaleChange: (scale: number) => void;        // 缩放变化回调
}
```

**功能特性:**
- **自适应缩放**: 使用 ResizeObserver 自动计算最佳缩放比例
- **实时预览**: 实时显示幻灯片渲染结果
- **错误显示**: 使用动画显示代码解析错误
- **画布适配**: 支持 16:9 和 4:3 两种画布比例

## 组件结构

```tsx
<div className="flex-grow flex items-center justify-center p-12 overflow-hidden">
  {/* 幻灯片容器 */}
  <div ref={containerRef} style={{ maxWidth: 根据比例, aspectRatio: 根据比例 }}>
    {/* 缩放后的预览区域 */}
    <div
      ref={previewRef}
      style={{
        width: canvasConfig.width,
        height: canvasConfig.height,
        transform: `scale(${scale})`
      }}
    >
      {/* 实际幻灯片内容 */}
      <div className="logical-slide-root">
        {children}
      </div>
    </div>
  </div>

  {/* 错误提示 */}
  <AnimatePresence>
    {error && <ErrorOverlay />}
  </AnimatePresence>
</div>
```

## 缩放系统

### 缩放计算
```typescript
const calculateScale = (containerWidth: number) => {
  return containerWidth / canvasConfig.width;
};
```

### CSS 变量
预览区域使用 CSS 变量确保幻灯片内容正确渲染：
```css
.logical-slide-root {
  --vh: calc(画布高度 / 100px);
  --vw: calc(画布宽度 / 100px);
}
```

### Tailwind 类覆盖
```css
.logical-slide-root .min-h-screen,
.logical-slide-root .h-screen {
  min-height: 画布高度px !important;
  height: 画布高度px !important;
}
```

## 错误处理

### 错误显示组件
```tsx
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 20, opacity: 0 }}
  style={{
    background: 'rgba(127, 29, 29, 0.9)',
    color: '#fecaca'
  }}
>
  <AlertCircle size={14} />
  代码解析错误
  {error}
</motion.div>
```

### 错误样式
- 背景色: 深红色半透明 (`rgba(127, 29, 29, 0.9)`)
- 文字颜色: 浅红色 (`#fecaca`)
- 位置: 底部居中
- 动画: 从底部滑入，淡入淡出

## 使用示例

### 基本使用
```typescript
import { SlidePreview } from './components/preview/SlidePreview';

function MyComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);
  const [error, setError] = useState(null);
  const canvasConfig = getCanvasConfig('16:9');

  return (
    <SlidePreview
      canvasConfig={canvasConfig}
      scale={scale}
      error={error}
      containerRef={containerRef}
      previewRef={previewRef}
      onScaleChange={setScale}
    >
      <MySlideContent />
    </SlidePreview>
  );
}
```

### 与渲染器集成
```typescript
const { error, RenderedSlide } = useSlideRenderer(code);

<SlidePreview
  canvasConfig={canvasConfig}
  scale={scale}
  error={error}
  containerRef={containerRef}
  previewRef={previewRef}
  onScaleChange={setScale}
>
  <RenderedSlide />
</SlidePreview>
```

## 样式系统

### 容器样式
```css
/* 外层容器 */
flex-grow flex items-center justify-center p-12 overflow-hidden

/* 幻灯片容器 */
bg-white rounded-sm overflow-hidden relative
max-width: 根据画布比例动态设置
aspect-ratio: 根据画布比例动态设置
box-shadow: var(--shadow-preview)

/* 缩放区域 */
origin-top-left overflow-hidden bg-white selection:bg-indigo-100
width: 画布宽度px
height: 画布高度px
transform: scale(缩放比例)
```

### 主题变量
```css
--shadow-preview: 预览区域阴影效果
```

## 性能优化

1. **ResizeObserver**: 高效监听容器大小变化
2. **transform 缩放**: 使用 GPU 加速的 CSS 变换
3. **错误动画**: 使用 Framer Motion 优化动画性能
4. **引用管理**: 使用 `useRef` 避免不必要的重渲染

## 扩展功能

### 添加缩放控制
```typescript
const [zoom, setZoom] = useState(100);

const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

<div style={{ transform: `scale(${scale * zoom / 100})` }}>
  {children}
</div>
```

### 添加全屏模式
```typescript
const [isFullscreen, setIsFullscreen] = useState(false);

const toggleFullscreen = () => {
  setIsFullscreen(!isFullscreen);
  // 使用 Fullscreen API
};

<div className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
  <SlidePreview ... />
</div>
```

### 添加网格背景
```css
.logical-slide-root {
  background-image:
    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
}
```

## 常见问题

### Q: 缩放不正确？
A: 检查 `containerRef` 是否正确绑定到 DOM 元素，确保父容器有明确宽度。

### Q: 幻灯片内容被裁剪？
A: 检查 `overflow-hidden` 类，确保容器大小足够容纳缩放后的内容。

### Q: 错误提示不显示？
A: 确保 `error` prop 正确传递，且 `AnimatePresence` 包裹了错误组件。

### Q: 性能问题？
A: 对于复杂的幻灯片，考虑：
- 使用 `React.memo` 包装子组件
- 减少 `useEffect` 的依赖项
- 使用虚拟滚动处理大量内容

## 注意事项

1. **内存管理**: ResizeObserver 在组件卸载时自动清理
2. **错误边界**: 确保幻灯片内容有错误边界保护
3. **响应式设计**: 测试不同屏幕尺寸下的显示效果
4. **可访问性**: 为错误信息添加适当的 ARIA 标签
