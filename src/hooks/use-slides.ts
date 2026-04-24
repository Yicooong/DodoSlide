/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';
import { DEFAULT_CODE } from '../constants';

export interface Slide {
  id: string;
  name: string;
  code: string;
}

/**
 * Hook for managing multiple slides
 */
export const useSlides = () => {
  const [slides, setSlides] = useState<Slide[]>([
    { id: '1', name: '幻灯片 1', code: DEFAULT_CODE }
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
    const newSlide: Slide = {
      id: Date.now().toString(),
      name: `幻灯片 ${slides.length + 1}`,
      code: DEFAULT_CODE
    };
    setSlides((prev: Slide[]) => [...prev, newSlide]);
    setCurrentSlideIndex(slides.length);
  }, [slides.length]);

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

  return {
    slides,
    currentSlideIndex,
    setCurrentSlideIndex,
    updateCurrentSlideCode,
    addNewSlide,
    deleteSlide,
    renameSlide,
    duplicateSlide,
  };
};
