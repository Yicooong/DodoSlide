import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ViewType } from '../../hooks/use-app-state';
import ConversationPanel from './ConversationPanel';
import StylePanel from './StylePanel';

interface AiGeneratePageProps {
  onNavigate: (view: ViewType) => void;
}

export type GenerationMode = 'guided' | 'direct';

export interface GenerationContext {
  purpose?: string;
  scenario?: string;
  tone?: string;
  memory?: string;
  preference?: string;
  directInput?: string;
  selectedStyle?: string;
  selectedTemplate?: string;
  pageCount?: number;
  canvasRatio?: '16:9' | '4:3';
}

const AiGeneratePage: React.FC<AiGeneratePageProps> = ({ onNavigate }) => {
  const [mode, setMode] = useState<GenerationMode>('guided');
  const [context, setContext] = useState<GenerationContext>({
    pageCount: 10,
    canvasRatio: '16:9'
  });

  const handleContextUpdate = (updates: Partial<GenerationContext>) => {
    setContext(prev => ({ ...prev, ...updates }));
  };

  return (
    <div
      className="flex flex-col h-screen"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      {/* Header */}
      <div
        className="flex items-center h-16 px-6 border-b shrink-0"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}
      >
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:opacity-80 cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>
        <h1
          className="ml-6 text-xl font-bold"
          style={{
            fontFamily: 'Space Grotesk, system-ui, sans-serif',
            color: 'var(--text-primary)'
          }}
        >
          AI 生成演示文稿
        </h1>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Conversation (65%) */}
        <div className="flex-1 border-r overflow-auto" style={{ borderColor: 'var(--border-primary)' }}>
          <ConversationPanel
            mode={mode}
            setMode={setMode}
            context={context}
            onContextUpdate={handleContextUpdate}
          />
        </div>

        {/* Right Panel - Style (35%) */}
        <div
          className="w-[35%] min-w-[320px] max-w-[400px] overflow-auto"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <StylePanel
            context={context}
            onContextUpdate={handleContextUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default AiGeneratePage;