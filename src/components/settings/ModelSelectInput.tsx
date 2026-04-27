/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Wifi, Loader2, ChevronDown } from 'lucide-react';

interface ModelSelectInputProps {
  value: string;
  onChange: (value: string) => void;
  availableModels: string[];
  onRefresh: () => void;
  isTesting: boolean;
}

export const ModelSelectInput: React.FC<ModelSelectInputProps> = ({
  value,
  onChange,
  availableModels,
  onRefresh,
  isTesting,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredModels = availableModels.filter(m =>
    m.toLowerCase().includes(filter.toLowerCase())
  );

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setFilter(newValue);
    if (availableModels.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleSelectModel = (model: string) => {
    onChange(model);
    setFilter(model);
    setShowDropdown(false);
  };

  const handleInputFocus = () => {
    if (availableModels.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* Text input with dropdown */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            placeholder="输入或选择模型名称"
            className="w-full px-4 py-3 rounded-xl focus:outline-none pr-9"
            style={{
              background: 'var(--bg-input)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          />
          {availableModels.length > 0 && (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            >
              <ChevronDown size={16} />
            </button>
          )}

          {/* Dropdown list */}
          {showDropdown && filteredModels.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute z-20 w-full mt-1 max-h-48 overflow-y-auto rounded-xl shadow-lg"
              style={{
                background: 'var(--bg-modal)',
                border: '1px solid var(--border-default)',
              }}
            >
              {filteredModels.map((model) => (
                <button
                  key={model}
                  onClick={() => handleSelectModel(model)}
                  className="w-full text-left px-4 py-2 text-sm transition-colors"
                  style={{
                    color: value === model ? 'var(--accent)' : 'var(--text-primary)',
                    background: value === model ? 'var(--accent-bg)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = value === model ? 'var(--accent-bg)' : 'transparent';
                  }}
                >
                  {model}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Test connection button */}
        <button
          onClick={onRefresh}
          disabled={isTesting}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: 'var(--bg-button)' }}
        >
          {isTesting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Wifi size={16} />
          )}
        </button>
      </div>

      {/* Model chips for quick selection */}
      {availableModels.length > 0 && (
        <div>
          <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            可用模型 (点击选择):
          </div>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableModels.map((model) => (
              <button
                key={model}
                onClick={() => handleSelectModel(model)}
                className="px-2 py-1 rounded text-xs transition-colors"
                style={{
                  background: value === model ? 'var(--accent)' : 'var(--bg-input)',
                  color: value === model ? 'var(--text-inverse)' : 'var(--text-secondary)',
                }}
              >
                {model}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableModels.length === 0 && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          点击右侧按钮测试连接并获取可用模型列表，或直接输入模型名称
        </div>
      )}
    </div>
  );
};
