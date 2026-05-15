# 风格模板开发指南

本指南定义了 DodoSlide AI 风格模板的完整规范。新增任何风格都必须遵循本文档的结构和质量要求。

---

## 目录结构

每个风格模板由三个文件组成，放在 `src/prompts/templates/{id}/` 目录下：

```
src/prompts/templates/
├── index.ts                  # 模板注册（所有风格在此声明）
├── STYLE_GUIDE.md            # 本文件
└── {style-id}/
    ├── style.txt             # [必需] 视觉风格提示词
    ├── workflow.md            # [必需] 设计方法论 SOP
    └── reference_1.jsx       # [必需] 参考幻灯片示例
```

**命名规则**：
- 目录名使用小写英文 kebab-case（如 `neo-brutal`、`japanese-minimal`）
- 保持简洁，2-3 个单词以内
- 不要与现有风格 ID 重复

---

## 一、style.txt 规范

style.txt 是 AI 生成幻灯片时的核心视觉指令。格式必须严格遵循以下 7 个章节，顺序固定。

### 文件头

```markdown
## 中文风格名 (English Name)

一句话灵感来源描述，点明设计语言的视觉基因。
```

### 第 1 章：配色方案

以 Markdown 表格定义完整的色彩系统。必须包含以下角色：

```markdown
### 配色方案

| 角色 | 色值 | Tailwind |
|------|------|----------|
| 主背景 | `#XXXXXX` | `bg-[#XXXXXX]` |
| 区块底（可选） | `#XXXXXX` | `bg-[#XXXXXX]` |
| 主文字 | `#XXXXXX` | `text-[#XXXXXX]` |
| 辅助文字 | `#XXXXXX` | `text-[#XXXXXX]` |
| 弱化文字 | `#XXXXXX` | `text-[#XXXXXX]` |
| 主强调色 | `#XXXXXX` | `bg-[#XXXXXX]` / `text-[#XXXXXX]` |
| 辅强调色（可选） | `#XXXXXX` | `text-[#XXXXXX]` |
| 点缀色（可选） | `#XXXXXX` | `text-[#XXXXXX]` |
| 分割线 | `rgba(...)` 或 `#XXXXXX` | `border-[...]` |
```

**要求**：
- 主背景、主文字、主强调色为必选
- Tailwind 列必须给出可直接使用的类名
- 深色背景风格需要同时定义深色底上的文字颜色
- 如果有特殊背景（如网格、渐变），用单独的代码块给出 inline style

### 第 2 章：排版系统

以 Markdown 表格定义字体层次。必须覆盖以下角色：

```markdown
### 排版系统

| 角色 | 字体 | 字重 | 字号 | Tailwind 写法 |
|------|------|------|------|---------------|
| Hero 标题 | ... | ... | ~Xvw | `...` |
| 章节标题 | ... | ... | ~Xvw | `...` |
| 正文标题 | ... | ... | ~Xvw | `...` |
| 引导段 | ... | ... | ~Xvw | `...` |
| 正文 | ... | ... | max(Xpx, Xvw) | `...` |
| Kicker | ... | ... | Xpx | `...` |
| 数据数字 | ... | ... | ~Xvw | `...` |
| 元数据 | ... | ... | Xpx | `...` |
```

**要求**：
- Hero 标题、正文标题、正文为必选
- 字号使用 `vw` 单位保证缩放适配，正文用 `max(px, vw)` 保底
- Tailwind 写法必须完整（包含 font-*、text-*、leading-*、tracking-* 等）
- 如有中文标题降级规则，在表格下方单独说明

**可用字体族**（已在 index.css 注册）：
- `font-sans` → Inter
- `font-mono` → JetBrains Mono
- `font-serif` → Playfair Display / Noto Serif SC
- `font-display` → Archivo Black / Space Grotesk
- `font-heading` → Oswald

### 第 3 章：布局模式

定义 6-10 种可复用的页面布局。每种布局必须包含：

```markdown
### 布局模式

**1. Cover Name（封面名称）**
- 用途：一句话说明适用场景
- 结构：描述几栏、各区域放什么
- Tailwind：`flex flex-col justify-center p-20`
```

**必选布局**：
1. **封面页** — 演示文稿第一页
2. **数据/指标页** — KPI、图表展示
3. **并列/对比页** — 多栏并列或双栏对比
4. **图文混排页** — 文字 + 图片
5. **列表/步骤页** — 要点、流程
6. **收尾页** — 演示文稿最后一页

**要求**：
- 至少 6 种不同布局
- 每种布局给出完整的 Tailwind 类名片段
- 布局名称使用英文，用途说明使用中文

### 第 4 章：组件模式

定义可复用的 UI 组件 JSX 代码片段：

```markdown
### 组件模式

**Component Name（组件名）**
\`\`\`jsx
<div className="...">
  {/* 组件内容 */}
</div>
\`\`\`
```

