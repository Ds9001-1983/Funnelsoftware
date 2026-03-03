import { registry } from "../../registry/element-registry";
import { HeadingRender } from "./HeadingRender";
import { HeadingSettings } from "./HeadingSettings";

registry.register({
  type: "heading",
  label: "Überschrift",
  icon: "Type",
  category: "basis",
  defaultProps: { content: "Überschrift" },
  defaultStyles: { fontSize: "2xl", textAlign: "center" },
  renderComponent: HeadingRender,
  settingsComponent: HeadingSettings,
});
