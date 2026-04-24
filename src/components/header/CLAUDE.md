# Header Components

这个文件夹包含应用头部导航相关的 UI 组件。

## 文件说明

### AppHeader.tsx
应用头部导航栏，包含标题、标签页切换、画布比例选择、主题切换和各种操作按钮。

**Props:**
```typescript
interface AppHeaderProps {
  // 标签页相关
  activeTab: 'preview' | 'code';
  setActiveTab: (tab: 'preview' | 'code') => void;

  // 画布配置
  canvasRatio: string;
  setCanvasRatio: (ratio: string) => void;
  canvasConfigs: CanvasConfig[];

  // 主题配置
  appTheme: string;
  setAppTheme: (theme: string) => void;
  themeConfigs: ThemeConfig[];

  // AI 功能
  showAiInput: boolean;
  setShowAiInput: (show: boolean) => void;
  isGenerating: boolean;

  // 设置和文件操作
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
}
```

## 组件结构

```tsx
<header className="h-16 border-b px-6 flex items-center justify-between">
  {/* 左侧：标题和主要控制 */}
  <div className="flex items-center gap-6">
    <h1>Slide Playground</h1>

    {/* 标签页切换 */}
    <nav>
      <button>编辑器</button>
      <button>预览</button>
    </nav>

    {/* 画布比例选择器 */}
    <select>
      <option>16:9</option>
      <option>4:3</option>
    </select>

    {/* 主题切换器 */}
    <div className="theme-buttons">
      <button>🌙</button>
      <button>☀️</button>
    </div>
  </div>

  {/* 右侧：操作按钮 */}
  <div className="flex items-center gap-3">
    <button>AI 生成</button>
    <button>设置</button>
    <label>上传 JSX</label>
    <button>导出 PPTX</button>
  </div>
</header>
```

## 功能模块

### 1. 标签页切换
**用途**: 在编辑器和预览视图之间切换

**样式配置**:
```typescript
activeTab === 'code' ? {
  background: 'var(--bg-button)',
  color: 'var(--text-primary)',
  shadow: 'shadow-sm'
} : {
  background: 'transparent',
  color: 'var(--text-muted)'
}
```

### 2. 画布比例选择器
**用途**: 切换幻灯片画布比例（16:9 或 4:3）

**选项格式**:
```typescript
{canvasConfigs.map((config) => (
  <option value={config.ratio}>
    {config.icon} {config.label}
  </option>
))}
```

**支持的画布比例**:
- 16:9 (1280×720) - 适合宽屏演示
- 4:3 (1024×768) - 适合传统投影仪

### 3. 主题切换器
**用途**: 在深色和浅色主题之间切换

**主题配置**:
```typescript
themeConfigs: ThemeConfig[] = [
  { id: 'dark', label: '深色', icon: '🌙', description: '深蓝灰色调' },
  { id: 'light', label: '浅色', icon: '☀️', description: '明亮简洁' }
]
```

**切换逻辑**:
```typescript
const handleThemeChange = (themeId: string) => {
  setAppTheme(themeId);
  // 主题变量会通过 CSS 类自动切换
};
```

### 4. 操作按钮组
**按钮功能**:
1. **AI 生成**: 打开 AI 生成面板
   - 渐变背景色
   - 禁用状态（生成中）
   - 动态文本（"AI 生成" / "关闭 AI"）

2. **设置**: 打开设置对话框
   - 标准按钮样式
   - 边框和背景色

3. **上传 JSX**: 上传本地 JSX 文件
   - 使用 `<label>` 元素
   - 隐藏的 `<input type="file">`

4. **导出 PPTX**: 打开导出对话框
   - 主题色背景
   - 阴影效果
   - 图标和文本

## 样式系统

### 高度统一
所有按钮和导航元素统一高度为 `h-9` (36px)

### 主题变量
```css
/* 头部背景 */
--bg-header: 头部背景色
--border-subtle: 边框颜色
backdrop-filter: blur(20px)  /* 毛玻璃效果 */

/* 交互元素 */
--bg-button: 按钮背景色
--bg-card: 卡片背景色
--border-default: 默认边框
--accent: 主题色
--text-primary: 主文本色
--text-secondary: 次要文本色
--text-muted: 弱化文本色

/* AI 渐变 */
--ai-gradient-from: AI 渐变起始色
--ai-gradient-to: AI 渐变结束色
```

