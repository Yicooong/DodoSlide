import React from 'react';
import { TrendingUp, Target, Users, BarChart3, ArrowUpRight } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 专业商务 Executive Cover + KPI — 高管封面 */}
      <div className="w-[1280px] h-[720px] bg-white relative overflow-hidden flex flex-col p-20">

        {/* 顶部元数据行 */}
        <div className="flex items-center justify-between mb-12">
          <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-[#1E3A5F]">
            Strategic Review
          </span>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-slate-400">
            Confidential · Q1 2026
          </span>
        </div>

        {/* 标题区 */}
        <div className="mb-6">
          <div className="w-16 h-1 bg-[#1E3A5F] mb-6" />
          <h1 className="font-bold text-[7vw] leading-[0.9] text-[#1E3A5F] mb-4">
            Growth
            <br />
            Strategy
          </h1>
          <p className="font-normal text-[1.5vw] leading-relaxed text-slate-600 max-w-[50vw]">
            核心业务持续增长，新兴市场加速布局，利润率稳步提升。
          </p>
        </div>

        {/* KPI 卡片网格 */}
        <div className="grid grid-cols-4 gap-5 mt-auto">
          {/* KPI 1 */}
          <div className="border-l-4 border-[#1E3A5F] pl-5 py-4 bg-slate-50 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#1E3A5F]" />
              <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-[#1E3A5F]">Revenue</span>
            </div>
            <p className="font-bold text-[2.5vw] text-[#1E3A5F] leading-none">¥4.8<span className="text-lg">亿</span></p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">+23.6%</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="border-l-4 border-blue-500 pl-5 py-4 bg-slate-50 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-blue-500">Clients</span>
            </div>
            <p className="font-bold text-[2.5vw] text-[#1E3A5F] leading-none">1,240</p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">+18.2%</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="border-l-4 border-[#1E3A5F] pl-5 py-4 bg-slate-50 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#1E3A5F]" />
              <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-[#1E3A5F]">Win Rate</span>
            </div>
            <p className="font-bold text-[2.5vw] text-[#1E3A5F] leading-none">67<span className="text-lg">%</span></p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">+5.1pp</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="border-l-4 border-blue-500 pl-5 py-4 bg-slate-50 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-blue-500">Margin</span>
            </div>
            <p className="font-bold text-[2.5vw] text-[#1E3A5F] leading-none">32<span className="text-lg">%</span></p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-green-600" />
              <span className="text-xs font-semibold text-green-600">+3.8pp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
