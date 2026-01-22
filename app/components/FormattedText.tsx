// app/components/FormattedText.tsx
import React from "react";
import {
  parseFormattedText,
  groupFormattedText,
  renderWithBold,
} from "../utils/textFormatter";

interface FormattedTextProps {
  text: string;
  className?: string;
}

const FormattedText: React.FC<FormattedTextProps> = ({
  text,
  className = "",
}) => {
  const parsedItems = parseFormattedText(text);
  const groupedItems = groupFormattedText(parsedItems);

  return (
    <div className={className}>
      {groupedItems.map((group, groupIdx) => {
        if (group.type === "paragraph") {
          return group.items.map((item, itemIdx) => (
            <p key={`${groupIdx}-${itemIdx}`} className="mb-2 leading-relaxed">
              {renderWithBold(item.content)}
            </p>
          ));
        }

        if (group.type === "bullet-list") {
          return (
            <ul key={groupIdx} className="list-disc pl-6 mb-3 space-y-1">
              {group.items.map((item, itemIdx) => (
                <li key={`${groupIdx}-${itemIdx}`} className="leading-relaxed">
                  {renderWithBold(item.content)}
                </li>
              ))}
            </ul>
          );
        }

        if (group.type === "numbered-list") {
          return (
            <ol key={groupIdx} className="list-decimal pl-6 mb-3 space-y-1">
              {group.items.map((item, itemIdx) => (
                <li key={`${groupIdx}-${itemIdx}`} className="leading-relaxed">
                  {renderWithBold(item.content)}
                </li>
              ))}
            </ol>
          );
        }

        return null;
      })}
    </div>
  );
};

export default FormattedText;
