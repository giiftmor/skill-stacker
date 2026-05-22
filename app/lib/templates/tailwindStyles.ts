// app/lib/templates/tailwindStyles.ts
import { TEMPLATES, THEMES, FONT_PAIRS } from "./templateDefinitions";

export function getTemplateClasses(templateId: string, themeId?: string): string {
  const template = TEMPLATES[templateId];
  if (!template) return "";
  
  let theme = { primary: template.colorScheme.primary, secondary: template.colorScheme.secondary, accent: template.colorScheme.accent, text: template.colorScheme.text, background: template.colorScheme.background };
  
  if (themeId) {
    const themeGroup = Object.values(THEMES).find(g => g.some(t => t.id === themeId));
    const foundTheme = themeGroup?.find(t => t.id === themeId);
    if (foundTheme) {
      theme = foundTheme.colors;
    }
  }
  
  const isTwoColumn = template.layout === "two-column";
  
  if (templateId === "executive") {
    return isTwoColumn ? twoColumnLayout(theme) : executiveLayout(theme);
  }
  
  if (templateId === "modern") {
    return isTwoColumn ? twoColumnLayout(theme) : modernLayout(theme);
  }
  
  if (templateId === "twoColumn") {
    return twoColumnLayout(theme);
  }
  
  if (templateId === "academic") {
    return academicLayout(theme);
  }
  
  if (templateId === "creative") {
    return creativeLayout(theme);
  }
  
  return defaultLayout(theme);
}

function defaultLayout(theme: { primary: string; secondary: string; accent: string; text: string; background: string }) {
  return `
    .cv-preview {
      background: ${theme.background};
      font-family: Arial, sans-serif;
    }
    .cv-preview h1 {
      color: ${theme.primary};
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .cv-preview h2 {
      color: ${theme.primary};
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 2px solid ${theme.accent};
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    .cv-preview p, .cv-preview li {
      color: ${theme.text};
      font-size: 12px;
      line-height: 1.5;
    }
  `;
}

function executiveLayout(theme: { primary: string; secondary: string; accent: string; text: string; background: string }) {
  return `
    .cv-preview {
      background: ${theme.background};
      font-family: Georgia, serif;
    }
    .cv-preview .header {
      background: ${theme.primary};
      color: white;
      padding: 24px;
    }
    .cv-preview h1 {
      color: white;
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .cv-preview h2 {
      color: ${theme.accent};
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid ${theme.accent};
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    .cv-preview p, .cv-preview li {
      color: ${theme.text};
      font-size: 12px;
      line-height: 1.5;
    }
  `;
}

function modernLayout(theme: { primary: string; secondary: string; accent: string; text: string; background: string }) {
  return `
    .cv-preview {
      background: ${theme.background};
      font-family: Helvetica, sans-serif;
    }
    .cv-preview .header {
      background: ${theme.primary};
      color: white;
      padding: 20px;
    }
    .cv-preview h1 {
      color: white;
      font-size: 26px;
      font-weight: bold;
    }
    .cv-preview h2 {
      background: ${theme.accent};
      color: white;
      font-size: 14px;
      font-weight: bold;
      padding: 6px 12px;
      margin-bottom: 12px;
    }
    .cv-preview p, .cv-preview li {
      color: ${theme.text};
      font-size: 12px;
      line-height: 1.5;
    }
  `;
}

function twoColumnLayout(theme: { primary: string; secondary: string; accent: string; text: string; background: string }) {
  return `
    .cv-preview {
      background: ${theme.background};
      font-family: Arial, sans-serif;
    }
    .cv-preview .sidebar {
      background: ${theme.primary};
      color: white;
    }
    .cv-preview h1 {
      color: white;
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .cv-preview h2 {
      color: ${theme.accent};
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
      border-bottom: 1px solid ${theme.accent};
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .cv-preview .main-content h2 {
      color: ${theme.primary};
      border-bottom: 2px solid ${theme.accent};
    }
    .cv-preview p, .cv-preview li {
      color: ${theme.text};
      font-size: 12px;
      line-height: 1.5;
    }
    .cv-preview .sidebar p, .cv-preview .sidebar li {
      color: rgba(255,255,255,0.9);
    }
  `;
}

function academicLayout(theme: { primary: string; secondary: string; accent: string; text: string; background: string }) {
  return `
    .cv-preview {
      background: ${theme.background};
      font-family: Georgia, serif;
    }
    .cv-preview h1 {
      color: ${theme.primary};
      font-size: 26px;
      font-weight: bold;
      border-bottom: 3px solid ${theme.accent};
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .cv-preview h2 {
      color: ${theme.primary};
      font-size: 15px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .cv-preview p, .cv-preview li {
      color: ${theme.text};
      font-size: 11px;
      line-height: 1.6;
    }
  `;
}

function creativeLayout(theme: { primary: string; secondary: string; accent: string; text: string; background: string }) {
  return `
    .cv-preview {
      background: ${theme.background};
      font-family: Verdana, sans-serif;
    }
    .cv-preview h1 {
      color: ${theme.primary};
      font-size: 28px;
      font-weight: bold;
    }
    .cv-preview h2 {
      background: ${theme.accent};
      color: white;
      font-size: 14px;
      font-weight: bold;
      padding: 8px 16px;
      margin-bottom: 12px;
    }
    .cv-preview p, .cv-preview li {
      color: ${theme.text};
      font-size: 12px;
      line-height: 1.5;
    }
  `;
}

export function getTemplatePreview(templateId: string, themeId?: string) {
  const classes = getTemplateClasses(templateId, themeId);
  return `<style>${classes}</style>`;
}