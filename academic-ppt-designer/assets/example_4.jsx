import React from 'react';
import { 
  Cpu, 
  Server, 
  Layers, 
  Database, 
  TrendingUp, 
  CheckCircle2, 
  Activity, 
  BarChart3,
  HardDrive
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 16:9 画布容器 */}
      <div className="w-[1280px] h-[720px] bg-white shadow-2xl relative overflow-hidden flex flex-col px-12 py-10">
        
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

        {/* 标题区 - 稍微压缩高度 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 flex items-center gap-3">
            实验设置
          </h1>
          <div className="w-16 h-1 bg-blue-600 mt-2 rounded-full"></div>
        </div>

        {/* 四宫格容器 - 优化间距 */}
        <div className="grid grid-cols-2 gap-6 flex-1 mb-2">
          
          {/* 1. 软硬件环境 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Server size={120} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <HardDrive size={20} className="text-blue-600" /> 软硬件环境
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                   <Activity size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">GPU Accelerator</p>
                  <p className="text-sm font-semibold text-slate-700">NVIDIA Tesla V100S (32GB)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                   <Cpu size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Processor</p>
                  <p className="text-sm font-semibold text-slate-700">Intel Xeon Gold 5218 CPU @ 2.30GHz</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                   <Layers size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Software Stack</p>
                  <p className="text-sm font-semibold text-slate-700">PyTorch 2.5.0 / CUDA 12.2 / Python 3.10</p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 对比基准 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={120} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <CheckCircle2 size={20} className="text-blue-600" /> 对比基准 (Baselines)
            </h3>
            <div className="space-y-2">
              <div className="px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-700 text-sm">Eager Mode</span>
                  <p className="text-[11px] text-slate-500">原生解释执行（性能下限）</p>
                </div>
                <div className="text-slate-300"><Layers size={16} /></div>
              </div>
              <div className="px-4 py-2.5 bg-blue-50 rounded-lg border border-blue-100 flex justify-between items-center">
                <div>
                  <span className="font-bold text-blue-700 text-sm">TorchDynamo</span>
                  <p className="text-[11px] text-blue-500">官方静态捕获前沿（SOTA基准）</p>
                </div>
                <div className="text-blue-300"><TrendingUp size={16} /></div>
              </div>
              <div className="px-4 py-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-700 text-sm">MagPy</span>
                  <p className="text-[11px] text-slate-500">学界先进状态监控修复方案</p>
                </div>
                <div className="text-slate-300"><Layers size={16} /></div>
              </div>
            </div>
          </div>

          {/* 3. 测试基准 (Dataset) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database size={120} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3 border-l-4 border-blue-600 pl-3">
              <Database size={20} className="text-blue-600" /> 测试基准 (Dataset)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                 <p className="text-2xl font-black text-blue-600 leading-none mb-1">1411+</p>
                 <p className="text-xs font-bold text-slate-700">ParityBench 项目库</p>
                 <p className="text-[10px] text-slate-500 mt-0.5">评估大规模泛化能力</p>
              </div>
              <div className="p-3 border border-slate-100 rounded-lg bg-slate-50/50">
                 <p className="text-2xl font-black text-blue-600 leading-none mb-1">7 模型</p>
                 <p className="text-xs font-bold text-slate-700">典型工业代表模型</p>
                 <p className="text-[10px] text-slate-500 mt-0.5">BERT, YOLO, ReFormer等</p>
              </div>
            </div>
          </div>

          {/* 4. 核心评价指标 - 调整为更紧凑的列表 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 text-white">
              <BarChart3 size={120} />
            </div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3 border-l-4 border-blue-400 pl-3">
              <BarChart3 size={20} className="text-blue-400" /> 核心评价指标
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                <div>
                  <span className="text-slate-200 font-bold text-sm">子图个数 (Graph Counts)</span>
                  <p className="text-[11px] text-slate-400 leading-tight">核心痛点：评估计算图碎片化程度</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                <div>
                  <span className="text-slate-200 font-bold text-sm">端到端加速比 (Speedup)</span>
                  <p className="text-[11px] text-slate-400 leading-tight">性能指标：评估实际运行性能收益</p>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></div>
                <div>
                  <span className="text-slate-200 font-bold text-sm">图中断修复率 (Repair Rate)</span>
                  <p className="text-[11px] text-slate-400 leading-tight">算法指标：评估模型泛化与修复能力</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;