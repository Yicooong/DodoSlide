import React, { useState, useEffect, useCallback } from 'react';
import { X, Shuffle, Crosshair, Bold, Italic, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useDesign } from './DesignProvider';
import { useInspector } from '../inspector/InspectorProvider';
import type { EditOp } from '../../lib/inspector/apply-edit';

// ── Element editing types & utils (from InspectorPanel) ──────────

type ElementSnapshot = {
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  color: string;
  backgroundColor: string | null;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number | null;
  letterSpacing: number;
  text: string | null;
};

const EDITING_FREEZE_CSS = `
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *),
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::before,
[data-inspector-editing] *:not([data-inspector-ui], [data-inspector-ui] *)::after {
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
  animation-iteration-count: 1 !important;
  animation-fill-mode: forwards !important;
  transition: none !important;
  cursor: pointer !important;
}
`;

function readSnapshot(el: HTMLElement): ElementSnapshot {
  const cs = getComputedStyle(el);
  const text = isSimpleTextElement(el) ? (el.textContent ?? '') : null;
  return {
    fontSize: parseFloat(cs.fontSize) || 16,
    fontWeight: parseInt(cs.fontWeight, 10) || 400,
    fontStyle: cs.fontStyle === 'italic' ? 'italic' : 'normal',
    color: rgbToHex(cs.color) ?? '#000000',
    backgroundColor: isTransparent(cs.backgroundColor) ? null : rgbToHex(cs.backgroundColor),
    textAlign: normalizeTextAlign(cs.textAlign),
    lineHeight: parseLineHeight(cs.lineHeight, parseFloat(cs.fontSize) || 16),
    letterSpacing: parseLetterSpacing(cs.letterSpacing),
    text,
  };
}

function isSimpleTextElement(el: HTMLElement): boolean {
  if (el.childNodes.length === 0) return true;
  if (el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) return true;
  return false;
}

function rgbToHex(value: string): string | null {
  const m = value.match(/^rgba?\(([^)]+)\)$/);
  if (!m) return null;
  const parts = m[1].split(',').map((s) => s.trim());
  if (parts.length < 3) return null;
  const r = clampByte(Number(parts[0]));
  const g = clampByte(Number(parts[1]));
  const b = clampByte(Number(parts[2]));
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(Number.isFinite(n) ? n : 0)));
}

function isTransparent(value: string): boolean {
  if (!value) return true;
  if (value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return true;
  return /^rgba\([^)]*,\s*0\)$/.test(value);
}

function normalizeTextAlign(v: string): ElementSnapshot['textAlign'] {
  if (v === 'center' || v === 'right' || v === 'justify') return v;
  return 'left';
}

function parseLineHeight(value: string, fontSize: number): number | null {
  if (!value || value === 'normal') return null;
  const n = parseFloat(value);
  if (!Number.isFinite(n) || n === 0) return null;
  return round2(n / fontSize);
}

