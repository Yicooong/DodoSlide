import { useState, useEffect, useCallback } from 'react';
import { transpileCode } from './lib/slide-renderer';
import { exportSlideByCode } from './lib/pptx-exporter';

type Status = 'idle' | 'valid' | 'invalid' | 'exporting' | 'error';

const STORAGE_KEY = 'react_slide_pptx_last_code';

export default function App() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Restore saved code on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(STORAGE_KEY, (result) => {
        if (result[STORAGE_KEY]) {
          setCode(result[STORAGE_KEY]);
        }
        setLoaded(true);
      });
    } else {
      setLoaded(true);
    }
  }, []);

  // Save code on change
  useEffect(() => {
    if (!loaded) return;
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.set({ [STORAGE_KEY]: code });
    }
  }, [code, loaded]);

  // Debounced auto-validation
  useEffect(() => {
    if (!code.trim()) {
      setStatus('idle');
      setErrorMsg('');
      return;
    }
    const timer = setTimeout(() => {
      try {
        transpileCode(code);
        setStatus('valid');
        setErrorMsg('');
      } catch (e: any) {
        setStatus('invalid');
        setErrorMsg(e.message || '转译失败');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [code]);

  const handleExport = useCallback(async () => {
    if (status !== 'valid') return;
    setStatus('exporting');
    setErrorMsg('');
    try {
      const blob = await exportSlideByCode(code);
      const url = URL.createObjectURL(blob);

      // Use chrome.downloads API if available, otherwise fallback to <a> download
      if (typeof chrome !== 'undefined' && chrome.downloads) {
        chrome.downloads.download({ url, filename: 'slide.pptx' }, () => {
          URL.revokeObjectURL(url);
        });
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = 'slide.pptx';
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e.message || '导出失败');
    }
  }, [code, status]);

  const statusMessage = () => {
    switch (status) {
      case 'idle':
        return '粘贴 React JSX 代码开始使用';
      case 'valid':
        return '代码有效，可以导出';
      case 'invalid':
        return errorMsg;
      case 'exporting':
        return '正在生成 PPTX...';
      case 'error':
        return errorMsg;
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>React Slide → PPTX</h1>
        <button
          className={`export-btn ${status === 'exporting' ? 'exporting' : ''}`}
          disabled={status !== 'valid'}
          onClick={handleExport}
        >
          {status === 'exporting' ? '导出中...' : '导出 PPTX'}
        </button>
      </div>

      <div className="code-area">
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={`请在此粘贴 React JSX 代码，例如：\n\nfunction MySlide() {\n  return (\n    <div style={{ width: '100%', height: '100%' }}>\n      <h1>Hello</h1>\n    </div>\n  );\n}\n\nexport default MySlide;`}
          spellCheck={false}
        />
      </div>

      <div className="status-bar">
        <span className={`status-dot ${status}`} />
        <span
          className={`status-text ${status === 'invalid' || status === 'error' ? 'error' : ''} ${status === 'valid' ? 'valid' : ''}`}
        >
          {statusMessage()}
        </span>
      </div>
    </div>
  );
}
