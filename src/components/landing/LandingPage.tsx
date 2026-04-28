import React from 'react';
import { Sparkles, Code2, ArrowRight } from 'lucide-react';
import { ViewType } from '../../hooks/use-app-state';

interface LandingPageProps {
  onNavigate: (view: ViewType) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-4xl w-full">
        {/* Logo / Title */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6" style={{ backgroundColor: 'var(--accent-primary)' }}>
            <Sparkles className="w-10 h-10" style={{ color: 'var(--text-inverse)' }} />
          </div>
          <h1
            className="text-5xl font-bold mb-4"
            style={{
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
              color: 'var(--text-primary)'
            }}
          >
            Gemini Canvas
          </h1>
          <p
            className="text-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            AI 驱动的演示文稿生成平台
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Generate Card */}
          <button
            onClick={() => onNavigate('ai-generate')}
            className="group relative flex flex-col items-center p-10 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Sparkles className="w-8 h-8" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{
                fontFamily: 'Space Grotesk, system-ui, sans-serif',
                color: 'var(--text-primary)'
              }}
            >
              AI 生成
            </h2>
            <p
              className="text-center mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              通过对话引导或直接描述<br />AI 自动生成演示文稿
            </p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group-hover:gap-3"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>
                开始创建
              </span>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
          </button>

          {/* Code Transform Card */}
          <button
            onClick={() => onNavigate('code')}
            className="group relative flex flex-col items-center p-10 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)'
            }}
          >
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-6 transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: 'var(--accent-secondary)' }}
            >
              <Code2 className="w-8 h-8" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <h2
              className="text-2xl font-bold mb-3"
              style={{
                fontFamily: 'Space Grotesk, system-ui, sans-serif',
                color: 'var(--text-primary)'
              }}
            >
              React 代码转换
            </h2>
            <p
              className="text-center mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              编写 React JSX 代码<br />实时预览并导出 PPTX
            </p>
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 group-hover:gap-3"
              style={{ backgroundColor: 'var(--accent-secondary)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>
                进入编辑器
              </span>
              <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            支持 16:9 和 4:3 多种画布比例 | 导出为 PPTX 格式
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;