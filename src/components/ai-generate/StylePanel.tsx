import React, { useState } from 'react';
import { Check, Palette, Layout, FileText } from 'lucide-react';
import { GenerationContext } from './AiGeneratePage';

// Style presets
interface StylePreset {
  id: string;
  name: string;
  description: string;
  colors: string[];
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'business-classic',
    name: '商务经典',
    description: '深蓝 + 白，衬线字体',
    colors: ['#1E2761', '#CADCFC', '#FFFFFF']
  },
  {
    id: 'tech-dark',
    name: '科技暗黑',
    description: '深灰 + 霓虹绿，等宽字体',
    colors: ['#1A1A1A', '#00FF88', '#333333']
  },
  {
    id: 'minimal-white',
    name: '极简留白',
    description: '黑白 + 大量留白',
    colors: ['#FFFFFF', '#000000', '#F5F5F5']
  },
  {
    id: 'vibrant-gradient',
    name: '活力渐变',
    description: '紫蓝渐变 + 圆角',
    colors: ['#667EEA', '#764BA2', '#F093FB']
  },
  {
    id: 'academic',
    name: '学术报告',
    description: '米白 + 深绿，宋体',
    colors: ['#F5F5DC', '#2C5F2D', '#97BC62']
  },
  {
    id: 'creative-magazine',
    name: '创意杂志',
    description: '撞色 + 不规则网格',
    colors: ['#FF6B6B', '#4ECDC4', '#FFE66D']
  },
  {
    id: 'warm-friendly',
    name: '暖色亲和',
    description: '橙黄暖色系 + 柔和圆角',
    colors: ['#FF9500', '#FFCC00', '#FFF5E6']
  },
  {
    id: 'futurism',
    name: '未来主义',
    description: '黑 + 银 + 全息色',
    colors: ['#000000', '#C0C0C0', '#00FFFF']
  },
];

// Content templates
interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
}

const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'product-launch',
    name: '产品发布',
    description: '问题 → 方案 → 演示 → 数据 → 愿景 → CTA',
    structure: ['问题', '方案', '演示', '数据', '愿景', 'CTA']
  },
  {
    id: 'pitch-deck',
    name: '商业路演',
    description: '痛点 → 市场 → 产品 → 商业模式 → 团队 → 融资需求',
    structure: ['痛点', '市场', '产品', '商业模式', '团队', '融资需求']
  },
  {
    id: 'tech-sharing',
    name: '技术分享',
    description: '背景 → 核心问题 → 方案架构 → 实现细节 → 性能对比 → 总结',
    structure: ['背景', '核心问题', '方案架构', '实现细节', '性能对比', '总结']
  },
  {
    id: 'quarterly-report',
    name: '季度汇报',
    description: '回顾 → 数据 → 挑战 → 下季度计划',
    structure: ['回顾', '数据', '挑战', '下季度计划']
  },
  {
    id: 'teaching',
    name: '教学课件',
    description: '概念 → 原理 → 示例 → 练习 → 总结',
    structure: ['概念', '原理', '示例', '练习', '总结']
  },
];

// Page count options
const PAGE_COUNT_OPTIONS = [5, 8, 10, 12, 15];

interface StylePanelProps {
  context: GenerationContext;
  onContextUpdate: (updates: Partial<GenerationContext>) => void;
}

const StylePanel: React.FC<StylePanelProps> = ({ context, onContextUpdate }) => {
  const [stylesExpanded, setStylesExpanded] = useState(true);
  const [templatesExpanded, setTemplatesExpanded] = useState(true);
  const [settingsExpanded, setSettingsExpanded] = useState(true);

  return (
    <div className="flex flex-col h-full">
      {/* Style Presets */}
      <div className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setStylesExpanded(!stylesExpanded)}
          className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              风格预设
            </span>
          </div>
          <ChevronIcon expanded={stylesExpanded} />
        </button>

        {stylesExpanded && (
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onContextUpdate({ selectedStyle: preset.id })}
                className="relative p-3 rounded-xl text-left transition-all hover:scale-[1.02] cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: context.selectedStyle === preset.id
                    ? '2px solid var(--accent-primary)'
                    : '1px solid var(--border-primary)'
                }}
              >
                {context.selectedStyle === preset.id && (
                  <div
                    className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Check className="w-3 h-3" style={{ color: 'var(--text-inverse)' }} />
                  </div>
                )}
                {/* Color preview */}
                <div className="flex gap-1 mb-2">
                  {preset.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="w-4 h-4 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {preset.name}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Templates */}
      <div className="border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setTemplatesExpanded(!templatesExpanded)}
          className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              内容模板
            </span>
          </div>
          <ChevronIcon expanded={templatesExpanded} />
        </button>

        {templatesExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {CONTENT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onContextUpdate({ selectedTemplate: template.id })}
                className="w-full p-3 rounded-xl text-left transition-all hover:scale-[1.01] cursor-pointer"
                style={{
                  backgroundColor: context.selectedTemplate === template.id
                    ? 'var(--accent-primary)'
                    : 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  opacity: context.selectedTemplate === template.id ? 1 : 0.8
                }}
              >
                <div className="flex items-center justify-between">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: context.selectedTemplate === template.id
                        ? 'var(--text-inverse)'
                        : 'var(--text-primary)'
                    }}
                  >
                    {template.name}
                  </p>
                  {context.selectedTemplate === template.id && (
                    <Check
                      className="w-4 h-4"
                      style={{ color: 'var(--text-inverse)' }}
                    />
                  )}
                </div>
                <p
                  className="text-xs mt-1"
                  style={{
                    color: context.selectedTemplate === template.id
                      ? 'var(--text-inverse)'
                      : 'var(--text-tertiary)'
                  }}
                >
                  {template.structure.join(' → ')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Page Settings */}
      <div>
        <button
          onClick={() => setSettingsExpanded(!settingsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
              页面设置
            </span>
          </div>
          <ChevronIcon expanded={settingsExpanded} />
        </button>

        {settingsExpanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Page Count */}
            <div>
              <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                页数
              </label>
              <div className="flex flex-wrap gap-2">
                {PAGE_COUNT_OPTIONS.map((count) => (
                  <button
                    key={count}
                    onClick={() => onContextUpdate({ pageCount: count })}
                    className="px-3 py-1.5 rounded-lg text-sm transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: context.pageCount === count
                        ? 'var(--accent-primary)'
                        : 'var(--bg-tertiary)',
                      color: context.pageCount === count
                        ? 'var(--text-inverse)'
                        : 'var(--text-primary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    {count}页
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Ratio */}
            <div>
              <label className="text-xs mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                画布比例
              </label>
              <div className="flex gap-2">
                {(['16:9', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => onContextUpdate({ canvasRatio: ratio })}
                    className="flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: context.canvasRatio === ratio
                        ? 'var(--accent-primary)'
                        : 'var(--bg-tertiary)',
                      color: context.canvasRatio === ratio
                        ? 'var(--text-inverse)'
                        : 'var(--text-primary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Chevron icon component
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
    style={{ color: 'var(--text-tertiary)' }}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default StylePanel;