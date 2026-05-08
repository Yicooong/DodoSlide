import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSlideRenderer } from '../../hooks/use-slide-renderer';
import { CanvasConfig } from '../../lib/canvas-config';
import { Slide } from '../../hooks/use-slides';
import { PresenterControls } from './PresenterControls';

interface PlayerProps {
  slides: Slide[];
  initialIndex: number;
  canvasConfig: CanvasConfig;
  onExit: () => void;
}

export function Player({ slides, initialIndex, canvasConfig, onExit }: PlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [blackScreen, setBlackScreen] = useState<'none' | 'black' | 'white'>('none');
  const [showOverview, setShowOverview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [laserMode, setLaserMode] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [direction, setDirection] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<number>(0);
  const slide = slides[currentIndex];
  const { error, RenderedSlide } = useSlideRenderer(slide?.code || '');

  const [scale, setScale] = useState(1);
  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const s = Math.min(vw / canvasConfig.width, vh / canvasConfig.height);
      setScale(s);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [canvasConfig]);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setBlackScreen('none');
  }, [slides.length, currentIndex]);

  const next = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const prev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Keyboard handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showOverview) {
        if (e.key === 'Escape' || e.key === 'o') { e.preventDefault(); setShowOverview(false); }
        return;
      }
      if (showHelp) {
        if (e.key === 'Escape' || e.key === 'h') { e.preventDefault(); setShowHelp(false); }
        return;
      }
      switch (e.key) {
        case 'Escape': e.preventDefault(); onExit(); break;
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': e.preventDefault(); next(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': e.preventDefault(); prev(); break;
        case 'b': e.preventDefault(); setBlackScreen(v => v === 'black' ? 'none' : 'black'); break;
        case 'w': e.preventDefault(); setBlackScreen(v => v === 'white' ? 'none' : 'white'); break;
        case 'o': e.preventDefault(); setShowOverview(true); break;
        case 'l': e.preventDefault(); setLaserMode(v => !v); break;
        case 'h': e.preventDefault(); setShowHelp(true); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, next, prev, showOverview, showHelp]);

  // Idle cursor hide
  useEffect(() => {
    const reset = () => {
      setCursorVisible(true);
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => setCursorVisible(false), 3000);
    };
    window.addEventListener('mousemove', reset);
    reset();
    return () => {
      window.removeEventListener('mousemove', reset);
      clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Fullscreen
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
    const onFsChange = () => {
      if (!document.fullscreenElement) onExit();
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [onExit]);

  const handleExit = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    onExit();
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden"
      style={{
        background: blackScreen === 'black' ? '#000' : blackScreen === 'white' ? '#fff' : '#111',
        cursor: cursorVisible ? (laserMode ? 'none' : 'default') : 'none',
      }}
    >
      {/* Laser pointer */}
      {laserMode && cursorVisible && <LaserDot />}

      {/* Slide content */}
      {blackScreen === 'none' && !showOverview && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: '#111' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 60 }}
              transition={{ duration: 0.25 }}
              style={{
                width: canvasConfig.width,
                height: canvasConfig.height,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
              }}
            >
              <div
                data-inspector-root
                className="logical-slide-root relative overflow-hidden"
                style={{
                  width: canvasConfig.width,
                  height: canvasConfig.height,
                  // @ts-ignore
                  '--vh': `${canvasConfig.height / 100}px`,
                  '--vw': `${canvasConfig.width / 100}px`,
                }}
              >
                <style>{`
                  .logical-slide-root * { box-sizing: border-box; }
                  .logical-slide-root .min-h-screen, .logical-slide-root .h-screen {
                    min-height: ${canvasConfig.height}px !important;
                    height: ${canvasConfig.height}px !important;
                  }
                  .logical-slide-root .min-w-screen, .logical-slide-root .w-screen {
                    min-width: ${canvasConfig.width}px !important;
                    width: ${canvasConfig.width}px !important;
                  }
                `}</style>
                <RenderedSlide />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Overview grid */}
      {showOverview && (
        <OverviewGrid
          slides={slides}
          canvasConfig={canvasConfig}
          currentIndex={currentIndex}
          onSelect={(i) => { goTo(i); setShowOverview(false); }}
          onClose={() => setShowHelp(false)}
        />
      )}

      {/* Help overlay */}
      {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}

      {/* Black screen overlay text */}
      {blackScreen !== 'none' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl opacity-30" style={{ color: blackScreen === 'black' ? '#fff' : '#000' }}>
            {blackScreen === 'black' ? '黑屏模式' : '白屏模式'} — 按 {blackScreen === 'black' ? 'B' : 'W'} 恢复
          </span>
        </div>
      )}

      {/* Controls */}
      <PresenterControls
        currentIndex={currentIndex}
        total={slides.length}
        onPrev={prev}
        onNext={next}
        onExit={handleExit}
        onGoto={goTo}
      />
    </div>
  );
}

function LaserDot() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);
  return (
    <div
      className="fixed pointer-events-none z-[10001]"
      style={{
        left: pos.x - 6,
        top: pos.y - 6,
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'red',
        boxShadow: '0 0 12px 4px rgba(255,0,0,0.6)',
      }}
    />
  );
}

function OverviewGrid({
  slides, canvasConfig, currentIndex, onSelect, onClose,
}: {
  slides: Slide[]; canvasConfig: CanvasConfig; currentIndex: number;
  onSelect: (i: number) => void; onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center p-8 overflow-auto" style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="text-white text-sm mb-4 opacity-60">按 O 或 Esc 关闭概览</div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(slides.length, 4)}, 1fr)` }}>
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => onSelect(i)}
            className="relative rounded overflow-hidden border-2 transition-all hover:scale-105"
            style={{
              borderColor: i === currentIndex ? '#3b82f6' : 'rgba(255,255,255,0.2)',
              width: 240,
              aspectRatio: canvasConfig.ratio === '16:9' ? '16/9' : '4/3',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-white text-xs bg-gray-800">
              {slide.name}
            </div>
            <div className="absolute bottom-1 right-2 text-white text-xs opacity-60">{i + 1}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    ['→ / ↓ / Space / PgDn', '下一页'],
    ['← / ↑ / PgUp', '上一页'],
    ['B', '黑屏切换'],
    ['W', '白屏切换'],
    ['O', '幻灯片概览'],
    ['L', '激光笔模式'],
    ['H', '显示/隐藏帮助'],
    ['Esc', '退出演示'],
  ];
  return (
    <div className="absolute inset-0 z-[10000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="bg-gray-900 rounded-xl p-8 shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-lg font-semibold mb-4">快捷键</h2>
        <div className="space-y-2">
          {shortcuts.map(([key, desc]) => (
            <div key={key} className="flex justify-between items-center">
              <kbd className="text-xs bg-gray-700 text-gray-200 px-2 py-1 rounded font-mono">{key}</kbd>
              <span className="text-gray-400 text-sm">{desc}</span>
            </div>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-all active:scale-[0.98]">
          关闭 (H / Esc)
        </button>
      </div>
    </div>
  );
}
