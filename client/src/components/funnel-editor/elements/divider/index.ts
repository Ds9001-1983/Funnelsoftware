import { registry } from "../../registry/element-registry";
import { DividerRender } from "./DividerRender";
import { DividerSettings } from "./DividerSettings";

registry.register({
  type: "divider",
  label: "Trennlinie",
  icon: "Minus",
  category: "basis",
  defaultProps: { dividerStyle: "solid" },
  defaultStyles: {},
  renderComponent: DividerRender,
  settingsComponent: DividerSettings,
});
