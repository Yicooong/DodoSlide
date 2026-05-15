import React from 'react';
import { Zap, Shield, Activity } from "lucide-react";

const App = () => {
  return (
    <div className="w-[1280px] h-[720px] bg-black flex flex-col p-16 font-mono relative overflow-hidden">
      {/* Glow background effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff2bd6] opacity-10 blur-[120px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00f0ff] opacity-10 blur-[120px] rounded-full" />

      {/* Header */}
      <div className="relative z-10 mb-4">
        <span className="text-[#00f0ff] text-sm tracking-[0.4em] uppercase opacity-80">
          Neural Interface v4.7
        </span>
      </div>

      {/* Title */}
      <div className="relative z-10 mb-12">
        <h1 className="text-6xl font-bold text-[#ff2bd6] leading-none"
          style={{ textShadow: "0 0 40px #ff2bd6, 0 0 80px #ff2bd633" }}>
          SYSTEM://OVERRIDE
        </h1>
        <p className="text-[#00f0ff] mt-4 text-lg opacity-70"
          style={{ textShadow: "0 0 20px #00f0ff44" }}>
          &gt; Accessing mainframe protocols...
        </p>
      </div>

      {/* Glow cards */}
      <div className="relative z-10 flex gap-6 mt-auto">
        {/* Card 1 - Pink */}
        <div className="flex-1 border border-[#ff2bd644] bg-[#ff2bd608] p-6 rounded-sm"
          style={{ boxShadow: "0 0 20px #ff2bd622, inset 0 0 20px #ff2bd608" }}>
          <Zap className="w-6 h-6 text-[#ff2bd6] mb-4" />
          <p className="text-4xl font-bold text-[#ff2bd6]">1.2M</p>
          <p className="text-xs text-gray-500 mt-2 tracking-wider">THREATS BLOCKED</p>
          <div className="h-px bg-[#ff2bd633] mt-4" />
          <p className="text-xs text-[#ff2bd6] mt-2">+23.4% ▲</p>
        </div>

        {/* Card 2 - Cyan */}
        <div className="flex-1 border border-[#00f0ff44] bg-[#00f0ff08] p-6 rounded-sm"
          style={{ boxShadow: "0 0 20px #00f0ff22, inset 0 0 20px #00f0ff08" }}>
          <Shield className="w-6 h-6 text-[#00f0ff] mb-4" />
          <p className="text-4xl font-bold text-[#00f0ff]">99.7%</p>
          <p className="text-xs text-gray-500 mt-2 tracking-wider">UPTIME RATIO</p>
          <div className="h-px bg-[#00f0ff33] mt-4" />
          <p className="text-xs text-[#00f0ff] mt-2">STABLE</p>
        </div>

        {/* Card 3 - Yellow */}
        <div className="flex-1 border border-[#ffd60044] bg-[#ffd60008] p-6 rounded-sm"
          style={{ boxShadow: "0 0 20px #ffd60022, inset 0 0 20px #ffd60008" }}>
          <Activity className="w-6 h-6 text-[#ffd600] mb-4" />
          <p className="text-4xl font-bold text-[#ffd600]">847</p>
          <p className="text-xs text-gray-500 mt-2 tracking-wider">ACTIVE NODES</p>
          <div className="h-px bg-[#ffd60033] mt-4" />
          <p className="text-xs text-[#ffd600] mt-2">+12 TODAY</p>
        </div>
      </div>
    </div>
  );
};

export default App;
