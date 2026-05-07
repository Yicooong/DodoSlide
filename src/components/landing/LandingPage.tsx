import React from 'react';
// 导入图标：Sparkles(AI)、Code2(代码)、ArrowRight(右箭头)、Zap(闪电)、Palette(调色板)、Download(下载)、Layers(图层)
import { Sparkles, Code2, ArrowRight, Zap, Palette, Download, Layers } from 'lucide-react';
// 导入 motion 动画库
import { motion } from 'motion/react';
// 导入视图类型
import { ViewType } from '../../hooks/use-app-state';

/** 着陆页组件属性接口 */
interface LandingPageProps {
  onNavigate: (view: ViewType) => void;  // 页面导航回调
}

/**
 * 着陆页组件（应用首页）
 * 功能：
 * - 显示应用 Logo 和标题
 * - 提供两个主要入口按钮：开始创作（AI 生成）、代码编辑器
 * - 展示四个核心功能特性卡片
 * - 底部显示支持的画布比例和导出格式信息
 * - 全部使用 motion 实现流畅的入场动画
 */
const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  // 功能特性列表
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
      {/* 主体区域：包含标题、按钮和功能卡片 */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* 背景径向渐变效果：从顶部中心向外扩散 */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top center, var(--accent) 0%, transparent 60%)',
          }}
        />

        {/* 主要内容区：使用 motion 实现从下方滑入的动画 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center max-w-3xl mx-auto"
        >
          {/* Logo：渐变背景 + 闪光图标 + 阴影效果 */}
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

          {/* 应用标题 */}
          <h1
            className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            style={{
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
              color: 'var(--text-primary)',
            }}
          >
            DodoSlide
          </h1>

          {/* 副标题：产品定位说明 */}
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

          {/* 主要操作按钮区 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {/* 开始创作按钮：导航到 AI 生成页 */}
            <motion.button
              whileHover={{ scale: 1.02 }}  // 悬停放大
              whileTap={{ scale: 0.98 }}    // 点击缩小
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
              {/* 箭头悬停右移动画 */}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </motion.button>

            {/* 代码编辑器按钮：导航到代码编辑页 */}
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

        {/* 功能特性卡片网格：2x2 布局（移动端）或 4x1（桌面端） */}
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
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}  // 依次延迟动画
                className="flex flex-col items-center text-center p-6 rounded-xl"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {/* 功能图标 */}
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

      {/* 底部信息栏 */}
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
