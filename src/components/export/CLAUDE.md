# Export Components

这个文件夹包含 PPTX 导出相关的 UI 组件。

## 文件说明

### ExportModal.tsx
PPTX 导出对话框，支持全部导出、当前幻灯片导出和范围导出。

**Props:**
```typescript
interface ExportModalProps {
  isOpen: boolean;                                // 是否显示模态框
  onClose: () => void;                            // 关闭回调
  isExporting: boolean;                           // 是否正在导出
  exportMode: ExportMode;                         // 导出模式
  setExportMode: (mode: ExportMode) => void;      // 设置导出模式
  exportRangeStart: number;                       // 范围起始页
  setExportRangeStart: (value: number) => void;   // 设置起始页
  exportRangeEnd: number;                         // 范围结束页
  setExportRangeEnd: (value: number) => void;     // 设置结束页
  exportSpecificPage: number;                     // 指定页码
  setExportSpecificPage: (value: number) => void; // 设置指定页码
  currentSlideIndex: number;                      // 当前幻灯片索引
  totalSlides: number;                            // 总幻灯片数
  currentSlideName: string;                       // 当前幻灯片名称
  onExport: () => void;                           // 确认导出回调
}
```

**导出模式类型**:
```typescript
type ExportMode = 'all' | 'current' | 'range';
```

## 组件结构

```tsx
<div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <motion.div className="rounded-xl shadow-2xl w-[480px] max-w-[90vw]">
    {/* 头部 */}
    <div className="px-6 py-4 flex items-center justify-between">
      <h3>
        <Download size={20} />
        导出 PPTX
      </h3>
      <button onClick={onClose}>✕</button>
    </div>

    {/* 主体 */}
    <div className="px-6 py-5 space-y-4">
      {/* 导出范围选择 */}
      <label>全部导出</label>
      <label>导出当前幻灯片</label>
      <label>导出指定范围</label>

      {/* 范围输入框（仅在 range 模式显示） */}
      {exportMode === 'range' && (
        <div>
          <span>从</span>
          <input type="number" value={exportRangeStart} />
          <span>到</span>
          <input type="number" value={exportRangeEnd} />
        </div>
      )}

      {/* 指定页码输入框（仅在 current 模式显示） */}
      {exportMode === 'current' && (
        <div>
          <span>指定页码:</span>
          <input type="number" value={exportSpecificPage} />
        </div>
      )}
    </div>

    {/* 底部按钮 */}
    <div className="px-6 py-4 flex justify-end gap-3">
      <button onClick={onClose}>取消</button>
      <button onClick={onExport} disabled={isExporting}>
        {isExporting ? <Loader2 /> : <Download />}
        {isExporting ? '导出中...' : '确认导出'}
      </button>
    </div>
  </motion.div>
</div>
```

## 导出模式详解

### 1. 全部导出 (`all`)
**描述**: 导出所有幻灯片到一个 PPTX 文件

**使用场景**:
- 完成演示文稿制作
- 需要完整备份

**文件命名**: `Presentation_All_Slides_{timestamp}.pptx`

### 2. 导出当前幻灯片 (`current`)
**描述**: 仅导出当前选中的幻灯片

**使用场景**:
- 单独分享某页幻灯片
- 测试特定幻灯片效果

**功能**:
- 可以指定导出任意页码（不限于当前页）
- 文件命名: `Slide_{slide_name}_{timestamp}.pptx`

### 3. 导出指定范围 (`range`)
**描述**: 导出连续的多个幻灯片

**使用场景**:
- 导出演示文稿的某个章节
- 批量处理相关幻灯片

**功能**:
- 支持起始页和结束页输入
- 自动处理页码顺序（支持反向输入）
- 文件命名: `Presentation_Slides_{start}-{end}_{timestamp}.pptx`

## 样式系统

### 模态框样式
```css
/* 外层容器 */
fixed inset-0 z-[9999]
bg-black/60 backdrop-blur-sm  /* 半透明背景 + 毛玻璃效果 */

/* 模态框主体 */
rounded-xl shadow-2xl
w-[480px] max-w-[90vw]
overflow-hidden
background: var(--bg-modal)
border: 1px solid var(--border-subtle)
```

### 单选按钮样式
```css
/* 选项容器 */
flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all

/* 选中状态 */
background: var(--accent-bg)
border-color: var(--border-active)

/* 未选中状态 */
background: var(--bg-card)
border-color: var(--border-default)
```

### 按钮样式
```css
/* 取消按钮 */
px-4 py-2 rounded-lg text-sm font-medium
color: var(--text-secondary)
background: var(--bg-button)

/* 确认按钮 */
px-6 py-2 rounded-lg text-sm font-bold text-white
flex items-center gap-2 transition-all
background: var(--accent)
disabled:opacity-50 disabled:cursor-not-allowed
```

## 使用示例

### 基本使用
```typescript
import { ExportModal, ExportMode } from './components/export/ExportModal';

function MyComponent() {
  const [showExport, setShowExport] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    // 执行导出逻辑
    setTimeout(() => {
      setIsExporting(false);
      setShowExport(false);
    }, 2000);
  };

  return (
    <>
      <button onClick={() => setShowExport(true)}>导出 PPTX</button>

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        isExporting={isExporting}
        exportMode={exportMode}
        setExportMode={setExportMode}
        exportRangeStart={1}
        setExportRangeStart={() => {}}
        exportRangeEnd={10}
        setExportRangeEnd={() => {}}
        exportSpecificPage={1}
        setExportSpecificPage={() => {}}
        currentSlideIndex={0}
        totalSlides={10}
        currentSlideName="幻灯片 1"
        onExport={handleExport}
      />
    </>
  );
}
```

