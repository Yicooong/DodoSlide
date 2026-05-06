import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageCircle, Edit3, Check, ChevronRight } from 'lucide-react';
import { GenerationMode, GenerationContext } from './AiGeneratePage';
import { CanvasRatio } from '../../lib/canvas-config';
import { ViewType } from '../../hooks/use-app-state';

interface AiGenProps {
  isGenerating: boolean;
  error: string | null;
  generate: (userInput: string, canvasRatio?: CanvasRatio) => Promise<{ success: boolean; code?: string; error?: string }>;
  clearError: () => void;
}

interface SlidesHook {
  slides: Array<{ id: string; name: string; code: string }>;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  updateCurrentSlideCode: (code: string) => void;
  addNewSlide: () => void;
  setSlideCode: (index: number, code: string) => void;
  setSlidesBulk: (slides: Array<{ id: string; name: string; code: string }>) => void;
}

// Guided mode conversation steps
interface ConversationStep {
  id: number;
  question: string;
  options?: string[];
  isMultiLine?: boolean;
}

const CONVERSATION_STEPS: ConversationStep[] = [
  {
    id: 1,
    question: '这份演示文稿要解决什么问题？目标受众是谁？',
  },
  {
    id: 2,
    question: '使用场景是什么？',
    options: ['技术分享', '商业路演', '内部汇报', '产品发布', '教学培训', '其他'],
  },
  {
    id: 3,
    question: '希望传递什么情绪和风格？',
    options: ['专业稳重', '年轻活力', '科技未来', '简约高级', '温暖亲和', '创意大胆'],
  },
  {
    id: 4,
    question: '观众离开后最可能记住的一个核心信息是什么？',
  },
  {
    id: 5,
    question: '有没有偏好的配色、参考案例、或必须包含的元素？（可选）',
    isMultiLine: true,
  },
];

// Quick tags for direct mode
const QUICK_TAGS = [
  '10页左右',
  '包含数据图表',
  '深色主题',
  '浅色主题',
  '带动画效果',
  '简洁文字',
];

interface ConversationPanelProps {
  mode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
  context: GenerationContext;
  onContextUpdate: (updates: Partial<GenerationContext>) => void;
  aiGen: AiGenProps;
  canvasRatio: CanvasRatio;
  slidesHook: SlidesHook;
  onNavigate: (view: ViewType) => void;
}

