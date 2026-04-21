import React from 'react';
import { Activity, CheckCircle, Cpu, ShieldCheck } from 'lucide-react';

export const DEFAULT_CODE = `import React from 'react';
import { Activity, CheckCircle, Cpu, ShieldCheck } from 'lucide-react';

/**
 * Slide Component
 * This is the code that will be rendered as a PPT slide.
 */
const MySlide = () => {
  return (
    <div className="w-full h-full bg-white text-slate-900 font-sans p-12 flex flex-col border border-slate-200 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 bottom-0 left-[33.33%] w-[1px] bg-slate-50 z-0" />
      <div className="absolute top-0 bottom-0 left-[66.66%] w-[1px] bg-slate-50 z-0" />
      
      {/* Header */}
      <div className="flex justify-between items-end mb-16 relative z-10">
        <div className="border-l-4 border-indigo-600 pl-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            系统核心模块验证程序 <span className="text-slate-400 font-light ml-2">V1.0</span>
          </h1>
          <p className="text-indigo-600 font-medium tracking-widest uppercase text-xs mt-2">
            System Core Logic Verification Report
          </p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 shadow-sm transition-all duration-300">
          <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></div>
          <span className="text-indigo-900 font-bold text-sm tracking-wide uppercase">Running / 运行中</span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-10 flex-grow relative z-10">
        
        {/* Card 1 */}
        <div className="bg-white border border-slate-100 rounded-[32px] p-10 flex flex-col justify-between shadow-xl shadow-slate-200/50">
          <div className="text-indigo-600 opacity-80">
            <Cpu size={48} />
          </div>
          <div className="mt-4">
            <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">资源占用率</span>
            <div className="mt-2 flex items-baseline">
              <span className="text-7xl font-bold font-mono text-slate-900">12.5</span>
              <span className="text-2xl text-slate-400 font-mono ml-2">%</span>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900 rounded-[32px] p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="text-emerald-400">
            <CheckCircle size={48} />
          </div>
          <div>
            <span className="text-slate-400 text-sm font-semibold uppercase tracking-wider">逻辑覆盖率</span>
            <div className="mt-2 flex items-baseline text-white">
              <span className="text-7xl font-bold font-mono">99.8</span>
              <span className="text-2xl text-emerald-400 font-mono ml-2">%</span>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] p-10 flex flex-col justify-center text-center items-center">
          <h3 className="text-slate-800 font-bold text-2xl mb-6">验证结论</h3>
          <p className="text-slate-600 text-lg leading-relaxed px-4">
            当前系统在 T_idle 状态下表现稳定，符合预期偏差范围。
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 flex justify-between items-center text-[10px] font-mono text-slate-400 tracking-[0.2em] border-t border-slate-100 pt-8 relative z-10">
        <div>VERIFICATION_ID: TEST_720P_STABLE</div>
        <div>2024-04-21 01:09 AM CST</div>
      </footer>
    </div>
  );
};

export default MySlide;`;
