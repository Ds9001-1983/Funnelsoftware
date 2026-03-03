import React from "react";
import { Calendar } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const DateRender = React.memo(function DateRender({ element }: ElementRenderProps) {
  return (
    <div className="w-full">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {element.label}
          {element.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="w-full border border-gray-200 rounded-lg shadow-sm px-3 py-2 text-sm bg-white flex items-center gap-2 cursor-default">
        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span className="text-gray-400">
          {element.placeholder || "Datum wählen..."}
        </span>
      </div>
    </div>
  );
});
