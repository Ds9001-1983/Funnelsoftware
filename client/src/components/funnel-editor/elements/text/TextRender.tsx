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

export const TextRender = React.memo(function TextRender({
  element,
  textColor,
}: ElementRenderProps) {
  const styles = element.styles ?? {};
  const fontSize = fontSizeMap[styles.fontSize ?? "sm"] ?? "text-sm";

  const inlineStyle: React.CSSProperties = {
    color: styles.color ?? textColor,
    textAlign: (styles.textAlign as React.CSSProperties["textAlign"]) ?? undefined,
    fontWeight: styles.fontWeight ?? undefined,
    fontStyle: styles.fontStyle ?? undefined,
    backgroundColor: styles.backgroundColor ?? undefined,
    padding: styles.padding ?? undefined,
    margin: styles.margin ?? undefined,
    borderRadius: styles.borderRadius ?? undefined,
    whiteSpace: "pre-wrap",
  };

  if (!element.content) {
    return (
      <p
        className={`${fontSize} text-muted-foreground`}
        style={inlineStyle}
      >
        Text eingeben...
      </p>
    );
  }

  return (
    <p className={fontSize} style={inlineStyle}>
      {element.content}
    </p>
  );
});
