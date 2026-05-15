// 导入各样式模板的样式提示词（style.txt）
import modernStyle from './modern/style.txt?raw';
import techStyle from './tech/style.txt?raw';
import creativeStyle from './creative/style.txt?raw';
import professionalStyle from './professional/style.txt?raw';
import elegantStyle from './elegant/style.txt?raw';
import magazineStyle from './magazine/style.txt?raw';
import swissStyle from './swiss/style.txt?raw';
import corporateStyle from './corporate/style.txt?raw';
import pitchStyle from './pitch/style.txt?raw';
import brutalStyle from './brutal/style.txt?raw';
import editorialStyle from './editorial/style.txt?raw';
import japaneseStyle from './japanese/style.txt?raw';
import cyberpunkStyle from './cyberpunk/style.txt?raw';
import blueprintStyle from './blueprint/style.txt?raw';
import newsStyle from './news/style.txt?raw';

// 工作流提示词导入（每个样式独立配置）
import modernWorkflow from './modern/workflow.md?raw';
import magazineWorkflow from './magazine/workflow.md?raw';
import swissWorkflow from './swiss/workflow.md?raw';
import corporateWorkflow from './corporate/workflow.md?raw';
import pitchWorkflow from './pitch/workflow.md?raw';
import brutalWorkflow from './brutal/workflow.md?raw';
import editorialWorkflow from './editorial/workflow.md?raw';
import japaneseWorkflow from './japanese/workflow.md?raw';
import cyberpunkWorkflow from './cyberpunk/workflow.md?raw';
import blueprintWorkflow from './blueprint/workflow.md?raw';
import newsWorkflow from './news/workflow.md?raw';

// 参考 JSX 示例导入（使用 Vite glob 自动发现）
// 自动扫描所有 reference_*.jsx 文件并加载为原始字符串
const referenceModules = import.meta.glob('./**/reference_*.jsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * 根据样式 ID 获取对应的参考示例数组
 * 过滤出属于指定样式的 reference_*.jsx 文件并排序
 * @param styleId 样式 ID（如 'modern', 'tech' 等）
 * @returns 参考示例字符串数组
 */
function getReferencesForStyle(styleId: string): string[] {
  const prefix = `./${styleId}/reference_`;
  return Object.entries(referenceModules)
    .filter(([path]) => path.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, content]) => content);
}

// 模板分类类型
export type TemplateCategory = 'business' | 'creative' | 'tech' | 'editorial' | 'general';

// 分类显示名称映射
export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  business: '商务',
  creative: '创意',
  tech: '科技',
  editorial: '编辑',
  general: '通用',
};

// 样式模板接口定义
export interface StyleTemplate {
  id: string;             // 样式唯一标识
  name: string;           // 显示名称
  description: string;    // 样式描述
  category: TemplateCategory;  // 模板分类
  colors: string[];       // 配色方案（颜色代码数组）
  stylePrompt: string;    // 样式提示词（视觉规则）
  workflowPrompt?: string;       // 工作流提示词（设计方法论，可选）
  referenceExamples?: string[];  // 参考示例 JSX（可选）
}

