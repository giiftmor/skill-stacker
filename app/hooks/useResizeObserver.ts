import { useCallback, useRef, useState, useEffect } from "react";

interface UseResizeObserverOptions {
  debounceMs?: number;
}

interface MeasuredElement {
  key: string;
  height: number;
  width: number;
}

export function useResizeObserver(options: UseResizeObserverOptions = {}) {
  const { debounceMs = 100 } = options;
  const [measurements, setMeasurements] = useState<Map<string, MeasuredElement>>(new Map());
  const observerRef = useRef<ResizeObserver | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMeasurements = useRef<Map<string, MeasuredElement>>(new Map());

  const observe = useCallback((key: string, element: HTMLElement | null) => {
    if (!element) return;

    if (!observerRef.current) {
      observerRef.current = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const measuredKey = element.getAttribute("data-measure-key");
          if (measuredKey) {
            pendingMeasurements.current.set(measuredKey, {
              key: measuredKey,
              height: entry.borderBoxSize[0]?.blockSize || entry.contentRect.height,
              width: entry.borderBoxSize[0]?.inlineSize || entry.contentRect.width,
            });
          }
        });

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
          setMeasurements(new Map(pendingMeasurements.current));
        }, debounceMs);
      });
    }

    element.setAttribute("data-measure-key", key);
    observerRef.current.observe(element);
  }, [debounceMs]);

  const unobserve = useCallback((key: string, element: HTMLElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const getHeight = useCallback((key: string, fallback: number): number => {
    return measurements.get(key)?.height || fallback;
  }, [measurements]);

  const hasMeasured = useCallback((key: string): boolean => {
    return measurements.has(key);
  }, [measurements]);

  return {
    measurements,
    observe,
    unobserve,
    getHeight,
    hasMeasured,
  };
}

export default useResizeObserver;