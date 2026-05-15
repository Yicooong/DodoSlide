import React from 'react';
import { ArrowRight, Zap, Layers, Globe } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 瑞士风 Index Cover — 克莱因蓝封面 */}
      <div className="w-[1280px] h-[720px] bg-[#002FA7] text-white relative overflow-hidden flex flex-col">

        {/* 点阵装饰背景 */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.2px, transparent 1.4px)',
            backgroundSize: '18px 18px',
          }}
        />

        {/* Chrome 页眉 */}
        <div className="flex justify-between items-center px-12 pt-8 font-mono text-[11px] font-medium tracking-[0.16em] uppercase opacity-60 relative z-10">
          <span>Swiss Style · International</span>
          <span>01 / 12</span>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col justify-center px-12 relative z-10">
          {/* 分类标签 */}
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase opacity-70 mb-4">
            Product Launch · 2026
          </span>

          {/* Hero 宣言 — 极轻字重 */}
          <h1 className="font-thin text-[min(11.6vw,19vh)] leading-[0.9] tracking-[-0.04em] mb-8 max-w-[80vw]">
            Design
            <br />
            Systems
          </h1>

          {/* 描述 */}
          <p className="font-normal text-[1.55vw] opacity-70 max-w-[50vw] mb-12">
            A framework for building consistent, scalable interfaces across every platform and touchpoint.
          </p>

          {/* 底部指标行 */}
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase opacity-50">Components</span>
              <span className="font-extrabold text-[3.5vw] leading-none mt-1">248</span>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase opacity-50">Tokens</span>
              <span className="font-extrabold text-[3.5vw] leading-none mt-1">1,024</span>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="flex flex-col">
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase opacity-50">Platforms</span>
              <span className="font-extrabold text-[3.5vw] leading-none mt-1">6</span>
            </div>
          </div>
        </div>

        {/* 底部 accent 色块 */}
        <div className="absolute bottom-0 right-0 w-[35vw] h-[30vh] bg-white/10" />

        {/* Foot 页脚 */}
        <div className="flex justify-between items-center px-12 pb-6 font-mono text-[11px] font-medium tracking-[0.16em] uppercase opacity-40 relative z-10">
          <span>Design Systems Framework</span>
          <span>— 2026 —</span>
        </div>
      </div>
    </div>
  );
};

export default App;
