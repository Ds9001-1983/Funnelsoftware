import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const RadioRender = React.memo(function RadioRender({ element }: ElementRenderProps) {
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
          <div
            key={index}
            className="w-full border-2 border-gray-200 rounded-xl py-3.5 px-4 text-sm text-gray-700 bg-white cursor-default hover:border-gray-300 transition-colors"
          >
            {option}
          </div>
        ))}
      </div>
    </div>
  );
});
