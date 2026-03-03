import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const CheckboxRender = React.memo(function CheckboxRender({ element }: ElementRenderProps) {
  const options = element.options || [];

  const wrapStyle: React.CSSProperties = {};
  if (element.styles?.backgroundColor) wrapStyle.backgroundColor = element.styles.backgroundColor;
  if (element.styles?.padding) wrapStyle.padding = element.styles.padding;
  if (element.styles?.margin) wrapStyle.margin = element.styles.margin;
  if (element.styles?.borderRadius) wrapStyle.borderRadius = element.styles.borderRadius;
  if (element.styles?.color) wrapStyle.color = element.styles.color;

  return (
    <div className="w-full" style={wrapStyle}>
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {element.label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2.5">
            <div className="w-5 h-5 border border-gray-300 rounded-sm bg-white flex-shrink-0" />
            <span className="text-sm text-gray-700">{option}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
