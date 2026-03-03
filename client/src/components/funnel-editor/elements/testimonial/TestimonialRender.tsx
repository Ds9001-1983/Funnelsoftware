import React from "react";
import { Star } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const TestimonialRender = React.memo(function TestimonialRender({
  element,
  textColor,
}: ElementRenderProps) {
  const slide = element.slides?.[0];
  const text = slide?.text ?? "Großartiger Service!";
  const author = slide?.author ?? "Kunde";
  const role = slide?.role ?? "Position";

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="text-base italic" style={{ color: textColor }}>
        &ldquo;{text}&rdquo;
      </p>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm" style={{ color: textColor }}>
            {author}
          </p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
});
