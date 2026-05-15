import React, { useState, useEffect, useCallback } from 'react';
import { X, Bold, Italic, AlignLeft, AlignCenter, AlignRight, ChevronRight, ChevronLeft } from 'lucide-react';

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
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0) {
      return true;
    }
  }
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

// ── Main Component ────────────────────────────────────────────────

interface DesignPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DesignPanel({ collapsed, onToggleCollapse }: DesignPanelProps) {
  const { active, selected, setSelected, bufferOps } = useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);

  // Auto-expand when element is selected
  useEffect(() => {
    if (selected && collapsed) {
      onToggleCollapse();
    }
  }, [selected]);

  // Read element snapshot when selection changes
  useEffect(() => {
    if (!selected) {
      setSnapshot(null);
      return;
    }
    const anchor = findElementByLine(selected.line, selected.column);
    if (!anchor?.isConnected) {
      setSnapshot(null);
      return;
    }
    try {
      setSnapshot(readSnapshot(anchor));
    } catch {
      setSnapshot(null);
    }
  }, [selected, setSelected]);

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
      const anchor = findElementByLine(selected.line, selected.column);
      if (!anchor?.isConnected) return;
      try {
        bufferOps(selected.line, selected.column, anchor, ops);
        setSnapshot(readSnapshot(anchor));
      } catch {
        // Silently handle edit errors
      }
    },
    [selected, bufferOps],
  );

  const selectedElement = selected ? findElementByLine(selected.line, selected.column) : null;
  const showElementEdit = active && selected && snapshot;

  return (
    <div
      data-inspector-ui
      className="h-full flex flex-col relative"
      style={{ background: 'var(--bg-sidebar)', borderLeft: '1px solid var(--border-subtle)' }}
    >
      {collapsed ? (
        <button
          onClick={onToggleCollapse}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-lg transition-all z-10 active:scale-90"
          style={{ color: 'var(--text-muted)', background: 'var(--bg-card)' }}
          title="展开设计面板"
        >
          <ChevronLeft size={20} />
        </button>
      ) : (
        <>
          {/* Header */}
          <div className="h-12 border-b flex items-center justify-between px-3 shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-main)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              元素属性
            </span>
            <div className="flex items-center gap-1.5">
              <button
                  onClick={onToggleCollapse}
                  className="p-1.5 rounded-lg transition-all flex-shrink-0 active:scale-90"
                  style={{ color: 'var(--text-muted)' }}
                  title="收缩设计面板"
                >
                  <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Element editing section (Inspector mode) */}
          {showElementEdit && (
            <div className="border-b p-3 space-y-3 shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-card)' }}>
              {/* Element tag */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-button)', color: 'var(--text-muted)' }}>
                  &lt;{selectedElement ? selectedElement.tagName.toLowerCase() : '?'}&gt;
                </span>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded transition-all active:scale-90"
                style={{ color: 'var(--text-muted)' }}
                title="取消选择"
              >
                <X size={14} />
              </button>
              </div>

              {snapshot.text !== null && (
                <ElementSection title="Content">
                    <textarea
                    value={snapshot.text}
                    onChange={(e) => applyElementEdit([{ kind: 'set-text', value: e.target.value }])}
                    rows={2}
                    className="w-full px-3 py-2 text-xs border rounded-lg resize-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    placeholder="Element text..."
                  />
                </ElementSection>
              )}

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
                    className="form-select flex-1 px-2 py-1 text-xs border rounded"
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
                      className="p-1.5 rounded border active:scale-90 transition-all"
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
                      className="p-1.5 rounded border active:scale-90 transition-all"
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
                        className="p-1.5 rounded border active:scale-90 transition-all"
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

          {/* Placeholder when no element selected */}
          {!showElementEdit && (
            <div className="flex-1 flex items-center justify-center p-6">
              <p className="text-xs text-center leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                请点击元素进行风格设置
              </p>
            </div>
          )}
        </>
      )}
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
          className="p-1 rounded transition-all active:scale-90"
          style={{ color: 'var(--text-muted)' }}
        >
          <X size={12} />
        </button>
      )}
    </ElementField>
  );
}


