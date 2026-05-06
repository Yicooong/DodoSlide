/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// 画布比例类型：16:9 宽屏或 4:3 标准
export type CanvasRatio = '16:9' | '4:3';

// 画布配置接口定义
export interface CanvasConfig {
  ratio: CanvasRatio;      // 画布比例
  label: string;           // 显示标签
  icon: string;            // 图标
  width: number;           // 画布宽度（像素）
  height: number;          // 画布高度（像素）
  pptxWidthIn: number;     // PPTX 导出宽度（英寸）
  pptxHeightIn: number;    // PPTX 导出高度（英寸）
  pptxLayout: string;      // PPTX 布局名称
}

// 画布配置对象，包含所有支持的画布比例
export const CANVAS_CONFIGS: Record<CanvasRatio, CanvasConfig> = {
  // 16:9 宽屏配置（默认）
  '16:9': {
    ratio: '16:9',
    label: '16:9 宽屏',
    icon: '🖥️',
    width: 1280,
    height: 720,
    pptxWidthIn: 13.33,
    pptxHeightIn: 7.5,
    pptxLayout: 'LAYOUT_16x9',
  },
  // 4:3 标准配置
  '4:3': {
    ratio: '4:3',
    label: '4:3 标准',
    icon: '📺',
    width: 1024,
    height: 768,
    pptxWidthIn: 10,
    pptxHeightIn: 7.5,
    pptxLayout: 'LAYOUT_4x3',
  },
};

/**
 * 根据画布比例获取对应的画布配置
 * 如果比例不存在，则返回默认的 16:9 配置
 * @param ratio 画布比例
 * @returns 画布配置对象
 */
export const getCanvasConfig = (ratio: CanvasRatio): CanvasConfig => {
  return CANVAS_CONFIGS[ratio] || CANVAS_CONFIGS['16:9'];
};
