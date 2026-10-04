import { FunnelRenderer } from "@/components/funnel-viewer/FunnelRenderer";
import { FunnelBranding } from "@/components/funnel-viewer/FunnelBranding";
import { getTemplateBySlug } from "@/lib/templates";
import { getMutedContrastColor } from "@/lib/utils";

export default function FreeFunnelContent() {
  const template = getTemplateBySlug("express-bewerbung")!;
  return <FunnelRenderer funnel={template} mode="preview" className="h-full"
    renderFooter={page => <div className="shrink-0 px-3 py-3 text-center text-xs" style={{ color: getMutedContrastColor(page.backgroundColor || template.theme.backgroundColor) }}>
      <FunnelBranding />
    </div>}
  />;
}
