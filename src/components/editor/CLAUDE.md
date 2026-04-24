# Editor Components

这个文件夹包含代码编辑器相关的 UI 组件。

## 文件说明

### CodeEditor.tsx
Monaco 编辑器的 React 包装组件，提供代码编辑功能。

**Props:**
```typescript
interface CodeEditorProps {
  code: string;                    // 编辑器中的代码内容
  onChange: (value: string) => void; // 代码变更回调
  monacoTheme: string;             // Monaco 编辑器主题
}
```

**功能特性:**
- **Monaco Editor**: 使用 VS Code 的编辑器核心
- **实时编辑**: 代码变化实时传递给父组件
- **主题支持**: 支持深色和浅色主题切换
- **自动布局**: 编辑器高度随容器自适应

**编辑器配置:**
```typescript
{
  fontSize: 14,                    // 字体大小
  minimap: { enabled: false },    // 禁用缩略图
  scrollBeyondLastLine: false,   // 不滚动到最后一行之外
  lineNumbers: 'on',             // 显示行号
  roundedSelection: false,        // 不圆角选择
  padding: { top: 20 },          // 顶部内边距
  fontFamily: 'JetBrains Mono',  // 字体
  automaticLayout: true,         // 自动调整大小
}
```

## 使用示例

### 基本使用
```typescript
import { CodeEditor } from './components/editor/CodeEditor';

function MyComponent() {
  const [code, setCode] = useState('const x = 1;');
  const themeConfig = getThemeConfig('dark');

  return (
    <CodeEditor
      code={code}
      onChange={setCode}
      monacoTheme={themeConfig.monacoTheme}
    />
  );
}
```

### 与幻灯片编辑器集成
```typescript
<CodeEditor
  code={slides[currentSlideIndex]?.code || ''}
  onChange={updateCurrentSlideCode}
  monacoTheme={themeConfig.monacoTheme}
/>
```

## 主题系统

### 支持的主题
- **VS Code Dark** (`vs-dark`): 深色主题
- **VS Code Light** (`vs`): 浅色主题

### 主题配置
主题配置在 `src/lib/theme-config.ts` 中定义：
```typescript
const THEME_CONFIGS = {
  dark: {
    monacoTheme: 'vs-dark',
    // ... 其他配置
  },
  light: {
    monacoTheme: 'vs',
    // ... 其他配置
  }
};
```

## 性能优化

1. **防抖处理**: 如果需要在代码变化时执行复杂操作，考虑添加防抖
2. **虚拟滚动**: 对于大型文件，Monaco 已内置虚拟滚动
3. **懒加载**: 编辑器组件会按需加载，不影响初始加载速度

## 扩展功能

### 添加代码格式化
```typescript
// 在 CodeEditor 组件中添加
const handleEditorDidMount = (editor: any) => {
  // 添加格式化快捷键
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
    editor.getAction('editor.action.formatDocument').run();
  });
};

<Editor
  onMount={handleEditorDidMount}
  // ... 其他 props
/>
```

### 添加代码提示
```typescript
const handleEditorDidMount = (editor: any, monaco: any) => {
  monaco.languages.registerCompletionItemProvider('javascript', {
    provideCompletionItems: () => {
      return {
        suggestions: [
          {
            label: 'CustomFunction',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'customFunction(${1:args})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          }
        ]
      };
    }
  });
};
```

### 自定义语法高亮
```typescript
const handleEditorDidMount = (editor: any, monaco: any) => {
  monaco.languages.setMonarchTokensProvider('javascript', {
    tokenizer: {
      root: [
        [/\bcustomKeyword\b/, 'custom-keyword'],
        // ... 其他规则
      ]
    }
  });

  monaco.editor.defineTheme('customTheme', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'custom-keyword', foreground: 'ff0000' },
    ],
    colors: {}
  });
};
```

## 常见问题

### Q: 编辑器内容为空白？
A: 检查 `code` prop 是否正确传递，确保不是 `undefined`。

### Q: 主题切换不生效？
A: 确保 `monacoTheme` prop 正确传递，主题名称必须是 `vs` 或 `vs-dark`。

### Q: 编辑器高度不正确？
A: 确保父容器有明确的高度，`automaticLayout` 选项已启用。

### Q: 性能问题？
A: 对于大型文件，考虑：
- 禁用一些高级功能
- 使用 Web Worker 进行代码分析
- 限制 undo/redo 历史记录大小

## 注意事项

1. **内存管理**: Monaco 编辑器实例会占用较多内存，确保在组件卸载时正确清理
2. **主题同步**: 当应用主题切换时，及时更新 `monacoTheme` prop
3. **代码验证**: 在 `onChange` 回调中添加代码语法验证
4. **防抖保护**: 对于频繁的代码变化，考虑添加防抖处理
