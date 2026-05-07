// 导入各样式模板的样式提示词（style.txt）
import modernStyle from './modern/style.txt?raw';
import techStyle from './tech/style.txt?raw';
import creativeStyle from './creative/style.txt?raw';
import professionalStyle from './professional/style.txt?raw';
import elegantStyle from './elegant/style.txt?raw';

// 工作流提示词导入（每个样式独立配置）
import modernWorkflow from './modern/workflow.md?raw';

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

// 样式模板接口定义
export interface StyleTemplate {
  id: string;             // 样式唯一标识
  name: string;           // 显示名称
  description: string;    // 样式描述
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
    colors: ['#0F172A', '#3B82F6', '#06B6D4'],
    stylePrompt: techStyle,
  },
  // 创意活力风格
  {
    id: 'creative',
    name: '创意活力',
    description: '多彩撞色，不规则布局，活泼动感',
    colors: ['#F43F5E', '#14B8A6', '#F59E0B'],
    stylePrompt: creativeStyle,
  },
  // 专业商务风格
  {
    id: 'professional',
    name: '专业商务',
    description: '海军蓝白，严谨网格，清晰层次',
    colors: ['#1E3A5F', '#3B82F6', '#FFFFFF'],
    stylePrompt: professionalStyle,
  },
  // 优雅典雅风格
  {
    id: 'elegant',
    name: '优雅典雅',
    description: '米白暖棕，精致排版，高级质感',
    colors: ['#FEFCE8', '#9F1239', '#92400E'],
    stylePrompt: elegantStyle,
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
