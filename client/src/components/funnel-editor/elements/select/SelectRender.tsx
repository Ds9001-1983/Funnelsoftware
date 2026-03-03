import React from "react";
import { ChevronDown } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const SelectRender = React.memo(function SelectRender({ element }: ElementRenderProps) {
  return (
    <div className="w-full">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {element.label}
          {element.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm bg-white flex items-center justify-between cursor-default">
        <span className="text-gray-400">
          {element.placeholder || "Option wählen..."}
        </span>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
});
