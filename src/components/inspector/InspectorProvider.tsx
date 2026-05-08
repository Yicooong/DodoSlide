import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useHistory } from './HistoryProvider';
import { applyEdit, type EditOp, type ApplyEditResult } from '../../lib/inspector/apply-edit';

export type SelectedTarget = {
  line: number;
  column: number;
  anchor: HTMLElement;
};

type AssetAttrOp = { assetPath: string; previewUrl: string };

type Bucket = {
  line: number;
  column: number;
  styleOps: Map<string, string | null>;
  textOps: Map<string, { value: string }>;
  attrOps: Map<string, AssetAttrOp>;
  origStyle: Map<string, string>;
  origTexts: Map<string, { value: string }>;
  origAttrs: Map<string, string | null>;
};

const INSTANCE_ID_ATTR = 'data-slide-instance-id';

function readInstanceId(el: HTMLElement): string | null {
  return el.getAttribute(INSTANCE_ID_ATTR);
}

type Edit = { line: number; column: number; ops: EditOp[] };

type InspectorCtx = {
  active: boolean;
  toggle: () => void;
  cancel: () => void;
  selected: SelectedTarget | null;
  setSelected: (s: SelectedTarget | null) => void;
  bufferOps: (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => void;
  pendingCount: number;
  commitEdits: () => void;
  cancelEdits: () => void;
  committing: boolean;
};

const Ctx = createContext<InspectorCtx | null>(null);

export function useInspector(): InspectorCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useInspector must be used inside <InspectorProvider>');
  return v;
}

type InspectorProviderProps = {
  children: ReactNode;
  currentCode: string;
  onCodeChange: (code: string) => void;
};

