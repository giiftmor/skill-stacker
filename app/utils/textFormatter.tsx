// app/utils/textFormatter.ts

import React from "react";

/**
 * Converts markdown-style text to formatted elements
 * Supports:
 * - Lines starting with "- " or "* " become bullet points
 * - Lines starting with numbers (1. 2. etc.) become numbered lists
 * - **bold** becomes bold text
 * - Empty lines create paragraphs
 */

export interface FormattedText {
  type: "paragraph" | "bullet" | "numbered";
  content: string;
  number?: number;
}

export function parseFormattedText(text: string): FormattedText[] {
  if (!text) return [];

  const lines = text.split("\n");
  const result: FormattedText[] = [];
  let currentParagraph = "";

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines but close current paragraph
    if (!trimmedLine) {
      if (currentParagraph) {
        result.push({ type: "paragraph", content: currentParagraph.trim() });
        currentParagraph = "";
      }
      continue;
    }

    // Check for bullet points (- or *)
    if (
      trimmedLine.startsWith("- ") ||
      trimmedLine.startsWith("* ") ||
      trimmedLine.startsWith("• ")
    ) {
      if (currentParagraph) {
        result.push({ type: "paragraph", content: currentParagraph.trim() });
        currentParagraph = "";
      }
      result.push({
        type: "bullet",
        content: trimmedLine.substring(2).trim(),
      });
      continue;
    }

    // Check for numbered lists (1. 2. 3. etc.)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (numberedMatch) {
      if (currentParagraph) {
        result.push({ type: "paragraph", content: currentParagraph.trim() });
        currentParagraph = "";
      }
      result.push({
        type: "numbered",
        content: numberedMatch[2].trim(),
        number: parseInt(numberedMatch[1]),
      });
      continue;
    }

    // Regular text - add to current paragraph
    currentParagraph += (currentParagraph ? " " : "") + trimmedLine;
  }

  // Add remaining paragraph
  if (currentParagraph) {
    result.push({ type: "paragraph", content: currentParagraph.trim() });
  }

  return result;
}

/**
 * Applies bold formatting (**text** becomes bold)
 */
export function renderWithBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong>{part.slice(2, -2)}</strong>;
    }
    return <span key={idx}>{part}</span>;
  });
}

/**
 * Groups consecutive items by type for proper list rendering
 */
export function groupFormattedText(items: FormattedText[]): Array<{
  type: "paragraph" | "bullet-list" | "numbered-list";
  items: FormattedText[];
}> {
  const groups: Array<{
    type: "paragraph" | "bullet-list" | "numbered-list";
    items: FormattedText[];
  }> = [];

  let currentGroup: (typeof groups)[0] | null = null;

  for (const item of items) {
    if (item.type === "paragraph") {
      groups.push({ type: "paragraph", items: [item] });
      currentGroup = null;
    } else if (item.type === "bullet") {
      if (currentGroup?.type === "bullet-list") {
        currentGroup.items.push(item);
      } else {
        currentGroup = { type: "bullet-list", items: [item] };
        groups.push(currentGroup);
      }
    } else if (item.type === "numbered") {
      if (currentGroup?.type === "numbered-list") {
        currentGroup.items.push(item);
      } else {
        currentGroup = { type: "numbered-list", items: [item] };
        groups.push(currentGroup);
      }
    }
  }

  return groups;
}
