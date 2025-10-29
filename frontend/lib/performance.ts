/**
 * Performance optimization utilities
 */

import { useEffect, useRef } from 'react';

/**
 * Debounce function - delays execution until after wait period
 * Useful for search inputs, resize events, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait period
 * Useful for scroll events, mouse movements, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }

    return lastResult;
  };
}

/**
 * Hook to detect if component is visible in viewport
 * Useful for lazy loading content
 */
export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { ref, isInView };
}

/**
 * Format large numbers efficiently
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Efficient deep comparison for React dependencies
 */
export function useDeepCompareMemo<T>(value: T): T {
  const ref = useRef<T>(value);
  const signalRef = useRef<number>(0);

  if (!isEqual(value, ref.current)) {
    ref.current = value;
    signalRef.current += 1;
  }

  return useMemo(() => ref.current, [signalRef.current]);
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !isEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Measure component render time (development only)
 */
export function useRenderTime(componentName: string) {
  if (process.env.NODE_ENV === 'production') return;

  const renderStart = performance.now();

  useEffect(() => {
    const renderEnd = performance.now();
    console.log(`[Performance] ${componentName} rendered in ${(renderEnd - renderStart).toFixed(2)}ms`);
  });
}

/**
 * Lazy load component with loading fallback
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const LazyComponent = lazy(factory);

  // Add preload method
  (LazyComponent as any).preload = factory;

  return LazyComponent;
}

/**
 * Preload data before navigation
 */
export function prefetchData(fetcher: () => Promise<any>) {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => fetcher());
    } else {
      setTimeout(() => fetcher(), 1);
    }
  }
}

// Import statements at the top
import { lazy, useEffect, useMemo, useState } from 'react';