**建议组件**：
- 数据卡片（KPI/Stat Card）
- 标签/徽章（Kicker/Badge）
- 分割线/装饰元素
- 引用框/Callout
- 按钮/CTA

**要求**：
- 每个组件给出完整的 Tailwind className
- 使用 inline style 的情况（如 box-shadow、background-image）给出完整 style 对象
- 至少 3 个组件

### 第 5 章：装饰元素

列出该风格的装饰性视觉元素：

```markdown
### 装饰元素

- **元素名**：`className 或 CSS 属性`
- **元素名**：`className 或 CSS 属性`
```

包括：分割线、背景纹理、角标、装饰性图形等。

### 第 6 章：禁止项

明确列出不允许的设计选择：

```markdown
### 禁止项

- 禁止使用 emoji 图标，必须用 lucide-react
- 禁止使用 XXX
- ...
```

**常见禁止项**（根据风格选择）：
- 禁止使用 emoji 图标（所有风格通用）
- 禁止使用圆角 / 禁止使用直角
- 禁止使用阴影 / 禁止使用渐变
- 禁止使用衬线字体 / 禁止使用无衬线字体
- 禁止自定义 hex 值（只用预设配色）
- 禁止使用 `rounded-2xl` 以上大圆角

### 第 7 章：质量自检

分三级定义质量检查清单：

```markdown
### 质量自检

**P0（必须通过）**
- 画布尺寸正确：`w-[1280px] h-[720px]`
- 配色一致：使用且仅使用预设配色
- 使用 lucide-react 图标，不使用 emoji
- 字体使用正确

**P1（布局节奏）**
- 使用了至少 3 种不同的布局模式
- 不连续 3 页使用同一布局
- 封面和收尾页有明显视觉区分

**P2（视觉打磨）**
- 间距一致（padding/margin 使用预设值）
- 字号层次清晰（Hero > 章节 > 正文 > 元数据）
- 装饰元素适度，不喧宾夺主
```

---

## 二、workflow.md 规范

workflow.md 是 AI 的设计方法论 SOP（Standard Operating Procedure），指导 AI 如何从用户输入到最终输出。

### 文件头

```markdown
# 中文风格名设计方法论 (English Name Design SOP)

---
```

### 结构：6 个阶段

```markdown
## 第一阶段：内容语义解析

分析用户输入，识别内容类型并匹配视觉策略。

| 内容类型 | 视觉策略 |
|---------|---------|
| 数据/指标 | KPI 卡片 / 数据仪表盘 |
| 概念并列 | 多栏卡片 |
| ... | ... |

---

## 第二阶段：布局决策

根据内容类型选择布局模式。

### 布局选择原则
- 信息密度高 → ...
- 视觉主导 → ...

---

## 第三阶段：色彩系统

定义该风格的色彩使用规则。

---

## 第四阶段：排版规范

定义字号、字重、行高的使用规则。

---

## 第五阶段：组件与装饰

定义可复用组件的选择和装饰元素的使用规则。

---

## 第六阶段：质量自检

生成完毕后的自检流程（对应 style.txt 的 P0/P1/P2）。
```

**要求**：
- 每个阶段用 `---` 分隔
- 包含至少 1 个表格（内容类型映射或布局选择矩阵）
- 阶段之间有逻辑递进关系
- 总行数 100-160 行

---

## 三、reference_1.jsx 规范

reference_1.jsx 是一个完整的、可直接渲染的 JSX 幻灯片组件，作为 AI 的 few-shot 示例。

### 模板结构

```jsx
import React from 'react';
import { Icon1, Icon2 } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 风格名 + 布局类型 */}
      <div className="w-[1280px] h-[720px] bg-[#XXXXXX] text-[#XXXXXX] relative overflow-hidden ...">

        {/* 页面内容 */}

      </div>
    </div>
  );
};

export default App;
```

### 必须遵守

| 规则 | 说明 |
|------|------|
| 画布尺寸 | `w-[1280px] h-[720px]`，不可修改 |
| 外层容器 | `flex items-center justify-center min-h-screen bg-slate-200 p-2` |
| 导出格式 | `const App = () => { ... }; export default App;` |
| 图标 | 只用 `lucide-react`，不用 emoji |
| 样式 | 只用 Tailwind CSS 类名，需要时可用 inline style |
| 色值 | 只使用 style.txt 中定义的配色 |
| 字体 | 只使用 `font-sans`、`font-mono`、`font-serif`、`font-display`、`font-heading` |

### 内容要求

- 展示该风格最有代表性的布局（通常是封面或数据页）
- 包含至少 2 种文字层次（标题 + 正文/数据）
- 包含至少 1 个 lucide-react 图标
- 包含该风格的标志性装饰元素
- 总行数 60-140 行

### 示例：封面页参考

