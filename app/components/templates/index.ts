import type { TemplatePreviewProps, TemplateSectionsResult, TemplateSection } from "@/app/types/global";

export type { TemplatePreviewProps, TemplateSectionsResult, TemplateSection };

export { getClassicSections } from "./ClassicPreview";
export { getExecutiveSections } from "./ExecutivePreview";
export { getModernSections } from "./ModernPreview";
export { getMinimalSections } from "./MinimalPreview";
export { getCreativeSections } from "./CreativePreview";
export { getTwoColumnSections } from "./TwoColumnPreview";
export { getAcademicSections } from "./AcademicPreview";

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
