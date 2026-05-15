import React from 'react';
// 导入 Check 图标：用于标记选中状态
import { Check } from 'lucide-react';
// 导入风格模板类型和分类标签
import { StyleTemplate, CATEGORY_LABELS } from '../../prompts/templates/index';

/** 风格模板卡片组件属性接口 */
interface TemplateCardProps {
  template: StyleTemplate;   // 风格模板数据
  isSelected: boolean;       // 是否被选中
  onSelect: (id: string) => void;  // 选中回调
}

/** 分类对应的背景色 */
const CATEGORY_COLORS: Record<string, string> = {
  business: '#3B82F6',
  creative: '#F43F5E',
  tech: '#06B6D4',
  editorial: '#F59E0B',
  general: '#8B5CF6',
};

/** 各模板的展示字体名 */
const TEMPLATE_FONTS: Record<string, string> = {
  modern: 'Inter',
  tech: 'JetBrains Mono',
  creative: 'Inter',
  professional: 'Inter',
  elegant: 'Playfair Display',
  magazine: 'Playfair Display',
  swiss: 'Inter',
  corporate: 'Inter',
  pitch: 'Inter',
  brutal: 'Archivo Black',
  editorial: 'Playfair Display',
  japanese: 'Noto Serif SC',
  cyberpunk: 'JetBrains Mono',
  blueprint: 'JetBrains Mono',
  news: 'Oswald',
};

/**
 * 风格模板卡片组件
 * 功能：
 * - 显示风格模板的缩略图预览（模拟幻灯片布局）
 * - 显示模板名称、描述和配色方案
 * - 选中时显示绿色边框和勾选标记
 * - 使用 glassmorphism（玻璃拟态）样式
 */
const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className="relative flex-shrink-0 w-44 rounded-xl overflow-hidden text-left transition-all duration-200 cursor-pointer group"
      style={{
        // 选中状态使用绿色边框和发光效果
        border: isSelected
          ? '2px solid #10B981'
          : '1px solid var(--glass-border)',
        background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        boxShadow: isSelected
          ? '0 0 0 1px #10B981, 0 4px 20px rgba(16, 185, 129, 0.15)'
          : 'var(--glass-shadow)',
      }}
    >
      {/* 分类标签：左上角小药丸 */}
      <div
        className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider uppercase"
        style={{
          background: `${CATEGORY_COLORS[template.category] || '#8B5CF6'}20`,
          color: CATEGORY_COLORS[template.category] || '#8B5CF6',
          border: `1px solid ${CATEGORY_COLORS[template.category] || '#8B5CF6'}40`,
        }}
      >
        {CATEGORY_LABELS[template.category] || template.category}
      </div>

      {/* 缩略图区域：模拟幻灯片预览 */}
      <div
        className="h-28 w-full flex items-center justify-center relative overflow-hidden"
        style={{
          // 使用模板配色的渐变背景
          background: `linear-gradient(135deg, ${template.colors[0]}22, ${template.colors[1]}22)`,
        }}
      >
        {/* 迷你幻灯片预览 */}
        <div
          className="w-[120px] h-[67px] rounded-sm shadow-md flex flex-col p-2 relative overflow-hidden"
          style={{
            // 科技风格使用深色背景，其他使用白色
            background: template.id === 'tech' ? template.colors[0] : '#fff',
            border: `1px solid ${template.colors[2] || template.colors[1]}30`,
          }}
        >
          {/* 迷你标题栏 */}
          <div
            className="h-1.5 w-8 rounded-full mb-1.5"
            style={{ background: template.colors[1] }}
          />
          {/* 迷你内容行：模拟文本内容 */}
          <div className="space-y-1">
            <div
              className="h-1 w-full rounded"
              style={{
                background: template.id === 'tech'
                  ? `${template.colors[1]}60`
                  : `${template.colors[1]}30`,
              }}
            />
            <div
              className="h-1 w-3/4 rounded"
              style={{
                background: template.id === 'tech'
                  ? `${template.colors[2] || template.colors[1]}40`
                  : `${template.colors[2] || template.colors[1]}20`,
              }}
            />
            <div
              className="h-1 w-1/2 rounded"
              style={{
                background: template.id === 'tech'
                  ? `${template.colors[1]}30`
                  : `${template.colors[1]}15`,
              }}
            />
          </div>
          {/* 迷你配色装饰圆点 */}
          <div
            className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full"
            style={{ background: template.colors[1] }}
          />
        </div>

        {/* 选中标记：右上角绿色勾选圆圈 */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* 色彩条带：渐变展示模板主色调 */}
      <div
        className="h-1 w-full"
        style={{
          background: `linear-gradient(90deg, ${template.colors.join(', ')})`,
        }}
      />

      {/* 卡片信息区域 */}
      <div className="px-3 py-2.5">
        <p
          className="text-xs font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {template.name}
        </p>
        <p
          className="text-[10px] mt-0.5 truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {template.description}
        </p>
        {/* 底部：配色圆点 + 字体名 */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex gap-1">
            {template.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-3 h-3 rounded-full border"
                style={{
                  background: color,
                  borderColor: 'var(--glass-border)',
                }}
              />
            ))}
          </div>
          <span
            className="text-[9px] tracking-wide opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            {TEMPLATE_FONTS[template.id] || 'Inter'}
          </span>
        </div>
      </div>
    </button>
  );
};

export default TemplateCard;
