import React from 'react';
import { 
  AlertCircle, 
  Trophy, 
  Activity, 
  Zap,
  Target
} from 'lucide-react';

const App = () => {
  const tableData = [
    { model: "Quantized", dynamo: "33", magpy: "1", ours: "1" },
    { model: "MaNet", dynamo: "9", magpy: "1", ours: "1" },
    { model: "YoloV5", dynamo: "12", magpy: "1", ours: "1" },
    { model: "TridentNet", dynamo: "25", magpy: "1", ours: "1" },
    { model: "MonoDepth", dynamo: "32", magpy: "1", ours: "1" },
    { model: "Bert", dynamo: "1", magpy: "1", ours: "1" },
    { model: "ReFormer", dynamo: "6", magpy: "Error", ours: "4", highlight: true },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-white shadow-2xl relative overflow-hidden flex flex-col px-12 py-10">
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

        {/* 标题区 */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-4">
            评估指标一：中断子图个数 (Graph Counts)
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-16 h-1 bg-blue-600 rounded-full"></div>
            <p className="text-slate-500 font-medium italic text-base">
              “子图数量越少，代表图中断越少，计算图越完整，优化空间越大”
            </p>
          </div>
        </div>

        {/* 内容区：左右布局 */}
        <div className="flex gap-10 flex-1 overflow-hidden">
          
          {/* 左侧：数据对比表格 - 移除标题栏，采用现代感透视设计 */}
          <div className="w-[58%] flex flex-col">
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200">
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-wider">测试模型</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-wider">TorchDynamo</th>
                    <th className="px-6 py-4 text-slate-500 font-bold text-xs uppercase tracking-wider">MagPy (SOTA)</th>
                    <th className="px-6 py-4 text-blue-700 font-black text-xs uppercase tracking-wider bg-blue-50/50">本研究 (Ours)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-white transition-colors ${row.highlight ? 'bg-amber-50/40' : ''}`}>
                      <td className="px-6 py-3 font-bold text-slate-700 text-sm">{row.model}</td>
                      <td className="px-6 py-3 text-slate-400 font-mono text-sm">{row.dynamo}</td>
                      <td className={`px-6 py-3 font-mono text-sm ${row.magpy === 'Error' ? 'text-red-500 font-bold italic' : 'text-slate-400'}`}>
                        {row.magpy}
                      </td>
                      <td className="px-6 py-3 font-black text-blue-600 bg-blue-50/30 font-mono text-lg">
                        {row.ours}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 表格下方补充说明 */}
            <div className="mt-4 flex items-center gap-2 text-slate-400">
               <Target size={14} />
               <p className="text-[11px] font-medium">注：除 ReFormer 特殊拓扑外，本研究均实现了全图捕获（子图数为1）。</p>
            </div>
          </div>

          {/* 右侧：结果深度分析 */}
          <div className="w-[42%] flex flex-col gap-5">
            
            {/* 结论卡片 1 */}
            <div className="bg-white border-l-4 border-blue-600 shadow-sm p-6 rounded-r-xl border border-slate-100 relative overflow-hidden group">
              <div className="absolute -right-2 -bottom-2 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Trophy size={80} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Trophy className="text-blue-600" size={20} /> 卓越的全图捕获率
              </h3>
              <p className="text-slate-600 leading-relaxed text-xs">
                原生系统在处理动态特性时子图碎片化严重。本方法通过多粒度修复机制，在大多数模型中实现了 <b className="text-blue-600">1个子图</b> 的连续捕获，为后端编译器释放了极致的融合空间。
              </p>
            </div>

            {/* 结论卡片 2 */}
            <div className="bg-red-50 border-l-4 border-red-500 shadow-sm p-6 rounded-r-xl border border-red-100">
              <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} /> 领先的系统鲁棒性对比
              </h3>
              <p className="text-red-900/80 leading-relaxed text-[11px] mb-3">
                针对包含复杂嵌套逻辑的 <b className="text-red-700">ReFormer</b> 模型：
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white/60 p-2 rounded-lg border border-red-200">
                   <span className="text-[11px] font-bold text-slate-600">MagPy (SOTA)</span>
                   <span className="text-[11px] font-black text-red-600 px-2 py-0.5 bg-red-100 rounded">运行异常 (Error)</span>
                </div>
                <div className="flex items-center justify-between bg-blue-600 p-2 rounded-lg shadow-sm">
                   <span className="text-[11px] font-bold text-white">本研究方案</span>
                   <span className="text-[11px] font-black text-blue-600 px-2 py-0.5 bg-white rounded">稳定运行 (4 Subgraphs)</span>
                </div>
              </div>
            </div>

            {/* 核心结论 */}
            <div className="mt-auto bg-slate-900 rounded-xl p-5 text-white relative overflow-hidden">
               <div className="absolute -right-3 -bottom-3 opacity-10"><Activity size={60} /></div>
               <div className="flex items-center gap-2 mb-1.5">
                 <Zap size={14} className="text-blue-400" />
                 <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">结论与启示</span>
               </div>
               <p className="text-[11px] font-medium leading-relaxed opacity-80">
                  实验结果表明，本研究不仅有效消除了子图碎片化，更在处理极端复杂模型时表现出极强的系统稳健性，弥补了现有 SOTA 方案在兼容性方面的短板。
               </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;