### 与应用状态集成
```typescript
const [showExportModal, setShowExportModal] = useState(false);
const [exportMode, setExportMode] = useState<ExportMode>('all');
const [exportRangeStart, setExportRangeStart] = useState(1);
const [exportRangeEnd, setExportRangeEnd] = useState(1);
const [exportSpecificPage, setExportSpecificPage] = useState(1);
const [isExporting, setIsExporting] = useState(false);

const handleExportClick = () => {
  setExportRangeStart(1);
  setExportRangeEnd(slides.length);
  setExportSpecificPage(currentSlideIndex + 1);
  setShowExportModal(true);
};

const handleConfirmExport = () => {
  if (exportMode === 'current') {
    const pageIndex = exportSpecificPage - 1;
    setCurrentSlideIndex(pageIndex);
    setTimeout(() => {
      exportToPPTX('current');
    }, 100);
  } else if (exportMode === 'range') {
    const start = Math.min(exportRangeStart, exportRangeEnd);
    const end = Math.max(exportRangeStart, exportRangeEnd);
    exportToPPTX('range', start, end);
  } else {
    exportToPPTX('all');
  }
};

<ExportModal
  isOpen={showExportModal}
  onClose={() => setShowExportModal(false)}
  isExporting={isExporting}
  exportMode={exportMode}
  setExportMode={setExportMode}
  exportRangeStart={exportRangeStart}
  setExportRangeStart={setExportRangeStart}
  exportRangeEnd={exportRangeEnd}
  setExportRangeEnd={setExportRangeEnd}
  exportSpecificPage={exportSpecificPage}
  setExportSpecificPage={setExportSpecificPage}
  currentSlideIndex={currentSlideIndex}
  totalSlides={slides.length}
  currentSlideName={slides[currentSlideIndex]?.name || ''}
  onExport={handleConfirmExport}
/>
```

## 输入验证

### 页码范围验证
```typescript
// 自动限制输入范围
const handleRangeStartChange = (value: string) => {
  const val = parseInt(value) || 1;
  setExportRangeStart(Math.max(1, Math.min(val, totalSlides)));
};

const handleRangeEndChange = (value: string) => {
  const val = parseInt(value) || 1;
  setExportRangeEnd(Math.max(1, Math.min(val, totalSlides)));
};
```

### 导出按钮禁用条件
```typescript
disabled={isExporting || (exportMode === 'range' && exportRangeStart > exportRangeEnd)}
```

## 动画效果

### 模态框动画
```tsx
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 0.95 }}
  transition={{ duration: 0.2 }}
>
  {/* 模态框内容 */}
</motion.div>
```

### 加载动画
```tsx
{isExporting ? (
  <Loader2 size={16} className="animate-spin" />
) : (
  <Download size={16} />
)}
```

## 扩展功能

### 添加导出格式选择
```typescript
type ExportFormat = 'pptx' | 'pdf' | 'png';

interface ExportModalProps {
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
}

// 在模态框中添加格式选择
<select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)}>
  <option value="pptx">PowerPoint (.pptx)</option>
  <option value="pdf">PDF 文档 (.pdf)</option>
  <option value="png">PNG 图片 (.png)</option>
</select>
```

### 添加导出质量设置
```typescript
interface ExportSettings {
  quality: 'high' | 'medium' | 'low';
  includeNotes: boolean;
  embedFonts: boolean;
}

<div className="export-settings">
  <label>
    <input type="checkbox" checked={includeNotes} onChange={(e) => setIncludeNotes(e.target.checked)} />
    包含备注
  </label>
  <label>
    <input type="checkbox" checked={embedFonts} onChange={(e) => setEmbedFonts(e.target.checked)} />
    嵌入字体
  </label>
</div>
```

### 添加导出历史记录
```typescript
const [exportHistory, setExportHistory] = useState<ExportRecord[]>([]);

interface ExportRecord {
  id: string;
  mode: ExportMode;
  filename: string;
  timestamp: Date;
}

// 显示最近的导出记录
<div className="export-history">
  <h4>最近导出</h4>
  {exportHistory.slice(0, 5).map(record => (
    <div key={record.id}>
      <span>{record.filename}</span>
      <span>{formatTime(record.timestamp)}</span>
    </div>
  ))}
</div>
```

## 常见问题

### Q: 模态框关闭时状态没有重置？
A: 在 `onClose` 回调中重置所有相关状态：
```typescript
const handleClose = () => {
  setShowExportModal(false);
  setExportMode('all');
  setExportRangeStart(1);
  setExportRangeEnd(slides.length);
};
```

### Q: 页码输入可以输入负数？
A: 使用 `Math.max(1, value)` 确保最小值为 1。

### Q: 导出按钮点击没有反应？
A: 检查 `onExport` 回调是否正确实现，确保没有抛出异常。

### Q: 动画效果不流畅？
A: 检查 Framer Motion 是否正确安装，确保 `AnimatePresence` 包裹模态框。

## 注意事项

1. **状态管理**: 确保所有导出相关状态在模态框关闭时正确重置
2. **输入验证**: 验证页码输入，防止越界和无效值
3. **用户反馈**: 导出过程中提供明确的加载状态和错误提示
4. **性能**: 对于大量幻灯片，考虑分批导出以避免界面卡顿
5. **可访问性**: 为表单元素添加适当的 `label` 和 `aria` 属性
