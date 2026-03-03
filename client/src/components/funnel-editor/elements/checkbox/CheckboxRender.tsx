import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const CheckboxRender = React.memo(function CheckboxRender({ element }: ElementRenderProps) {
  const options = element.options || [];

  return (
    <div className="w-full">
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