// 样式模板数组，定义所有可用的预设样式
export const STYLE_TEMPLATES: StyleTemplate[] = [
  // 现代简约风格
  {
    id: 'modern',
    name: '现代简约',
    description: '白色背景，深色文字，简洁留白',
    category: 'general',
    colors: ['#FFFFFF', '#6366F1', '#1E293B'],
    stylePrompt: modernStyle,
    workflowPrompt: modernWorkflow,
    referenceExamples: getReferencesForStyle('modern'),
  },
  // 科技暗黑风格
  {
    id: 'tech',
    name: '科技暗黑',
    description: '深蓝黑背景，霓虹蓝绿，科技感',
    category: 'tech',
    colors: ['#0F172A', '#3B82F6', '#06B6D4'],
    stylePrompt: techStyle,
  },
  // 创意活力风格
  {
    id: 'creative',
    name: '创意活力',
    description: '多彩撞色，不规则布局，活泼动感',
    category: 'creative',
    colors: ['#F43F5E', '#14B8A6', '#F59E0B'],
    stylePrompt: creativeStyle,
  },
  // 专业商务风格
  {
    id: 'professional',
    name: '专业商务',
    description: '海军蓝白，严谨网格，清晰层次',
    category: 'business',
    colors: ['#1E3A5F', '#3B82F6', '#FFFFFF'],
    stylePrompt: professionalStyle,
  },
  // 优雅典雅风格
  {
    id: 'elegant',
    name: '优雅典雅',
    description: '米白暖棕，精致排版，高级质感',
    category: 'general',
    colors: ['#FEFCE8', '#9F1239', '#92400E'],
    stylePrompt: elegantStyle,
  },
  // 杂志风 × 电子墨水
  {
    id: 'magazine',
    name: '杂志风',
    description: '衬线主导，暖色调，杂志质感',
    category: 'editorial',
    colors: ['#F1EFEA', '#0A0A0B', '#E8E5DE'],
    stylePrompt: magazineStyle,
    workflowPrompt: magazineWorkflow,
    referenceExamples: getReferencesForStyle('magazine'),
  },
  // 瑞士国际主义
  {
    id: 'swiss',
    name: '瑞士风',
    description: '纯无衬线，网格严格，克莱因蓝',
    category: 'general',
    colors: ['#FAFAF8', '#002FA7', '#0A0A0A'],
    stylePrompt: swissStyle,
    workflowPrompt: swissWorkflow,
    referenceExamples: getReferencesForStyle('swiss'),
  },
  // 企业商务
  {
    id: 'corporate',
    name: '企业商务',
    description: '海军蓝白，严谨保守，咨询风格',
    category: 'business',
    colors: ['#0A2540', '#1D4ED8', '#FFFFFF'],
    stylePrompt: corporateStyle,
    workflowPrompt: corporateWorkflow,
    referenceExamples: getReferencesForStyle('corporate'),
  },
  // 融资路演
  {
    id: 'pitch',
    name: '融资路演',
    description: '蓝紫渐变，大留白，YC风格',
    category: 'business',
    colors: ['#0070F3', '#7928CA', '#FFFFFF'],
    stylePrompt: pitchStyle,
    workflowPrompt: pitchWorkflow,
    referenceExamples: getReferencesForStyle('pitch'),
  },
  // 新粗野主义
  {
    id: 'brutal',
    name: '新粗野主义',
    description: '米白底，黑边框硬阴影，明黄强调',
    category: 'creative',
    colors: ['#FFEF00', '#000000', '#FFFEF0'],
    stylePrompt: brutalStyle,
    workflowPrompt: brutalWorkflow,
    referenceExamples: getReferencesForStyle('brutal'),
  },
  // 编辑衬线
  {
    id: 'editorial',
    name: '编辑衬线',
    description: '奶油底，Playfair衬线，铁锈红强调',
    category: 'editorial',
    colors: ['#FAF7F2', '#8A2A1C', '#1A1A1A'],
    stylePrompt: editorialStyle,
    workflowPrompt: editorialWorkflow,
    referenceExamples: getReferencesForStyle('editorial'),
  },
  // 日式极简
  {
    id: 'japanese',
    name: '日式极简',
    description: '象牙白底，朱红点缀，极致留白',
    category: 'editorial',
    colors: ['#FAFAF5', '#D93A2A', '#1A1A1A'],
    stylePrompt: japaneseStyle,
    workflowPrompt: japaneseWorkflow,
    referenceExamples: getReferencesForStyle('japanese'),
  },
  // 赛博朋克
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    description: '黑底霓虹，粉青撞色，辉光效果',
    category: 'tech',
    colors: ['#000000', '#FF2BD6', '#00F0FF'],
    stylePrompt: cyberpunkStyle,
    workflowPrompt: cyberpunkWorkflow,
    referenceExamples: getReferencesForStyle('cyberpunk'),
  },
  // 蓝图
  {
    id: 'blueprint',
    name: '蓝图',
    description: '深蓝底色，白色线条，网格虚线',
    category: 'tech',
    colors: ['#0B3A6F', '#FFFFFF', '#4A90D9'],
    stylePrompt: blueprintStyle,
    workflowPrompt: blueprintWorkflow,
    referenceExamples: getReferencesForStyle('blueprint'),
  },
  // 新闻播报
  {
    id: 'news',
    name: '新闻播报',
    description: '白底红色点缀，Oswald大写，硬阴影',
    category: 'editorial',
    colors: ['#FFFFFF', '#E11D2D', '#1A1A1A'],
    stylePrompt: newsStyle,
    workflowPrompt: newsWorkflow,
    referenceExamples: getReferencesForStyle('news'),
  },
];

/**
 * 根据样式 ID 获取样式模板
 * @param id 样式 ID
 * @returns 样式模板对象，如果不存在则返回 undefined
 */
export function getStyleTemplate(id: string): StyleTemplate | undefined {
  return STYLE_TEMPLATES.find(t => t.id === id);
}

/**
 * 获取指定样式的样式提示词
 * @param id 样式 ID
 * @returns 样式提示词字符串
 */
export function getStylePrompt(id: string): string {
  return getStyleTemplate(id)?.stylePrompt || '';
}

/**
 * 获取指定样式的工作流提示词
 * @param id 样式 ID
 * @returns 工作流提示词字符串，如果不存在则返回 undefined
 */
export function getWorkflowPrompt(id: string): string | undefined {
  return getStyleTemplate(id)?.workflowPrompt;
}

/**
 * 获取指定样式的参考示例
 * @param id 样式 ID
 * @returns 参考示例字符串数组
 */
export function getReferenceExamples(id: string): string[] {
  return getStyleTemplate(id)?.referenceExamples || [];
}

/** 完整的提示词包（样式 + 工作流 + 参考示例） */
export interface StylePromptBundle {
  stylePrompt: string;
  workflowPrompt?: string;
  referenceExamples?: string[];
}

/**
 * 获取指定样式的完整提示词包
 * 包含样式提示词、工作流提示词和参考示例
 * @param id 样式 ID
 * @returns 提示词包对象
 */
export function getStylePromptBundle(id: string): StylePromptBundle {
  const t = getStyleTemplate(id);
  return {
    stylePrompt: t?.stylePrompt || '',
    workflowPrompt: t?.workflowPrompt,
    referenceExamples: t?.referenceExamples,
  };
}

/**
 * 按分类获取模板列表
 * @param category 模板分类
 * @returns 属于该分类的模板数组
 */
export function getTemplatesByCategory(category: TemplateCategory): StyleTemplate[] {
  return STYLE_TEMPLATES.filter(t => t.category === category);
}

/**
 * 获取所有可用分类（按推荐顺序）
 * @returns 分类数组
 */
export function getCategories(): TemplateCategory[] {
  return ['business', 'creative', 'tech', 'editorial', 'general'];
}
