<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Gemini Canvas — AI 幻灯片生成平台

一款功能强大的浏览器端幻灯片编辑器，使用 JSX 代码编写幻灯片，支持 AI 生成、多种画布比例、主题切换，并可导出为 PPTX 文件。

---

## 功能特性

- **AI 智能生成** — 通过自然语言描述，AI 自动生成专业幻灯片
- **5 种设计风格** — 现代简约、科技感、创意活泼、专业严谨、优雅典雅
- **实时预览** — 边写边看，代码即所得
- **多画布比例** — 支持 16:9 (1280×720) 和 4:3 (1024×768)
- **导出 PPTX** — 支持导出当前页、全部页面或指定范围
- **深色/浅色主题** — 全界面统一样式切换
- **lucide-react 图标** — 支持所有 lucide 图标库
- **浏览器端转译** — 使用 Babel 无需构建步骤

---

## 快速开始

**前置要求：** Node.js 18+

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 构建生产版本
npm start            # 启动生产服务器
npm run lint         # TypeScript 类型检查
```

---

## 界面导航

### 首页
- **开始创作** → 进入 AI 生成页面
- **代码编辑器** → 进入 Monaco 编辑器

### AI 生成页面
1. 选择设计风格模板
2. 描述你想要的幻灯片内容
3. 点击生成，AI 自动创建幻灯片
4. 在预览区查看效果
5. 可发送后续指令修改（如"把背景调深一点"）
6. 点击导出下载 PPTX 文件

### 代码编辑器
- 左侧：幻灯片缩略图列表
- 中间：Monaco 代码编辑器
- 右侧：实时预览
- 顶部：画布比例、主题、导出按钮

---

## 项目结构

```
src/
├── main.tsx                    — React 根挂载
├── App.tsx                     — 主应用：视图路由、导出逻辑
├── index.css                   — Tailwind + 主题变量
├── hooks/
│   ├── use-slides.ts           — 幻灯片 CRUD 操作
│   ├── use-app-state.ts        — 视图类型、主题、画布比例
│   └── use-slide-renderer.tsx  — JSX 转译和渲染
├── components/
│   ├── landing/                — 首页
│   │   └── LandingPage.tsx
│   ├── ai-generate/            — AI 生成页面
│   │   ├── AiGeneratePage.tsx  — 阶段编排器
│   │   ├── EntryPhase.tsx      — 入口态 UI
│   │   ├── WorkspacePhase.tsx  — 工作区态 UI
│   │   ├── AiAssistantSidebar.tsx — AI 对话侧边栏
│   │   └── TemplateCard.tsx    — 风格卡片
│   ├── slide/                  — 幻灯片管理
│   ├── editor/                 — 代码编辑器
│   ├── preview/                — 预览组件
│   ├── header/                 — 顶部导航
│   └── export/                 — 导出对话框
└── lib/
    ├── canvas-config.ts        — 画布比例配置
    ├── theme-config.ts         — 主题配置
    ├── use-ai-generation.ts    — AI 生成 Hook
    ├── prompt-manager.ts       — 提示词管理
    └── pptx-exporter.ts        — PPTX 导出逻辑
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | React 19 + Tailwind CSS v4 |
| 代码编辑器 | Monaco Editor |
| JSX 转译 | Babel (浏览器端) |
| PPTX 生成 | pptxgenjs |
| 动画 | motion (Framer Motion) |
| 图标 | lucide-react |
| 服务器 | Express + Vite |

---

## AI 生成功能

### 支持的 API
自定义 OpenAI 兼容 API，可配置任意兼容接口的模型服务。

### 设计风格预设

| 风格 | 说明 |
|------|------|
| 现代简约 | 简洁现代的设计风格，适合商务演示 |
| 科技感 | 蓝色科技风格，适合技术主题 |
| 创意活泼 | 鲜艳色彩，适合创意主题 |
| 专业严谨 | 简洁专业，适合学术和商务 |
| 优雅典雅 | 柔和色调，适合艺术和文化 |

### 使用方式

1. 点击「开始创作」进入 AI 生成页面
2. 选择设计风格模板
3. 在输入框中描述幻灯片内容
4. 点击生成，AI 自动创建
5. 预览效果，可发送后续修改指令
6. 满意后点击导出下载

---

## 浏览器扩展

项目附带一个独立的 Chrome/Edge 浏览器扩展，位于 `chrome-extension/` 目录。点击扩展图标即可粘贴 React JSX 代码并一键导出 PPTX，无需 AI 功能和代码编辑器。

**快速安装：**
1. 打开 `chrome://extensions`（或 `edge://extensions`）
2. 开启「开发者模式」
3. 将 `chrome-extension/react-slide-to-pptx.zip` 拖入页面即可

详细说明见 [chrome-extension/README.md](chrome-extension/README.md)。

---

## 导出功能

支持三种导出模式：

- **全部导出** — 导出所有幻灯片到一个 PPTX 文件
- **导出当前** — 仅导出当前选中的幻灯片
- **导出范围** — 导出指定页码范围的幻灯片

导出时自动处理：
- 形状（矩形、圆角矩形、线条）
- SVG 图标（lucide-react）
- 富文本（大小、粗细、颜色、对齐）
- 背景颜色和渐变
- 透明度继承

---

## 主题系统

点击顶部主题切换按钮：

- **深色主题** — 深蓝灰色调，适合长时间使用
- **浅色主题** — 明亮简洁，适合演示环境（默认）

幻灯片预览区域始终使用白色背景，不受主题切换影响。

---

## 配置说明

### API 配置

1. 点击「设置」按钮
2. 填写 API 端点和 API Key
3. 点击「测试连接」获取模型列表
4. 选择模型并保存

### Prompt 配置

1. 进入设置的「Prompt 配置」标签
2. 选择使用默认 Prompt 或自定义
3. 添加额外指令
4. 保存配置

---

## 开发指南

### 添加新的画布比例
1. 更新 `src/lib/canvas-config.ts` 中的 `CanvasRatio` 类型
2. 添加配置到 `CANVAS_CONFIGS`
3. 测试缩略图渲染和导出

### 添加新的 AI 风格
1. 创建 `src/prompts/templates/{name}/style.txt`
2. 在 `src/prompts/templates/index.ts` 中注册
3. 风格自动出现在入口页的模板卡片中

### 自定义主题
1. 在 `src/index.css` 中修改 CSS 变量
2. 确保深色和浅色主题都有定义
3. 遵循 `--category-property` 命名规范

---

## License

Apache 2.0