```jsx
import React from 'react';
import { ArrowRight } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      <div className="w-[1280px] h-[720px] bg-[#FAFAF8] text-[#0A0A0A] relative overflow-hidden flex flex-col justify-center p-20">
        {/* 分类标签 */}
        <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#002FA7] mb-4">
          Product Launch · 2026
        </span>

        {/* Hero 标题 */}
        <h1 className="font-thin text-[min(11.6vw,19vh)] leading-[0.9] tracking-[-0.04em] mb-8">
          Design
          <br />
          Systems
        </h1>

        {/* 引导段 */}
        <p className="font-normal text-[1.55vw] text-[#737373] max-w-[50vw] mb-12">
          构建可扩展的视觉语言，让每一页幻灯片都保持一致的专业品质。
        </p>

        {/* CTA */}
        <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#002FA7]">
          <span>Explore</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default App;
```

---

## 四、注册到 index.ts

创建完三个文件后，需要在 `index.ts` 中注册新风格。

### 4.1 添加导入

```typescript
// 样式提示词导入（文件顶部）
import newStyle from './new-style/style.txt?raw';

// 工作流提示词导入
import newWorkflow from './new-style/workflow.md?raw';

// reference_*.jsx 通过 import.meta.glob 自动发现，无需手动导入
```

### 4.2 添加模板条目

在 `STYLE_TEMPLATES` 数组中添加：

```typescript
{
  id: 'new-style',              // 与目录名一致
  name: '新风格名',              // 中文显示名
  description: '一句话描述',     // 10 字以内
  category: 'general',          // 分类：business | creative | tech | editorial | general
  colors: ['#XXXXXX', '#XXXXXX', '#XXXXXX'],  // 主色调（3 个）
  stylePrompt: newStyle,
  workflowPrompt: newWorkflow,
  referenceExamples: getReferencesForStyle('new-style'),
},
```

### 分类选择指南

| 分类 | 适用场景 | 现有示例 |
|------|---------|---------|
| `business` | 商务汇报、融资路演、企业介绍 | corporate, pitch, professional |
| `creative` | 创意展示、设计提案、品牌宣传 | creative, brutal |
| `tech` | 技术分享、架构设计、数据报告 | tech, cyberpunk, blueprint |
| `editorial` | 内容发布、杂志排版、新闻播报 | magazine, editorial, japanese, news |
| `general` | 通用场景、无明显倾向 | modern, elegant, swiss |

---

## 五、质量检查清单

在提交新风格之前，逐项检查：

### 文件完整性
- [ ] `style.txt` 存在且包含全部 7 个章节
- [ ] `workflow.md` 存在且包含 6 个阶段
- [ ] `reference_1.jsx` 存在且可正常渲染
- [ ] `index.ts` 中已注册（导入 + 条目）

### style.txt 质量
- [ ] 配色方案表格包含至少 6 个角色
- [ ] 排版系统表格包含至少 6 个角色
- [ ] 每个 Tailwind 写法可直接复制使用
- [ ] 布局模式至少 6 种，每种有 Tailwind 代码
- [ ] 组件模式至少 3 个，每个有完整 JSX
- [ ] 禁止项至少 4 条
- [ ] 质量自检包含 P0/P1/P2 三级

### workflow.md 质量
- [ ] 6 个阶段结构完整
- [ ] 包含至少 1 个决策表格
- [ ] 行数在 100-160 行之间

### reference_1.jsx 质量
- [ ] 画布尺寸为 `w-[1280px] h-[720px]`
- [ ] 导出格式为 `const App = () => {}; export default App;`
- [ ] 只使用 lucide-react 图标
- [ ] 色值来自 style.txt 定义的配色
- [ ] 行数在 60-140 行之间

### 视觉一致性
- [ ] style.txt 中的色值与 index.ts 中的 `colors` 数组一致
- [ ] workflow.md 中引用的布局模式在 style.txt 中有定义
- [ ] reference_1.jsx 中使用的类名在 style.txt 中有规范

---

## 六、快速创建流程

```bash
# 1. 创建目录
mkdir src/prompts/templates/my-style

# 2. 创建三个文件（按本指南的格式）
# 3. 在 index.ts 中注册

# 4. 验证 TypeScript 编译
npx tsc --noEmit

# 5. 启动开发服务器测试
npm run dev
```

---

## 七、现有风格参考

按质量排序，推荐参考：

| 风格 | 特点 | 推荐参考内容 |
|------|------|-------------|
| swiss | 最严格的设计系统 | 排版系统（字重驱动层次）、网格布局 |
| magazine | 丰富的布局模式 | 布局模式（10 种）、组件模式 |
| cyberpunk | 强视觉风格 | 装饰元素（发光效果）、禁止项 |
| news | 清晰的信息层次 | 组件模式（Kicker Badge）、质量自检 |
| japanese | 极致留白 | 禁止项（克制原则）、中文降级规则 |
