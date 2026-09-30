export type Panel = "checklist" | "style" | "tailor";

export function exclusivePanel(open: Panel | null, next: Panel): Panel | null {
  return open === next ? null : next;
}
