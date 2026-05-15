# 编辑衬线设计方法论 (Editorial Serif SOP)

---

## 第一阶段：叙事结构搭建

编辑衬线风以文本驱动，灵感来自杂志版面。面对用户输入，先构建叙事骨架：

| 内容类型 | 视觉策略 | 说明 |
|---------|---------|------|
| 核心观点/宣言 | Pull Quote | 大字号 serif 斜体引用 + 左侧铁锈红竖线 |
| 深度分析 | Two Column Text | 7:5 分栏，左文右图/数据 |
| 关键指标 | Data Feature | 2x2 网格，kicker + serif 大数字 |
| 图文混排 | Image + Caption | 大图 + mono 小字说明 |
| 步骤/要点 | Numbered List | 大号 serif 编号 + 标题 + 描述 |
| 前后对比 | Before/After | 1:1 分栏，左半透明，右满亮度 |
| 开篇引言 | Magazine Cover | 斜体 serif 超大标题 + 装饰线 |
| 收尾总结 | Closing Statement | 深色底 + 白色 serif 标题 |

**核心原则：像编辑一篇文章一样编辑幻灯片。** 有开头、展开、高潮、收尾。

### 杂志叙事结构

1. **开篇钩子**（Opening Hook）：封面页，用斜体 serif 大标题制造氛围
2. **正文展开**（Body Sections）：交替使用 Two Column Text、Data Feature、Pull Quote
3. **金句穿插**（Pull Quotes）：每 2-3 页正文插入一个 Pull Quote，打断阅读节奏
4. **收尾论点**（Closing Argument）：深色底收尾页，用最有力的一句话结束

---

## 第二阶段：编辑式布局

### 栏目系统

编辑衬线风使用 12 列网格，但更偏向杂志分栏逻辑：

| 栏目比例 | 适用场景 | 说明 |
|---------|---------|------|
| 7:5（`col-span-7` + `col-span-5`） | 图文混排 | 左文右图，杂志经典比例 |
| 8:4（`col-span-8` + `col-span-4`） | 文字主导 | 正文+侧边栏/数据 |
| 6:6（`col-span-6` + `col-span-6`） | 对称对比 | Before/After、双栏文本 |
| 全宽 12 | 封面/收尾/引用 | 全页沉浸式 |

### 引用排版规范
- Pull Quote 使用 serif italic，字号 `~2.4vw`
- 左侧竖线：`border-l-2 border-[#8A2A1C] pl-8`
- 出处用 mono 小字：`font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]`
- 引用前后留足空白（`py-16`），与正文形成呼吸感

### 标题层级

| 层级 | 字体 | 样式 | 用途 |
|------|------|------|------|
| 一级标题 | serif italic | `font-serif font-semibold italic text-[8vw]` | 封面 Hero |
| 二级标题 | serif | `font-serif font-semibold text-[5vw]` | 章节标题 |
| 三级标题 | serif | `font-serif font-semibold text-[2.6vw]` | 正文标题 |
| 引导段 | sans light | `font-light text-[1.6vw]` | 标题下方首段 |
| 正文 | sans regular | `font-normal text-[max(14px,1.1vw)]` | 主体内容 |
| Kicker | sans semibold | `font-semibold text-[11px] tracking-[0.16em] uppercase` | 分类标签 |

**关键规则：**
- Hero 和章节标题必须用 serif（Playfair Display）
- 正文和引导段用 sans（无衬线），形成对比
- 引导段用 Light 字重（300），正文用 Regular（400）
- Kicker 用铁锈红 `#8A2A1C`，大写，宽字距

---

## 第三阶段：排版打磨

### 段落节奏
- 每段正文不超过 4 行（幻灯片不是论文）
- 段落间距用 `gap-6` 或 `gap-8`，不要用 `margin` 堆叠
- 引导段（标题后第一段）用 `font-light text-[1.6vw]`，比正文大一号

### 图片规范
- 图片容器保持直角（无圆角、无阴影）
- 图片下方附 mono 小字说明：`font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]`
- 图片与文字之间用 `gap-3` 或 `gap-4`

### 分割线规范
- 装饰线：`w-20 h-px bg-[#8A2A1C]`（铁锈红，1px）
- 内容分割：`border-t border-[rgba(40,28,18,0.12)]`
- 引用竖线：`border-l-2 border-[#8A2A1C]`
- 分割线长度统一为 `w-20` 或 `w-16`

### 配色纪律
- 主背景：奶油 `#FAF7F2`（暖色调，非纯白）
- 区块底色：浅棕 `#F3EFE6`
- 主强调：铁锈红 `#8A2A1C`（用于 kicker、引用线、装饰线）
- 辅强调：琥珀 `#C97A4A`（用于次要高亮）
- 禁止使用渐变、霓虹色、荧光色

---

## 第四阶段：质量自检

### P0（必须通过）
- 画布尺寸正确：`w-[1280px] h-[720px]`
- 配色一致：奶油底 + 铁锈红强调
- 使用 lucide-react 图标，不使用 emoji
- Hero 标题使用 serif italic（`font-serif font-semibold italic`）
- 正文标题左对齐，不居中（封面/引用除外）
- 禁止渐变、禁止自定义 hex 值

### P1（叙事节奏）
- 使用了至少 3 种不同的布局模式
- 不连续 3 页使用同一布局
- 封面和收尾页有明显视觉区分（封面奶油底，收尾深色底）
- 8 页以上至少有 1 个 Pull Quote 打断阅读节奏
- 图文比例合理——纯文字页不超过连续 2 页

### P2（视觉打磨）
- 引导段使用 Light 字重（`font-light`）
- 引用文字使用 serif italic
- 装饰线长度统一（`w-20` 或 `w-16`）
- 图片容器保持直角（无圆角、无阴影）
- Kicker 大写、宽字距（`tracking-[0.16em]`）
- 正文与标题的字体对比清晰（serif vs sans）
- 段落间距充足，不拥挤
