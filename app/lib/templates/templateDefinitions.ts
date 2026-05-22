// app/lib/templates/templateDefinitions.ts
export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  supportsPhoto: boolean;
  layout: "single" | "two-column";
  sections: string[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
}

export interface FontPair {
  id: string;
  name: string;
  heading: string;
  body: string;
}

export const TEMPLATES: Record<string, TemplateDefinition> = {
  classic: {
    id: "classic",
    name: "Classic",
    description: "Clean traditional layout",
    colorScheme: {
      primary: "#333333",
      secondary: "#555555",
      accent: "#666666",
      text: "#333333",
      background: "#ffffff",
    },
    supportsPhoto: false,
    layout: "single",
    sections: ["personal", "profile", "experience", "education", "skills", "certificates", "references"],
  },
  executive: {
    id: "executive",
    name: "Executive",
    description: "Premium formal with dark header",
    colorScheme: {
      primary: "#1a1a2e",
      secondary: "#16213e",
      accent: "#c9a227",
      text: "#333333",
      background: "#ffffff",
    },
    supportsPhoto: false,
    layout: "single",
    sections: ["personal", "profile", "experience", "education", "skills", "certificates", "references"],
  },
  modern: {
    id: "modern",
    name: "Modern",
    description: "Bold left sidebar with teal accent",
    colorScheme: {
      primary: "#0f766e",
      secondary: "#115e59",
      accent: "#14b8a6",
      text: "#1f2937",
      background: "#ffffff",
    },
    supportsPhoto: false,
    layout: "single",
    sections: ["personal", "profile", "experience", "education", "skills", "certificates", "references"],
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean whitespace-heavy",
    colorScheme: {
      primary: "#000000",
      secondary: "#888888",
      accent: "#000000",
      text: "#333333",
      background: "#ffffff",
    },
    supportsPhoto: false,
    layout: "single",
    sections: ["personal", "profile", "experience", "education", "skills", "certificates", "references"],
  },
  creative: {
    id: "creative",
    name: "Creative",
    description: "Color-blocked sections with bold headers",
    colorScheme: {
      primary: "#7c3aed",
      secondary: "#6d28d9",
      accent: "#f97316",
      text: "#1f2937",
      background: "#ffffff",
    },
    supportsPhoto: false,
    layout: "single",
    sections: ["personal", "profile", "experience", "education", "skills", "certificates", "references"],
  },
  twoColumn: {
    id: "twoColumn",
    name: "Two-Column",
    description: "Left sidebar for skills and photo",
    colorScheme: {
      primary: "#1e3a5f",
      secondary: "#2d4a6f",
      accent: "#3d5a7f",
      text: "#333333",
      background: "#ffffff",
    },
    supportsPhoto: true,
    layout: "two-column",
    sections: ["personal", "profile", "experience", "education", "certificates", "references"],
  },
  academic: {
    id: "academic",
    name: "Academic",
    description: "Structured citation-style layout",
    colorScheme: {
      primary: "#1e40af",
      secondary: "#1e3a8a",
      accent: "#3b82f6",
      text: "#1f2937",
      background: "#ffffff",
    },
    supportsPhoto: true,
    layout: "single",
    sections: ["personal", "profile", "experience", "education", "skills", "certificates", "references"],
  },
};

export const THEMES: Record<string, ThemeDefinition[]> = {
  default: [
    { id: "default-blue", name: "Blue", colors: { primary: "#1e40af", secondary: "#3b82f6", accent: "#60a5fa", text: "#1f2937", background: "#ffffff" } },
    { id: "default-green", name: "Green", colors: { primary: "#166534", secondary: "#22c55e", accent: "#4ade80", text: "#1f2937", background: "#ffffff" } },
    { id: "default-red", name: "Red", colors: { primary: "#991b1b", secondary: "#ef4444", accent: "#f87171", text: "#1f2937", background: "#ffffff" } },
    { id: "default-purple", name: "Purple", colors: { primary: "#6b21a8", secondary: "#a855f7", accent: "#c084fc", text: "#1f2937", background: "#ffffff" } },
    { id: "default-gray", name: "Gray", colors: { primary: "#374151", secondary: "#6b7280", accent: "#9ca3af", text: "#1f2937", background: "#ffffff" } },
  ],
  executive: [
    { id: "exec-navy-gold", name: "Navy Gold", colors: { primary: "#1a1a2e", secondary: "#16213e", accent: "#c9a227", text: "#333333", background: "#ffffff" } },
    { id: "exec-black-silver", name: "Black Silver", colors: { primary: "#0f0f0f", secondary: "#2d2d2d", accent: "#c0c0c0", text: "#333333", background: "#ffffff" } },
    { id: "exec-dark-green", name: "Dark Green", colors: { primary: "#1a2e1a", secondary: "#2d4a2d", accent: "#8fbc8f", text: "#333333", background: "#ffffff" } },
  ],
  modern: [
    { id: "mod-teal", name: "Teal", colors: { primary: "#0f766e", secondary: "#14b8a6", accent: "#2dd4bf", text: "#1f2937", background: "#ffffff" } },
    { id: "mod-blue", name: "Blue", colors: { primary: "#0369a1", secondary: "#0ea5e9", accent: "#38bdf8", text: "#1f2937", background: "#ffffff" } },
    { id: "mod-indigo", name: "Indigo", colors: { primary: "#4338ca", secondary: "#6366f1", accent: "#818cf8", text: "#1f2937", background: "#ffffff" } },
  ],
};

export const FONT_PAIRS: FontPair[] = [
  { id: "default", name: "Default", heading: "Arial, sans-serif", body: "Arial, sans-serif" },
  { id: "modern", name: "Modern", heading: "Helvetica, sans-serif", body: "Arial, sans-serif" },
  { id: "classic", name: "Classic", heading: "Times New Roman, serif", body: "Georgia, serif" },
  { id: "professional", name: "Professional", heading: "Georgia, serif", body: "Arial, sans-serif" },
  { id: "creative", name: "Creative", heading: "Verdana, sans-serif", body: "Verdana, sans-serif" },
];

export type TemplateId = keyof typeof TEMPLATES;
export type ThemeId = string;
export type FontPairId = string;

export interface TemplateSettings {
  template: TemplateId;
  theme: ThemeId;
  fontPair: FontPairId;
  colorScheme?: string;
}