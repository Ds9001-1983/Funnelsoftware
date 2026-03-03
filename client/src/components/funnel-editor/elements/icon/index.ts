import { registry } from "../../registry/element-registry";
import { IconRender } from "./IconRender";
import { IconSettings } from "./IconSettings";

registry.register({
  type: "icon",
  label: "Icon",
  icon: "Star",
  category: "erweitert",
  defaultProps: { iconName: "star", iconSize: "md" },
  defaultStyles: {},
  renderComponent: IconRender,
  settingsComponent: IconSettings,
});
