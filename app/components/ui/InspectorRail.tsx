"use client";

import TemplateSelector from "@/app/components/ui/TemplateSelector";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  type SectionKey,
} from "@/app/lib/readiness";
import type { TemplateId } from "@/app/lib/templates/templateDefinitions";

export interface InspectorSection {
  key: SectionKey;
  state: "none" | "partial" | "full";
}

export function InspectorRail({
  sections,
  templateId,
  themeId,
  fontPairId,
  onTemplateChange,
  onThemeChange,
  onFontPairChange,
  onEditSection,
  tailorSlot,
}: {
  sections: InspectorSection[];
  templateId: TemplateId;
  themeId: string;
  fontPairId: string;
  onTemplateChange: (t: TemplateId) => void;
  onThemeChange: (t: string) => void;
  onFontPairChange: (t: string) => void;
  onEditSection: (key: SectionKey) => void;
  tailorSlot?: React.ReactNode;
}) {
  const orderedSections = SECTION_KEYS.map((key) =>
    sections.find((s) => s.key === key),
  ).filter((s): s is InspectorSection => s !== undefined);
  return (
    <aside className="w-72 shrink-0 overflow-y-auto border-l border-hairline bg-canvas p-4">
      <div className="rounded-lg border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Checklist
        </h2>
        <ul className="space-y-1">
          {orderedSections.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onEditSection(s.key)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-ink hover:bg-accent-soft"
              >
                <span
                  className={
                    s.state === "full"
                      ? "h-2 w-2 rounded-full bg-status-good"
                      : s.state === "partial"
                        ? "h-2 w-2 rounded-full bg-status-warn"
                        : "h-2 w-2 rounded-full bg-faint"
                  }
                />
                {SECTION_LABELS[s.key]}
                {s.state === "none" && (
                  <span className="ml-auto text-xs text-faint">Add?</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 rounded-lg border border-hairline bg-surface p-4">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Style
        </h2>
        <TemplateSelector
          selectedTemplate={templateId}
          selectedTheme={themeId}
          selectedFontPair={fontPairId}
          onTemplateChange={onTemplateChange}
          onThemeChange={onThemeChange}
          onFontPairChange={onFontPairChange}
        />
      </div>

      {tailorSlot && <div className="mt-4">{tailorSlot}</div>}
    </aside>
  );
}
