import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

const fontSizeMap: Record<string, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
  "4xl": "text-4xl",
};

export const HeadingRender = React.memo(function HeadingRender({
  element,
  textColor,
}: ElementRenderProps) {
  const styles = element.styles ?? {};
  const fontSize = fontSizeMap[styles.fontSize ?? "2xl"] ?? "text-2xl";

  const inlineStyle: React.CSSProperties = {
    color: styles.color ?? textColor,
    textAlign: (styles.textAlign as React.CSSProperties["textAlign"]) ?? undefined,
    fontWeight: styles.fontWeight ?? undefined,
    fontStyle: styles.fontStyle ?? undefined,
    backgroundColor: styles.backgroundColor ?? undefined,
    padding: styles.padding ?? undefined,
    margin: styles.margin ?? undefined,
    borderRadius: styles.borderRadius ?? undefined,
  };

  if (!element.content) {
    return (
      <h2
        className={`${fontSize} text-muted-foreground`}
        style={inlineStyle}
      >
        Überschrift
      </h2>
    );
  }

  return (
    <h2 className={fontSize} style={inlineStyle}>
      {element.content}
    </h2>
  );
});
