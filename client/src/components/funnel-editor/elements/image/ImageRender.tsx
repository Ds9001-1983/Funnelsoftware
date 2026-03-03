import React from "react";
import { Image as ImageIcon } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const ImageRender = React.memo(function ImageRender({
  element,
}: ElementRenderProps) {
  const styles = element.styles ?? {};

  const inlineStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor ?? undefined,
    padding: styles.padding ?? undefined,
    margin: styles.margin ?? undefined,
    borderRadius: styles.borderRadius ?? undefined,
  };

  if (element.imageUrl) {
    return (
      <img
        src={element.imageUrl}
        alt={element.imageAlt ?? ""}
        className="max-w-full rounded"
        style={inlineStyle}
      />
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-100 py-12 text-gray-400"
      style={inlineStyle}
    >
      <ImageIcon className="h-10 w-10" />
      <span className="text-sm">Bild hinzufügen</span>
    </div>
  );
});
