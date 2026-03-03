import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const SocialProofRender = React.memo(function SocialProofRender({
  element,
}: ElementRenderProps) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-8 w-16 bg-gray-200/50 rounded"
        />
      ))}
    </div>
  );
});
