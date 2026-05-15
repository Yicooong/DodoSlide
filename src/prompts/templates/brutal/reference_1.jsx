import React from 'react';
import {
  Zap,
  Layers,
  Rocket,
  ArrowRight,
  Check,
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#FFFef0] p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-[#FFFef0] relative overflow-hidden flex flex-col px-12 py-10">

        {/* 顶部标签行 */}
        <div className="flex items-center justify-between mb-8">
          <span className="inline-block px-4 py-1.5 bg-[#FFD400] border-[2px] border-black text-black font-bold text-xs tracking-[0.12em] uppercase">
            Manifesto v2.0
          </span>
          <span className="font-sans text-xs font-bold text-black uppercase tracking-[0.1em]">
            2025 — Build the Future
          </span>
        </div>

        {/* 巨型宣言标题 */}
        <div className="mb-10">
          <h1 className="text-[9vw] font-display text-black uppercase leading-[0.85] tracking-tight">
            BUILD
          </h1>
          <h1 className="text-[9vw] font-display text-black uppercase leading-[0.85] tracking-tight">
            DIFFERENT
          </h1>
        </div>

        {/* 三列特征网格 */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          {/* 卡片 1 - 性能 */}
          <div className="bg-white border-[3px] border-black rounded-none p-6 shadow-[6px_6px_0_#000] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-[#FFD400] border-[3px] border-black flex items-center justify-center mb-4">
                <Zap size={20} className="text-black" />
              </div>
              <h3 className="font-sans font-bold text-[1.8vw] text-black mb-2">
                极速交付
              </h3>
              <p className="font-sans text-[max(14px,1.1vw)] leading-relaxed text-[#222222]">
                从想法到上线只需 48 小时。没有冗长的审批流程，没有无意义的会议。
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t-[2px] border-black">
              <div className="w-5 h-5 bg-[#FFD400] border-[2px] border-black flex items-center justify-center">
                <Check size={12} className="text-black" />
              </div>
              <span className="font-sans font-bold text-xs uppercase tracking-wider">10x Faster</span>
            </div>
          </div>

          {/* 卡片 2 - 架构 */}
          <div className="bg-white border-[3px] border-black rounded-none p-6 shadow-[6px_6px_0_#000] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-[#FF5CA8] border-[3px] border-black flex items-center justify-center mb-4">
                <Layers size={20} className="text-white" />
              </div>
              <h3 className="font-sans font-bold text-[1.8vw] text-black mb-2">
                模块化架构
              </h3>
              <p className="font-sans text-[max(14px,1.1vw)] leading-relaxed text-[#222222]">
                每个组件都是独立积木。拼装、替换、扩展——像搭乐高一样构建产品。
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t-[2px] border-black">
              <div className="w-5 h-5 bg-[#FF5CA8] border-[2px] border-black flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
              <span className="font-sans font-bold text-xs uppercase tracking-wider">Plug & Play</span>
            </div>
          </div>

          {/* 卡片 3 - 扩展 */}
          <div className="bg-white border-[3px] border-black rounded-none p-6 shadow-[6px_6px_0_#000] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 bg-[#3A7CFF] border-[3px] border-black flex items-center justify-center mb-4">
                <Rocket size={20} className="text-white" />
              </div>
              <h3 className="font-sans font-bold text-[1.8vw] text-black mb-2">
                无限扩展
              </h3>
              <p className="font-sans text-[max(14px,1.1vw)] leading-relaxed text-[#222222]">
                从 0 到 100 万用户，架构无需重写。水平扩展是我们默认的设计前提。
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-4 border-t-[2px] border-black">
              <div className="w-5 h-5 bg-[#3A7CFF] border-[2px] border-black flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
              <span className="font-sans font-bold text-xs uppercase tracking-wider">Scale Ready</span>
            </div>
          </div>
        </div>

        {/* 底部 CTA */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t-[3px] border-black">
          <span className="font-sans font-bold text-xs text-black uppercase tracking-[0.1em]">
            不做平庸的产品。不做平庸的团队。
          </span>
          <div className="flex items-center gap-2 bg-black text-white px-5 py-2.5 border-[3px] border-black font-bold text-xs uppercase tracking-wider">
            Join Us <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
