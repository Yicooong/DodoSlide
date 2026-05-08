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
];

const DEFAULT_TOKENS = PRESETS[0].tokens;

type DesignCtx = {
  tokens: DesignTokens;
  setTokens: (t: Partial<DesignTokens>) => void;
  applyPreset: (name: string) => void;
  randomPreset: () => void;
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
    presets: PRESETS,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
