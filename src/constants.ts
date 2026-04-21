import React from 'react';
import { Activity, CheckCircle, Cpu, ShieldCheck } from 'lucide-react';

export const DEFAULT_CODE = `

import React from 'react';
import { Cpu, Layers, Zap, Database, BarChart3, Binary, ArrowRight, Activity } from 'lucide-react';

const App = () => {
  // 研究进展数据定义
  const progressItems = [
    { label: '并行化', title: '异构并行', desc: 'C/C++ 代码接入', icon: <Zap size={20} /> },
    { label: '重构', title: '降级方案', desc: 'CUDA 功能拓展', icon: <Layers size={20} /> },
    { label: '资产', title: '模型库', desc: '芯片栈优化复用', icon: <Database size={20} /> },
    { label: '前沿', title: '布局优化', desc: '数据布局调研', icon: <BarChart3 size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
      {/* 16:9 画布: 1280x720 */}
      <div className="relative w-[1280px] h-[720px] bg-[#F8FAFC] shadow-2xl overflow-hidden rounded-sm ring-1 ring-slate-300 flex flex-col p-10">
        
        {/* 顶部标题栏 */}
        <header className="flex justify-between items-end border-b-2 border-slate-200 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-[#4F46E5] text-white p-1.5 rounded">
                <Binary size={24} />
              </div>
              <span className="text-sm font-mono font-bold text-[#4F46E5] tracking-widest uppercase">NKCT Compiler Lab</span>
            </div>
            <h1 className="text-4xl font-bold text-[#0F172A] tracking-tight">
              NKCT AI 编译器：跨平台高性能代码生成研究概览
            </h1>
          </div>
          <div className="text-right">
            <p className="text-slate-500 font-mono text-sm">2024 ACADEMIC YEAR REPORT</p>
            <p className="text-indigo-600 font-bold uppercase tracking-tighter">Status: Phase 2 Exploration</p>
          </div>
        </header>

        {/* 主体布局: 三栏网格 */}
        <main className="flex-1 grid grid-cols-12 gap-6">
          
          {/* 左侧栏: 背景与挑战 (占 3 列) */}
          <section className="col-span-3 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" /> 研究背景与挑战
              </h3>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg border-l-4 border-slate-900">
                  <p className="text-xs font-mono text-slate-400 mb-1">CHALLENGE 01</p>
                  <p className="text-sm font-bold text-slate-800">硬件爆发式增长</p>
                  <p className="text-xs text-slate-500 mt-1">软件适配效率落后于 AI 专用加速芯片的发展速度。</p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-[#4F46E5]">
                  <p className="text-xs font-mono text-indigo-400 mb-1">CHALLENGE 02</p>
                  <p className="text-sm font-bold text-indigo-900">生态碎片化痛点</p>
                  <p className="text-xs text-indigo-700/70 mt-1">厂商移植成本骤增，维护难度随硬件规模指数级上升。</p>
                </div>
                <div className="border border-indigo-200 p-4 rounded-lg border-l-4 border-indigo-600">
                  <p className="text-xs font-mono text-indigo-600 mb-1">OBJECTIVE</p>
                  <p className="text-sm font-bold text-slate-900">高性能与可移植性</p>
                  <p className="text-xs text-slate-500 mt-1">在保证极致执行效率的同时，实现跨平台的无缝适配。</p>
                </div>
              </div>
            </div>
          </section>

          {/* 中间栏: 架构与技术流 (占 5 列) */}
          <section className="col-span-5 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Cpu size={16} className="text-indigo-600" /> NKCT 核心技术架构 (Pipeline)
              </h3>
              
              <div className="flex-1 flex flex-col justify-around py-4 relative">
                {/* 流程线条 */}
                <div className="absolute left-[31px] top-10 bottom-10 w-0.5 bg-slate-100"></div>
                
                {[
                  { label: 'Source', title: '原生 CUDA 程序', status: 'slate' },
                  { label: 'Transform', title: 'NK Dialect 转换层 (中间表示)', status: 'indigo' },
                  { label: 'Gen', title: 'Triton IR 编译后端', status: 'indigo' },
                  { label: 'Exec', title: '目标芯片优化代码/二进制', status: 'green' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-6 relative z-10">
                    <div className={\`w-16 h-16 rounded-full flex items-center justify-center border-4 shrink-0 shadow-sm
                      \${step.status === 'indigo' ? 'bg-[#4F46E5] border-indigo-100 text-white' : 
                        step.status === 'green' ? 'bg-[#5B8054] border-green-100 text-white' : 
                        'bg-white border-slate-100 text-slate-400'}\`}>
                      <span className="font-mono font-bold text-lg">{idx + 1}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase leading-none mb-1">{step.label}</span>
                      <span className={\`font-bold \${step.status === 'indigo' ? 'text-[#4F46E5]' : 'text-slate-800'}\`}>{step.title}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-4 bg-slate-900 rounded-lg">
                <p className="text-xs text-slate-400 leading-relaxed italic font-serif">
                  "通过定义多层次、可扩展的 NK Dialect，将计算图逐步转化为高效、可移植的底层代码。"
                </p>
              </div>
            </div>
          </section>

          {/* 右侧栏: 本期工作进展 (占 4 列) */}
          <section className="col-span-4 flex flex-col gap-4">
            <div className="bg-[#0F172A] p-6 rounded-xl shadow-lg flex-1 flex flex-col">
              <h3 className="text-sm font-bold text-indigo-400 mb-6 flex items-center gap-2">
                <BarChart3 size={16} /> 本学期探索性工作总结
              </h3>
              
              <div className="grid grid-cols-2 gap-3 mb-8">
                {progressItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg text-center transition-all hover:bg-slate-800">
                    <div className="text-indigo-400 mb-2 flex justify-center">{item.icon}</div>
                    <div className="text-lg font-bold text-white font-mono tracking-tighter">{item.title}</div>
                    <div className="text-[10px] text-slate-400 uppercase mt-1 tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex-1 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">归因与分析</h4>
                {[
                  "接入异构并行化，提升跨平台调度效率。",
                  "完成 CUDA 代码降级方案重构，增强通用性。",
                  "构建芯片模型库，实现优化栈复用。",
                  "完成数据布局优化调研，为性能调优奠基。"
                ].map((text, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0 group-hover:scale-125 transition-transform"></div>
                    <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        {/* 底部装饰与版权 */}
        <footer className="mt-8 flex justify-between items-center opacity-40">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
            <span className="text-[10px] font-mono font-bold text-slate-900 uppercase tracking-tighter">Academic Research Internal Use Only</span>
          </div>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-[10px] font-mono">
               <span className="w-2 h-2 rounded-full bg-[#5B8054]"></span> SYSTEM STABLE
             </div>
             <div className="flex items-center gap-2 text-[10px] font-mono">
               <span className="w-2 h-2 rounded-full bg-[#4F46E5]"></span> COMPILER ACTIVE
             </div>
          </div>
        </footer>

      </div>
    </div>
  );
};

export default App;

`;
