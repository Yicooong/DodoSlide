/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
// 导入图标：Eye(显示)、EyeOff(隐藏)、Check(确认)
import { Eye, EyeOff, Check } from 'lucide-react';

/** API Key 输入组件属性接口 */
interface ApiKeyInputProps {
  value: string;           // 当前 API Key 值
  onChange: (value: string) => void;  // 值变更回调
  placeholder?: string;    // 占位符文本（默认：输入 API Key）
}

/**
 * API Key 输入组件
 * 功能：
 * - 密码类型输入框，默认隐藏输入内容
 * - 支持显示/隐藏切换（眼睛图标按钮）
 * - 下方显示脱敏后的 Key 预览（前4位 + 圆点 + 后4位）
 * - 绿色对勾表示已设置 Key
 */
export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({
  value,
  onChange,
  placeholder = '输入 API Key',
}) => {
  // 是否显示明文 Key
  const [showKey, setShowKey] = useState(false);

  /**
   * 生成脱敏后的 Key 显示文本
   * - 未设置：显示"未设置"
   * - 长度小于8：全部显示为圆点
   * - 其他：前4位 + 圆点 + 后4位
   */
  const renderMaskedKey = (key: string) => {
    if (!key) return '未设置';
    if (key.length < 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  return (
    <div>
      {/* 输入框区域：包含密码输入和显示/隐藏按钮 */}
      <div className="relative">
        <input
          type={showKey ? 'text' : 'password'}  // 切换输入类型
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl focus:outline-none pr-12"
          style={{
            background: 'var(--bg-input)',
            borderColor: 'var(--border-default)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        />
        {/* 显示/隐藏切换按钮：绝对定位在输入框右侧 */}
        <button
          onClick={() => setShowKey(!showKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-all active:scale-90"
          style={{ color: 'var(--text-muted)' }}
        >
          {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {/* 脱敏 Key 预览：绿色对勾表示已设置 */}
      <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        <Check size={12} style={{ color: value ? '#22c55e' : 'var(--text-muted)' }} />
        当前: {renderMaskedKey(value)}
      </div>
    </div>
  );
};
