import { registry } from "../../registry/element-registry";
import { RadioRender } from "./RadioRender";
import { RadioSettings } from "./RadioSettings";

registry.register({
  type: "radio",
  label: "Auswahl-Karten",
  icon: "CircleDot",
  category: "formular",
  defaultProps: { label: "", options: ["Option 1", "Option 2", "Option 3"] },
  defaultStyles: {},
  renderComponent: RadioRender,
  settingsComponent: RadioSettings,
});
