"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import TemplateSelector from "@/app/components/ui/TemplateSelector";
import { exclusivePanel, type Panel } from "@/app/lib/accordion";
import {
  SECTION_KEYS,
  SECTION_LABELS,
  type SectionKey,
} from "@/app/lib/readiness";
import {
  TEMPLATES,
  type TemplateId,
} from "@/app/lib/templates/templateDefinitions";

export interface InspectorSection {
  key: SectionKey;
  state: "none" | "partial" | "full";
}

function Accordion({
  panel,
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  panel: Panel;
  title: string;
  summary: string;
  open: boolean;
  onToggle: (panel: Panel) => void;
  children: React.ReactNode;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const headerId = `inspector-${uid}-${panel}-header`;
  const panelId = `inspector-${uid}-${panel}-panel`;
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-hairline bg-surface shadow-sm">
      <button
        type="button"
        id={headerId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onToggle(panel)}
        className="flex min-h-12 w-full items-center gap-2.5 px-3.5 text-left text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-bold tracking-[0.09em] text-muted uppercase">
          {title}
        </span>{" "}
        <span className="truncate text-[11px] font-bold text-accent">
          {summary}
        </span>{" "}
        <span
          aria-hidden="true"
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-[9px] border transition-[transform,background-color,color] duration-300 ${
            open
              ? "rotate-180 border-accent bg-accent-soft text-accent"
              : "border-hairline bg-canvas text-faint"
          }`}
        >
          <ChevronDown size={14} />
        </span>
      </button>
      {/* biome-ignore lint/a11y/useSemanticElements: role="region" is the required contract, not <section> */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          open ? "[grid-template-rows:1fr]" : "[grid-template-rows:0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="px-3.5 pt-0.5 pb-3.5">{children}</div>
        </div>
      </div>
    </div>
  );
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
  const [open, setOpen] = useState<Panel | null>("checklist");
  const orderedSections = SECTION_KEYS.map((key) =>
    sections.find((s) => s.key === key),
  ).filter((s): s is InspectorSection => s !== undefined);
  const complete = orderedSections.filter((s) => s.state === "full").length;
  const templateName = TEMPLATES[templateId]?.name ?? templateId;

  return (
    <aside className="flex min-w-0 flex-col gap-3">
      <Accordion
        panel="checklist"
        title="Checklist"
        summary={`${complete} / ${orderedSections.length}`}
        open={open === "checklist"}
        onToggle={(p) => setOpen((o) => exclusivePanel(o, p))}
      >
        <ul className="space-y-0.5">
          {orderedSections.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => onEditSection(s.key)}
                className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  aria-hidden="true"
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
      </Accordion>

      <Accordion
        panel="style"
        title="Style"
        summary={templateName}
        open={open === "style"}
        onToggle={(p) => setOpen((o) => exclusivePanel(o, p))}
      >
        <TemplateSelector
          selectedTemplate={templateId}
          selectedTheme={themeId}
          selectedFontPair={fontPairId}
          onTemplateChange={onTemplateChange}
          onThemeChange={onThemeChange}
          onFontPairChange={onFontPairChange}
        />
      </Accordion>

      {tailorSlot && (
        <Accordion
          panel="tailor"
          title="Tailor"
          summary="ready"
          open={open === "tailor"}
          onToggle={(p) => setOpen((o) => exclusivePanel(o, p))}
        >
          {tailorSlot}
        </Accordion>
      )}
    </aside>
  );
}
