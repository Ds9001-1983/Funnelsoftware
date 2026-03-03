import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const ButtonRender = React.memo(function ButtonRender({
  element,
  primaryColor,
}: ElementRenderProps) {
  const styles = element.styles ?? {};

  const inlineStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor ?? primaryColor,
    color: styles.color ?? "#ffffff",
    padding: styles.padding ?? undefined,
    margin: styles.margin ?? undefined,
    borderRadius: styles.borderRadius ?? undefined,
  };

  return (
    <button
      type="button"
      className="w-full rounded-xl py-3 px-6 font-semibold shadow-lg transition-opacity hover:opacity-90"
      style={inlineStyle}
    >
      {element.content || "Klick mich"}
    </button>
  );
});
