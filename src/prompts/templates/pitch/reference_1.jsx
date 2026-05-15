import React from 'react';
import {
  Users,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  Zap,
  Shield,
  Globe,
} from 'lucide-react';

const App = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-2">
      {/* 16:9 画布容器 (1280x720) */}
      <div className="w-[1280px] h-[720px] bg-white relative overflow-hidden flex flex-col">

        {/* Hero 封面区 */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-24">
          {/* Kicker */}
          <span className="font-semibold text-xs tracking-[0.12em] uppercase bg-gradient-to-r from-[#0070F3] to-[#7928CA] bg-clip-text text-transparent mb-6">
            AI-Powered Platform · Series B
          </span>

          {/* 渐变标题 */}
          <h1 className="text-[7vw] font-extrabold leading-[0.95] bg-gradient-to-r from-[#0070F3] to-[#7928CA] bg-clip-text text-transparent mb-6">
            AI-Powered Future
          </h1>

          {/* 副标题 */}
          <p className="text-[1.6vw] font-normal leading-relaxed text-[#4A5270] max-w-[60vw] mb-8">
            我们正在构建下一代智能平台，让每一家企业都能轻松驾驭 AI 能力，
            实现指数级效率提升。
          </p>

          {/* CTA 按钮 */}
          <button className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0070F3] to-[#7928CA] text-white font-semibold text-sm shadow-lg shadow-blue-500/20 mb-12">
            了解更多
          </button>

          {/* 渐变分割线 */}
          <div className="h-1 w-16 bg-gradient-to-r from-[#0070F3] to-[#7928CA] rounded-full mb-12"></div>

          {/* Traction 三列数据 */}
          <div className="grid grid-cols-3 gap-8 w-full max-w-[900px]">
            {/* 用户数 */}
            <div className="bg-[#FAFBFC] border border-[rgba(20,30,50,0.1)] rounded-2xl p-6 text-left">
              <div className="h-1 w-10 bg-gradient-to-r from-[#0070F3] to-[#7928CA] rounded-full mb-4"></div>
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-[#0070F3]" />
                <span className="text-xs text-[#8B93A8] uppercase tracking-wider font-mono">Total Users</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#0B0D12]">2.4M</span>
                <span className="flex items-center gap-0.5 text-sm font-semibold text-emerald-500">
                  <ArrowUpRight size={14} />
                  320%
                </span>
              </div>
              <p className="text-sm text-[#4A5270] mt-2">活跃用户同比增长</p>
            </div>

            {/* 营收 */}
            <div className="bg-[#FAFBFC] border border-[rgba(20,30,50,0.1)] rounded-2xl p-6 text-left">
              <div className="h-1 w-10 bg-gradient-to-r from-[#0070F3] to-[#7928CA] rounded-full mb-4"></div>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign size={16} className="text-[#0070F3]" />
                <span className="text-xs text-[#8B93A8] uppercase tracking-wider font-mono">ARR</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#0B0D12]">$18M</span>
                <span className="flex items-center gap-0.5 text-sm font-semibold text-emerald-500">
                  <ArrowUpRight size={14} />
                  180%
                </span>
              </div>
              <p className="text-sm text-[#4A5270] mt-2">年度经常性收入</p>
            </div>

            {/* 增长 */}
            <div className="bg-[#FAFBFC] border border-[rgba(20,30,50,0.1)] rounded-2xl p-6 text-left">
              <div className="h-1 w-10 bg-gradient-to-r from-[#0070F3] to-[#7928CA] rounded-full mb-4"></div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-[#0070F3]" />
                <span className="text-xs text-[#8B93A8] uppercase tracking-wider font-mono">NDR</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-[#0B0D12]">145%</span>
                <span className="flex items-center gap-0.5 text-sm font-semibold text-emerald-500">
                  <ArrowUpRight size={14} />
                  Top 5%
                </span>
              </div>
              <p className="text-sm text-[#4A5270] mt-2">净收入留存率</p>
            </div>
          </div>
        </div>

        {/* 底部特征条 */}
        <div className="flex items-center justify-center gap-10 py-5 border-t border-[rgba(20,30,50,0.06)]">
          <div className="flex items-center gap-2 text-[#8B93A8]">
            <Zap size={14} />
            <span className="text-xs font-medium">毫秒级响应</span>
          </div>
          <div className="flex items-center gap-2 text-[#8B93A8]">
            <Shield size={14} />
            <span className="text-xs font-medium">SOC 2 认证</span>
          </div>
          <div className="flex items-center gap-2 text-[#8B93A8]">
            <Globe size={14} />
            <span className="text-xs font-medium">全球 40+ 节点</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
