/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { getDefaultCode } from '../constants';
import { CanvasRatio } from '../lib/canvas-config';

export interface Slide {
  id: string;
  name: string;
  code: string;
}

/**
 * Hook for managing multiple slides
 */
export const useSlides = (canvasRatio: CanvasRatio = '16:9') => {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', name: '幻灯片 1', code: getDefaultCode(canvasRatio) }
  ]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  /**
   * Update code for current slide
   */
  const updateCurrentSlideCode = useCallback((newCode: string) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated[currentSlideIndex] = { ...updated[currentSlideIndex], code: newCode };
      return updated;
    });
  }, [currentSlideIndex]);

  /**
   * Add a new slide
   */
  const addNewSlide = useCallback(() => {
    setSlides((prev: Slide[]) => {
      const newSlide: Slide = {
        id: Date.now().toString(),
        name: `幻灯片 ${prev.length + 1}`,
        code: getDefaultCode(canvasRatio)
      };
      const newSlides = [...prev, newSlide];
      setCurrentSlideIndex(newSlides.length - 1);
      return newSlides;
    });
  }, [canvasRatio]);

  /**
   * Delete a slide
   */
  const deleteSlide = useCallback((index: number) => {
    if (slides.length <= 1) return; // Keep at least one slide
    setSlides((prev: Slide[]) => prev.filter((_: Slide, i: number) => i !== index));
    if (currentSlideIndex >= index && currentSlideIndex > 0) {
      setCurrentSlideIndex((prev: number) => prev - 1);
    }
  }, [slides.length, currentSlideIndex]);

  /**
   * Rename a slide
   */
  const renameSlide = useCallback((index: number, newName: string) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], name: newName };
      return updated;
    });
  }, []);

  /**
   * Duplicate a slide
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
      updated.splice(index + 1, 0, newSlide);
      return updated;
    });
    setCurrentSlideIndex(index + 1);
  }, [slides]);

  /**
   * Replace all slides at once
   */
  const setSlidesBulk = useCallback((newSlides: Slide[]) => {
    setSlides(newSlides);
    setCurrentSlideIndex(0);
  }, []);

  /**
   * Update code for a specific slide by index
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
   * Insert slides after a given index
   */
  const insertSlides = useCallback((afterIndex: number, newSlides: Slide[]) => {
    setSlides((prev: Slide[]) => {
      const updated = [...prev];
      updated.splice(afterIndex + 1, 0, ...newSlides);
      return updated;
    });
  }, []);

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
