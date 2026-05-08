import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { findSlideSource, type SlideSourceHit } from '../../lib/inspector/find-source';
import { useInspector } from './InspectorProvider';

type Highlight = { hit: SlideSourceHit };
type RelRect = { left: number; top: number; width: number; height: number };

const FRAME_FADE_MS = 150;
const FRAME_MORPH_MS = 180;

function findSelectedAnchor(line: number, column: number): HTMLElement | null {
  const root = document.querySelector<HTMLElement>('[data-inspector-root]');
  if (!root) return null;
  return root.querySelector<HTMLElement>(`[data-slide-loc="${line}:${column}"]`);
}

export function InspectOverlay() {
  const { active, selected, setSelected } = useInspector();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<Highlight | null>(null);

  useEffect(() => {
    if (!active) {
      setHover(null);
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelected(null);
      }
    };

    const onMove = (e: PointerEvent) => {
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return setHover(null);
      const hit = findSlideSource(el);
      if (!hit) return setHover(null);
      setHover({ hit });
    };

    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-inspector-ui]')) return;
      const el = pickElement(e.clientX, e.clientY);
      if (!el) return;
      const hit = findSlideSource(el);
      if (!hit) return;
      setSelected({ line: hit.line, column: hit.column, anchor: hit.anchor });
      setHover({ hit });
    };

    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('click', onClick, true);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('click', onClick, true);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [active, setSelected]);

  const selectedAnchor = selected
    ? findSelectedAnchor(selected.line, selected.column) ?? selected.anchor
    : null;

  const hoverAnchor = hover?.hit.anchor ?? null;
  const isHoverSameAsSelected = !!(selectedAnchor && hoverAnchor && selectedAnchor === hoverAnchor);

  return (
    <FrameOverlay
      active={active}
      overlayRef={overlayRef}
      selectedAnchor={selectedAnchor}
      hoverAnchor={isHoverSameAsSelected ? null : hoverAnchor}
    />
  );
}

function useFrameMeasure(
  active: boolean,
  overlayRef: React.RefObject<HTMLDivElement>,
  anchor: HTMLElement | null,
) {
  const [rect, setRect] = useState<RelRect | null>(null);
  const [hasTarget, setHasTarget] = useState(false);

  const measure = useCallback(() => {
    const overlay = overlayRef.current;
    if (!active || !anchor?.isConnected || !overlay) {
      setHasTarget(false);
      return;
    }

    const targetRect = anchor.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const next = {
      left: targetRect.left - overlayRect.left,
      top: targetRect.top - overlayRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };

    setHasTarget(true);
    setRect((prev) => (sameRect(prev, next) ? prev : next));
  }, [active, overlayRef, anchor]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!active || !anchor) {
      setHasTarget(false);
      return;
    }

    let scheduled = 0;
    const scheduleMeasure = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(measure);
    };

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    const root = document.querySelector<HTMLElement>('[data-inspector-root]');
    if (root) resizeObserver.observe(root);
    if (overlayRef.current) resizeObserver.observe(overlayRef.current);
    if (anchor) resizeObserver.observe(anchor);

    window.addEventListener('resize', scheduleMeasure, true);
    window.addEventListener('scroll', scheduleMeasure, true);
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(scheduled);
      window.removeEventListener('resize', scheduleMeasure, true);
      window.removeEventListener('scroll', scheduleMeasure, true);
    };
  }, [active, measure, overlayRef, anchor]);

  const [morph, setMorph] = useState(false);
  useLayoutEffect(() => {
    if (hasTarget && rect) {
      setMorph(true);
      return;
    }
    const t = setTimeout(() => setMorph(false), FRAME_FADE_MS);
    return () => clearTimeout(t);
  }, [hasTarget, rect]);

  const transition = morph
    ? `left ${FRAME_MORPH_MS}ms ease-out, top ${FRAME_MORPH_MS}ms ease-out, ` +
      `width ${FRAME_MORPH_MS}ms ease-out, height ${FRAME_MORPH_MS}ms ease-out, ` +
      `opacity ${FRAME_FADE_MS}ms ease-out`
    : `opacity ${FRAME_FADE_MS}ms ease-out`;

  return { rect, hasTarget: !!(hasTarget && rect), transition };
}

type FrameStyle = 'selection' | 'hover';

const FRAME_STYLES: Record<FrameStyle, { outline: string; bg: string }> = {
  selection: { outline: '2px solid #3b82f6', bg: 'rgba(59,130,246,0.1)' },
  hover: { outline: '1.5px dashed #93c5fd', bg: 'rgba(59,130,246,0.05)' },
};

function FrameOverlay({
  active,
  overlayRef,
  selectedAnchor,
  hoverAnchor,
}: {
  active: boolean;
  overlayRef: React.RefObject<HTMLDivElement>;
  selectedAnchor: HTMLElement | null;
  hoverAnchor: HTMLElement | null;
}) {
  const sel = useFrameMeasure(active, overlayRef, selectedAnchor);
  const hov = useFrameMeasure(active, overlayRef, hoverAnchor);

  if (!active) return null;

  return (
    <div ref={overlayRef} data-inspector-ui className="pointer-events-none absolute inset-0 z-30">
      {sel.hasTarget && (
        <FrameRect rect={sel.rect!} visible={sel.hasTarget} transition={sel.transition} style={FRAME_STYLES.selection} />
      )}
      {hov.hasTarget && (
        <FrameRect rect={hov.rect!} visible={hov.hasTarget} transition={hov.transition} style={FRAME_STYLES.hover} />
      )}
    </div>
  );
}

function FrameRect({
  rect,
  visible,
  transition,
  style,
}: {
  rect: RelRect;
  visible: boolean;
  transition: string;
  style: { outline: string; bg: string };
}) {
  return (
    <div
      className="absolute"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        opacity: visible ? 1 : 0,
        transition,
        outline: style.outline,
        background: style.bg,
      }}
    />
  );
}

function sameRect(a: RelRect | null, b: RelRect): boolean {
  return (
    !!a &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

function pickElement(x: number, y: number): HTMLElement | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest('[data-inspector-ui]')) continue;
    if (!el.closest('[data-inspector-root]')) continue;
    return el;
  }
  return null;
}
