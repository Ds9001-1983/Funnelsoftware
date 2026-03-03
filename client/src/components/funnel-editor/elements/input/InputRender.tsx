import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const InputRender = React.memo(function InputRender({ element }: ElementRenderProps) {
  return (
    <div className="w-full">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {element.label}
          {element.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <input
        type="text"
        readOnly
        placeholder={element.placeholder || "Eingabe..."}
        className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm bg-white placeholder:text-gray-400 cursor-default"
      />
    </div>
  );
});
