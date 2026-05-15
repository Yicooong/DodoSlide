# 新粗野主义设计方法论 (Neo-Brutalism SOP)

---

## 第一阶段：信息提炼

新粗野主义拒绝含蓄。面对用户输入，先将内容提炼为最直接的表达：

| 内容类型 | 视觉策略 | 说明 |
|---------|---------|------|
| 核心宣言/观点 | Manifesto Cover | 巨型大写标题，黄色 pill 标签 |
| 多项特性/优势 | Bold Grid | 2x2 或 3x2 网格，厚边框+硬阴影 |
| 核心数据 | Number Feature | 左侧巨型数字，右侧描述 |
| 对比/对立 | Split Statement 或 Comparison Versus | 黄底vs白底，或三栏PK |
| 清单/要点 | Checklist | 带勾选标记的列表，黄色背景 |
| 金句/评价 | Quote Block | 黑底+白字+黄色引号装饰 |
| 号召行动 | CTA Closing | 黄色全底+黑色大标题+按钮 |

**核心原则：删到不能删为止。** 每个元素都必须有存在的理由，否则去掉。

---

## 第二阶段：大胆布局

### 布局决策矩阵

| 内容特征 | 推荐布局 | 视觉特征 | 适用场景 |
|---------|---------|---------|---------|
| 单一强观点 | Manifesto Cover | 全页大字，黄色标签 | 封面、转折页 |
| 3-6 个并列项 | Bold Grid | 厚边框卡片，硬阴影 | 产品特性、服务项目 |
| 一个关键数字 | Number Feature | 左大右小，对比强烈 | 核心成就、里程碑 |
| 两个对立面 | Split Statement | 黄白分栏，黑线分隔 | 新旧对比、优劣对比 |
| A vs B 选择 | Comparison Versus | 三栏：左+VS+右 | 竞品对比、方案选择 |
| 行动清单 | Checklist | 黄色勾选框，粗体文字 | 优势列表、承诺清单 |
| 收尾号召 | CTA Closing | 黄色全底，居中大标题 | 最后一页 |

### 间距规范
- 页面 padding：`p-16` 到 `p-20`
- 卡片间距：`gap-5`
- 卡片内边距：`p-6`
- 元素之间用充足留白制造呼吸感

---

## 第三阶段：粗野风格执行

### 边框与阴影——粗野风的灵魂

**所有交互元素必须同时具备：**
- 厚边框：`border-[3px] border-black`
- 硬阴影：`shadow-[6px_6px_0_#000]`

**阴影尺寸对照表：**

| 元素类型 | 阴影偏移 | Tailwind |
|---------|---------|---------|
| 大卡片 | 6px | `shadow-[6px_6px_0_#000]` |
| 小卡片/标签 | 4px | `shadow-[4px_4px_0_#000]` |
| 按钮 | 4px | `shadow-[4px_4px_0_#000]` |
| 悬停态 | 2px | `shadow-[2px_2px_0_#000]` + `translate` |

### 配色纪律
- 主背景：米白 `#FFFef0`（不用纯白）
- 卡片背景：纯白 `#FFFFFF`
- 主强调：明黄 `#FFD400`（最常用）
- 辅强调：粉色 `#FF5CA8`、蓝色 `#3A7CFF`（交替使用）
- 边框/文字：纯黑 `#000000`

**强调色使用规则：**
- 每页只用一个强调色
- 不同页之间可以交替使用黄/粉/蓝
- 强调色用于：背景色块、pill 标签、勾选框、按钮

### 字体规则
- Hero/章节标题：`font-display`（Archivo Black），全大写 `uppercase`
- 正文标题：`font-sans font-bold`（Space Grotesk Bold）
- 正文：`font-sans font-normal`（Space Grotesk Regular）
- 标签：`font-sans font-semibold text-[11px] tracking-[0.12em] uppercase`

---

## 第四阶段：冲击力检查

### P0（必须通过）
- 画布尺寸正确：`w-[1280px] h-[720px]`
- 所有卡片有 `border-[3px] border-black` + `shadow-[6px_6px_0_#000]`
- 使用 lucide-react 图标，不使用 emoji
- 所有元素 `rounded-none`（零圆角）
- 标题使用 Archivo Black（`font-display`），全大写
- 边框纯黑，不低于 `border-[3px]`

### P1（布局节奏）
- 使用了至少 3 种不同的布局模式
- 不连续 3 页使用同一布局
- 黄色/粉色/蓝色 accent 有交替使用
- 8 页以上至少有 1 个宣言封面 + 1 个 CTA 收尾
- 每页视觉焦点明确，不模糊

### P2（视觉打磨）
- 正文使用 Space Grotesk（`font-sans`）
- 阴影偏移量一致（大卡 `6px`，小卡/按钮 `4px`）
- 边框粗细一致（`border-[3px]`）
- 悬停态阴影缩小+位移（`2px` + `translate`）
- 强调色不混用——每页只选一个
- 米白背景 `#FFFef0`，不是纯白 `#FFFFFF`（主背景）
- 对比度足够：黑字黄底、白字黑底，确保可读性
