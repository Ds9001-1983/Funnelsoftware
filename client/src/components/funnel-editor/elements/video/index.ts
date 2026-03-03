import { registry } from "../../registry/element-registry";
import { VideoRender } from "./VideoRender";
import { VideoSettings } from "./VideoSettings";

registry.register({
  type: "video",
  label: "Video",
  icon: "Video",
  category: "erweitert",
  defaultProps: { videoUrl: "", videoType: "youtube", videoAutoplay: false },
  defaultStyles: {},
  renderComponent: VideoRender,
  settingsComponent: VideoSettings,
});
