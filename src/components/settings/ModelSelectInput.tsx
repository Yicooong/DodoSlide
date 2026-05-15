/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
// 导入图标：Wifi(连接测试)、Loader2(加载中)、ChevronDown(下拉)
import { Wifi, Loader2, ChevronDown } from 'lucide-react';

/** 模型选择输入组件属性接口 */
interface ModelSelectInputProps {
  value: string;           // 当前选中的模型名称
  onChange: (value: string) => void;  // 值变更回调
  availableModels: string[];  // 可用模型列表（从 API 获取）
  onRefresh: () => void;   // 刷新模型列表回调（触发连接测试）
  isTesting: boolean;      // 是否正在测试连接
}

/**
 * 模型选择输入组件
 * 功能：
 * - 支持手动输入任意模型名称
 * - 显示可用模型下拉列表（有数据时）
 * - 下拉列表支持搜索过滤（不区分大小写）
 * - 显示模型芯片按钮供快速选择
 * - 点击外部区域关闭下拉列表
 * - 连接测试按钮用于获取可用模型列表
 */
export const ModelSelectInput: React.FC<ModelSelectInputProps> = ({
  value,
  onChange,
  availableModels,
  onRefresh,
  isTesting,
}) => {
  // 是否显示下拉列表
  const [showDropdown, setShowDropdown] = useState(false);
  // 过滤关键词
  const [filter, setFilter] = useState('');
  // 输入框引用
  const inputRef = useRef<HTMLInputElement>(null);
  // 下拉列表引用
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部区域时关闭下拉列表
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

  // 根据过滤关键词筛选模型列表
  const filteredModels = availableModels.filter(m =>
    m.toLowerCase().includes(filter.toLowerCase())
  );

  /** 处理输入框内容变更：更新值并打开下拉列表 */
  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    setFilter(newValue);
    if (availableModels.length > 0) {
      setShowDropdown(true);
    }
  };

  /** 选择模型：更新值、同步过滤词、关闭下拉 */
  const handleSelectModel = (model: string) => {
    onChange(model);
    setFilter(model);
    setShowDropdown(false);
  };

  /** 输入框获得焦点：有可用模型时显示下拉列表 */
  const handleInputFocus = () => {
    if (availableModels.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {/* 文本输入框：支持下拉选择 */}
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
          {/* 下拉按钮：有可用模型时显示 */}
          {availableModels.length > 0 && (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-all active:scale-90"
              style={{ color: 'var(--text-muted)' }}
            >
              <ChevronDown size={16} />
            </button>
          )}

          {/* 下拉列表：显示过滤后的模型 */}
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
                  className="w-full text-left px-4 py-2 text-sm transition-all active:scale-[0.98]"
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

        {/* 连接测试按钮：点击获取可用模型列表 */}
        <button
          onClick={onRefresh}
          disabled={isTesting}
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          style={{ background: 'var(--bg-button)' }}
        >
          {isTesting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Wifi size={16} />
          )}
        </button>
      </div>

      {/* 模型芯片列表：用于快速选择 */}
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
                className="px-2 py-1 rounded text-xs transition-all active:scale-90 whitespace-nowrap"
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

      {/* 无可用模型时的提示 */}
      {availableModels.length === 0 && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          点击右侧按钮测试连接并获取可用模型列表，或直接输入模型名称
        </div>
      )}
    </div>
  );
};
