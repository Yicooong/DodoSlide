<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DodoSlide — AI 幻灯片生成平台

一款功能强大的浏览器端幻灯片编辑器，使用 JSX 代码编写幻灯片，支持 AI 生成、多种画布比例、主题切换，并可导出为 PPTX 文件。支持对话式 AI 交互、多幻灯片生成和完整的 API 提供商管理。

---

## 功能特性

### 核心功能
- **AI 智能生成** — 通过自然语言描述，AI 自动生成专业幻灯片
- **对话式交互** — 基于树状结构的对话系统，支持多轮对话和分支
- **多幻灯片生成** — 支持一次性生成多页幻灯片，保持风格一致
- **15 种设计风格** — 覆盖商务、创意、科技、编辑、通用五大分类，支持分类筛选
- **实时预览** — 边写边看，代码即所得
- **Inspector 点选编辑** — 点击预览元素直接修改样式和文本，实时同步到代码
- **多画布比例** — 支持 16:9 (1280×720) 和 4:3 (1024×768)
- **导出 PPTX** — 支持导出当前页、全部页面或指定范围

### 界面与体验
- **深色/浅色主题** — 全界面统一样式切换
- **可调整面板** — 使用 react-resizable-panels 实现拖拽调整布局
- **玻璃态设计** — 现代化的毛玻璃效果 UI
- **lucide-react 图标** — 支持所有 lucide 图标库

### 技术特性
- **浏览器端转译** — 使用 Babel 无需构建步骤
- **SSE 流式响应** — AI 生成过程实时展示
- **API 提供商管理** — 支持自定义 OpenAI 兼容 API
- **localStorage 持久化** — 对话历史和设置自动保存

---

## 快速开始

**前置要求：** Node.js 18+

### 主应用
```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 构建生产版本
npm start            # 启动生产服务器
npm run lint         # TypeScript 类型检查
```

### Chrome 扩展
项目附带独立的浏览器扩展，位于 `chrome-extension/` 目录：
```bash
cd chrome-extension
npm install          # 安装扩展依赖
npm run build        # 构建扩展（输出到 dist/）
```
构建后可将 `chrome-extension/react-slide-to-pptx.zip` 直接拖入浏览器扩展页面安装。

---

## 界面导航

### 首页 (LandingPage)
- **开始创作** → 进入 AI 生成页面（对话式交互）
- **代码编辑器** → 进入 Monaco 编辑器（手动编写 JSX）

### AI 生成页面 (Phase-Based UI)
**入口阶段 (EntryPhase):**
1. 选择设计风格模板（15 种预设，支持按商务/创意/科技/编辑分类筛选）
2. 选择画布比例（16:9 或 4:3）
3. 输入幻灯片描述（自由输入或引导模式）
4. 点击生成，AI 自动创建幻灯片

**工作区阶段 (WorkspacePhase):**
- 左侧：对话列表侧边栏（可折叠，支持搜索/重命名）
- 中间：AI 助手侧边栏（可调整宽度，显示对话历史）
- 右侧：预览/代码区域（可切换标签页）
- 支持发送后续修改指令（如"把背景调深一点"）
- 停止按钮可取消正在生成的请求
- 导出按钮直接下载 PPTX 文件

### 代码编辑器
- 左侧：幻灯片缩略图列表（可折叠，支持增删改查）
- 中间：Monaco 代码编辑器 / 实时预览（可切换标签页）
- 右侧：设计面板 — 点击预览元素可编辑样式和文本（可折叠）
- 顶部：画布比例切换、主题切换、上传 JSX、导出 PPTX

---

## 项目结构

