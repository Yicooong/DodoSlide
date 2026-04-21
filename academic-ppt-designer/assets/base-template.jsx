// 16:9 比例学术 PPT 基础模板
import React from 'react';
import { Layout, Zap, Activity } from 'lucide-react';

const SlideTemplate = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-100 p-2">
      <div className="w-[1280px] h-[720px] bg-white shadow-2xl relative overflow-hidden flex flex-col px-12 py-10">
        {/* 顶部视觉锚点 */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-800 via-indigo-600 to-indigo-200" />
        
        {/* 标题区 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">在这里输入页面主标题</h1>
          <div className="flex items-center gap-4 mt-3">
            <div className="w-16 h-1 bg-indigo-600 rounded-full" />
            <p className="text-slate-500 italic text-lg tracking-wide">此处填写核心观点或研究假设</p>
          </div>
        </div>

        {/* 内容主体：建议采用双栏或三栏布局 */}
        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* 左侧：数据/图形 */}
          <div className="w-1/2 bg-zinc-50 rounded-2xl border border-zinc-200 p-6 shadow-sm">
            {/* 插入代码示例 */}
          </div>
          {/* 右侧：定性分析 */}
          <div className="w-1/2 flex flex-col gap-4">
             {/* 插入结论卡片 */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideTemplate;