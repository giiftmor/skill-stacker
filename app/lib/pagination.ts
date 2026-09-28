export const MM = 96 / 25.4;
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const PAGE_PADDING_MM = 15;
export const PAGE_INNER_PX =
  (A4_HEIGHT_MM - PAGE_PADDING_MM * 2) * MM;

export function pack(heights: number[]): number[][] {
  const pages: number[][] = [[]];
  let used = 0;
  heights.forEach((h, i) => {
    const current = pages[pages.length - 1];
    if (used + h > PAGE_INNER_PX && current.length > 0) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1].push(i);
    used += h;
  });
  return pages;
}
