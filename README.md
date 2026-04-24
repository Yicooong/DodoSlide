<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Slide Playground — JSX 幻灯片编辑器

一款功能强大的浏览器端幻灯片编辑器，使用 JSX 代码编写幻灯片，支持多种画布比例、AI 生成、主题切换，并可导出为 PPTX 文件。

---

## ✨ 功能特性

- **🎨 JSX 编写幻灯片** — 用熟悉的 React JSX 语法编写幻灯片内容
- **📐 多画布比例** — 支持 16:9 (1280×720) 和 4:3 (1024×768) 两种标准比例
- **🎯 多幻灯片管理** — 左侧边栏支持添加、删除、复制、重命名幻灯片，带收缩/展开功能
- **👁️ 实时预览** — 边写边看，智能缩放适配视口
- **🤖 AI 生成幻灯片** — 支持自定义 API，5 种预设设计风格，智能代码生成
- **📤 导出 PPTX** — 支持导出当前页、全部页面或指定范围页面
- **🎭 主题系统** — 深色/浅色主题切换，全界面统一样式
- **🔤 lucide-react 图标** — 支持所有 lucide 图标库
- **⚡ 浏览器端转译** — 使用 Babel 无需构建步骤，修改代码即时生效

---

## 🚀 快速开始

**前置要求：** Node.js 18+

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可使用。

---

## 📋 可用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 TypeScript 类型检查 |
| `npm run clean` | 清理构建目录 |

---

## 🎨 幻灯片代码示例

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

### 支持的样式特性

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

预览区域根据选择的画布比例自动调整：
- **16:9**: 1280×720 像素
- **4:3**: 1024×768 像素

以下 Tailwind 类会在对应画布上下文中被强制覆盖：
- `h-screen` / `min-h-screen` → 固定为画布高度
- `w-screen` / `min-w-screen` → 固定为画布宽度

---

## 🤖 AI 生成功能

### 支持的 API

目前支持 **自定义 OpenAI 兼容 API**，可配置任意兼容接口的模型服务。

### 设计风格预设

提供 5 种精心设计的美学风格：

- **现代简约** — 简洁现代的设计风格，适合商务演示
- **科技感** — 蓝色科技风格，适合技术主题
- **创意活泼** — 鲜艳色彩，适合创意主题
- **专业严谨** — 简洁专业，适合学术和商务
- **优雅典雅** — 柔和色调，适合艺术和文化

### 使用方式

1. 点击顶部「AI 生成」按钮
2. 在输入框中描述你想要的幻灯片内容
3. 选择合适的设计风格
4. 点击生成，AI 会自动创建 React 代码
5. 预览生成的代码，可选择复制或直接应用到编辑器

---

## 📁 项目结构

```
/
├── index.html              — 入口 HTML
├── server.ts               — Express 服务器（开发热加载 / 生产静态服务）
├── vite.config.ts          — Vite 配置
├── src/
│   ├── App.tsx             — 主应用：编辑器 + 预览 + PPTX 导出逻辑
│   ├── constants.ts        — 默认幻灯片代码示例
│   ├── index.css           — Tailwind CSS v4 + 主题变量
│   ├── components/
│   │   ├── AiGenerationPanel.tsx  — AI 生成面板（带风格选择）
│   │   ├── SettingsModal.tsx     — API 设置对话框
│   │   ├── AiInputModal.tsx      — AI 生成模态框
│   │   └── AiInputBar.tsx        — AI 输入栏
│   └── lib/
│       ├── canvas-config.ts       — 画布比例配置
│       ├── theme-config.ts        — 主题配置
│       ├── api-providers.ts       — API 提供商和模型获取
│       ├── prompt-manager.ts      — 系统提示词管理
│       ├── use-ai-generation.ts   — AI 生成 Hook
│       └── utils.ts               — 工具函数
└── package.json
```

---

## 🛠️ 技术栈

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

## 📤 导出功能

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

---

## 🎭 主题系统

### 主题切换

点击顶部主题切换按钮可在深色和浅色主题间切换：

- **深色主题** — 深蓝灰色调，适合长时间使用
- **浅色主题** — 明亮简洁，适合演示环境

### 主题覆盖范围

主题切换影响所有 UI 元素：
- 编辑器、预览区域、侧边栏
- 所有模态框和面板
- 按钮、输入框、下拉菜单
- 边框、背景、文字颜色

---

## 🔧 配置说明

### API 配置

在设置中配置自定义 API：

1. 点击「设置」按钮
2. 进入「API 配置」标签
3. 填写 API 端点（如：`https://api.example.com/v1`）
4. 填写 API Key
5. 点击「测试连接」获取可用模型列表
6. 选择要使用的模型
7. 点击「保存」

### Prompt 配置

在设置中自定义 AI 生成行为：

1. 进入「Prompt 配置」标签
2. 选择使用默认 Prompt 或自定义
3. 添加额外指令（如设计偏好、颜色要求等）
4. 保存配置

---

## 📝 开发指南

### 添加新的画布比例

1. 在 `src/lib/canvas-config.ts` 中添加新的配置
2. 更新 `CanvasRatio` 类型
3. 在 `App.tsx` 中添加比例选择器选项
4. 测试缩略图渲染和导出功能

### 添加新的 AI 风格

1. 在 `src/components/AiGenerationPanel.tsx` 中的 `PROMPT_STYLES` 数组添加新风格
2. 在 `App.tsx` 的 `handleAiGenerate` 函数中添加对应的风格指令
3. 测试风格应用效果

### 自定义主题

1. 在 `src/index.css` 中修改 CSS 变量
2. 确保深色和浅色主题都有对应的变量定义
3. 遵循 `--category-property` 命名规范

---

## 📄 License

Apache 2.0
