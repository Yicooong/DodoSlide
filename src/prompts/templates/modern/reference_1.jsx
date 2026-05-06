import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  Activity, 
  Cpu, 
  BarChart3,
  Maximize2,
  Info,
  AlertCircle
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-white shadow-2xl relative overflow-hidden flex flex-col px-12 py-8">
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

        {/* 标题区 - 紧凑布局 */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-4">
            评估指标二：端到端加速比 (Speedup Ratio)
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
            <p className="text-slate-500 font-medium italic text-base">
              “完整图转换通过消除同步开销，深度释放后端编译器的算子融合潜力”
            </p>
          </div>
        </div>

        {/* 内容区：左右布局 */}
        <div className="flex gap-8 flex-1 overflow-hidden">
          
          {/* 左侧：性能数据展示区 */}
          <div className="w-[55%] flex flex-col gap-5">
            
            {/* 核心加速指标卡片 - 高度压缩 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <TrendingUp size={100} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">VS. 原生 Eager 模式</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800">1.62</span>
                  <span className="text-xl font-bold text-slate-400">×</span>
                </div>
                <p className="text-xs font-bold text-slate-600">最高推理加速 (平均 1.27×)</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Zap size={100} className="text-blue-600" />
                </div>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">VS. 官方 TorchDynamo</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-blue-600">2.39</span>
                  <span className="text-xl font-bold text-blue-300">×</span>
                </div>
                <p className="text-xs font-bold text-blue-800">最高推理加速 (平均 1.14×)</p>
              </div>
            </div>

            {/* 性能趋势简图说明 - 优化柱状图高度 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex-1 flex flex-col">
              <h4 className="text-sm font-bold text-slate-400 mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> 代表性模型端到端推理性能对比
              </h4>
              <div className="flex-1 flex items-end justify-between px-8 pb-4">
                 <Bar label="Eager" val={1.0} color="bg-slate-300" />
                 <Bar label="MagPy" val={1.09} color="bg-slate-400" />
                 <Bar label="Dynamo" val={1.62} color="bg-slate-500" />
                 <Bar label="Ours" val={2.39} color="bg-blue-600" highlight />
              </div>
            </div>
          </div>

          {/* 右侧：指标定义与机理分析 */}
          <div className="w-[45%] flex flex-col gap-4 overflow-hidden">
            
            {/* 指标定义与公式卡片 - 扁平化处理 */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white relative shadow-lg">
               <div className="flex items-center gap-2 mb-3 text-blue-400">
                  <Info size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">指标定义与计算公式</span>
               </div>
               
               {/* 视觉公式组件 - 压缩垂直空间 */}
               <div className="bg-white/10 rounded-xl p-4 flex justify-center items-center border border-white/10 mb-3 select-none">
                  <div className="flex items-center font-serif text-xl italic">
                    <span className="mr-3 text-blue-300 font-bold not-italic">Speedup</span>
                    <span className="mr-3 text-slate-400 not-italic">=</span>
                    <div className="flex flex-col items-center">
                      <span className="px-3 pb-1 text-base">T <sub className="text-[10px] not-italic opacity-70">baseline</sub></span>
                      <div className="w-full h-[1.5px] bg-slate-400 rounded-full"></div>
                      <span className="px-3 pt-1 text-base">T <sub className="text-[10px] not-italic opacity-70">optimized</sub></span>
                    </div>
                  </div>
               </div>

               <p className="text-[11px] text-slate-300 leading-relaxed">
                  通过衡量基准方法与本研究方法在全流程中的时间消耗比值，直观反映<b className="text-white">图中断减少</b>带来的效率提升。
               </p>
            </div>

            {/* 核心价值点列表 - 紧凑展示 */}
            <div className="flex-1 flex flex-col gap-3">
               <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-xl border-l-4 border-blue-600">
                  <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Activity className="text-blue-600" size={16} /> 减少系统性同步开销
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    大幅降低碎片化调度引发的频繁上下文切换及昂贵的主机/设备（CPU/GPU）同步成本。
                  </p>
               </div>

               <div className="bg-white border border-slate-100 shadow-sm p-4 rounded-xl border-l-4 border-blue-600">
                  <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Cpu className="text-blue-600" size={16} /> 释放后端全局优化空间
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    完整的计算图结构使后端能够实施深层次算子融合与显存优化，从而获得显著性能改进。
                  </p>
               </div>

               <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-auto">
                  <div className="flex items-center gap-2 mb-1">
                    <Maximize2 size={16} className="text-blue-600" />
                    <span className="text-[11px] font-bold text-blue-800 uppercase tracking-tighter">研究结论</span>
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                    Speedup 值的增大验证了多粒度捕获机制的优越性：在实现语义一致性的同时，兼顾了极致的执行性能。
                  </p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// 内部小组件：简约柱状图 - 调整高度系数以适应 16:9
const Bar = ({ label, val, color, highlight }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className="text-[10px] font-black text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {val}×
    </div>
    <div 
      className={`w-10 ${color} rounded-t-md shadow-sm transition-all group-hover:brightness-110`} 
      style={{ height: `${val * 65}px` }}
    >
      {highlight && <div className="w-full h-1 bg-white/30"></div>}
    </div>
    <span className={`text-[10px] font-bold ${highlight ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
  </div>
);

export default App;