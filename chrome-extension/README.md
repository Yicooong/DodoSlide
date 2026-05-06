# React Slide to PPTX — 浏览器扩展

将 React JSX 代码一键导出为 PPTX 文件的 Chrome/Edge 浏览器扩展。

## 功能

- 粘贴 React JSX 代码，自动校验转译是否成功
- 一键导出为 16:9 PPTX 文件
- 代码自动保存，弹窗关闭不丢失
- 无需 AI、无需 Monaco 编辑器，极简轻量

## 安装

### 直接导入 zip

1. 从 `chrome-extension/` 目录获取 `react-slide-to-pptx.zip`
2. **Chrome**：打开 `chrome://extensions` → 开启「开发者模式」→ 将 zip 拖入页面
3. **Edge**：打开 `edge://extensions` → 同上

### 从源码构建

```bash
cd chrome-extension
npm install
npx vite build
# 构建完成后自动在 chrome-extension/ 下生成 react-slide-to-pptx.zip
```

## 使用方式

1. 点击浏览器工具栏中的扩展图标
2. 在弹窗中粘贴 React JSX 代码
3. 底部状态栏自动显示校验结果
4. 校验通过后点击「导出 PPTX」即可下载

## 代码格式

输入的代码必须是一个导出默认 React 组件的 JSX：

```jsx
function MySlide() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#667eea' }}>
      <h1>Hello</h1>
    </div>
  );
}

export default MySlide;
```

## 文件结构

```
chrome-extension/
├── manifest.json              # Manifest V3 配置
├── package.json               # 依赖声明
├── vite.config.ts             # 构建配置（含自动 zip）
├── tsconfig.json
├── popup/
│   ├── index.html             # 弹窗入口
│   ├── main.tsx               # React 入口
│   ├── App.tsx                # 主组件（代码输入 + 校验 + 导出）
│   ├── App.css                # 样式
│   └── lib/
│       ├── pptx-exporter.ts   # DOM → PPTX 转换管线
│       └── slide-renderer.ts  # Babel 转译 + 组件执行
├── dist/                      # 构建输出（加载扩展时选此目录）
└── react-slide-to-pptx.zip    # 可直接导入浏览器的 zip
```

## 技术细节

- **Manifest V3** — 支持 Chrome 和 Edge 最新版本
- **CSP** — 使用 `unsafe-eval` 以支持 Babel 转译后的 `new Function()` 执行
- **核心管线** — 提取自主项目的 `pptx-exporter.ts`，通过离屏 DOM 渲染 + TreeWalker 遍历 + pptxgenjs 生成 PPTX
- **固定 16:9** — 画布比例 1280×720，PPTX 尺寸 13.33"×7.5"
- **代码持久化** — 使用 `chrome.storage.local` 保存用户代码
