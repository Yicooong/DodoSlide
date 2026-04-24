/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CanvasRatio = '16:9' | '4:3';

export interface CanvasConfig {
  ratio: CanvasRatio;
  label: string;
  icon: string;
  width: number;
  height: number;
  pptxWidthIn: number;
  pptxHeightIn: number;
  pptxLayout: string;
}

export const CANVAS_CONFIGS: Record<CanvasRatio, CanvasConfig> = {
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

export const getCanvasConfig = (ratio: CanvasRatio): CanvasConfig => {
  return CANVAS_CONFIGS[ratio] || CANVAS_CONFIGS['16:9'];
};