### 按钮样式变体

**标准按钮**:
```css
px-4 py-2 rounded-lg text-sm font-semibold
border active:scale-95 hover:opacity-90
background: var(--bg-button)
color: var(--text-secondary)
```

**主要按钮**:
```css
px-6 py-2 rounded-lg text-sm font-bold
active:scale-95
background: var(--accent)
color: var(--text-inverse)
box-shadow: 0 4px 14px var(--accent-bg)
```

**AI 按钮**:
```css
px-4 py-2 rounded-lg text-sm font-bold shadow-lg
flex items-center gap-2 transition-all active:scale-95
background: linear-gradient(135deg, var(--ai-gradient-from), var(--ai-gradient-to))
color: white
box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3)
```

## 使用示例

### 基本使用
```typescript
import { AppHeader } from './components/header/AppHeader';

function MyComponent() {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('code');
  const [canvasRatio, setCanvasRatio] = useState('16:9');
  const [appTheme, setAppTheme] = useState('dark');

  return (
    <AppHeader
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      canvasRatio={canvasRatio}
      setCanvasRatio={setCanvasRatio}
      canvasConfigs={Object.values(CANVAS_CONFIGS)}
      appTheme={appTheme}
      setAppTheme={setAppTheme}
      themeConfigs={Object.values(THEME_CONFIGS)}
      showAiInput={false}
      setShowAiInput={() => {}}
      isGenerating={false}
      showSettings={false}
      setShowSettings={() => {}}
      onUpload={() => {}}
      onExport={() => {}}
    />
  );
}
```

### 与状态管理集成
```typescript
const appState = useAppState();
const { isGenerating } = useAiGeneration();

<AppHeader
  activeTab={appState.activeTab}
  setActiveTab={appState.setActiveTab}
  canvasRatio={appState.canvasRatio}
  setCanvasRatio={handleCanvasRatioChange}
  canvasConfigs={Object.values(CANVAS_CONFIGS)}
  appTheme={appState.appTheme}
  setAppTheme={handleThemeChange}
  themeConfigs={Object.values(THEME_CONFIGS)}
  showAiInput={showAiInput}
  setShowAiInput={setShowAiInput}
  isGenerating={isGenerating}
  showSettings={showSettings}
  setShowSettings={setShowSettings}
  onUpload={handleFileUpload}
  onExport={handleExportClick}
/>
```

## 扩展功能

### 添加快捷键支持
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'e':
          e.preventDefault();
          setActiveTab('code');
          break;
        case 'p':
          e.preventDefault();
          setActiveTab('preview');
          break;
        case 's':
          e.preventDefault();
          onExport();
          break;
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [setActiveTab, onExport]);
```

### 添加撤销/重做按钮
```typescript
<div className="flex items-center gap-2">
  <button
    onClick={handleUndo}
    disabled={!canUndo}
    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
  >
    <Undo size={16} />
  </button>
  <button
    onClick={handleRedo}
    disabled={!canRedo}
    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
  >
    <Redo size={16} />
  </button>
</div>
```

### 添加保存状态指示器
```typescript
<div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
  <Circle size={8} className={isSaved ? 'text-green-500' : 'text-yellow-500'} />
  {isSaved ? '已保存' : '未保存'}
</div>
```

## 响应式设计

### 移动端适配
```css
@media (max-width: 768px) {
  .header {
    padding: 0.5rem 1rem;
    gap: 0.5rem;
  }

  .header h1 {
    font-size: 1rem;
  }

  .header button {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }

  .header .label {
    display: none;  /* 隐藏按钮文字 */
  }
}
```

## 注意事项

1. **按钮状态**: 正确处理禁用状态（如生成中的 AI 按钮）
2. **主题同步**: 确保主题切换时所有元素样式正确更新
3. **可访问性**: 为所有交互元素添加适当的 `title` 和 `aria-label`
4. **性能**: 避免在头部组件中进行复杂计算
5. **国际化**: 考虑将文本提取到 i18n 配置中
