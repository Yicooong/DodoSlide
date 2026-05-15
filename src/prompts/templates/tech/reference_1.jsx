import React from 'react';
import { Cpu, Database, Shield, Zap, Activity } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-200 p-2">
      {/* 科技暗黑 Neon Cover — 霓虹封面 + 数据仪表盘 */}
      <div className="w-[1280px] h-[720px] bg-[#0F172A] relative overflow-hidden flex flex-col p-16">

        {/* 背景光晕 */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3B82F6] opacity-[0.06] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#06B6D4] opacity-[0.05] blur-[100px] rounded-full" />

        {/* 顶部 Kicker + 元数据 */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <span className="font-mono text-xs font-medium tracking-[0.18em] uppercase text-[#06B6D4]">
            System Status · v4.7
          </span>
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-[#64748B]">
            LIVE · 2026.05.15
          </span>
        </div>

        {/* 标题区 */}
        <div className="mb-10 relative z-10">
          <h1
            className="font-bold text-[8vw] leading-[0.85] text-[#F1F5F9] mb-4"
            style={{ textShadow: '0 0 20px rgba(59,130,246,0.5), 0 0 40px rgba(6,182,212,0.3)' }}
          >
            Neural
            <br />
            <span className="text-[#3B82F6]">Engine</span>
          </h1>
          <p className="font-normal text-[1.55vw] leading-relaxed text-[#94A3B8] max-w-[45vw]">
            下一代分布式推理引擎，突破性能瓶颈，赋能实时 AI 应用。
          </p>
        </div>

        {/* 数据仪表盘网格 */}
        <div className="grid grid-cols-4 gap-4 mt-auto relative z-10">
          {/* 卡片 1 */}
          <div className="bg-[#1E293B] border border-[rgba(148,163,184,0.15)] rounded-lg p-5">
            <Cpu className="w-5 h-5 text-[#3B82F6] mb-3" />
            <p className="font-bold text-[2vw] text-[#F1F5F9] leading-none">2.4M</p>
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[#64748B] mt-2">Requests/sec</p>
            <div className="h-px bg-[rgba(148,163,184,0.15)] mt-3 mb-2" />
            <p className="text-xs text-[#06B6D4]">+34.2% ▲</p>
          </div>

          {/* 卡片 2 */}
          <div className="bg-[#1E293B] border border-[rgba(148,163,184,0.15)] rounded-lg p-5">
            <Database className="w-5 h-5 text-[#06B6D4] mb-3" />
            <p className="font-bold text-[2vw] text-[#F1F5F9] leading-none">99.97%</p>
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[#64748B] mt-2">Uptime</p>
            <div className="h-px bg-[rgba(148,163,184,0.15)] mt-3 mb-2" />
            <p className="text-xs text-[#06B6D4]">STABLE</p>
          </div>

          {/* 卡片 3 */}
          <div className="bg-[#1E293B] border border-[rgba(148,163,184,0.15)] rounded-lg p-5">
            <Shield className="w-5 h-5 text-[#8B5CF6] mb-3" />
            <p className="font-bold text-[2vw] text-[#F1F5F9] leading-none">847</p>
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[#64748B] mt-2">Threats Blocked</p>
            <div className="h-px bg-[rgba(148,163,184,0.15)] mt-3 mb-2" />
            <p className="text-xs text-[#8B5CF6]">+12 TODAY</p>
          </div>

          {/* 卡片 4 */}
          <div className="bg-[#1E293B] border border-[rgba(148,163,184,0.15)] rounded-lg p-5">
            <Activity className="w-5 h-5 text-[#3B82F6] mb-3" />
            <p className="font-bold text-[2vw] text-[#F1F5F9] leading-none">12ms</p>
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-[#64748B] mt-2">Latency p99</p>
            <div className="h-px bg-[rgba(148,163,184,0.15)] mt-3 mb-2" />
            <p className="text-xs text-[#06B6D4]">-8.3% ▼</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
