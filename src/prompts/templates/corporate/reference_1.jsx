import React from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Target,
  ArrowUpRight,
  BarChart3,
  Briefcase,
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-white relative overflow-hidden flex flex-col">

        {/* 顶部海军蓝导航条 */}
        <div className="bg-[#0A2540] flex items-center justify-between px-12 py-4">
          <div className="flex items-center gap-3">
            <Briefcase size={20} className="text-white" />
            <span className="text-white font-semibold text-sm tracking-wide">ACME Corp</span>
          </div>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#8898AA]">
            Q3 2025 · 业绩回顾
          </span>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col px-12 py-8">

          {/* 标题区 */}
          <div className="mb-8">
            <h1 className="text-[3.5vw] font-bold text-[#0A2540] leading-tight mb-3">
              Q3 业绩回顾
            </h1>
            <div className="flex items-center gap-4">
              <div className="w-12 h-0.5 bg-[#0A2540] rounded-full"></div>
              <p className="text-[1.2vw] text-[#425466] leading-relaxed">
                核心业务指标全面达标，营收同比增长 23%
              </p>
            </div>
          </div>

          {/* KPI 指标卡片 - 2 列布局 */}
          <div className="grid grid-cols-2 gap-5 flex-1">
            {/* 营收卡片 */}
            <div className="bg-white border border-[rgba(10,37,64,0.12)] rounded-md p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={16} className="text-blue-700" />
                  <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-[#8898AA]">
                    季度营收
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[#0A2540]">¥4.8亿</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <ArrowUpRight size={14} />
                    +23%
                  </span>
                </div>
              </div>
              <div className="mt-4 h-16 flex items-end gap-2">
                {[
                  { h: '40%', label: 'Q1' },
                  { h: '55%', label: 'Q2' },
                  { h: '70%', label: 'Q3' },
                  { h: '85%', label: 'Q4T' },
                ].map((bar) => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-blue-700 rounded-t-sm"
                      style={{ height: bar.h }}
                    ></div>
                    <span className="text-[10px] text-[#8898AA] font-mono">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 增长率卡片 */}
            <div className="bg-white border border-[rgba(10,37,64,0.12)] rounded-md p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-blue-700" />
                  <span className="font-semibold text-[11px] tracking-[0.14em] uppercase text-[#8898AA]">
                    同比增长率
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-[#0A2540]">23.6%</span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-emerald-600">
                    <ArrowUpRight size={14} />
                    +5.2pp
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-[#F5F7FA] rounded-md p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8898AA] mb-1">目标</p>
                  <p className="text-lg font-bold text-[#0A2540]">20%</p>
                </div>
                <div className="bg-[#F5F7FA] rounded-md p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8898AA] mb-1">达成率</p>
                  <p className="text-lg font-bold text-blue-700">118%</p>
                </div>
              </div>
            </div>
          </div>

          {/* 底部状态行 */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[rgba(10,37,64,0.12)]">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-[#8898AA]" />
                <span className="text-xs text-[#425466]">活跃客户 1,240 家</span>
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-[#8898AA]" />
                <span className="text-xs text-[#425466]">续费率 96.2%</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-[#8898AA]" />
                <span className="text-xs text-[#425466]">毛利润 68.5%</span>
              </div>
            </div>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-[#8898AA]">
              数据截止 2025.09.30
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