export function InspectorProvider({ children, currentCode, onCodeChange }: InspectorProviderProps) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState<SelectedTarget | null>(null);
  const history = useHistory();

  const pendingRef = useRef<Map<string, Bucket>>(new Map());
  const instanceCounterRef = useRef(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [committing, setCommitting] = useState(false);
  const codeRef = useRef(currentCode);
  codeRef.current = currentCode;

  const ensureInstanceId = useCallback((el: HTMLElement): string => {
    const existing = el.getAttribute(INSTANCE_ID_ATTR);
    if (existing) return existing;
    const next = `inst-${++instanceCounterRef.current}`;
    el.setAttribute(INSTANCE_ID_ATTR, next);
    return next;
  }, []);

  const refreshCount = useCallback(() => {
    let n = 0;
    for (const b of pendingRef.current.values()) {
      if (b.styleOps.size > 0 || b.textOps.size > 0 || b.attrOps.size > 0) n++;
    }
    setPendingCount(n);
  }, []);

  const findAnchor = useCallback((line: number, column: number, instanceId?: string) => {
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return null;
    if (instanceId) {
      const byInstance = root.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`);
      if (byInstance) return byInstance;
    }
    return root.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`);
  }, []);

  const applyOpsRaw = useCallback(
    (line: number, column: number, anchor: HTMLElement | null, ops: EditOp[]) => {
      const key = `${line}:${column}`;
      let bucket = pendingRef.current.get(key);
      if (!bucket) {
        bucket = {
          line,
          column,
          styleOps: new Map(),
          textOps: new Map(),
          attrOps: new Map(),
          origStyle: new Map(),
          origTexts: new Map(),
          origAttrs: new Map(),
        };
        pendingRef.current.set(key, bucket);
      }
      const style = (anchor?.style ?? {}) as unknown as Record<string, string>;
      for (const op of ops) {
        if (op.kind === 'set-style') {
          if (anchor && !bucket.origStyle.has(op.key)) {
            bucket.origStyle.set(op.key, style[op.key] ?? '');
          }
          bucket.styleOps.set(op.key, op.value);
          if (anchor?.isConnected) style[op.key] = op.value ?? '';
        } else if (op.kind === 'set-text') {
          if (!anchor) continue;
          const instanceId = ensureInstanceId(anchor);
          if (!bucket.origTexts.has(instanceId)) {
            bucket.origTexts.set(instanceId, { value: anchor.textContent ?? '' });
          }
          bucket.textOps.set(instanceId, { value: op.value });
          if (anchor.isConnected) anchor.textContent = op.value;
        } else if (op.kind === 'set-attr-asset') {
          if (anchor && !bucket.origAttrs.has(op.attr)) {
            bucket.origAttrs.set(
              op.attr,
              anchor.hasAttribute(op.attr) ? anchor.getAttribute(op.attr) : null,
            );
          }
          bucket.attrOps.set(op.attr, { assetPath: op.assetPath, previewUrl: op.previewUrl });
          if (anchor?.isConnected) anchor.setAttribute(op.attr, op.previewUrl);
        }
      }
      refreshCount();
    },
    [refreshCount, ensureInstanceId],
  );

  type StyleSnap = { kind: 'style'; key: string; value: string | null; existed: boolean };
  type TextSnap = { kind: 'text'; instanceId: string; value: string | null; existed: boolean };
  type AttrSnap = {
    kind: 'attr';
    attr: string;
    value: AssetAttrOp | string | null;
    source: 'op' | 'orig' | 'dom-missing' | 'dom-present';
  };
  type Snap = StyleSnap | TextSnap | AttrSnap;

  const snapshotForOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]): Snap[] => {
      const key = `${line}:${column}`;
      const bucket = pendingRef.current.get(key);
      const style = anchor.style as unknown as Record<string, string>;
      const snaps: Snap[] = [];
      for (const op of ops) {
        if (op.kind === 'set-style') {
          if (bucket?.styleOps.has(op.key)) {
            snaps.push({
              kind: 'style',
              key: op.key,
              value: bucket.styleOps.get(op.key) ?? null,
              existed: true,
            });
          } else {
            snaps.push({
              kind: 'style',
              key: op.key,
              value: style[op.key] ?? '',
              existed: false,
            });
          }
        } else if (op.kind === 'set-text') {
          const instanceId = ensureInstanceId(anchor);
          const existing = bucket?.textOps.get(instanceId);
          if (existing) {
            snaps.push({ kind: 'text', instanceId, value: existing.value, existed: true });
          } else {
            snaps.push({
              kind: 'text',
              instanceId,
              value: anchor.textContent ?? '',
              existed: false,
            });
          }
        } else if (op.kind === 'set-attr-asset') {
          const prev = bucket?.attrOps.get(op.attr);
          if (prev) {
            snaps.push({ kind: 'attr', attr: op.attr, value: prev, source: 'op' });
          } else if (bucket?.origAttrs.has(op.attr)) {
            snaps.push({
              kind: 'attr',
              attr: op.attr,
              value: bucket.origAttrs.get(op.attr) ?? null,
              source: 'orig',
            });
          } else if (anchor.hasAttribute(op.attr)) {
            snaps.push({
              kind: 'attr',
              attr: op.attr,
              value: anchor.getAttribute(op.attr),
              source: 'dom-present',
            });
          } else {
            snaps.push({ kind: 'attr', attr: op.attr, value: null, source: 'dom-missing' });
          }
        }
      }
      return snaps;
    },
    [ensureInstanceId],
  );

  const restoreSnapshot = useCallback(
    (line: number, column: number, snaps: Snap[]) => {
      const key = `${line}:${column}`;
      const bucket = pendingRef.current.get(key);
      if (!bucket) return;
      const sharedAnchor = findAnchor(line, column);
      const sharedStyle = (sharedAnchor?.style ?? {}) as unknown as Record<string, string>;
      for (const snap of snaps) {
        if (snap.kind === 'style') {
          if (snap.existed) {
            const v = snap.value ?? '';
            bucket.styleOps.set(snap.key, snap.value);
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = v;
          } else {
            bucket.styleOps.delete(snap.key);
            const orig = bucket.origStyle.get(snap.key);
            if (sharedAnchor?.isConnected) sharedStyle[snap.key] = orig ?? '';
          }
        } else if (snap.kind === 'text') {
          const textAnchor = findAnchor(line, column, snap.instanceId);
          if (snap.existed) {
            bucket.textOps.set(snap.instanceId, { value: snap.value ?? '' });
            if (textAnchor?.isConnected) textAnchor.textContent = snap.value ?? '';
          } else {
            bucket.textOps.delete(snap.instanceId);
            const orig = bucket.origTexts.get(snap.instanceId);
            if (textAnchor?.isConnected) textAnchor.textContent = orig?.value ?? '';
          }
        } else if (snap.kind === 'attr') {
          if (snap.source === 'op') {
            const op = snap.value as AssetAttrOp;
            bucket.attrOps.set(snap.attr, op);
            if (sharedAnchor?.isConnected) sharedAnchor.setAttribute(snap.attr, op.previewUrl);
          } else {
            bucket.attrOps.delete(snap.attr);
            const orig = bucket.origAttrs.get(snap.attr);
            if (sharedAnchor?.isConnected) {
              if (orig === null || orig === undefined) sharedAnchor.removeAttribute(snap.attr);
              else sharedAnchor.setAttribute(snap.attr, orig);
            }
          }
        }
      }
      if (bucket.styleOps.size === 0 && bucket.textOps.size === 0 && bucket.attrOps.size === 0) {
        pendingRef.current.delete(key);
      }
      refreshCount();
    },
    [findAnchor, refreshCount],
  );

  const bufferOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => {
      const snaps = snapshotForOps(line, column, anchor, ops);
      applyOpsRaw(line, column, anchor, ops);
      const first = ops[0];
      const opKey = first
        ? first.kind === 'set-style'
          ? first.key
          : first.kind === 'set-attr-asset'
            ? first.attr
            : 'text'
        : 'noop';
      const coalesceKey = `inspector:${line}:${column}:${first?.kind ?? 'noop'}:${opKey}`;
      history.record({
        coalesceKey,
        undo: () => restoreSnapshot(line, column, snaps),
        redo: () => applyOpsRaw(line, column, findAnchor(line, column), ops),
      });
    },
    [applyOpsRaw, snapshotForOps, restoreSnapshot, findAnchor, history],
  );

  const commitEdits = useCallback(() => {
    const buckets = pendingRef.current;
    if (buckets.size === 0) return;

    setCommitting(true);
    try {
      let currentSource = codeRef.current;
      const failures: string[] = [];

      for (const [key, bucket] of buckets) {
        const { line, column, styleOps, textOps, attrOps, origTexts } = bucket;

        const sharedOps: EditOp[] = [];
        for (const [k, v] of styleOps) sharedOps.push({ kind: 'set-style', key: k, value: v });
        for (const [attr, op] of attrOps) {
          sharedOps.push({
            kind: 'set-attr-asset',
            attr,
            assetPath: op.assetPath,
            previewUrl: op.previewUrl,
          });
        }
        if (sharedOps.length > 0) {
          const result = applyEdit(currentSource, line, column, sharedOps);
          if (!result.ok) {
            failures.push(`line ${line}: ${(result as { error: string }).error}`);
          } else {
            currentSource = result.source;
            bucket.styleOps.clear();
            bucket.attrOps.clear();
          }
        }

        for (const [instanceId, textOp] of textOps) {
          const orig = origTexts.get(instanceId);
          const textOpsList: EditOp[] = [
            { kind: 'set-text', value: textOp.value, prevText: orig?.value },
          ];
          const result = applyEdit(currentSource, line, column, textOpsList);
          if (!result.ok) {
            failures.push(`line ${line} text: ${(result as { error: string }).error}`);
          } else {
            currentSource = result.source;
            bucket.textOps.delete(instanceId);
          }
        }

        if (bucket.styleOps.size === 0 && bucket.textOps.size === 0 && bucket.attrOps.size === 0) {
          pendingRef.current.delete(key);
        }
      }

      if (currentSource !== codeRef.current) {
        onCodeChange(currentSource);
      }

      refreshCount();
      if (failures.length > 0) {
        console.error('[Inspector] Save errors:', failures);
      }
    } finally {
      setCommitting(false);
      history.clear();
    }
  }, [onCodeChange, refreshCount, history]);

  const cancelEdits = useCallback(() => {
    if (pendingRef.current.size === 0) {
      history.clear();
      return;
    }
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    for (const b of pendingRef.current.values()) {
      const sharedEl = root?.querySelector<HTMLElement>(`[data-slide-loc="${b.line}:${b.column}"]`);
      if (sharedEl) {
        const style = sharedEl.style as unknown as Record<string, string>;
        for (const [k, v] of b.origStyle) style[k] = v;
        for (const [attr, value] of b.origAttrs) {
          if (value === null) sharedEl.removeAttribute(attr);
          else sharedEl.setAttribute(attr, value);
        }
      }
      for (const [instanceId, orig] of b.origTexts) {
        const textEl =
          root?.querySelector<HTMLElement>(`[${INSTANCE_ID_ATTR}="${instanceId}"]`) ?? null;
        if (textEl?.isConnected) textEl.textContent = orig.value;
      }
    }
    pendingRef.current = new Map();
    setPendingCount(0);
    history.clear();
  }, [history]);

  const commitRef = useRef(commitEdits);
  commitRef.current = commitEdits;
  useEffect(() => {
    if (!active) commitRef.current();
  }, [active]);
  useEffect(() => {
    return () => {
      commitRef.current();
    };
  }, []);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (!root) return;

    const applyBuffered = (el: HTMLElement) => {
      const loc = el.dataset.slideLoc;
      if (!loc) return;
      const bucket = pendingRef.current.get(loc);
      if (!bucket) return;
      const style = el.style as unknown as Record<string, string>;
      for (const [key, value] of bucket.styleOps) {
        const v = value ?? '';
        if (style[key] !== v) style[key] = v;
      }
      const instanceId = readInstanceId(el);
      if (instanceId) {
        const textOp = bucket.textOps.get(instanceId);
        if (textOp && el.textContent !== textOp.value) {
          el.textContent = textOp.value;
        }
      }
      for (const [attr, op] of bucket.attrOps) {
        if (el.getAttribute(attr) !== op.previewUrl) el.setAttribute(attr, op.previewUrl);
      }
    };

    const replayAll = () => {
      if (pendingRef.current.size === 0) return;
      root.querySelectorAll<HTMLElement>('[data-slide-loc]').forEach(applyBuffered);
    };

    replayAll();
    const observer = new MutationObserver(replayAll);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const toggle = useCallback(() => {
    setActive((a) => {
      if (a) setSelected(null);
      return !a;
    });
  }, []);

  const cancel = useCallback(() => {
    setActive(false);
    setSelected(null);
  }, []);

  const value = useMemo<InspectorCtx>(
    () => ({
      active,
      toggle,
      cancel,
      selected,
      setSelected,
      bufferOps,
      pendingCount,
      commitEdits,
      cancelEdits,
      committing,
    }),
    [active, toggle, cancel, selected, bufferOps, pendingCount, commitEdits, cancelEdits, committing],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