const ConversationPanel: React.FC<ConversationPanelProps> = ({
  mode,
  setMode,
  context,
  onContextUpdate,
  aiGen,
  canvasRatio,
  slidesHook,
  onNavigate,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'ai', content: string}>>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const handleOptionSelect = (option: string) => {
    const step = CONVERSATION_STEPS.find(s => s.id === currentStep);
    if (!step) return;

    // Add user response to history
    setConversationHistory(prev => [
      ...prev,
      { role: 'user', content: option }
    ]);

    // Update context based on step
    const contextKeyMap: Record<number, keyof GenerationContext> = {
      1: 'purpose',
      2: 'scenario',
      3: 'tone',
      4: 'memory',
      5: 'preference',
    };

    const key = contextKeyMap[currentStep];
    if (key) {
      onContextUpdate({ [key]: option });
    }

    // AI confirmation
    const confirmations: Record<number, string> = {
      1: `明白了，您需要一份面向 ${option.includes('投资人') ? '投资人' : option.includes('团队') ? '团队' : option} 的演示文稿。`,
      2: `好的，使用场景是「${option}」。`,
      3: `收到，风格调性是「${option}」。`,
      4: `好的，核心记忆点是「${option}」。`,
      5: `了解了，您的偏好是「${option}」。`,
    };

    setTimeout(() => {
      setConversationHistory(prev => [
        ...prev,
        { role: 'ai', content: confirmations[currentStep] || '收到！' }
      ]);

      // Move to next step or show summary
      setTimeout(() => {
        if (currentStep < 5) {
          setCurrentStep(prev => prev + 1);
        } else {
          setShowSummary(true);
        }
      }, 800);
    }, 300);
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;
    handleOptionSelect(inputValue.trim());
    setInputValue('');
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    aiGen.clearError();

    // Build the user prompt from context
    const promptParts: string[] = [];
    if (context.purpose) promptParts.push(`目的：${context.purpose}`);
    if (context.scenario) promptParts.push(`场景：${context.scenario}`);
    if (context.tone) promptParts.push(`风格：${context.tone}`);
    if (context.memory) promptParts.push(`核心信息：${context.memory}`);
    if (context.preference) promptParts.push(`偏好：${context.preference}`);
    if (context.directInput) promptParts.push(context.directInput);

    const userPrompt = promptParts.length > 0
      ? promptParts.join('\n')
      : context.directInput || '创建一份演示文稿';

    const selectedRatio = context.canvasRatio || canvasRatio;

    try {
      const result = await aiGen.generate(userPrompt, selectedRatio);
      if (result.success && result.code) {
        slidesHook.updateCurrentSlideCode(result.code);
        onNavigate('code');
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInputSubmit();
    }
  };

  // Render guided mode
  const renderGuidedMode = () => (
    <div className="flex flex-col h-full">
      {/* Mode Switcher */}
      <div className="flex gap-2 p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setMode('guided')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mode === 'guided' ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: mode === 'guided' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'guided' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            ['--tw-ring-color' as string]: 'var(--accent-primary)'
          }}
        >
          <MessageCircle className="w-4 h-4" />
          引导模式
        </button>
        <button
          onClick={() => setMode('direct')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mode === 'direct' ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: mode === 'direct' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'direct' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            ['--tw-ring-color' as string]: 'var(--accent-primary)'
          }}
        >
          <Edit3 className="w-4 h-4" />
          直接输入
        </button>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Welcome Message */}
        {conversationHistory.length === 0 && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div
              className="p-4 rounded-2xl rounded-tl-md max-w-[80%]"
              style={{ backgroundColor: 'var(--bg-secondary)' }}
            >
              <p style={{ color: 'var(--text-primary)' }}>
                你好！我是 AI 演示文稿助手 🚀<br /><br />
                我将通过几个简单的问题帮你明确需求，然后生成一份专业的演示文稿。<br /><br />
                {CONVERSATION_STEPS[0]?.question}
              </p>
            </div>
          </div>
        )}

        {/* Conversation History */}
        {conversationHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {msg.role === 'ai' && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
              </div>
            )}
            <div
              className={`p-4 rounded-2xl max-w-[80%] ${
                msg.role === 'user'
                  ? 'rounded-tr-md'
                  : 'rounded-tl-md'
              }`}
              style={{
                backgroundColor: msg.role === 'user'
                  ? 'var(--accent-primary)'
                  : 'var(--bg-secondary)',
                color: msg.role === 'user'
                  ? 'var(--text-inverse)'
                  : 'var(--text-primary)'
              }}
            >
              <p>{msg.content}</p>
            </div>
          </div>
        ))}

        {/* Current Step Options */}
        {!showSummary && currentStep <= 5 && (
          <div className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 animate-pulse"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Sparkles className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div className="max-w-[80%]">
              <p className="mb-3" style={{ color: 'var(--text-primary)' }}>
                {CONVERSATION_STEPS[currentStep - 1]?.question}
              </p>
              {CONVERSATION_STEPS[currentStep - 1]?.options ? (
                <div className="flex flex-wrap gap-2">
                  {CONVERSATION_STEPS[currentStep - 1]?.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleOptionSelect(option)}
                      className="px-3 py-1.5 rounded-full text-sm transition-all hover:scale-105 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-primary)'
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="请输入..."
                    className="flex-1 px-4 py-2 rounded-lg text-sm outline-none transition-all focus:ring-2"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-primary)',
                      ['--tw-ring-color' as string]: 'var(--accent-primary)'
                    }}
                  />
                  <button
                    onClick={handleInputSubmit}
                    className="px-4 py-2 rounded-lg transition-all hover:scale-105 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-inverse)'
                    }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary Card */}
        {showSummary && (
          <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--accent-primary)' }}>
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                需求摘要
              </span>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p><strong style={{ color: 'var(--text-primary)' }}>目的：</strong>{context.purpose || '-'}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>场景：</strong>{context.scenario || '-'}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>调性：</strong>{context.tone || '-'}</p>
              <p><strong style={{ color: 'var(--text-primary)' }}>记忆点：</strong>{context.memory || '-'}</p>
              {context.preference && (
                <p><strong style={{ color: 'var(--text-primary)' }}>偏好：</strong>{context.preference}</p>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Action Buttons */}
      <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--border-primary)' }}>
        {showSummary ? (
          <>
            <button
              onClick={() => {
                setShowSummary(false);
                setCurrentStep(1);
                setConversationHistory([]);
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              重新填写
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--text-inverse)'
              }}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  生成演示文稿
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </>
        ) : (
          currentStep > 1 && (
            <button
              onClick={() => {
                setCurrentStep(prev => prev - 1);
                setConversationHistory(prev => prev.slice(0, -2));
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              上一步
            </button>
          )
        )}
      </div>
    </div>
  );

  // Render direct mode
  const renderDirectMode = () => (
    <div className="flex flex-col h-full">
      {/* Mode Switcher */}
      <div className="flex gap-2 p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setMode('guided')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mode === 'guided' ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: mode === 'guided' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'guided' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            ['--tw-ring-color' as string]: 'var(--accent-primary)'
          }}
        >
          <MessageCircle className="w-4 h-4" />
          引导模式
        </button>
        <button
          onClick={() => setMode('direct')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            mode === 'direct' ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
          }`}
          style={{
            backgroundColor: mode === 'direct' ? 'var(--accent-primary)' : 'transparent',
            color: mode === 'direct' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            ['--tw-ring-color' as string]: 'var(--accent-primary)'
          }}
        >
          <Edit3 className="w-4 h-4" />
          直接输入
        </button>
      </div>

      {/* Input Area */}
      <div className="flex-1 p-4 flex flex-col">
        <div className="flex-1">
          <textarea
            value={context.directInput || ''}
            onChange={(e) => onContextUpdate({ directInput: e.target.value })}
            placeholder="请描述你的演示文稿需求，越详细越好。例如：帮我做一份关于 AI 在医疗领域应用的 10 页技术分享 PPT，风格要科技未来感，主色调深蓝..."
            className="w-full h-full p-4 rounded-xl text-sm outline-none resize-none transition-all focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              ['--tw-ring-color' as string]: 'var(--accent-primary)'
            }}
          />
        </div>

        {/* Quick Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                const current = context.directInput || '';
                const newInput = current ? `${current} ${tag}` : tag;
                onContextUpdate({ directInput: newInput });
              }}
              className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !context.directInput?.trim()}
          className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:scale-[1.02] cursor-pointer disabled:opacity-50"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-inverse)'
          }}
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              一键生成
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return mode === 'guided' ? renderGuidedMode() : renderDirectMode();
};

export default ConversationPanel;