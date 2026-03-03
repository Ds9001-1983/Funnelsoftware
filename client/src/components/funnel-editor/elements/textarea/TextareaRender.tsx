import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const TextareaRender = React.memo(function TextareaRender({ element }: ElementRenderProps) {
  const wrapStyle: React.CSSProperties = {};
  if (element.styles?.backgroundColor) wrapStyle.backgroundColor = element.styles.backgroundColor;
  if (element.styles?.padding) wrapStyle.padding = element.styles.padding;
  if (element.styles?.margin) wrapStyle.margin = element.styles.margin;
  if (element.styles?.borderRadius) wrapStyle.borderRadius = element.styles.borderRadius;
  if (element.styles?.color) wrapStyle.color = element.styles.color;

  return (
    <div className="w-full" style={wrapStyle}>
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {element.label}
          {element.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        readOnly
        rows={3}
        placeholder={element.placeholder || "Nachricht..."}
        className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm bg-white placeholder:text-gray-400 cursor-default resize-none"
      />
    </div>
  );
});
