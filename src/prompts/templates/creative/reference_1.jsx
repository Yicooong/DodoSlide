import React from 'react';
import { Sparkles, Palette, Zap, Star } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 创意活力 Bold Cover — 多彩撞色封面 */}
      <div className="w-[1280px] h-[720px] bg-white relative overflow-hidden flex flex-col items-start justify-center p-20">

        {/* 几何装饰元素 */}
        <div className="absolute top-12 right-16 w-32 h-32 bg-rose-500 rounded-2xl rotate-12 opacity-80" />
        <div className="absolute top-24 right-40 w-20 h-20 bg-teal-500 rounded-full opacity-70" />
        <div className="absolute bottom-20 right-24 w-24 h-24 bg-amber-500 rounded-2xl -rotate-6 opacity-75" />
        <div className="absolute bottom-32 left-16 w-16 h-16 bg-purple-500 rounded-full opacity-60" />

        {/* Kicker */}
        <span className="font-bold text-xs tracking-[0.12em] uppercase text-rose-500 mb-6 relative z-10">
          Creative Direction · 2026
        </span>

        {/* Hero 标题 — 超大字号 */}
        <h1 className="font-extrabold text-[9vw] leading-[0.85] tracking-tight text-slate-800 mb-8 relative z-10">
          Make It
          <br />
          <span className="text-rose-500">Pop</span>
        </h1>

        {/* 引导段 */}
        <p className="font-normal text-[1.6vw] leading-relaxed text-slate-500 max-w-[45vw] mb-12 relative z-10">
          打破常规，用色彩和几何构建令人难忘的视觉体验。
        </p>

        {/* 底部特性卡片 */}
        <div className="flex gap-4 mt-auto relative z-10">
          <div className="flex items-center gap-3 bg-rose-50 px-5 py-3 rounded-xl">
            <Sparkles className="w-5 h-5 text-rose-500" />
            <span className="text-sm font-semibold text-slate-800">大胆配色</span>
          </div>
          <div className="flex items-center gap-3 bg-teal-50 px-5 py-3 rounded-xl">
            <Palette className="w-5 h-5 text-teal-500" />
            <span className="text-sm font-semibold text-slate-800">几何构成</span>
          </div>
          <div className="flex items-center gap-3 bg-amber-50 px-5 py-3 rounded-xl">
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-slate-800">活力动感</span>
          </div>
          <div className="flex items-center gap-3 bg-purple-50 px-5 py-3 rounded-xl">
            <Star className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-semibold text-slate-800">创意无限</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
