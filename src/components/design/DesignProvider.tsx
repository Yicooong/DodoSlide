import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type DesignTokens = {
  bg: string;
  text: string;
  accent: string;
  fontDisplay: string;
  fontBody: string;
  sizeHero: string;
  sizeBody: string;
  radius: string;
};

type DesignPreset = {
  name: string;
  tokens: DesignTokens;
};

const PRESETS: DesignPreset[] = [
  {
    name: 'Corporate',
    tokens: {
      bg: '#ffffff',
      text: '#1e293b',
      accent: '#2563eb',
      fontDisplay: 'Inter, sans-serif',
      fontBody: 'Inter, sans-serif',
      sizeHero: '48px',
      sizeBody: '18px',
      radius: '8px',
    },
  },
  {
    name: 'Creative',
    tokens: {
      bg: '#faf5ff',
      text: '#3b0764',
      accent: '#9333ea',
      fontDisplay: 'Georgia, serif',
      fontBody: 'system-ui, sans-serif',
      sizeHero: '56px',
      sizeBody: '20px',
      radius: '16px',
    },
  },
  {
    name: 'Minimal',
    tokens: {
      bg: '#ffffff',
      text: '#111111',
      accent: '#555555',
      fontDisplay: 'Helvetica Neue, sans-serif',
      fontBody: 'Helvetica Neue, sans-serif',
      sizeHero: '44px',
      sizeBody: '16px',
      radius: '4px',
    },
  },
  {
    name: 'Warm',
    tokens: {
      bg: '#fffbeb',
      text: '#451a03',
      accent: '#ea580c',
      fontDisplay: 'Georgia, serif',
      fontBody: 'Georgia, serif',
      sizeHero: '50px',
      sizeBody: '19px',
      radius: '12px',
    },
  },
  {
    name: 'Tech',
    tokens: {
      bg: '#0f172a',
      text: '#e2e8f0',
      accent: '#06b6d4',
      fontDisplay: 'JetBrains Mono, monospace',
      fontBody: 'JetBrains Mono, monospace',
      sizeHero: '42px',
      sizeBody: '16px',
      radius: '6px',
    },
  },
  {
    name: 'Ocean',
    tokens: {
      bg: '#f0f9ff',
      text: '#0c4a6e',
      accent: '#0284c7',
      fontDisplay: 'Segoe UI, sans-serif',
      fontBody: 'Segoe UI, sans-serif',
      sizeHero: '52px',
      sizeBody: '18px',
      radius: '10px',
    },
  },
  {
    name: 'Corporate Navy',
    tokens: {
      bg: '#ffffff',
      text: '#0A2540',
      accent: '#1D4ED8',
      fontDisplay: 'Inter, sans-serif',
      fontBody: 'Inter, sans-serif',
      sizeHero: '48px',
      sizeBody: '18px',
      radius: '6px',
    },
  },
  {
    name: 'Pitch Deck',
    tokens: {
      bg: '#ffffff',
      text: '#1a1a2e',
      accent: '#0070f3',
      fontDisplay: 'Inter, sans-serif',
      fontBody: 'Inter, sans-serif',
      sizeHero: '52px',
      sizeBody: '18px',
      radius: '14px',
    },
  },
  {
    name: 'Neo Brutal',
    tokens: {
      bg: '#fffef0',
      text: '#000000',
      accent: '#ffd400',
      fontDisplay: 'Archivo Black, sans-serif',
      fontBody: 'Space Grotesk, sans-serif',
      sizeHero: '56px',
      sizeBody: '18px',
      radius: '0px',
    },
  },
  {
    name: 'Editorial',
    tokens: {
      bg: '#faf7f2',
      text: '#1a1a1a',
      accent: '#8a2a1c',
      fontDisplay: 'Playfair Display, serif',
      fontBody: 'Inter, sans-serif',
      sizeHero: '52px',
      sizeBody: '18px',
      radius: '4px',
    },
  },
  {
    name: 'Japanese',
    tokens: {
      bg: '#fafaf5',
      text: '#1a1a18',
      accent: '#d93a2a',
      fontDisplay: 'Noto Serif SC, serif',
      fontBody: 'Inter, sans-serif',
      sizeHero: '48px',
      sizeBody: '17px',
      radius: '0px',
    },
  },
  {
    name: 'Cyberpunk',
    tokens: {
      bg: '#000000',
      text: '#f5f7ff',
      accent: '#ff2bd6',
      fontDisplay: 'JetBrains Mono, monospace',
      fontBody: 'Inter, sans-serif',
      sizeHero: '48px',
      sizeBody: '16px',
      radius: '6px',
    },
  },
  {
    name: 'Blueprint',
    tokens: {
      bg: '#0b3a6f',
      text: '#e8f3ff',
      accent: '#ffffff',
      fontDisplay: 'JetBrains Mono, monospace',
      fontBody: 'JetBrains Mono, monospace',
      sizeHero: '44px',
      sizeBody: '16px',
      radius: '0px',
    },
  },
  {
    name: 'News',
    tokens: {
      bg: '#ffffff',
      text: '#0a0a0a',
      accent: '#e11d2d',
      fontDisplay: 'Oswald, sans-serif',
      fontBody: 'Inter, sans-serif',
      sizeHero: '52px',
      sizeBody: '17px',
      radius: '0px',
    },
  },
];

