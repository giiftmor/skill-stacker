"use client";

import TemplateSelector from "@/app/components/ui/TemplateSelector";
import type { TemplateId } from "@/app/lib/templates/templateDefinitions";

export default function StepStyle(props: {
  selectedTemplate: TemplateId;
  selectedTheme: string;
  selectedFontPair: string;
  onTemplateChange: (t: TemplateId) => void;
  onThemeChange: (t: string) => void;
  onFontPairChange: (t: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm text-muted">Choose your template, accent, and font pairing. You can change these later in the editor.</p>
      <TemplateSelector {...props} />
    </div>
  );
}