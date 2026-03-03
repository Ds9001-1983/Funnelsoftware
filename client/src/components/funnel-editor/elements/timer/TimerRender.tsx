import React from "react";
import type { ElementRenderProps } from "../../registry/element-registry";

const mockValues = [
  { label: "Tage", value: "00" },
  { label: "Std", value: "12" },
  { label: "Min", value: "45" },
  { label: "Sek", value: "30" },
];

export const TimerRender = React.memo(function TimerRender({
  element,
  textColor,
}: ElementRenderProps) {
  const showDays = element.timerShowDays !== false;
  const items = showDays ? mockValues : mockValues.slice(1);

  return (
    <div className="flex items-center justify-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col items-center">
          <div
            className="bg-gray-100 rounded-lg px-4 py-3 font-bold text-2xl min-w-[60px] text-center"
            style={{ color: textColor }}
          >
            {item.value}
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
});
