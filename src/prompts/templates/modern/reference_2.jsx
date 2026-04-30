import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  BarChart3,
  Globe,
  TrendingUp,
  ShieldAlert,
  SearchCode,
  ArrowUpRight
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-white shadow-xl relative overflow-hidden flex flex-col px-12 py-8 border border-zinc-200">
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-700 via-indigo-500 to-indigo-200"></div>

        {/* 标题区 - 紧凑化 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-4 tracking-tight">
            评估指标三：图中中断修复率 (Repair Rate)
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="w-16 h-1 bg-indigo-600 rounded-full"></div>
            <p className="text-slate-500 font-medium italic text-lg leading-none">
              “基于 ParityBench 大规模基准测试集，验证多粒度机制的泛化性与鲁棒性”
            </p>
          </div>
        </div>

        {/* 内容区：左右布局 */}
        <div className="flex gap-10 flex-1 overflow-hidden">
          
          {/* 左侧：泛化能力数据对比 */}
          <div className="w-[42%] flex flex-col gap-5">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-7 text-white shadow-lg flex-1 flex flex-col relative overflow-hidden">
               {/* 背景装饰 */}
               <div className="absolute -right-10 -bottom-10 opacity-5">
                 <Globe size={180} />
               </div>

               <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-indigo-300">
                 <BarChart3 size={20} /> ParityBench 图中中断修复率对比
               </h3>

               <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                  {/* TorchDynamo */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TorchDynamo (Baseline)</span>
                      <span className="text-xl font-mono font-bold opacity-80">79.80%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                       <div className="bg-slate-500 h-full opacity-60" style={{width: '79.8%'}}></div>
                    </div>
                  </div>

                  {/* MagPy */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">MagPy (SOTA)</span>
                      <span className="text-xl font-mono font-bold opacity-80">81.93%</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                       <div className="bg-slate-400 h-full opacity-60" style={{width: '81.93%'}}></div>
                    </div>
                  </div>

                  {/* 本方法 - 核心高亮 */}
                  <div className="space-y-2 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-300 font-sans">本研究方法 (Ours)</span>
                        <div className="px-2 py-0.5 bg-indigo-500 text-[9px] rounded-sm text-white font-black tracking-tighter">BEST</div>
                      </div>
                      <span className="text-4xl font-mono font-black text-white">93.76%</span>
                    </div>
                    <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-[2px]">
                       <div className="bg-indigo-500 h-full rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]" style={{width: '93.76%'}}></div>
                    </div>
                  </div>
               </div>

               {/* 底部数据面板：已将中位耗时替换为提升 */}
               <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-around text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">测试样本</p>
                    <p className="text-xl font-black text-white">1,411</p>
                  </div>
                  <div className="h-8 w-px bg-white/5"></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">成功修复</p>
                    <p className="text-xl font-black text-indigo-400">1,323</p>
                  </div>
                  <div className="h-8 w-px bg-white/5"></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-tighter">修复提升 (vs SOTA)</p>
                    <div className="flex items-center justify-center gap-1">
                       <p className="text-xl font-black text-green-400">11.83%</p>
                       <ArrowUpRight size={14} className="text-green-400" />
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* 右侧：分析与定性归因 */}
          <div className="w-[58%] flex flex-col gap-4">
            
            {/* 结论评价卡片 */}
            <div className="bg-zinc-50 border border-zinc-200 p-5 rounded-xl relative overflow-hidden">
               <div className="absolute right-4 top-4 text-indigo-100/50"><CheckCircle2 size={36} /></div>
               <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                 修复能力综合评价
               </h3>
               <p className="text-slate-500 text-xs leading-relaxed max-w-[92%] font-medium">
                  实验表明，本研究相比现有 SOTA 方案在<b className="text-indigo-600">图中中断修复率</b>上实现了显著提升。系统能自动化重构大量不规范的 Python 代码模式，显著拓宽了静态图编译的优化边界。
               </p>
            </div>

            {/* 失败案例归因分析 */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 relative flex-1 flex flex-col shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <ShieldAlert className="text-slate-400" size={18} /> 未修复案例定性分析 (N=88)
                  </h3>
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Boundary Analysis</span>
               </div>
               
               <div className="flex gap-8 items-center flex-1">
                  {/* 环形比例图 */}
                  <div className="relative w-36 h-36 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#f4f4f5" strokeWidth="4"></circle>
                      <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="63.64 100"></circle>
                      <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#e2a2a2" strokeWidth="4.5" strokeDasharray="26.14 100" strokeDashoffset="-63.64"></circle>
                      <circle cx="18" cy="18" r="15.9" fill="transparent" stroke="#cbd5e1" strokeWidth="4.5" strokeDasharray="10.23 100" strokeDashoffset="-89.78"></circle>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-2xl font-black text-slate-800">88</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Total Cases</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3.5">
                     <div className="flex items-center gap-4 group">
                        <div className="w-3.5 h-3.5 rounded-sm bg-slate-400"></div>
                        <div className="flex-1 border-b border-zinc-100 pb-1 flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-600">编译器系统错误</span>
                          <span className="text-sm font-black text-slate-500">63.6%</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 group">
                        <div className="w-3.5 h-3.5 rounded-sm bg-[#e2a2a2]"></div>
                        <div className="flex-1 border-b border-zinc-100 pb-1 flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-600">数值结果偏差</span>
                          <span className="text-sm font-black text-rose-300">26.1%</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 group">
                        <div className="w-3.5 h-3.5 rounded-sm bg-slate-200"></div>
                        <div className="flex-1 border-b border-zinc-100 pb-1 flex justify-between items-baseline">
                          <span className="text-xs font-bold text-slate-600">转换过程二次中断</span>
                          <span className="text-sm font-black text-slate-300">10.2%</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* 深层成因 */}
               <div className="mt-5 p-4 bg-zinc-50 border border-zinc-100 rounded-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    <SearchCode size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Deep Insight</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed italic">
                    分析显示：剩余中断主要源于不可静态表示的动态场景，如<b className="text-slate-700">复杂 RNN 循环</b>、<b className="text-slate-700">显式禁用的底层指令</b>或<b className="text-slate-700">张量追踪链的物理断裂</b>。
                  </p>
               </div>
            </div>

            {/* 综合结论 */}
            <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden mt-auto">
               <div className="absolute -right-3 -bottom-3 opacity-10"><Target size={50} /></div>
               <p className="text-[11px] font-medium leading-relaxed opacity-80">
                  <span className="text-indigo-400 font-bold uppercase mr-2 tracking-tighter">Research Insight:</span>
                  本系统在显著拓宽修复边界的同时，也触及了动态语言编译的“硬核物理极限”。多粒度分析在平衡修复能力与语义一致性方面表现卓越。
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;