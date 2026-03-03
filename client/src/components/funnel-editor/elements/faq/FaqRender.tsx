import React from "react";
import { ChevronDown } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const FaqRender = React.memo(function FaqRender({
  element,
  textColor,
}: ElementRenderProps) {
  const items = element.faqItems ?? [
    { id: "faq-1", question: "Häufige Frage?", answer: "Hier steht die Antwort." },
  ];

  return (
    <div className="space-y-2 w-full">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-lg shadow-sm border p-3 flex items-center justify-between"
        >
          <span className="text-sm font-medium text-left" style={{ color: textColor }}>
            {item.question}
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
        </div>
      ))}
    </div>
  );
});
