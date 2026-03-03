import React from "react";
import { Star } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

const sizeMap: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export const IconRender = React.memo(function IconRender({
  element,
  primaryColor,
}: ElementRenderProps) {
  const size = sizeMap[element.iconSize ?? "md"] ?? 24;

  return (
    <div className="flex items-center justify-center w-full">
      <Star style={{ color: primaryColor, width: size, height: size }} />
    </div>
  );
});
