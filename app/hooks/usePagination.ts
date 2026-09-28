import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { pack } from "../lib/pagination";

export function usePagination(blockCount: number) {
  const measurerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<number[][]>([
    Array.from({ length: blockCount }, (_, i) => i),
  ]);

  const measure = useCallback(() => {
    const el = measurerRef.current;
    if (!el) return;
    const heights = Array.from(el.children).map(
      (c) => (c as HTMLElement).getBoundingClientRect().height,
    );
    const next = pack(heights);
    setPages((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
    );
  }, []);

  useLayoutEffect(() => {
    measure();
  });

  useLayoutEffect(() => {
    const el = measurerRef.current;
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [measure]);

  return { measurerRef, pages };
}
