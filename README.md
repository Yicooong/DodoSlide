<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Slide Playground — JSX 幻灯片编辑器

一款运行在浏览器中的幻灯片编辑器，使用 JSX 代码编写幻灯片，实时预览，并导出为 PPTX 文件。

---

## 功能特性

- **JSX 编写幻灯片** — 用熟悉的 React JSX 语法编写幻灯片内容
- **多幻灯片管理** — 左侧边栏支持添加、删除、复制、重命名幻灯片
- **实时预览** — 边写边看，1280×720（16:9）标准比例
- **AI 生成幻灯片** — 支持 Google Gemini、OpenAI、Anthropic 等 AI 自动生成幻灯片
- **导出 PPTX** — 支持导出当前页、全部页面或指定范围页面
- **lucide-react 图标** — 支持所有 lucide 图标库
- **浏览器端转译** — 使用 Babel 无需构建步骤，修改代码即时生效

---

## 本地运行

**前置要求：** Node.js

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（可选，AI 相关功能需要）
cp .env.example .env.local
# 编辑 .env.local，填入 GEMINI_API_KEY

# 3. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 即可使用。

### 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 TypeScript 类型检查 |
| `npm run clean` | 清理构建目录 |

---

## 生产构建

```bash
npm run build
npm start
```

---

## 幻灯片代码示例

幻灯片以 React 函数组件的形式编写，**必须使用 `export default` 导出**：

```tsx
import React from 'react';
import { Activity, CheckCircle, Cpu, ShieldCheck } from 'lucide-react';

const MySlide = () => {
  return (
    <div className="w-full h-full bg-white text-slate-900 font-sans p-12 flex flex-col">
      <h1 className="text-4xl font-extrabold">系统核心模块验证程序</h1>
      <Cpu size={48} />
      <p>当前系统表现稳定，符合预期偏差范围。</p>
    </div>
  );
};

export default MySlide;
```

### 支持的样式

| 特性 | 支持情况 |
|------|----------|
| Tailwind CSS 类名 | ✅ 完整支持 |
| lucide-react 图标 | ✅ |
| 背景颜色 / 渐变 | ✅ |
| 边框（实线 / 虚线 / 不对称） | ✅ |
| 圆角（矩形 / 胶囊形） | ✅ |
| 文字（大小 / 粗细 / 颜色 / 对齐） | ✅ |
| 透明度继承 | ✅ |

### 尺寸单位说明

预览区域固定为 **1280×720**（16:9）。以下 Tailwind 类在该上下文中会被强制覆盖：

- `h-screen` / `min-h-screen` → 固定为 720px
- `w-screen` / `min-w-screen` → 固定为 1280px

---

## 项目结构

```
/
├── index.html              — 入口 HTML
├── server.ts               — Express 服务器（开发热加载 / 生产静态服务）
├── vite.config.ts          — Vite 配置
├── src/
│   ├── App.tsx             — 主应用：编辑器 + 预览 + PPTX 导出逻辑
│   ├── constants.ts        — 默认幻灯片代码示例
│   ├── index.css           — Tailwind CSS v4 主题
│   ├── components/
│   │   ├── AiInputModal.tsx    — AI 生成对话框
│   │   └── SettingsModal.tsx   — API 设置对话框
│   └── lib/
│       ├── api-providers.ts    — AI 提供商配置
│       ├── prompt-manager.ts   — 系统提示词管理
│       ├── use-ai-generation.ts — AI 生成 Hook
│       └── utils.ts            — cn() 工具函数
└── package.json
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
| AI SDK | @google/genai |
| 服务器 | Express + Vite |

## 导出功能

支持三种导出模式：

- **全部导出** — 导出所有幻灯片到一个 PPTX 文件
- **导出当前** — 仅导出当前选中的幻灯片
- **导出范围** — 导出指定页码范围的幻灯片（如 1-5）

导出时会自动处理：
- 形状（矩形、圆角矩形、线条）
- SVG 图标（lucide-react）
- 富文本（大小、粗细、颜色、对齐）
- 背景颜色和渐变
- 透明度继承

## AI 生成

支持多种 AI 提供商自动生成幻灯片：

- **Google Gemini** — 默认推荐
- **OpenAI** — GPT-4/GPT-3.5
- **Anthropic** — Claude 系列
- **自定义 API** — 支持 OpenAI 兼容接口

在设置中配置 API 密钥和系统提示词，即可通过自然语言描述生成幻灯片。

---

## License

Apache 2.0
