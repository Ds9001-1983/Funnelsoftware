import { registry } from "../../registry/element-registry";
import { CheckboxRender } from "./CheckboxRender";
import { CheckboxSettings } from "./CheckboxSettings";

registry.register({
  type: "checkbox",
  label: "Checkbox",
  icon: "CheckSquare",
  category: "formular",
  defaultProps: { label: "Checkbox", options: ["Option 1"] },
  defaultStyles: {},
  renderComponent: CheckboxRender,
  settingsComponent: CheckboxSettings,
});
