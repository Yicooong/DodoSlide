import React from 'react';
import { Clock, Code2, Star, Download, Globe, GitCommitHorizontal } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 杂志风 Big Numbers Grid — 数据大字报 */}
      <div className="w-[1280px] h-[720px] bg-[#F1EFEA] text-[#0A0A0B] relative overflow-hidden flex flex-col px-12 py-8">

        {/* Chrome 页眉 */}
        <div className="flex justify-between items-center mb-8 font-mono text-[0.88vw] tracking-[0.16em] uppercase opacity-40">
          <span>过去 64 天 · 开发篇</span>
          <span>Act I · 02 / 25</span>
        </div>

        {/* 标题区 */}
        <div className="mb-6">
          <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#737373] block mb-2">
            一个人，做了什么。
          </span>
          <h2 className="font-serif text-[6.2vw] font-bold leading-tight">
            过去 64 天
          </h2>
          <p className="font-serif text-[1.9vw] font-normal leading-relaxed text-[#737373] mt-2">
            从 0 到开源 CodePilot。
          </p>
        </div>

        {/* 3×2 数据卡片网格 */}
        <div className="grid grid-cols-3 gap-6 flex-1">
          <StatCard icon={<Clock size={18} />} label="Duration" number="64" unit="天" note="从 0 到现在" />
          <StatCard icon={<Code2 size={18} />} label="Lines of Code" number="110K+" note="一行行写到 11 万+" />
          <StatCard icon={<Star size={18} />} label="GitHub Stars" number="5,166" note="一个开源仓库" />
          <StatCard icon={<Download size={18} />} label="Downloads" number="41K+" note="装到了几万台电脑里" />
          <StatCard icon={<Globe size={18} />} label="AI Providers" number="19" note="跨平台接入" />
          <StatCard icon={<GitCommitHorizontal size={18} />} label="Commits" number="608+" note="没有协作者" />
        </div>

        {/* Ghost 装饰背景字 */}
        <div className="absolute font-serif text-[34vw] font-black opacity-[0.04] pointer-events-none select-none -right-6 -bottom-16">
          DATA
        </div>

        {/* Foot 页脚 */}
        <div className="flex justify-between items-center mt-4 font-mono text-[0.88vw] tracking-[0.16em] uppercase opacity-30">
          <span>项目 · CodePilot | github.com/codepilot</span>
          <span>Act I · Dev Numbers</span>
        </div>
      </div>
    </div>
  );
};

// Stat 数据卡片组件
const StatCard = ({ icon, label, number, unit, note }) => (
  <div className="bg-[#E8E5DE] rounded-none p-5 flex flex-col gap-1">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[#737373]">{icon}</span>
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#737373]">{label}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="font-serif text-[2.8vw] font-extrabold text-[#0A0A0B]">{number}</span>
      {unit && <span className="font-serif text-sm opacity-50">{unit}</span>}
    </div>
    <span className="font-sans text-xs text-[#737373]">{note}</span>
  </div>
);

export default App;
