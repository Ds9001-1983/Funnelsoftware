import React from "react";
import { Image, ChevronLeft, ChevronRight } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const SliderRender = React.memo(function SliderRender({
  element,
}: ElementRenderProps) {
  const slides = element.slides ?? [{ id: "s1" }, { id: "s2" }, { id: "s3" }];

  return (
    <div className="w-full space-y-3">
      <div className="relative aspect-[4/3] bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
        <Image className="w-12 h-12 text-gray-300" />

        <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`w-2 h-2 rounded-full ${
              index === 0 ? "bg-gray-800" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
});
