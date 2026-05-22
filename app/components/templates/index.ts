import type { TemplatePreviewProps, TemplateSectionsResult, TemplateSection } from "@/app/types/global";

export type { TemplatePreviewProps, TemplateSectionsResult, TemplateSection };

import { getClassicSections } from "./ClassicPreview";
import { getExecutiveSections } from "./ExecutivePreview";
import { getModernSections } from "./ModernPreview";
import { getMinimalSections } from "./MinimalPreview";
import { getCreativeSections } from "./CreativePreview";
import { getTwoColumnSections } from "./TwoColumnPreview";
import { getAcademicSections } from "./AcademicPreview";

export { getClassicSections, getExecutiveSections, getModernSections, getMinimalSections, getCreativeSections, getTwoColumnSections, getAcademicSections };

export function getTemplateSections(
  templateId: string,
  props: TemplatePreviewProps,
): TemplateSectionsResult {
  switch (templateId) {
    case "executive":
      return getExecutiveSections(props);
    case "modern":
      return getModernSections(props);
    case "minimal":
      return getMinimalSections(props);
    case "creative":
      return getCreativeSections(props);
    case "twoColumn":
      return getTwoColumnSections(props);
    case "academic":
      return getAcademicSections(props);
    case "classic":
    default:
      return getClassicSections(props);
  }
}
