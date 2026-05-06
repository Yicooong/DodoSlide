# Slide Components

这个文件夹包含与幻灯片管理相关的 UI 组件。

## 文件说明

### SlideThumbnail.tsx
渲染幻灯片的缩略图预览，支持动态画布比例和错误处理。

**Props:**
```typescript
interface SlideThumbnailProps {
  code: string;              // 幻灯片 JSX 代码
  isActive: boolean;         // 是否为当前选中的幻灯片
  canvasRatio: CanvasRatio;  // 画布比例 ('16:9' | '4:3')
}
```

**功能特性:**
- 动态缩放：使用 ResizeObserver 根据容器大小自动调整缩放比例
- 画布适配：支持 16:9 和 4:3 两种画布比例
- 错误处理：代码解析错误时显示友好的错误提示
- 性能优化：使用 `useEffect` 和 `useRef` 避免不必要的重渲染

**实现细节:**
- 使用 Babel 浏览器端转译 JSX 代码
- 创建临时 DOM 环境渲染组件
- 根据画布配置动态设置 CSS 变量
- 使用 CSS transform 进行缩放以保持清晰度

### SlideSidebar.tsx
可折叠的侧边栏，显示幻灯片列表并提供管理功能。

**Props:**
```typescript
interface SlideSidebarProps {
  slides: Slide[];                    // 所有幻灯片数组
  currentSlideIndex: number;          // 当前选中的幻灯片索引
  canvasRatio: CanvasRatio;           // 画布比例
  collapsed: boolean;                 // 是否折叠
  onToggleCollapse: () => void;       // 切换折叠状态
  onSelectSlide: (index: number) => void;      // 选择幻灯片
  onAddSlide: () => void;             // 添加新幻灯片
  onDeleteSlide: (index: number) => void;      // 删除幻灯片
  onRenameSlide: (index: number, name: string) => void; // 重命名幻灯片
  onDuplicateSlide: (index: number) => void;   // 复制幻灯片
}
```

**功能特性:**
- **折叠/展开**: 点击折叠按钮切换侧边栏宽度（48px / 256px）
- **幻灯片列表**: 显示所有幻灯片的缩略图和名称
- **交互操作**:
  - 单击切换幻灯片
  - 双击名称进行编辑
  - 悬停显示操作按钮（复制、删除）
- **视觉反馈**:
  - 当前幻灯片高亮显示
  - 幻灯片编号显示
  - 操作按钮悬停效果

**状态管理:**
- 内部管理 `editingSlideName` 状态用于重命名编辑
- 所有数据操作通过 props 回调函数传递给父组件

## 样式系统

所有组件使用 CSS 变量进行主题适配：
```css
/* 幻灯片容器 */
--bg-sidebar: 侧边栏背景色
--border-subtle: 边框颜色
--accent-bg: 选中状态背景
--accent: 主题色

/* 幻灯片项 */
--bg-card: 卡片背景色
--border-active: 激活状态边框
--text-primary: 主文本颜色
--text-secondary: 次要文本颜色
```

## 使用示例

### 在 App.tsx 中使用
```typescript
<SlideSidebar
  slides={slides}
  currentSlideIndex={currentSlideIndex}
  canvasRatio={canvasRatio}
  collapsed={sidebarCollapsed}
  onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
  onSelectSlide={setCurrentSlideIndex}
  onAddSlide={addNewSlide}
  onDeleteSlide={deleteSlide}
  onRenameSlide={renameSlide}
  onDuplicateSlide={duplicateSlide}
/>
```

## 性能优化

1. **SlideThumbnail**:
   - 使用 `useRef` 避免不必要的重渲染
   - ResizeObserver 自动清理，避免内存泄漏
   - Babel 转译结果缓存（通过 useEffect 依赖）

2. **SlideSidebar**:
   - 幻灯片列表只渲染可见部分（可以通过虚拟滚动进一步优化）
   - 缩略图按需渲染（只有 visible 时才实际渲染）

## 扩展指南

### 添加新的幻灯片操作
1. 在 `SlideSidebarProps` 接口中添加新的回调函数
2. 在组件的按钮区域添加对应的按钮
3. 实现图标和样式
4. 在父组件中实现对应的业务逻辑

### 自定义缩略图样式
修改 `SlideThumbnail.tsx` 中的样式配置：
```typescript
const thumbnailStyles = {
  // 修改默认缩放比例
  scale: 0.15,
  // 修改错误显示样式
  errorText: '错误',
  // 修改容器样式
  containerClass: 'w-full h-full overflow-hidden relative bg-white'
};
```

## 注意事项

1. **内存管理**: 确保 ResizeObserver 在组件卸载时正确清理
2. **错误处理**: 幻灯片代码可能有语法错误，需要友好的错误提示
3. **性能**: 大量幻灯片时考虑虚拟滚动优化
4. **可访问性**: 为所有交互元素添加适当的 ARIA 标签
