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
        <h3 className="text-lg font-semibold mb-3">Select Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {templateKeys.map((key) => {
            const template = TEMPLATES[key as TemplateId];
            const isSelected = selectedTemplate === key;
            return (
              <button
                key={key}
                onClick={() => onTemplateChange(key as TemplateId)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="text-xs font-bold mb-1">{template.name}</div>
                <div className="text-xs text-gray-500">{template.description}</div>
                {template.supportsPhoto && (
                  <div className="text-xs text-blue-500 mt-1">📷 Photo</div>
                )}
                {template.layout === "two-column" && (
                  <div className="text-xs text-purple-500 mt-1">📐 2-Col</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Color Theme</h3>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                selectedTheme === theme.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: theme.colors.primary }}
              />
              <span className="text-sm">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Font Pair</h3>
        <div className="flex flex-wrap gap-2">
          {FONT_PAIRS.map((pair) => (
            <button
              key={pair.id}
              onClick={() => onFontPairChange(pair.id)}
              className={`px-3 py-2 rounded-lg border ${
                selectedFontPair === pair.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
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