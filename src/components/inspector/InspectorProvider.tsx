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
import { applyEdit, type EditOp } from '../../lib/inspector/apply-edit';

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

type InspectorCtx = {
  active: boolean;
  toggle: () => void;
  cancel: () => void;
  selected: SelectedTarget | null;
  setSelected: (s: SelectedTarget | null) => void;
  bufferOps: (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => void;
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

const COMMIT_DELAY_MS = 300;

export function InspectorProvider({ children, currentCode, onCodeChange }: InspectorProviderProps) {
  const [active, setActive] = useState(true);
  const [selected, setSelected] = useState<SelectedTarget | null>(null);

  const pendingRef = useRef<Map<string, Bucket>>(new Map());
  const instanceCounterRef = useRef(0);
  const codeRef = useRef(currentCode);
  const onCodeChangeRef = useRef(onCodeChange);
  codeRef.current = currentCode;
  onCodeChangeRef.current = onCodeChange;

  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureInstanceId = useCallback((el: HTMLElement): string => {
    const existing = el.getAttribute(INSTANCE_ID_ATTR);
    if (existing) return existing;
    const next = `inst-${++instanceCounterRef.current}`;
    el.setAttribute(INSTANCE_ID_ATTR, next);
    return next;
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
    },
    [ensureInstanceId],
  );

  const autoCommit = useCallback(() => {
    const buckets = pendingRef.current;
    if (buckets.size === 0) return;

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
      onCodeChangeRef.current(currentSource);
    }

    if (failures.length > 0) {
      console.error('[Inspector] Auto-commit errors:', failures);
    }
  }, []);

  const scheduleCommit = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      autoCommit();
    }, COMMIT_DELAY_MS);
  }, [autoCommit]);

  const flushAndCommit = useCallback(() => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
    autoCommit();
  }, [autoCommit]);

  const bufferOps = useCallback(
    (line: number, column: number, anchor: HTMLElement, ops: EditOp[]) => {
      applyOpsRaw(line, column, anchor, ops);
      scheduleCommit();
    },
    [applyOpsRaw, scheduleCommit],
  );

  // Flush pending edits when inspector is toggled off or unmounts
  const flushRef = useRef(flushAndCommit);
  flushRef.current = flushAndCommit;
  useEffect(() => {
    if (!active) flushRef.current();
  }, [active]);
  useEffect(() => {
    return () => {
      flushRef.current();
    };
  }, []);

  // MutationObserver: replay buffered edits after React re-renders
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
    setActive((a: boolean) => {
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
    }),
    [active, toggle, cancel, selected, bufferOps],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
