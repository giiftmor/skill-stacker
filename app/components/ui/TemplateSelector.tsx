// app/components/ui/TemplateSelector.tsx
"use client";
import {
  FONT_PAIRS,
  TEMPLATES,
  type TemplateId,
  THEMES,
} from "../../lib/templates/templateDefinitions";

interface TemplateSelectorProps {
  selectedTemplate: TemplateId;
  selectedTheme: string;
  selectedFontPair: string;
  onTemplateChange: (template: TemplateId) => void;
  onThemeChange: (theme: string) => void;
  onFontPairChange: (fontPair: string) => void;
}

export default function TemplateSelector({
  selectedTemplate,
  selectedTheme,
  selectedFontPair,
  onTemplateChange,
  onThemeChange,
  onFontPairChange,
}: TemplateSelectorProps) {
  const templateKeys = Object.keys(TEMPLATES);
  const themeOptions = THEMES[selectedTemplate] || THEMES.default;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-[family-name:var(--font-heading)] mb-2 text-sm text-ink">
          Select Template
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {templateKeys.map((key) => {
            const template = TEMPLATES[key as TemplateId];
            const isSelected = selectedTemplate === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onTemplateChange(key as TemplateId)}
                className={`rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-hairline bg-surface hover:border-faint"
                }`}
              >
                <div className="font-[family-name:var(--font-heading)] mb-1 text-sm text-ink">
                  {template.name}
                </div>
                <div className="text-xs text-muted">{template.description}</div>
                {template.supportsPhoto && (
                  <div className="mt-1 inline-block rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                    Photo
                  </div>
                )}
                {template.layout === "two-column" && (
                  <div className="mt-1 inline-block rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                    2-Col
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-heading)] mb-2 text-sm text-ink">
          Color Theme
        </h3>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((theme) => {
            const isSelected = selectedTheme === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onThemeChange(theme.id)}
                className={`flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? "border-accent bg-accent-soft"
                    : "border-hairline bg-surface hover:border-faint"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-4 w-4 shrink-0 rounded-full ${
                    isSelected
                      ? "ring-2 ring-accent ring-offset-2 ring-offset-surface"
                      : ""
                  }`}
                  style={{ backgroundColor: theme.colors.primary }}
                />
                <span className="text-sm text-ink">{theme.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-heading)] mb-2 text-sm text-ink">
          Font Pair
        </h3>
        <div className="flex flex-wrap gap-2">
          {FONT_PAIRS.map((pair) => {
            const isSelected = selectedFontPair === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onFontPairChange(pair.id)}
                className={`min-h-10 rounded-lg border px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  isSelected
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-hairline bg-surface text-ink hover:border-faint"
                }`}
              >
                <span className="text-sm">{pair.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
