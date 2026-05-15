import React from 'react';
import { Quote, ArrowRight } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 优雅典雅 Editorial Cover — 编辑封面 */}
      <div className="w-[1280px] h-[720px] bg-yellow-50 relative overflow-hidden flex flex-col justify-center p-24">

        {/* 顶部元数据 */}
        <div className="flex items-center justify-between mb-16">
          <span className="font-medium text-xs tracking-[0.16em] uppercase text-rose-700">
            Vol. XII · Issue 04
          </span>
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-stone-400">
            Spring 2026
          </span>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Kicker */}
          <span className="font-medium text-xs tracking-[0.16em] uppercase text-rose-700 mb-6">
            The Art of Refinement
          </span>

          {/* Hero 标题 — serif 衬线 */}
          <h1 className="font-serif font-bold text-[8vw] leading-[0.9] tracking-tight text-stone-900 mb-8">
            Elegance
            <br />
            <span className="italic font-normal">Redefined</span>
          </h1>

          {/* 装饰线 */}
          <div className="w-24 h-px bg-rose-700 mb-8" />

          {/* 引导段 */}
          <p className="font-light text-[1.6vw] leading-relaxed text-stone-600 max-w-[40vw] mb-12">
            在克制中寻找力量，在留白中构建意义。
            每一处细节都是对品质的承诺。
          </p>
        </div>

        {/* 底部引用区 */}
        <div className="flex items-start gap-8 border-l-2 border-rose-700 pl-8">
          <Quote className="w-6 h-6 text-rose-700 opacity-40 shrink-0 mt-1" />
          <div>
            <p className="font-serif italic text-[2.2vw] leading-relaxed text-stone-700 mb-3">
              &ldquo;Simplicity is the ultimate sophistication.&rdquo;
            </p>
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-stone-400">
              — Leonardo da Vinci
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
