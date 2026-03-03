import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const SpacerRender = React.memo(function SpacerRender({
  element,
}: ElementRenderProps) {
  const height = element.spacerHeight ?? 32;

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {/* Faint dashed line to make the spacer visible in the editor */}
      <div
        className="absolute inset-x-0 top-1/2 border-t border-dashed border-gray-300"
        style={{ transform: "translateY(-50%)" }}
      />
    </div>
  );
});