```
src/
├── main.tsx                    — React 根挂载
├── App.tsx                     — 主应用：视图路由、导出逻辑
├── constants.ts                — 默认代码示例
├── index.css                   — Tailwind + 主题变量
├── hooks/
│   ├── use-slides.ts           — 幻灯片 CRUD、批量操作
│   ├── use-app-state.ts        — 视图类型、主题、画布比例、标签页
│   ├── use-slide-renderer.tsx  — JSX 转译和渲染（Babel）
│   └── use-multi-generation.ts — 多幻灯片生成 Hook
├── components/
│   ├── landing/                — 首页
│   │   └── LandingPage.tsx     — Hero 页面（渐变背景 + 功能卡片）
│   ├── ai-generate/            — AI 生成页面（阶段式 UI）
│   │   ├── AiGeneratePage.tsx  — 阶段编排器（entry ↔ workspace）
│   │   ├── EntryPhase.tsx      — 入口态：玻璃态聊天框 + 风格卡片
│   │   ├── WorkspacePhase.tsx  — 工作区态：对话列表 + AI 侧边栏 + 预览
│   │   ├── AiAssistantSidebar.tsx — AI 对话侧边栏（消息历史）
│   │   ├── ConversationListSidebar.tsx — 对话列表（搜索/重命名）
│   │   ├── MessageBubble.tsx   — 消息气泡（流式/状态支持）
│   │   ├── TemplateCard.tsx    — 风格卡片（缩略图预览）
│   │   ├── ConversationPanel.tsx — 遗留面板（未使用）
│   │   └── StylePanel.tsx      — 遗留面板（未使用）
│   ├── slide/                  — 幻灯片管理
│   │   ├── SlideSidebar.tsx    — 可折叠幻灯片列表
│   │   └── SlideThumbnail.tsx  — 缩略图（ResizeObserver）
│   ├── editor/                 — 代码编辑器
│   │   └── CodeEditor.tsx      — Monaco 编辑器包装器
│   ├── preview/                — 预览组件
│   │   └── SlidePreview.tsx    — 实时预览（错误显示）
│   ├── header/                 — 顶部导航
│   │   └── AppHeader.tsx       — 标签页、画布比例、主题、导出
│   ├── export/                 — 导出组件
│   │   └── ExportModal.tsx     — PPTX 导出对话框
│   ├── design/                 — 设计面板
│   │   ├── DesignPanel.tsx     — 元素编辑面板（Inspector 模式 UI）
│   │   └── DesignProvider.tsx  — 设计令牌上下文（CSS 变量注入）
│   ├── settings/               — 设置组件
│   │   ├── ProviderList.tsx    — 提供商列表
│   │   ├── ProviderListItem.tsx — 提供商列表项
│   │   ├── ProviderDetailEditor.tsx — 提供商编辑器
│   │   ├── ApiKeyInput.tsx     — API Key 输入（显示/隐藏）
│   │   ├── ModelSelectInput.tsx — 模型选择（组合框）
│   │   └── CustomEndpointEditor.tsx — 自定义端点编辑器
│   ├── SettingsModal.tsx        — 设置模态框（API 配置 + Prompt 配置）
│   └── AiGenerationPanel.tsx    — 遗留 AI 面板（未使用）
├── lib/
│   ├── canvas-config.ts        — 16:9 和 4:3 配置
│   ├── theme-config.ts         — 深色/浅色主题定义
│   ├── api-providers.ts        — 自定义 API 提供商 + 模型获取
│   ├── prompt-manager.ts       — 系统提示词 + 风格提示词构建
│   ├── use-ai-generation.ts    — AI 生成 Hook（支持中止）
│   ├── pptx-exporter.ts        — DOM 到 PPTX 转换管道
│   ├── utils.ts                — cn() 工具函数（clsx + tailwind-merge）
│   ├── chat/                   — 对话系统
│   │   ├── types.ts            — ChatMessage、Conversation 类型
│   │   ├── conversation-storage.ts — localStorage 持久化
│   │   ├── conversation-manager.ts — 对话 CRUD 逻辑
│   │   ├── use-conversation.ts — React Hook（对话状态管理）
│   │   ├── use-streaming.ts    — SSE 流式 Hook
│   │   └── code-extractor.ts   — 从 AI 响应提取 JSX
│   └── providers/              — API 提供商系统
│       ├── types.ts            — Provider、ApiCallOptions 类型
│       ├── api-strategy.ts     — 策略注册表
│       ├── openai-strategy.ts  — OpenAI 兼容 API（流式）
│       ├── provider-manager.ts — 提供商 CRUD
│       ├── provider-storage.ts — localStorage 持久化
│       ├── provider-validator.ts — 提供商验证
│       └── use-provider-manager.ts — React Hook 桥接
└── prompts/
    └── templates/              — 提示词模板
        ├── index.ts            — 模板注册表（15 种风格）+ 分类系统 + 包访问器
        └── {style}/
            ├── style.txt       — 视觉风格提示词（必需）
            ├── workflow.md      — 设计方法论 SOP（可选）
            └── reference_*.jsx  — 参考幻灯片示例（可选，自动发现）
```

### Chrome 扩展目录
```
chrome-extension/
├── manifest.json               — 扩展清单
├── popup/                      — 弹出窗口
├── dist/                       — 构建输出
├── react-slide-to-pptx.zip     — 打包的扩展文件
└── vite.config.ts              — Vite 配置
```

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | React 19 + Tailwind CSS v4 |
| 代码编辑器 | Monaco Editor (`@monaco-editor/react`) |
| JSX 转译 | Babel (`@babel/standalone`，浏览器端) |
| PPTX 生成 | pptxgenjs |
| 动画 | motion (Framer Motion) |
| 图标 | lucide-react |
| 可调整面板 | react-resizable-panels |
| ID 生成 | nanoid |
| 服务器 | Express + Vite (dev) / 静态服务 (prod) |

---

## AI 生成功能

