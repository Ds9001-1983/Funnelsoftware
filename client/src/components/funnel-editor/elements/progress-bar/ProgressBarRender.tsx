import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const ProgressBarRender = React.memo(function ProgressBarRender({
  element,
  textColor,
  primaryColor,
}: ElementRenderProps) {
  const label = element.content || "Fortschritt";

  return (
    <div className="w-full space-y-2">
      <span className="text-sm font-medium" style={{ color: textColor }}>
        {label}
      </span>
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: "65%", backgroundColor: primaryColor }}
        />
      </div>
    </div>
  );
});
