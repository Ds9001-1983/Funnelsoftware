import { registry } from "../../registry/element-registry";
import { ImageRender } from "./ImageRender";
import { ImageSettings } from "./ImageSettings";

registry.register({
  type: "image",
  label: "Bild",
  icon: "Image",
  category: "basis",
  defaultProps: { imageUrl: "", imageAlt: "" },
  defaultStyles: { borderRadius: "8px" },
  renderComponent: ImageRender,
  settingsComponent: ImageSettings,
});
