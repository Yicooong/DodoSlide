import React from 'react';
import { Minus, ArrowRight } from "lucide-react";

const App = () => {
  return (
    <div className="w-[1280px] h-[720px] bg-[#fafaf5] flex flex-col justify-center p-24 font-serif relative">
      {/* Vermillion accent bar */}
      <div className="absolute top-0 left-0 w-1 h-full bg-[#d93a2a]" />

      {/* Top section - minimal branding */}
      <div className="mb-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-6 h-6 bg-[#d93a2a]" />
          <span className="text-xs tracking-[0.3em] text-gray-400 uppercase">
            Design Philosophy
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col gap-8">
        <h1 className="text-7xl font-light text-gray-900 tracking-tight leading-none">
          静かな革新
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <Minus className="w-8 h-8 text-[#d93a2a]" />
          <p className="text-lg text-gray-400 font-light">
            Quiet Innovation
          </p>
        </div>
      </div>

      {/* Bottom data section */}
      <div className="mt-auto pt-20 flex items-end justify-between">
        <div>
          <p className="text-8xl font-light text-gray-900">97<span className="text-4xl text-[#d93a2a]">%</span></p>
          <p className="text-sm text-gray-400 mt-2 tracking-wide">User satisfaction rate</p>
        </div>
        <div className="flex items-center gap-3 text-[#d93a2a]">
          <span className="text-sm tracking-wider">Explore</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default App;
