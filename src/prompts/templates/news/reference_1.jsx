import React from 'react';
import { TrendingUp, DollarSign, Users, ArrowUpRight } from "lucide-react";

const App = () => {
  return (
    <div className="w-[1280px] h-[720px] bg-white flex flex-col font-sans relative overflow-hidden">
      {/* Red left bar */}
      <div className="absolute top-0 left-0 w-2 h-full bg-[#e11d2d]" />

      {/* Breaking news banner */}
      <div className="bg-[#e11d2d] text-white px-16 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-white text-[#e11d2d] text-xs font-black px-3 py-1 tracking-widest uppercase">
            Breaking
          </span>
          <span className="text-sm font-semibold tracking-wider uppercase">
            Financial Report
          </span>
        </div>
        <span className="text-xs opacity-70">Q1 2026 · LIVE</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col px-16 py-12">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tight leading-none"
            style={{ fontFamily: "Oswald, sans-serif" }}>
            QUARTERLY EARNINGS REPORT
          </h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="h-[3px] w-16 bg-[#e11d2d]" />
            <p className="text-sm text-gray-500 uppercase tracking-wider">
              Fiscal Year 2026 · First Quarter Analysis
            </p>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="flex gap-8 mt-auto">
          {/* Stat 1 */}
          <div className="flex-1 border-l-4 border-[#e11d2d] pl-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#e11d2d]" />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Revenue</span>
            </div>
            <p className="text-5xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
              $4.2B
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">+18.3%</span>
              <span className="text-xs text-gray-400 ml-1">YoY</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="flex-1 border-l-4 border-[#e11d2d] pl-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#e11d2d]" />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Active Users</span>
            </div>
            <p className="text-5xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
              12.8M
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">+31.7%</span>
              <span className="text-xs text-gray-400 ml-1">YoY</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="flex-1 border-l-4 border-[#e11d2d] pl-6 py-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#e11d2d]" />
              <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Net Margin</span>
            </div>
            <p className="text-5xl font-black text-gray-900" style={{ fontFamily: "Oswald, sans-serif" }}>
              24.6%
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-4 h-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">+2.1pp</span>
              <span className="text-xs text-gray-400 ml-1">QoQ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ticker */}
      <div className="bg-gray-900 text-white px-16 py-3 flex items-center justify-between">
        <span className="text-xs tracking-wider opacity-60">DODO FINANCIAL · CONFIDENTIAL</span>
        <span className="text-xs tracking-wider opacity-40">PAGE 1 OF 1</span>
      </div>
    </div>
  );
};

export default App;
