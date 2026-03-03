import { registry } from "../../registry/element-registry";
import { SpacerRender } from "./SpacerRender";
import { SpacerSettings } from "./SpacerSettings";

registry.register({
  type: "spacer",
  label: "Abstand",
  icon: "Space",
  category: "basis",
  defaultProps: { spacerHeight: 32 },
  defaultStyles: {},
  renderComponent: SpacerRender,
  settingsComponent: SpacerSettings,
});
