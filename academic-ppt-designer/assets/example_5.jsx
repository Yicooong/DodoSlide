import React from 'react';
import { ArrowRightLeft, GitFork, Printer, Globe, Code2, Cpu, Brain, Zap, ArrowRight } from 'lucide-react';

const App = () => {
  const mappingData = [
    {
      level: "L1",
      layer: "源码层 / LLM 协同",
      cause: "跨语义边界与非透明调用",
      mechanism: "NumPy 等第三方库黑盒、强制标量化导致符号追踪链路断裂",
      solution: "语义级代码平替、元函数注册或元数据延迟求值",
      color: "blue",
      icon: <Brain className="text-blue-600" size={24} />
    },
    {
      level: "L2",
      layer: "AST 层结构化重构",
      cause: "数据依赖控制流",
      mechanism: "运行时分支走向依赖张量数值，导致符号追踪无法预知路径",
      solution: "利用 torch.cond 高阶算子进行结构化控制流重写",
      color: "sky",
      icon: <GitFork className="text-sky-600" size={24} />
    },
    {
      level: "L3",
      layer: "字节码层指令剥离",
      cause: "I/O 操作与副作用",
      mechanism: "非计算核心的 print 或日志操作强制 CPU/GPU 同步，拖累性能",
      solution: "移除相关 Opcode 并重新校正跳转偏移量，实现非侵入式清理",
      color: "slate",
      icon: <Cpu className="text-slate-600" size={24} />
    }
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-[1280px] h-[720px] bg-white shadow-2xl relative overflow-hidden flex flex-col p-12">
        {/* 顶部装饰 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-900 to-sky-400"></div>

        {/* 标题区 */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-4">
            为什么要分三层：图中断的异质性与映射
          </h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="w-20 h-1.5 bg-blue-600 rounded-full"></div>
            <p className="text-slate-500 font-medium italic">“单一规则难以兼顾机制差异，必须针对成因精准施策”</p>
          </div>
        </div>

        {/* 映射内容区 */}
        <div className="flex-1 flex flex-col gap-6 justify-center">
          {mappingData.map((item, index) => (
            <div key={index} className="flex items-stretch group">
              
              {/* 左侧：中断成因 */}
              <div className="w-[38%] bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm group-hover:border-blue-200 transition-all">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-xl group-hover:bg-blue-50 transition-colors">
                    {item.cause.includes('控制流') ? <GitFork size={24} className="text-slate-600" /> : 
                     item.cause.includes('I/O') ? <Printer size={24} className="text-slate-600" /> : 
                     <Globe size={24} className="text-slate-600" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{item.cause}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.mechanism}</p>
                  </div>
                </div>
              </div>

              {/* 中间：映射关系 */}
              <div className="flex flex-col items-center justify-center px-6">
                <div className="flex items-center gap-1 text-blue-400 group-hover:text-blue-600 transition-colors">
                  <div className="h-px w-8 bg-current"></div>
                  <ArrowRight size={20} />
                  <div className="h-px w-8 bg-current"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-2 tracking-widest uppercase">对症下药</span>
              </div>

              {/* 右侧：修复层级 */}
              <div className={`w-[48%] rounded-2xl p-6 shadow-lg border relative flex items-center gap-6 
                ${item.color === 'blue' ? 'bg-blue-600 border-blue-700 text-white' : 
                  item.color === 'sky' ? 'bg-sky-500 border-sky-600 text-white' : 
                  'bg-slate-800 border-slate-900 text-white'}`}>
                
                <div className="absolute -top-3 left-6 bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-black shadow-md">
                  {item.level} 修复层
                </div>

                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  {React.cloneElement(item.icon, { className: 'text-white' })}
                </div>

                <div className="flex-1">
                  <h4 className="text-xl font-bold mb-2">{item.layer}</h4>
                  <div className="bg-white/10 rounded-lg p-3 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Zap size={14} className="text-yellow-300" />
                      <span className="text-xs font-bold uppercase tracking-wider opacity-80">典型技术方案</span>
                    </div>
                    <p className="text-sm font-medium">{item.solution}</p>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* 底部总结栏 */}
        <div className="mt-8 bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-blue-600">核心逻辑：</span> 
            根源高度异质，单一规则容易拖累系统性能。我们根据底层机制的差异化，实现了“三层映射”优化体系。
          </p>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-blue-600"></div> 语义修复
             </div>
             <div className="flex items-center gap-2 text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-sky-500"></div> 结构重写
             </div>
             <div className="flex items-center gap-2 text-xs text-slate-400">
               <div className="w-2 h-2 rounded-full bg-slate-800"></div> 指令优化
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default App;