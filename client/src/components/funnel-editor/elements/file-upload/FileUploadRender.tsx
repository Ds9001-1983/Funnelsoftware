import React from "react";
import { Upload } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const FileUploadRender = React.memo(function FileUploadRender({ element }: ElementRenderProps) {
  const typesLabel = element.acceptedFileTypes?.length
    ? element.acceptedFileTypes.join(", ")
    : "Alle Dateien";

  return (
    <div className="w-full">
      {element.label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {element.label}
          {element.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="w-full border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 py-8 flex flex-col items-center justify-center gap-2 cursor-default">
        <Upload className="h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">
          {element.label || "Datei hochladen"}
        </span>
        <span className="text-xs text-gray-400">
          {typesLabel}
        </span>
      </div>
    </div>
  );
});