### 对话系统
项目实现了完整的对话系统，支持：
- **树状消息结构**：每条消息可以有父消息和子消息，支持分支对话
- **对话管理**：创建、切换、重命名、删除对话
- **历史持久化**：自动保存到 localStorage（最多 50 个对话）
- **流式响应**：使用 SSE (Server-Sent Events) 实时显示生成过程

### 支持的 API
自定义 OpenAI 兼容 API，可配置任意兼容接口的模型服务。
- 支持自定义 API 端点
- 支持自定义端点（如特定的功能端点）
- 支持温度和最大令牌数配置

### 设计风格预设

| 风格 ID | 名称 | 分类 | 说明 |
|---------|------|------|------|
| modern | 现代简约 | 通用 | 白色背景，深色文字，简洁留白 |
| tech | 科技暗黑 | 科技 | 深蓝黑背景，霓虹蓝绿，科技感 |
| creative | 创意活力 | 创意 | 多彩撞色，不规则布局，活泼动感 |
| professional | 专业商务 | 商务 | 海军蓝白，严谨网格，清晰层次 |
| elegant | 优雅典雅 | 通用 | 米白暖棕，精致排版，高级质感 |
| magazine | 杂志风 | 编辑 | 衬线主导，暖色调，杂志质感 |
| swiss | 瑞士风 | 通用 | 纯无衬线，网格严格，克莱因蓝 |
| corporate | 企业商务 | 商务 | 海军蓝白，严谨保守，咨询风格 |
| pitch | 融资路演 | 商务 | 蓝紫渐变，大留白，YC 风格 |
| brutal | 新粗野主义 | 创意 | 米白底，黑边框硬阴影，明黄强调 |
| editorial | 编辑衬线 | 编辑 | 奶油底，Playfair 衬线，铁锈红强调 |
| japanese | 日式极简 | 编辑 | 象牙白底，朱红点缀，极致留白 |
| cyberpunk | 赛博朋克 | 科技 | 黑底霓虹，粉青撞色，辉光效果 |
| blueprint | 蓝图 | 科技 | 深蓝底色，白色线条，网格虚线 |
| news | 新闻播报 | 编辑 | 白底红色点缀，Oswald 大写，硬阴影 |

### 提示词系统
- **StylePromptBundle**：组合 style.txt（视觉规则）、workflow.md（设计方法）、reference_*.jsx（示例）
- **自动发现**：reference_*.jsx 文件通过 `import.meta.glob` 自动加载
- **灵活配置**：支持禁用 workflow/references，控制发送给 API 的内容

### 使用方式

**单页生成：**
1. 点击「开始创作」进入 AI 生成页面
2. 选择设计风格模板
3. 选择画布比例（16:9 或 4:3）
4. 在输入框中描述幻灯片内容（自由输入或引导模式）
5. 点击生成，AI 自动创建
6. 预览效果，可发送后续修改指令
7. 满意后点击导出下载

**多页生成：**
- 在描述中指定页数（如"生成 5 页关于..."）
- 系统自动逐页生成，保持风格一致
- 可在生成过程中随时停止

---

## 浏览器扩展

项目附带一个独立的 Chrome/Edge 浏览器扩展，位于 `chrome-extension/` 目录。点击扩展图标即可粘贴 React JSX 代码并一键导出 PPTX，无需 AI 功能和代码编辑器。

**快速安装：**
1. 打开 `chrome://extensions`（或 `edge://extensions`）
2. 开启「开发者模式」
3. 将 `chrome-extension/react-slide-to-pptx.zip` 拖入页面即可
   - 或者：加载 `chrome-extension/dist/` 目录作为解压的扩展

**扩展功能：**
- 粘贴 JSX 代码到弹出窗口
- 一键导出为 PPTX
- 无需主应用即可使用

详细说明见 [chrome-extension/README.md](chrome-extension/README.md)。

---

## 导出功能

### 导出模式
支持三种导出模式：

- **全部导出** — 导出所有幻灯片到一个 PPTX 文件
- **导出当前** — 仅导出当前选中的幻灯片（可指定页码）
- **导出范围** — 导出指定页码范围的幻灯片（自动处理起止顺序）

### 导出处理
导出时自动处理：
- **形状** — 矩形、圆角矩形、边框线条
- **SVG 图标** — lucide-react 图标序列化为 base64 嵌入
- **富文本** — 字体大小（px→pt×0.75）、粗细、颜色、对齐
- **背景** — 纯色、渐变（通过 canvas 技巧解析 oklch、color-mix、rgba）
- **透明度** — 继承 DOM 树的透明度计算

### 缩放系统
预览使用 CSS transform 缩放，导出使用原始坐标：
```javascript
pxToIn = (px / currentScale) * canvasConfig.pptxWidthIn / canvasConfig.width
```

---

## 主题系统

### 主题切换
点击顶部主题切换按钮：
- **浅色主题** — 明亮简洁，适合演示环境（默认）
- **深色主题** — 深蓝灰色调，适合长时间使用

