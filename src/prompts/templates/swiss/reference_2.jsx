import React from 'react';
import { TrendingUp, Users, Activity, Target, ArrowUpRight } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 瑞士风 KPI Tower — 数据塔 + 右侧分析 */}
      <div className="w-[1280px] h-[720px] bg-[#FAFAF8] text-[#0A0A0A] relative overflow-hidden flex flex-col px-12 py-8">

        {/* Chrome 页眉 */}
        <div className="flex justify-between items-center mb-6 font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-[#737373]">
          <span>Q1 Performance · Metrics</span>
          <span>03 / 12</span>
        </div>

        {/* 标题区 */}
        <div className="mb-8">
          <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#737373] block mb-2">
            Key Results
          </span>
          <h2 className="font-thin text-[min(7vw,12vh)] leading-[0.9] tracking-[-0.04em]">
            Quarterly
            <br />
            Performance
          </h2>
        </div>

        {/* 主内容区：左 KPI Tower + 右分析卡片 */}
        <div className="grid grid-cols-12 gap-6 flex-1">

          {/* 左侧：KPI Tower — 4 个指标纵向堆叠 */}
          <div className="col-span-5 flex flex-col gap-4">
            <KPITower
              label="Revenue"
              value="$4.2M"
              change="+23%"
              barWidth="78%"
              icon={<TrendingUp size={16} />}
            />
            <KPITower
              label="Active Users"
              value="128K"
              change="+41%"
              barWidth="92%"
              icon={<Users size={16} />}
            />
            <KPITower
              label="Retention"
              value="87%"
              change="+5%"
              barWidth="87%"
              icon={<Activity size={16} />}
            />
            <KPITower
              label="NPS Score"
              value="72"
              change="+12"
              barWidth="72%"
              icon={<Target size={16} />}
            />
          </div>

          {/* 右侧：分析卡片 */}
          <div className="col-span-7 flex flex-col gap-4">
            {/* Ink 黑底反转卡 */}
            <div className="bg-[#0A0A0A] text-[#FAFAF8] p-6 flex-1">
              <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase opacity-50 block mb-3">
                Highlight
              </span>
              <p className="font-light text-[2.6vw] leading-[1.1] mb-4">
                User growth exceeded target by <span className="font-normal">2.3×</span>
              </p>
              <p className="font-normal text-[max(13px,1.05vw)] opacity-60 leading-relaxed">
                The combination of improved onboarding flow and referral program drove organic acquisition beyond all projections.
              </p>
            </div>

            {/* 底部两个小卡片 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#F0F0EE] p-5">
                <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#737373] block mb-2">
                  Conversion
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-[2.5vw]">3.4%</span>
                  <span className="font-mono text-xs text-[#002FA7] flex items-center gap-1">
                    <ArrowUpRight size={12} /> +0.8%
                  </span>
                </div>
              </div>
              <div className="bg-[#F0F0EE] p-5">
                <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#737373] block mb-2">
                  Avg. Session
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-extrabold text-[2.5vw]">4m 32s</span>
                  <span className="font-mono text-xs text-[#002FA7] flex items-center gap-1">
                    <ArrowUpRight size={12} /> +18%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 发丝线分隔 */}
        <div className="border-t border-[#D4D4D2] mt-4 pt-4">
          <div className="flex justify-between items-center font-mono text-[11px] font-medium tracking-[0.16em] uppercase text-[#737373]">
            <span>FY2026 · Q1 Report</span>
            <span>Data as of March 31</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// KPI Tower 组件
const KPITower = ({ label, value, change, barWidth, icon }) => (
  <div className="flex items-center gap-4">
    <div className="text-[#737373]">{icon}</div>
    <div className="flex-1">
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-[#737373]">{label}</span>
        <span className="font-mono text-xs text-[#002FA7]">{change}</span>
      </div>
      <span className="font-extrabold text-[2.2vw] leading-none block mb-2">{value}</span>
      <div className="w-full h-2 bg-[#F0F0EE]">
        <div className="h-full bg-[#002FA7]" style={{ width: barWidth }} />
      </div>
    </div>
  </div>
);

export default App;
