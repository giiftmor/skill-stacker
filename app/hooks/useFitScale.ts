import { useEffect, useRef, useState } from "react";

const A4_WIDTH_PX = 794; // 210mm at 96dpi, matches the fixed .cv-page width

export function useFitScale(ready: boolean) {
  const fitRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const measure = () => {
      const el = fitRef.current;
      if (!el) return;
      const cs = getComputedStyle(el);
      const avail =
        el.clientWidth -
        parseFloat(cs.paddingLeft) -
        parseFloat(cs.paddingRight);
      const next = avail > 0 ? Math.min(1, avail / A4_WIDTH_PX) : 1;
      setScale((prev) => (Math.abs(prev - next) > 0.005 ? next : prev));
    };
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    });
    if (fitRef.current) ro.observe(fitRef.current);
    document.fonts?.ready.then(measure);
    measure();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ready]);

  return { fitRef, scale };
}
