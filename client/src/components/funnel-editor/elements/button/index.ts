import { registry } from "../../registry/element-registry";
import { ButtonRender } from "./ButtonRender";
import { ButtonSettings } from "./ButtonSettings";

registry.register({
  type: "button",
  label: "Button",
  icon: "MousePointer",
  category: "basis",
  defaultProps: { content: "Klick mich" },
  defaultStyles: {},
  renderComponent: ButtonRender,
  settingsComponent: ButtonSettings,
});
