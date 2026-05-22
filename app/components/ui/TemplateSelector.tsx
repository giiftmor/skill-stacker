// app/components/ui/TemplateSelector.tsx
"use client";
import { TEMPLATES, THEMES, FONT_PAIRS, TemplateId, TemplateSettings } from "../../lib/templates/templateDefinitions";

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
  const currentTemplate = TEMPLATES[selectedTemplate];
  const themeOptions = THEMES[selectedTemplate] || THEMES.default;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-base text-[#e8e6e3] mb-3">Select Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {templateKeys.map((key) => {
            const template = TEMPLATES[key as TemplateId];
            const isSelected = selectedTemplate === key;
            return (
              <button
                key={key}
                onClick={() => onTemplateChange(key as TemplateId)}
                className={`p-3 rounded-lg border transition-all text-left card-hover ${
                  isSelected
                    ? "border-[#d4a853] bg-[#d4a85315]"
                    : "border-[#333] bg-[#1a1a1a] hover:border-[#444]"
                }`}
              >
                <div className="font-[family-name:var(--font-heading)] text-sm text-[#e8e6e3] mb-1">{template.name}</div>
                <div className="text-xs text-[#666]">{template.description}</div>
                {template.supportsPhoto && (
                  <div className="text-xs text-[#d4a853] mt-1 bg-[#d4a85315] inline-block px-1.5 py-0.5 rounded">Photo</div>
                )}
                {template.layout === "two-column" && (
                  <div className="text-xs text-[#d4a853] mt-1 bg-[#d4a85315] inline-block px-1.5 py-0.5 rounded">2-Col</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-base text-[#e8e6e3] mb-3">Color Theme</h3>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                selectedTheme === theme.id
                  ? "border-[#d4a853] bg-[#d4a85315]"
                  : "border-[#333] bg-[#242424] hover:border-[#444]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full ${selectedTheme === theme.id ? "ring-2 ring-[#d4a853] ring-offset-2 ring-offset-[#0d0d0d]" : ""}`}
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span className="text-sm text-[#e8e6e3]">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-base text-[#e8e6e3] mb-3">Font Pair</h3>
        <div className="flex flex-wrap gap-2">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => onFontPairChange(pair.id)}
              className={`px-3 py-2 rounded-lg border ${
                selectedFontPair === pair.id
                  ? "bg-[#d4a85315] border-[#d4a853] text-[#d4a853]"
                  : "bg-[#242424] border-[#333] text-[#e8e6e3] hover:border-[#444]"
              }`}
            >
              <span className="text-sm">{pair.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}