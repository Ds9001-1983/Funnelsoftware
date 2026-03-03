import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const DividerRender = React.memo(function DividerRender({
  element,
  textColor,
}: ElementRenderProps) {
  const styles = element.styles ?? {};
  const dividerStyle = element.dividerStyle ?? "solid";

  const inlineStyle: React.CSSProperties = {
    backgroundColor: styles.backgroundColor ?? undefined,
    padding: styles.padding ?? undefined,
    margin: styles.margin ?? undefined,
    borderRadius: styles.borderRadius ?? undefined,
  };

  if (dividerStyle === "gradient") {
    return (
      <div style={inlineStyle}>
        <div
          className="h-0.5 w-full"
          style={{
            background: `linear-gradient(to right, transparent, ${styles.color ?? textColor}, transparent)`,
          }}
        />
      </div>
    );
  }

  return (
    <hr
      className="w-full border-0 border-t-2"
      style={{
        borderStyle: dividerStyle,
        borderColor: styles.color ?? textColor,
        ...inlineStyle,
      }}
    />
  );
});
