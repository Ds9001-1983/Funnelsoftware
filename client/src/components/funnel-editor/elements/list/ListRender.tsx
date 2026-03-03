import React from "react";
import { Check, Circle } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const ListRender = React.memo(function ListRender({
  element,
  textColor,
  primaryColor,
}: ElementRenderProps) {
  const items = element.listItems ?? [
    { id: "li-1", text: "Erster Punkt" },
    { id: "li-2", text: "Zweiter Punkt" },
    { id: "li-3", text: "Dritter Punkt" },
  ];
  const style = element.listStyle ?? "check";

  return (
    <div className="space-y-2 w-full text-left">
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          {style === "check" && (
            <Check className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
          )}
          {style === "bullet" && (
            <Circle className="w-3 h-3 flex-shrink-0 fill-current" style={{ color: primaryColor }} />
          )}
          {style === "number" && (
            <span
              className="text-sm font-semibold flex-shrink-0 min-w-[1.25rem]"
              style={{ color: primaryColor }}
            >
              {index + 1}.
            </span>
          )}
          <span className="text-sm" style={{ color: textColor }}>
            {item.text}
          </span>
        </div>
      ))}
    </div>
  );
});
