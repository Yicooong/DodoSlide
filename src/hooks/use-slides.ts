/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
// 导入默认代码模板生成函数
import { getDefaultCode } from '../constants';
// 导入画布比例类型
import { CanvasRatio } from '../lib/canvas-config';

// 幻灯片接口定义
export interface Slide {
  id: string;       // 幻灯片唯一标识
  name: string;     // 幻灯片名称
  code: string;     // 幻灯片 JSX 代码
}

/**
 * 管理多个幻灯片的 Hook
 * 提供幻灯片的增删改查、复制、批量更新等功能
 * @param canvasRatio 画布比例，用于生成新幻灯片的默认代码
 */
export const useSlides = (canvasRatio: CanvasRatio = '16:9') => {
  // 幻灯片数组状态，初始包含一张默认幻灯片
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', name: '幻灯片 1', code: getDefaultCode(canvasRatio) }
  ]);
  // 当前选中的幻灯片索引
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  /**
   * 更新当前幻灯片的代码
   * @param newCode 新的 JSX 代码
   */
  const updateCurrentSlideCode = useCallback((newCode: string) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated[currentSlideIndex] = { ...updated[currentSlideIndex], code: newCode };
      return updated;
    });
  }, [currentSlideIndex]);

  /**
   * 添加新幻灯片
   * 使用默认代码模板创建新幻灯片并自动切换到该幻灯片
   */
  const addNewSlide = useCallback(() => {
    setSlides((prev: Slide[]) => {
      const newSlide: Slide = {
        id: Date.now().toString(),  // 使用时间戳作为唯一 ID
        name: `幻灯片 ${prev.length + 1}`,
        code: getDefaultCode(canvasRatio)
      };
      const newSlides = [...prev, newSlide];
      setCurrentSlideIndex(newSlides.length - 1);  // 切换到新添加的幻灯片
      return newSlides;
    });
  }, [canvasRatio]);

  /**
   * 删除指定索引的幻灯片
   * 至少保留一张幻灯片
   * @param index 要删除的幻灯片索引
   */
  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return; // 至少保留一张幻灯片
    setSlides((prev: Slide[]) => prev.filter((_: Slide, i: number) => i !== index));
    // 如果删除的是当前幻灯片或之前的幻灯片，调整当前索引
    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex((prev: number) => prev - 1);
    }
  }, [slides.length, currentSlideIndex]);

  /**
   * 重命名指定幻灯片
   * @param index 幻灯片索引
   * @param newName 新名称
   */
  const renameSlide = useCallback((index: number, newName: string) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  }, []);

  /**
   * 复制指定幻灯片
   * 在原幻灯片后插入副本并自动切换到副本
   * @param index 要复制的幻灯片索引
   */
  const duplicateSlide = useCallback((index: number) => {
    const slideToDuplicate = slides[index];
    const newSlide: Slide = {
      id: Date.now().toString(),
      name: `${slideToDuplicate.name} 副本`,
      code: slideToDuplicate.code
    };
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newSlide);  // 在原幻灯片后插入
      return updated;
    });
    setCurrentSlideIndex(index + 1);  // 切换到副本
  }, [slides]);

  /**
   * 批量替换所有幻灯片
   * 用于 AI 生成等场景一次性设置多张幻灯片
   * @param newSlides 新的幻灯片数组
   */
  const setSlidesBulk = useCallback((newSlides: Slide[]) => {
    setSlides(newSlides);
    setCurrentSlideIndex(0);  // 重置到第一张幻灯片
  }, []);

  /**
   * 更新指定索引幻灯片的代码
   * @param index 幻灯片索引
   * @param code 新的 JSX 代码
   */
  const setSlideCode = useCallback((index: number, code: string) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], code };
      }
      return updated;
    });
  }, []);

  /**
   * 在指定索引后插入多张幻灯片
   * @param afterIndex 插入位置之后的索引
   * @param newSlides 要插入的幻灯片数组
   */
  const insertSlides = useCallback((afterIndex: number, newSlides: Slide[]) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated.splice(afterIndex + 1, 0, ...newSlides);
      return updated;
    });
  }, []);

  // 返回所有状态和操作函数
  return {
    slides,
    currentSlideIndex,
    setCurrentSlideIndex,
    updateCurrentSlideCode,
    addNewSlide,
    deleteSlide,
    renameSlide,
    duplicateSlide,
    setSlidesBulk,
    setSlideCode,
    insertSlides,
  };
};
