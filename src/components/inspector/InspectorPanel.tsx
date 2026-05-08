import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useInspector } from './InspectorProvider';
import type { EditOp } from '../../lib/inspector/apply-edit';

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

export function InspectorPanel() {
  const { active, selected, setSelected, bufferOps, pendingCount } = useInspector();
  const [snapshot, setSnapshot] = useState<ElementSnapshot | null>(null);

  useEffect(() => {
    void pendingCount;
    if (!selected) {
      setSnapshot(null);
      return;
    }
    let anchor = selected.anchor;
    if (!anchor.isConnected) {
      const next = findElementByLine(selected.line, selected.column);
      if (next) {
        anchor = next;
        setSelected({ ...selected, anchor: next });
      } else {
        return;
      }
    }
    setSnapshot(readSnapshot(anchor));
  }, [selected, setSelected, pendingCount]);

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

  const apply = useCallback(
    (ops: EditOp[]) => {
      if (!selected) return;
      bufferOps(selected.line, selected.column, selected.anchor, ops);
      if (selected.anchor.isConnected) setSnapshot(readSnapshot(selected.anchor));
    },
    [selected, bufferOps],
  );

  if (!active || !selected || !snapshot) return null;

  return (
    <div
      data-inspector-ui
      className="absolute right-0 top-0 bottom-0 w-64 bg-white border-l border-gray-200 overflow-y-auto z-40 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Inspector</span>
          <span className="font-mono text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
            &lt;{selected.anchor.tagName.toLowerCase()}&gt;
          </span>
        </div>
        <button
          onClick={() => setSelected(null)}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-4">
        {/* Content */}
        {snapshot.text !== null && (
          <Section title="Content">
            <textarea
              value={snapshot.text}
              onChange={(e) => apply([{ kind: 'set-text', value: e.target.value }])}
              rows={3}
              className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Element text..."
            />
          </Section>
        )}

        {/* Typography */}
        <Section title="Typography">
          {/* Font Size */}
          <Field label="Size">
            <input
              type="range"
              min={8}
              max={200}
              step={1}
              value={snapshot.fontSize}
              onChange={(e) =>
                apply([{ kind: 'set-style', key: 'fontSize', value: `${Math.round(Number(e.target.value))}px` }])
              }
              className="flex-1"
            />
            <span className="text-[10px] text-gray-500 w-8 text-right">{Math.round(snapshot.fontSize)}px</span>
          </Field>

          {/* Font Weight */}
          <Field label="Weight">
            <select
              value={String(snapshot.fontWeight)}
              onChange={(e) => {
                const n = Number(e.target.value);
                apply([{ kind: 'set-style', key: 'fontWeight', value: n === 400 ? null : e.target.value }]);
              }}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extrabold</option>
            </select>
          </Field>

          {/* Bold / Italic */}
          <Field label="Style">
            <div className="flex gap-1">
              <button
                onClick={() =>
                  apply([{ kind: 'set-style', key: 'fontWeight', value: snapshot.fontWeight >= 600 ? null : '700' }])
                }
                className={`p-1.5 rounded border ${snapshot.fontWeight >= 600 ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  apply([{ kind: 'set-style', key: 'fontStyle', value: snapshot.fontStyle === 'italic' ? null : 'italic' }])
                }
                className={`p-1.5 rounded border ${snapshot.fontStyle === 'italic' ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
            </div>
          </Field>

          {/* Line Height */}
          <Field label="Line Height">
            <input
              type="range"
              min={0.8}
              max={3}
              step={0.05}
              value={snapshot.lineHeight ?? 1.4}
              onChange={(e) => apply([{ kind: 'set-style', key: 'lineHeight', value: String(round2(Number(e.target.value))) }])}
              className="flex-1"
            />
            <span className="text-[10px] text-gray-500 w-8 text-right">{round2(snapshot.lineHeight ?? 1.4)}</span>
          </Field>

          {/* Letter Spacing */}
          <Field label="Tracking">
            <input
              type="range"
              min={-5}
              max={20}
              step={0.1}
              value={snapshot.letterSpacing}
              onChange={(e) =>
                apply([{ kind: 'set-style', key: 'letterSpacing', value: Number(e.target.value) === 0 ? null : `${round2(Number(e.target.value))}px` }])
              }
              className="flex-1"
            />
            <span className="text-[10px] text-gray-500 w-8 text-right">{round2(snapshot.letterSpacing)}px</span>
          </Field>

          {/* Text Align */}
          <Field label="Align">
            <div className="flex gap-1">
              {[
                { v: 'left', Icon: AlignLeft },
                { v: 'center', Icon: AlignCenter },
                { v: 'right', Icon: AlignRight },
              ].map(({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => apply([{ kind: 'set-style', key: 'textAlign', value: v === 'left' ? null : v }])}
                  className={`p-1.5 rounded border ${snapshot.textAlign === v ? 'bg-blue-100 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <ColorField
            label="Text"
            value={snapshot.color}
            onChange={(v) => apply([{ kind: 'set-style', key: 'color', value: v }])}
          />
          <ColorField
            label="Background"
            value={snapshot.backgroundColor ?? '#ffffff'}
            dim={!snapshot.backgroundColor}
            onChange={(v) => apply([{ kind: 'set-style', key: 'backgroundColor', value: v }])}
            onClear={() => apply([{ kind: 'set-style', key: 'backgroundColor', value: null }])}
          />
        </Section>
      </div>
    </div>
  );
}

// ── Sub Components ─────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-14 shrink-0">{label}</span>
      {children}
    </div>
  );
}

function ColorField({
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
    <Field label={label}>
      <label className="relative w-7 h-7 shrink-0 cursor-pointer rounded border border-gray-300 overflow-hidden">
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
        className="flex-1 h-7 px-2 text-[11px] font-mono uppercase border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        spellCheck={false}
      />
      {onClear && (
        <button
          onClick={onClear}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </Field>
  );
}

// ── Utilities ──────────────────────────────────────────────────────

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
