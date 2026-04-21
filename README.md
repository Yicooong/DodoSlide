<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Slide Playground — JSX 幻灯片编辑器

一款运行在浏览器中的幻灯片编辑器，使用 JSX 代码编写幻灯片，实时预览，并导出为 PPTX 文件。

---

## 功能特性

- **JSX 编写幻灯片** — 用熟悉的 React JSX 语法编写幻灯片内容
- **实时预览** — 边写边看，1280×720（16:9）标准比例
- **导出 PPTX** — 一键导出为 `.pptx` 文件，支持形状、颜色、文字、图标
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
├── index.html          — 入口 HTML
├── server.ts           — Express 服务器（开发热加载 / 生产静态服务）
├── vite.config.ts      — Vite 配置
├── src/
│   ├── App.tsx         — 主应用：编辑器 + 预览 + PPTX 导出逻辑
│   ├── constants.ts    — 默认幻灯片代码示例
│   ├── index.css       — Tailwind CSS v4 主题
│   └── lib/utils.ts    — cn() 工具函数
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
| 动画 | motion |
| 图标 | lucide-react |
| 服务器 | Express + Vite |

---

## License

Apache 2.0
