import React from 'react';
import { Sparkles, Code2, ArrowRight, Zap, Palette, Download, Layers } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewType } from '../../hooks/use-app-state';

interface LandingPageProps {
  onNavigate: (view: ViewType) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'AI 智能生成',
      description: '通过自然语言描述，AI 自动生成专业幻灯片',
    },
    {
      icon: <Palette className="w-5 h-5" />,
      title: '多种风格模板',
      description: '现代、科技、创意、专业、优雅 5 种设计风格',
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: '实时预览',
      description: '代码即所得，所见即所出',
    },
    {
      icon: <Download className="w-5 h-5" />,
      title: '一键导出',
      description: '支持 PPTX 格式导出，兼容主流办公软件',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-root)' }}>
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* Background gradient effect */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top center, var(--accent) 0%, transparent 60%)',
          }}
        />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-8"
            style={{
              background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
              boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            style={{
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
              color: 'var(--text-primary)',
            }}
          >
            Gemini Canvas
          </h1>

          {/* Subtitle */}
          <p
            className="text-xl md:text-2xl mb-12 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            AI 驱动的演示文稿生成平台
            <br />
            <span className="text-lg" style={{ color: 'var(--text-muted)' }}>
              从想法到幻灯片，只需一句话
            </span>
          </p>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('ai-generate')}
              className="group flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, var(--accent) 0%, #8b5cf6 100%)',
                color: '#ffffff',
                boxShadow: '0 10px 30px -8px rgba(99, 102, 241, 0.5)',
              }}
            >
              <Zap className="w-5 h-5" />
              开始创作
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('code')}
              className="flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-lg font-semibold transition-all cursor-pointer"
              style={{
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <Code2 className="w-5 h-5" />
              代码编辑器
            </motion.button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 w-full max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className="flex flex-col items-center text-center p-6 rounded-xl"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                <div
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}
                >
                  {feature.icon}
                </div>
                <h3
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center py-6 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          支持 16:9 和 4:3 多种画布比例 · 导出为 PPTX 格式
        </p>
      </motion.div>
    </div>
  );
};

export default LandingPage;
