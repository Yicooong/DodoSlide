import React from 'react';
import {
  Pen,
  BookOpen,
  Eye,
  Clock,
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F3EFE6] p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-[#FAF7F2] relative overflow-hidden flex flex-col">

        {/* 杂志页眉 */}
        <div className="flex items-center justify-between px-16 pt-8">
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]">
            Vol. 04 · Issue 12
          </span>
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]">
            The Design Journal
          </span>
        </div>

        {/* 装饰分割线 */}
        <div className="mx-16 mt-4 border-t border-[rgba(40,28,18,0.12)]"></div>

        {/* 主内容区 */}
        <div className="flex-1 grid grid-cols-12 gap-8 px-16 py-10">

          {/* 左栏 — 封面主体 (col-span-7) */}
          <div className="col-span-7 flex flex-col justify-center">
            {/* Kicker */}
            <span className="font-semibold text-[11px] tracking-[0.16em] uppercase text-[#8A2A1C] mb-4 block">
              Feature Story
            </span>

            {/* Hero 标题 — 斜体衬线 */}
            <h1 className="font-serif font-semibold italic text-[5.5vw] text-[#1B1410] leading-[0.95] mb-6">
              The Art of
              <br />
              Design
            </h1>

            {/* 装饰线 */}
            <div className="w-20 h-px bg-[#8A2A1C] mb-6"></div>

            {/* 引导段 */}
            <p className="font-light text-[1.4vw] leading-relaxed text-[#5C4A3E] max-w-[90%] mb-8">
              在这个信息过载的时代，好的设计不是加法，而是减法。每一个留白、每一处间距、每一根线条都在无声地讲述一个故事。
            </p>

            {/* 元数据行 */}
            <div className="flex items-center gap-5 font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]">
              <span className="flex items-center gap-1.5">
                <Pen size={11} /> 陈默
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Clock size={11} /> 2025.09
              </span>
              <span>·</span>
              <span>8 min read</span>
            </div>
          </div>

          {/* 右栏 — 引用块 + 数据 (col-span-5) */}
          <div className="col-span-5 flex flex-col justify-center gap-8">

            {/* Pull Quote 引用块 */}
            <div className="border-l-2 border-[#8A2A1C] pl-8 py-4">
              <p className="font-serif italic text-[2vw] leading-relaxed text-[#1B1410]">
                "设计不是装饰，而是让复杂的事物变得可理解的桥梁。"
              </p>
              <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868] mt-4 block">
                — 原研哉，设计中的设计
              </span>
            </div>

            {/* 数据区 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-[11px] tracking-[0.16em] uppercase text-[#8A2A1C]">
                  年度项目
                </span>
                <span className="font-serif font-bold text-[4vw] text-[#1B1410] leading-none">
                  128
                </span>
                <span className="text-sm text-[#5C4A3E]">
                  跨 6 个行业的设计实践
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-[11px] tracking-[0.16em] uppercase text-[#8A2A1C]">
                  设计原则
                </span>
                <span className="font-serif font-bold text-[4vw] text-[#1B1410] leading-none">
                  05
                </span>
                <span className="text-sm text-[#5C4A3E]">
                  简约、克制、功能、一致、留白
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 页脚 */}
        <div className="mx-16 border-t border-[rgba(40,28,18,0.12)]"></div>
        <div className="flex items-center justify-between px-16 py-4">
          <div className="flex items-center gap-4">
            <BookOpen size={14} className="text-[#8A7868]" />
            <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]">
              The Design Journal · 季刊
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.16em] uppercase text-[#8A7868]">
            <span className="flex items-center gap-1.5"><Eye size={11} /> 12,400 readers</span>
            <span>—</span>
            <span>Page 01</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