const DEFAULT_TOKENS = PRESETS[0].tokens;

/** 模板 ID 到预设名称的映射 */
const TEMPLATE_PRESET_MAP: Record<string, string> = {
  modern: 'Minimal',
  tech: 'Tech',
  creative: 'Creative',
  professional: 'Corporate',
  elegant: 'Warm',
  magazine: 'Editorial',
  swiss: 'Minimal',
  corporate: 'Corporate Navy',
  pitch: 'Pitch Deck',
  brutal: 'Neo Brutal',
  editorial: 'Editorial',
  japanese: 'Japanese',
  cyberpunk: 'Cyberpunk',
  blueprint: 'Blueprint',
  news: 'News',
};

type DesignCtx = {
  tokens: DesignTokens;
  setTokens: (t: Partial<DesignTokens>) => void;
  applyPreset: (name: string) => void;
  randomPreset: () => void;
  syncFromTemplate: (templateId: string) => void;
  presets: DesignPreset[];
};

const Ctx = createContext<DesignCtx | null>(null);

export function useDesign(): DesignCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useDesign must be used inside <DesignProvider>');
  return v;
}

export function DesignProvider({ children }: { children: ReactNode }) {
  const [tokens, setTokensState] = useState<DesignTokens>(DEFAULT_TOKENS);

  const setTokens = useCallback((partial: Partial<DesignTokens>) => {
    setTokensState((prev) => ({ ...prev, ...partial }));
  }, []);

  const applyPreset = useCallback((name: string) => {
    const preset = PRESETS.find((p) => p.name === name);
    if (preset) setTokensState(preset.tokens);
  }, []);

  const randomPreset = useCallback(() => {
    const i = Math.floor(Math.random() * PRESETS.length);
    setTokensState(PRESETS[i].tokens);
  }, []);

  const syncFromTemplate = useCallback((templateId: string) => {
    const presetName = TEMPLATE_PRESET_MAP[templateId];
    if (presetName) {
      const preset = PRESETS.find((p) => p.name === presetName);
      if (preset) setTokensState(preset.tokens);
    }
  }, []);

  // Inject CSS custom properties into the preview root
  useEffect(() => {
    const root = document.querySelector('[data-inspector-root]') || document.querySelector('.logical-slide-root');
    if (!root) return;
    const el = root as HTMLElement;
    el.style.setProperty('--ds-bg', tokens.bg);
    el.style.setProperty('--ds-text', tokens.text);
    el.style.setProperty('--ds-accent', tokens.accent);
    el.style.setProperty('--ds-font-display', tokens.fontDisplay);
    el.style.setProperty('--ds-font-body', tokens.fontBody);
    el.style.setProperty('--ds-size-hero', tokens.sizeHero);
    el.style.setProperty('--ds-size-body', tokens.sizeBody);
    el.style.setProperty('--ds-radius', tokens.radius);
  }, [tokens]);

  const value: DesignCtx = {
    tokens,
    setTokens,
    applyPreset,
    randomPreset,
    syncFromTemplate,
    presets: PRESETS,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
