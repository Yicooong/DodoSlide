import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface PresenterControlsProps {
  currentIndex: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
  onGoto: (index: number) => void;
}

export function PresenterControls({ currentIndex, total, onPrev, onNext, onExit, onGoto }: PresenterControlsProps) {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const nearBottom = window.innerHeight - e.clientY < 120;
      if (nearBottom) {
        setVisible(true);
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = window.setTimeout(() => setVisible(false), 2500);
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute bottom-0 left-0 right-0 z-[10001] flex items-center justify-center gap-4 px-6 py-3"
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}
          onMouseEnter={() => { setVisible(true); clearTimeout(hideTimerRef.current); }}
          onMouseLeave={() => { hideTimerRef.current = window.setTimeout(() => setVisible(false), 2000); }}
        >
          <button onClick={onPrev} disabled={currentIndex === 0} className="p-2 rounded-full text-white hover:bg-white/20 disabled:opacity-30 transition-all active:scale-90">
            <ChevronLeft size={20} />
          </button>

          {/* Progress bar */}
          <div className="flex-1 max-w-lg h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer group hover:h-2 transition-all duration-200" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            onGoto(Math.round(pct * (total - 1)));
          }}>
            <div
              className="h-full bg-white rounded-full transition-all duration-200 group-hover:bg-blue-400"
              style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
            />
          </div>

          <span className="text-white text-sm font-mono min-w-[60px] text-center">
            {currentIndex + 1} / {total}
          </span>

          <button onClick={onNext} disabled={currentIndex === total - 1} className="p-2 rounded-full text-white hover:bg-white/20 disabled:opacity-30 transition-all active:scale-90">
            <ChevronRight size={20} />
          </button>

          <button onClick={onExit} className="p-2 rounded-full text-white hover:bg-red-500/60 transition-all active:scale-90 ml-2">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
