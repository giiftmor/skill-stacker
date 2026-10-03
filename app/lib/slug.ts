export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugFromId(fullName: string, id: number): string {
  return `${slugify(fullName) || "resume"}-${id.toString(16)}`;
}

export const VALID_SLUG = /^[a-z0-9-]+$/;
