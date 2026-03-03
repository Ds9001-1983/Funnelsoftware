import React from "react";
import { Play } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";

export const VideoRender = React.memo(function VideoRender({
  element,
}: ElementRenderProps) {
  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg flex items-center justify-center overflow-hidden">
      <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
        <Play className="w-8 h-8 text-gray-900 ml-1" />
      </div>
      {element.videoUrl && (
        <span className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/60 truncate px-4">
          {element.videoUrl}
        </span>
      )}
    </div>
  );
});
