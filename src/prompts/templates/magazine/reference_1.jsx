import React from 'react';
import { Sparkles, Calendar, User } from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#18181A] p-2">
      {/* 杂志风 Hero Cover — 深色开场封面 */}
      <div className="w-[1280px] h-[720px] bg-[#0A0A0B] text-[#F1EFEA] relative overflow-hidden flex flex-col">

        {/* Chrome 页眉 */}
        <div className="flex justify-between items-center px-12 pt-8 font-mono text-[0.88vw] tracking-[0.16em] uppercase opacity-40">
          <span>A Talk · 2026.05</span>
          <span>Vol.01</span>
        </div>

        {/* 主内容区 — 垂直居中 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-20">
          {/* Kicker */}
          <span className="font-mono text-xs tracking-[0.18em] uppercase text-[#737373] mb-6">
            私享会 · AI 时代的个体创作者
          </span>

          {/* Hero 标题 */}
          <h1 className="font-serif text-[10vw] font-black leading-[0.9] tracking-tight mb-6">
            一人公司
          </h1>

          {/* 副标题 */}
          <p className="font-serif text-[3.1vw] font-medium opacity-70 mb-10">
            被 AI 折叠的组织
          </p>

          {/* 引导段 */}
          <p className="font-serif text-[1.9vw] font-normal leading-relaxed opacity-55 max-w-[60vw] mb-12">
            一个 AI 创作者 —— 在 64 天里做了 11 万行代码、在 9 个平台上持续输出，生活节奏几乎没有被改变。
          </p>

          {/* 元数据行 */}
          <div className="flex items-center gap-6 font-mono text-[0.88vw] tracking-[0.16em] uppercase opacity-35">
            <span className="flex items-center gap-2"><User size={14} /> 归藏 Guizang</span>
            <span>·</span>
            <span className="flex items-center gap-2"><Calendar size={14} /> 2026.04.22</span>
            <span>·</span>
            <span>独立创作者 / CodePilot 作者</span>
          </div>
        </div>

        {/* Ghost 装饰背景字 */}
        <div className="absolute font-serif text-[34vw] font-black opacity-[0.04] pointer-events-none select-none -right-6 -top-20">
          01
        </div>

        {/* Foot 页脚 */}
        <div className="flex justify-between items-center px-12 pb-6 font-mono text-[0.88vw] tracking-[0.16em] uppercase opacity-30">
          <span>一场关于 AI · 组织 · 个体的分享</span>
          <span>— 2026 —</span>
        </div>
      </div>
    </div>
  );
};

export default App;