function parseLetterSpacing(value: string): number {
  if (!value || value === 'normal') return 0;
  const n = parseFloat(value);
  return Number.isFinite(n) ? round2(n) : 0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function findElementByLine(line: number, column: number): HTMLElement | null {
  const root = document.querySelector('[data-inspector-root]');
  if (!root) return null;
  return root.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`);
}

// ── Design token options ──────────────────────────────────────────

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Helvetica Neue', value: 'Helvetica Neue, sans-serif' },
  { label: 'system-ui', value: 'system-ui, sans-serif' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono, monospace' },
  { label: 'Segoe UI', value: 'Segoe UI, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
];

// ── Main Component ────────────────────────────────────────────────

export function DesignPanel() {
  const { tokens, setTokens, applyPreset, randomPreset, presets } = useDesign();
  const { active, selected, setSelected, bufferOps, pendingCount } = useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);

  // Read element snapshot when selection changes
  useEffect(() => {
    void pendingCount;
    if (!selected) {
      setSnapshot(null);
      return;
    }
    let anchor = selected.anchor;
    try {
      if (!anchor.isConnected) {
        const next = findElementByLine(selected.line, selected.column);
        if (next) {
          anchor = next;
          setSelected({ ...selected, anchor: next });
        } else {
          setSnapshot(null);
          return;
        }
      }
      setSnapshot(readSnapshot(anchor));
    } catch {
      setSnapshot(null);
    }
  }, [selected, setSelected, pendingCount]);

  // Inject editing freeze CSS when Inspector is active
  useEffect(() => {
    if (!active) return;
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = EDITING_FREEZE_CSS;
    document.head.appendChild(styleEl);
    root.dataset.inspectorEditing = 'true';
    return () => {
      styleEl.remove();
      delete root.dataset.inspectorEditing;
    };
  }, [active]);

  // Apply element edit operations
  const applyElementEdit = useCallback(
    (ops: EditOp[]) => {
      if (!selected) return;
      try {
        bufferOps(selected.line, selected.column, selected.anchor, ops);
        if (selected.anchor.isConnected) setSnapshot(readSnapshot(selected.anchor));
      } catch {
        // Silently handle edit errors
      }
    },
    [selected, bufferOps],
  );

  const showElementEdit = active && selected && snapshot;

  return (
    <div
      data-inspector-ui
      className="h-full flex flex-col overflow-y-auto"
      style={{ background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-3 shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-main)' }}>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {showElementEdit ? '元素属性' : '设计系统'}
        </span>
        <div className="flex items-center gap-1.5">
          {active && (
            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#3b82f6', color: '#fff' }}>
              <Crosshair size={10} />
              Inspector
            </span>
          )}
          {!active && (
            <button
              onClick={randomPreset}
              className="flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors"
              style={{ background: 'var(--bg-button)', color: 'var(--text-muted)' }}
            >
              <Shuffle size={10} />
              随机预设
            </button>
          )}
        </div>
      </div>

      {/* Element editing section (Inspector mode) */}
      {showElementEdit && (
        <div className="border-b p-3 space-y-3 shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
          {/* Element tag */}
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-button)', color: 'var(--text-muted)' }}>
              &lt;{selected.anchor.tagName.toLowerCase()}&gt;
            </span>
            <button
              onClick={() => setSelected(null)}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="取消选择"
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          {snapshot.text !== null && (
            <ElementSection title="Content">
              <textarea
                value={snapshot.text}
                onChange={(e) => applyElementEdit([{ kind: 'set-text', value: e.target.value }])}
                rows={2}
                className="w-full px-2 py-1.5 text-xs border rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                placeholder="Element text..."
              />
            </ElementSection>
          )}

          {/* Typography */}
          <ElementSection title="Typography">
            <ElementField label="Size">
              <input
                type="range"
                min={8}
                max={200}
                step={1}
                value={snapshot.fontSize}
                onChange={(e) =>
                  applyElementEdit([{ kind: 'set-style', key: 'fontSize', value: `${Math.round(Number(e.target.value))}px` }])
                }
                className="flex-1"
              />
              <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-muted)' }}>{Math.round(snapshot.fontSize)}px</span>
            </ElementField>

            <ElementField label="Weight">
              <select
                value={String(snapshot.fontWeight)}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  applyElementEdit([{ kind: 'set-style', key: 'fontWeight', value: n === 400 ? null : e.target.value }]);
                }}
                className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="700">Bold</option>
                <option value="800">Extrabold</option>
              </select>
            </ElementField>

            <ElementField label="Style">
              <div className="flex gap-1">
                <button
                  onClick={() =>
                    applyElementEdit([{ kind: 'set-style', key: 'fontWeight', value: snapshot.fontWeight >= 600 ? null : '700' }])
                  }
                  className="p-1.5 rounded border"
                  style={{
                    background: snapshot.fontWeight >= 600 ? 'var(--accent-bg)' : 'transparent',
                    borderColor: snapshot.fontWeight >= 600 ? 'var(--border-active)' : 'var(--border-subtle)',
                    color: snapshot.fontWeight >= 600 ? 'var(--accent-text)' : 'var(--text-muted)',
                  }}
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() =>
                    applyElementEdit([{ kind: 'set-style', key: 'fontStyle', value: snapshot.fontStyle === 'italic' ? null : 'italic' }])
                  }
                  className="p-1.5 rounded border"
                  style={{
                    background: snapshot.fontStyle === 'italic' ? 'var(--accent-bg)' : 'transparent',
                    borderColor: snapshot.fontStyle === 'italic' ? 'var(--border-active)' : 'var(--border-subtle)',
                    color: snapshot.fontStyle === 'italic' ? 'var(--accent-text)' : 'var(--text-muted)',
                  }}
                >
                  <Italic size={14} />
                </button>
              </div>
            </ElementField>

            <ElementField label="Line H">
              <input
                type="range"
                min={0.8}
                max={3}
                step={0.05}
                value={snapshot.lineHeight ?? 1.4}
                onChange={(e) => applyElementEdit([{ kind: 'set-style', key: 'lineHeight', value: String(round2(Number(e.target.value))) }])}
                className="flex-1"
              />
              <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-muted)' }}>{round2(snapshot.lineHeight ?? 1.4)}</span>
            </ElementField>

            <ElementField label="Tracking">
              <input
                type="range"
                min={-5}
                max={20}
                step={0.1}
                value={snapshot.letterSpacing}
                onChange={(e) =>
                  applyElementEdit([{ kind: 'set-style', key: 'letterSpacing', value: Number(e.target.value) === 0 ? null : `${round2(Number(e.target.value))}px` }])
                }
                className="flex-1"
              />
              <span className="text-[10px] w-8 text-right" style={{ color: 'var(--text-muted)' }}>{round2(snapshot.letterSpacing)}px</span>
            </ElementField>

            <ElementField label="Align">
              <div className="flex gap-1">
                {[
                  { v: 'left', Icon: AlignLeft },
                  { v: 'center', Icon: AlignCenter },
                  { v: 'right', Icon: AlignRight },
                ].map(({ v, Icon }) => (
                  <button
                    key={v}
                    onClick={() => applyElementEdit([{ kind: 'set-style', key: 'textAlign', value: v === 'left' ? null : v }])}
                    className="p-1.5 rounded border"
                    style={{
                      background: snapshot.textAlign === v ? 'var(--accent-bg)' : 'transparent',
                      borderColor: snapshot.textAlign === v ? 'var(--border-active)' : 'var(--border-subtle)',
                      color: snapshot.textAlign === v ? 'var(--accent-text)' : 'var(--text-muted)',
                    }}
                  >
                    <Icon size={14} />
                  </button>
                ))}
              </div>
            </ElementField>
          </ElementSection>

          {/* Colors */}
          <ElementSection title="Colors">
            <ElementColorField
              label="Text"
              value={snapshot.color}
              onChange={(v) => applyElementEdit([{ kind: 'set-style', key: 'color', value: v }])}
            />
            <ElementColorField
              label="Background"
              value={snapshot.backgroundColor ?? '#ffffff'}
              dim={!snapshot.backgroundColor}
              onChange={(v) => applyElementEdit([{ kind: 'set-style', key: 'backgroundColor', value: v }])}
              onClear={() => applyElementEdit([{ kind: 'set-style', key: 'backgroundColor', value: null }])}
            />
          </ElementSection>
        </div>
      )}

      {/* Global design tokens section */}
      <div className="flex-1 p-3 space-y-4 overflow-y-auto">
        {/* Preset selector */}
        <DesignSection title="预设">
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.name}
                onClick={() => applyPreset(p.name)}
                className="flex items-center gap-2 px-2 py-1.5 text-[11px] rounded border transition-colors text-left"
                style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: `linear-gradient(135deg, ${p.tokens.bg}, ${p.tokens.accent})` }}
                />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </DesignSection>

        {/* Colors */}
        <DesignSection title="颜色">
          <DesignColorField label="背景" value={tokens.bg} onChange={(v) => setTokens({ bg: v })} />
          <DesignColorField label="文字" value={tokens.text} onChange={(v) => setTokens({ text: v })} />
          <DesignColorField label="强调" value={tokens.accent} onChange={(v) => setTokens({ accent: v })} />
        </DesignSection>

        {/* Typography */}
        <DesignSection title="字体">
          <DesignField label="展示字体">
            <select
              value={tokens.fontDisplay}
              onChange={(e) => setTokens({ fontDisplay: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </DesignField>
          <DesignField label="正文字体">
            <select
              value={tokens.fontBody}
              onChange={(e) => setTokens({ fontBody: e.target.value })}
              className="flex-1 px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </DesignField>
        </DesignSection>

        {/* Sizes */}
        <DesignSection title="字号">
          <DesignField label="标题">
            <input
              type="range"
              min={24}
              max={80}
              step={2}
              value={parseInt(tokens.sizeHero)}
              onChange={(e) => setTokens({ sizeHero: `${e.target.value}px` })}
              className="flex-1"
            />
            <span className="text-[10px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>{tokens.sizeHero}</span>
          </DesignField>
          <DesignField label="正文">
            <input
              type="range"
              min={12}
              max={32}
              step={1}
              value={parseInt(tokens.sizeBody)}
              onChange={(e) => setTokens({ sizeBody: `${e.target.value}px` })}
              className="flex-1"
            />
            <span className="text-[10px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>{tokens.sizeBody}</span>
          </DesignField>
        </DesignSection>

        {/* Border radius */}
        <DesignSection title="圆角">
          <DesignField label="半径">
            <input
              type="range"
              min={0}
              max={32}
              step={1}
              value={parseInt(tokens.radius)}
              onChange={(e) => setTokens({ radius: `${e.target.value}px` })}
              className="flex-1"
            />
            <span className="text-[10px] w-10 text-right" style={{ color: 'var(--text-muted)' }}>{tokens.radius}</span>
          </DesignField>
        </DesignSection>

        {/* Preview */}
        <DesignSection title="预览">
          <div
            className="rounded border p-3 space-y-2"
            style={{
              background: tokens.bg,
              color: tokens.text,
              borderRadius: tokens.radius,
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div style={{ fontFamily: tokens.fontDisplay, fontSize: tokens.sizeHero, fontWeight: 700, lineHeight: 1.2 }}>
              标题文本
            </div>
            <div style={{ fontFamily: tokens.fontBody, fontSize: tokens.sizeBody, lineHeight: 1.6 }}>
              这是正文内容的预览效果。
            </div>
            <div
              className="inline-block px-3 py-1 text-sm font-medium"
              style={{
                background: tokens.accent,
                color: '#fff',
                borderRadius: tokens.radius,
                fontFamily: tokens.fontBody,
              }}
            >
              按钮样式
            </div>
          </div>
        </DesignSection>

        {/* CSS Variables reference */}
        <DesignSection title="CSS 变量">
          <div className="text-[10px] font-mono space-y-0.5" style={{ color: 'var(--text-muted)' }}>
            <div>--ds-bg: {tokens.bg}</div>
            <div>--ds-text: {tokens.text}</div>
            <div>--ds-accent: {tokens.accent}</div>
            <div>--ds-font-display: {tokens.fontDisplay.split(',')[0]}</div>
            <div>--ds-font-body: {tokens.fontBody.split(',')[0]}</div>
            <div>--ds-size-hero: {tokens.sizeHero}</div>
            <div>--ds-size-body: {tokens.sizeBody}</div>
            <div>--ds-radius: {tokens.radius}</div>
          </div>
        </DesignSection>
      </div>
    </div>
  );
}

// ── Element editing sub components ────────────────────────────────

function ElementSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ElementField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      {children}
    </div>
  );
}

function ElementColorField({
  label,
  value,
  dim,
  onChange,
  onClear,
}: {
  label: string;
  value: string;
  dim?: boolean;
  onChange: (v: string) => void;
  onClear?: () => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commitHex = (hex: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <ElementField label={label}>
      <label className="relative w-7 h-7 shrink-0 cursor-pointer rounded border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
        <span
          className="block w-full h-full"
          style={{
            backgroundColor: dim ? 'transparent' : value,
            backgroundImage: dim
              ? 'linear-gradient(45deg, #d4d4d4 25%, transparent 25%, transparent 75%, #d4d4d4 75%), linear-gradient(45deg, #d4d4d4 25%, transparent 25%, transparent 75%, #d4d4d4 75%)'
              : undefined,
            backgroundSize: dim ? '8px 8px' : undefined,
            backgroundPosition: dim ? '0 0, 4px 4px' : undefined,
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <input
        type="text"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          commitHex(e.target.value);
        }}
        className="flex-1 h-7 px-2 text-[11px] font-mono uppercase border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
        spellCheck={false}
      />
      {onClear && (
        <button
          onClick={onClear}
          className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      )}
    </ElementField>
  );
}

// ── Design token sub components ───────────────────────────────────

function DesignSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function DesignField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] w-14 shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
      {children}
    </div>
  );
}

function DesignColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const commitHex = (hex: string) => {
    if (/^#[0-9a-fA-F]{6}$/.test(hex)) onChange(hex);
  };

  return (
    <DesignField label={label}>
      <label className="relative w-7 h-7 shrink-0 cursor-pointer rounded border overflow-hidden" style={{ borderColor: 'var(--border-subtle)' }}>
        <span className="block w-full h-full" style={{ backgroundColor: value }} />
        <input
          type="color"
          value={value}
          onChange={(e) => { setDraft(e.target.value); onChange(e.target.value); }}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
      <input
        type="text"
        value={draft}
        onChange={(e) => { setDraft(e.target.value); commitHex(e.target.value); }}
        className="flex-1 h-7 px-2 text-[11px] font-mono uppercase border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
        spellCheck={false}
      />
    </DesignField>
  );
}
