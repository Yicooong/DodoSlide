# AGENT.md

本文件为 AI Agent 提供操作指南，帮助快速理解项目并高效完成任务。

## 项目速览

**项目名称：** DodoSlide
**类型：** 浏览器端幻灯片编辑器，支持 AI 生成
**技术栈：** React 19 + Tailwind CSS v4 + Monaco Editor + pptxgenjs

**核心功能：**
- JSX 代码编写幻灯片，Babel 浏览器端转译
- AI 对话式生成（支持多轮对话、分支、流式响应）
- 多幻灯片生成（保持风格一致）
- 导出 PPTX（DOM 到 pptxgenjs 管道）
- 主题切换（深色/浅色，玻璃态 UI）
- API 提供商管理（OpenAI 兼容）

---

## 快速命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 生产构建
npm start            # 启动生产服务器
npm run lint         # TypeScript 类型检查
```

---

## 关键路径

| 文件/目录 | 说明 |
|-----------|------|
| `src/App.tsx` | 主应用：视图路由、导出逻辑 |
| `src/hooks/use-slides.ts` | 幻灯片 CRUD |
| `src/hooks/use-app-state.ts` | 全局 UI 状态（视图、主题、画布比例）|
| `src/components/ai-generate/` | AI 生成页面（阶段式 UI）|
| `src/lib/chat/` | 对话系统（树状消息、持久化）|
| `src/lib/providers/` | API 提供商系统 |
| `src/lib/pptx-exporter.ts` | DOM 到 PPTX 转换管道 |
| `src/prompts/templates/` | 提示词模板（5 种风格）|

---

## 架构要点

### 视图系统
- `landing` → 首页（Hero + 功能卡片）
- `ai-generate` → AI 生成（EntryPhase ↔ WorkspacePhase）
- `code` / `preview` → Monaco 编辑器 + 实时预览

### AI 生成流程
1. **EntryPhase**：选择风格、画布比例，输入描述
2. **WorkspacePhase**：对话列表 + AI 侧边栏 + 预览/代码
3. **流式响应**：SSE via ReadableStream，逐 token 显示
4. **多页生成**：`useMultiGeneration()` 逐页生成，保持上下文

### 对话系统
- **消息结构**：树状（parentId/childrenIds），支持分支
- **持久化**：localStorage，最多 50 个对话
- **上下文**：后续请求发送最近 10 条消息

### 提示词系统
- **StylePromptBundle**：style.txt + workflow.md + reference_*.jsx
- **自动发现**：reference_*.jsx 通过 `import.meta.glob` 自动加载
- **灵活配置**：可禁用 workflow/references

---

## 开发约定

### 添加新功能
1. 在对应目录创建组件/Hook
2. 遵循现有代码风格（TypeScript、CSS 变量）
3. 使用 `lucide-react` 图标
4. 支持深色/浅色主题（CSS 变量）

### 添加 AI 风格
1. 创建 `src/prompts/templates/{name}/` 目录
2. 添加 `style.txt`（必需）、`workflow.md`（可选）、`reference_*.jsx`（可选）
3. 在 `src/prompts/templates/index.ts` 注册

### 修改主题
1. 编辑 `src/index.css` 中的 CSS 变量
2. 同时修改 `.dark` 和 `.light` 作用域
3. 遵循 `--category-property` 命名规范

---

## 重要注意事项

1. **默认主题**：浅色（在 `use-app-state.ts` 中设置）
2. **预览背景**：始终白色（`--bg-preview-canvas`）
3. **导出**：直接下载 PPTX，不导航
4. **停止生成**：使用 AbortController
5. **面板大小**：自动保存到 localStorage
6. **对话系统**：树状结构，支持分支
7. **流式响应**：SSE (ReadableStream)
8. **端口清理**：任务完成后运行端口清理脚本

---

## 文档维护

完成重大任务后，更新以下文档：
- `README.md`：项目功能、使用方法、依赖变化
- `CLAUDE.md`：架构、组件说明、开发指南
- `AGENT.md`：Agent 操作指南（本文件）
- 子目录 `CLAUDE.md`：各模块详细说明

---

## 端口清理

任务完成后必须清理端口：
```bash
kill $(lsof -t -i:3000) 2>/dev/null; kill $(lsof -t -i:24678) 2>/dev/null
```
- 端口 3000：Vite 开发服务器
- 端口 24678：Vite WebSocket 热更新服务
