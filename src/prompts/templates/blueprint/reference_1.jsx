import React from 'react';
import { Layers, Database, Monitor, ArrowDown } from "lucide-react";

const App = () => {
  return (
    <div
      className="w-[1280px] h-[720px] bg-[#0b3a6f] flex flex-col p-16 font-mono text-white relative overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 border border-white/60" />
          <span className="text-xs tracking-[0.3em] text-white/50 uppercase">
            Technical Specification
          </span>
        </div>
        <span className="text-xs text-white/30">REV 2.0 — 2026.05</span>
      </div>

      {/* Title */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-white tracking-tight leading-none">
          System Architecture v2.0
        </h1>
        <p className="text-white/40 mt-3 text-sm">
          Three-tier distributed microservice topology
        </p>
      </div>

      {/* Architecture layers */}
      <div className="flex-1 flex flex-col gap-4 justify-center">
        {/* Layer 1 - Presentation */}
        <div className="border border-dashed border-white/40 bg-white/5 p-6 flex items-center gap-6">
          <Monitor className="w-8 h-8 text-white/60 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold tracking-wider text-white/80">PRESENTATION LAYER</p>
            <p className="text-xs text-white/40 mt-1">React SPA · CDN Edge · SSR Gateway</p>
          </div>
          <span className="text-xs text-white/30 border border-white/20 px-3 py-1">LAYER 01</span>
        </div>

        <ArrowDown className="w-4 h-4 text-white/20 self-center" />

        {/* Layer 2 - Application */}
        <div className="border border-dashed border-white/50 bg-white/8 p-6 flex items-center gap-6">
          <Layers className="w-8 h-8 text-white/70 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold tracking-wider text-white/90">APPLICATION LAYER</p>
            <p className="text-xs text-white/50 mt-1">API Gateway · Auth Service · Business Logic</p>
          </div>
          <span className="text-xs text-white/30 border border-white/20 px-3 py-1">LAYER 02</span>
        </div>

        <ArrowDown className="w-4 h-4 text-white/20 self-center" />

        {/* Layer 3 - Data */}
        <div className="border border-dashed border-white/60 bg-white/10 p-6 flex items-center gap-6">
          <Database className="w-8 h-8 text-white/80 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold tracking-wider text-white">DATA LAYER</p>
            <p className="text-xs text-white/60 mt-1">PostgreSQL · Redis Cache · S3 Object Store</p>
          </div>
          <span className="text-xs text-white/30 border border-white/20 px-3 py-1">LAYER 03</span>
        </div>
      </div>
    </div>
  );
};

export default App;