### 预览独立性
幻灯片预览区域始终使用白色背景（`--bg-preview-canvas`），不受主题切换影响。

### 玻璃态设计
UI 使用 CSS 变量实现玻璃态效果：
- `--glass-bg`：半透明背景
- `--glass-border`：半透明边框
- `--glass-shadow`：玻璃阴影效果

---

## 配置说明

### API 提供商配置
1. 点击「设置」按钮（全局可用）
2. 在「API 配置」标签页：
   - 点击「添加提供商」创建新配置
   - 填写名称、API 端点、API Key
   - 点击「测试连接」获取模型列表
   - 选择模型并保存
3. 支持多个提供商，可随时切换
4. 支持自定义端点（如 `/v1/chat/completions` 之外的端点）

### Prompt 配置
1. 进入设置的「Prompt 配置」标签
2. 选择使用默认 Prompt 或自定义
3. 添加额外指令（会附加到系统提示词）
4. 保存配置

### 对话管理
- 左侧边栏显示所有对话（可搜索）
- 点击切换对话，双击重命名
- 支持创建新对话、删除对话
- 自动保存到 localStorage（最多 50 个）

---

## 开发指南

### 添加新的画布比例
1. 更新 `src/lib/canvas-config.ts` 中的 `CanvasRatio` 类型
2. 添加配置到 `CANVAS_CONFIGS`（包含 width、height、pptxWidthIn、pptxHeightIn）
3. 测试缩略图渲染和导出

### 添加新的 AI 风格
1. 创建 `src/prompts/templates/{name}/` 目录
2. 创建 `style.txt`（必需）：采用标准化 7 章节格式（配色方案、排版系统、布局模式、组件模式、装饰元素、禁止项、质量自检）
3. 可选创建 `workflow.md`：设计方法论 SOP（6 阶段流程 + 质量自检）
4. 可选添加 `reference_*.jsx`：参考示例（自动发现，无需 import）
5. 在 `src/prompts/templates/index.ts` 中注册：
   - 导入 style.txt（?raw）
   - 如有 workflow.md 也导入（?raw）
   - 添加到 `STYLE_TEMPLATES` 数组（含 `category` 分类字段）
6. 风格自动出现在 EntryPhase 的模板卡片中，按分类筛选

### 自定义主题
1. 在 `src/index.css` 中修改 CSS 变量
2. 确保 `.dark` 和 `.light` 两个作用域都有定义
3. 遵循 `--category-property` 命名规范（如 `--bg-preview-canvas`）
4. 测试所有组件在两个主题下的显示效果

### 添加新的 Hook
- 提取组件中的复杂状态逻辑
- 封装副作用（API 调用、localStorage）
- 提供 TypeScript 类型定义
- 确保单一职责原则

---

## 重要说明

1. **默认主题**：浅色主题（在 `use-app-state.ts` 中设置）
2. **预览背景**：始终白色（`--bg-preview-canvas` 变量）
3. **导出触发**：直接下载 PPTX，不导航到其他页面
4. **停止按钮**：使用 AbortController 取消 AI 请求
5. **单页生成**：默认可生成多页（使用 `use-multi-generation.ts`）
6. **全局设置**：设置按钮在编辑器和 AI 生成页面都可用
7. **面板大小持久化**：`react-resizable-panels` 自动保存到 localStorage
8. **对话系统**：消息使用树状结构（parentId/childrenIds）支持分支
9. **流式响应**：AI 响应通过 SSE (ReadableStream) 逐 token 流式返回
10. **对话上下文**：后续请求发送最近 10 条消息作为上下文
11. **localStorage 持久化**：对话存储在 `dodoslide_conversations` 键下（最多 50 个）

---

## 致谢与参考

本项目的 AI 风格模板系统参考了以下开源项目，在此表示感谢：

| 项目 | 说明 |
|------|------|
| [html-ppt-skill](https://github.com/lewislulu/html-ppt-skill) | HTML PPT Studio — 36 个 CSS 主题 + 设计 token 体系 + 31 种布局模式，本项目模板标准化格式的主要灵感来源 |
| [guizang-ppt-skill](https://github.com/op7418/guizang-ppt-skill) | 杂志风 × 瑞士风横向翻页网页 PPT，本项目 magazine 和 swiss 模板的参考 |
| [open-slide](https://github.com/1weiho/open-slide) | 开源幻灯片生成工具，提供了 AI 幻灯片生成流程的参考 |
| [awesome-claude-design](https://github.com/rohitg00/awesome-claude-design) | Claude 设计类 Skill 合集，提供了技能系统设计的参考 |
| [garden-skills](https://github.com/ConardLi/garden-skills) | Claude Skills 花园，提供了 Skill 生态和模板组织方式的参考 |

---

## License

Apache 2.0
