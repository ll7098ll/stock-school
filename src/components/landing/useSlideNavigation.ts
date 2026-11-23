import { useEffect, useRef, useState, useCallback } from 'react';

interface UseSlideNavigationOptions {
  slideCount: number;
  disabled?: boolean;
}

export function useSlideNavigation({ slideCount, disabled = false }: UseSlideNavigationOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [visitedSlides, setVisitedSlides] = useState<Set<number>>(() => new Set([0]));

  const registerSlide = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      slideRefs.current[index] = el;
    },
    []
  );

  const scrollToSlide = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(slideCount - 1, index));
      const target = slideRefs.current[clamped];
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [slideCount]
  );

  // Observe visible slides inside the scroll container
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        for (const entry of entries) {
          const idx = Number((entry.target as HTMLElement).dataset.slideIndex);
          if (Number.isNaN(idx)) continue;

          if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
            setVisitedSlides((prev) => {
              if (prev.has(idx)) return prev;
              const next = new Set(prev);
              next.add(idx);
              return next;
            });
          }

          if (entry.isIntersecting && entry.intersectionRatio >= bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = idx;
          }
        }

        if (bestIndex !== -1 && bestRatio >= 0.4) {
          setActiveSlide(bestIndex);
        }
      },
      {
        root,
        threshold: [0.15, 0.4, 0.65],
      }
    );

    slideRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [slideCount]);

  // Keyboard navigation (ArrowUp/Down, PageUp/Down) when not typing or in modal
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          active.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (activeSlide < slideCount - 1) {
          e.preventDefault();
          scrollToSlide(activeSlide + 1);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (activeSlide > 0) {
          e.preventDefault();
          scrollToSlide(activeSlide - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlide, slideCount, disabled, scrollToSlide]);

  return {
    containerRef,
    activeSlide,
    visitedSlides,
    registerSlide,
    scrollToSlide,
  };
}
