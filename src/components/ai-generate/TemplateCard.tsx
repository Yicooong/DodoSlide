import React from 'react';
import { Check } from 'lucide-react';
import { StyleTemplate } from '../../prompts/templates/index';

interface TemplateCardProps {
  template: StyleTemplate;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      onClick={() => onSelect(template.id)}
      className="relative flex-shrink-0 w-40 rounded-xl overflow-hidden text-left transition-all duration-200 cursor-pointer group"
      style={{
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
      {/* Thumbnail area */}
      <div
        className="h-24 w-full flex items-center justify-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${template.colors[0]}22, ${template.colors[1]}22)`,
        }}
      >
        {/* Mini slide preview */}
        <div
          className="w-[120px] h-[67px] rounded-sm shadow-md flex flex-col p-2 relative overflow-hidden"
          style={{
            background: template.id === 'tech' ? template.colors[0] : '#fff',
            border: `1px solid ${template.colors[2] || template.colors[1]}30`,
          }}
        >
          {/* Mini header bar */}
          <div
            className="h-1.5 w-8 rounded-full mb-1.5"
            style={{ background: template.colors[1] }}
          />
          {/* Mini content lines */}
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
          {/* Mini color accent */}
          <div
            className="absolute bottom-1.5 right-1.5 w-3 h-3 rounded-full"
            style={{ background: template.colors[1] }}
          />
        </div>

        {/* Selected checkmark */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {/* Card info */}
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
        {/* Color swatches */}
        <div className="flex gap-1 mt-2">
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
      </div>
    </button>
  );
};

export default TemplateCard;
