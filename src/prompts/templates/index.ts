import modernStyle from './modern/style.txt?raw';
import techStyle from './tech/style.txt?raw';
import creativeStyle from './creative/style.txt?raw';
import professionalStyle from './professional/style.txt?raw';
import elegantStyle from './elegant/style.txt?raw';

// Workflow imports (explicit per style)
import modernWorkflow from './modern/workflow.md?raw';

// Reference JSX imports (glob auto-discovery)
const referenceModules = import.meta.glob('./**/reference_*.jsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function getReferencesForStyle(styleId: string): string[] {
  const prefix = `./${styleId}/reference_`;
  return Object.entries(referenceModules)
    .filter(([path]) => path.startsWith(prefix))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, content]) => content);
}

export interface StyleTemplate {
  id: string;
  name: string;
  description: string;
  colors: string[];
  stylePrompt: string;
  workflowPrompt?: string;
  referenceExamples?: string[];
}

export const STYLE_TEMPLATES: StyleTemplate[] = [
  {
    id: 'modern',
    name: '现代简约',
    description: '白色背景，深色文字，简洁留白',
    colors: ['#FFFFFF', '#6366F1', '#1E293B'],
    stylePrompt: modernStyle,
    workflowPrompt: modernWorkflow,
    referenceExamples: getReferencesForStyle('modern'),
  },
  {
    id: 'tech',
    name: '科技暗黑',
    description: '深蓝黑背景，霓虹蓝绿，科技感',
    colors: ['#0F172A', '#3B82F6', '#06B6D4'],
    stylePrompt: techStyle,
  },
  {
    id: 'creative',
    name: '创意活力',
    description: '多彩撞色，不规则布局，活泼动感',
    colors: ['#F43F5E', '#14B8A6', '#F59E0B'],
    stylePrompt: creativeStyle,
  },
  {
    id: 'professional',
    name: '专业商务',
    description: '海军蓝白，严谨网格，清晰层次',
    colors: ['#1E3A5F', '#3B82F6', '#FFFFFF'],
    stylePrompt: professionalStyle,
  },
  {
    id: 'elegant',
    name: '优雅典雅',
    description: '米白暖棕，精致排版，高级质感',
    colors: ['#FEFCE8', '#9F1239', '#92400E'],
    stylePrompt: elegantStyle,
  },
];

export function getStyleTemplate(id: string): StyleTemplate | undefined {
  return STYLE_TEMPLATES.find(t => t.id === id);
}

export function getStylePrompt(id: string): string {
  return getStyleTemplate(id)?.stylePrompt || '';
}

export function getWorkflowPrompt(id: string): string | undefined {
  return getStyleTemplate(id)?.workflowPrompt;
}

export function getReferenceExamples(id: string): string[] {
  return getStyleTemplate(id)?.referenceExamples || [];
}

/** Complete prompt bundle for a style (style + workflow + references). */
export interface StylePromptBundle {
  stylePrompt: string;
  workflowPrompt?: string;
  referenceExamples?: string[];
}

export function getStylePromptBundle(id: string): StylePromptBundle {
  const t = getStyleTemplate(id);
  return {
    stylePrompt: t?.stylePrompt || '',
    workflowPrompt: t?.workflowPrompt,
    referenceExamples: t?.referenceExamples,
  };
}
