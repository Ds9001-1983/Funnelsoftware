import { registry } from "../../registry/element-registry";
import { ProgressBarRender } from "./ProgressBarRender";
import { ProgressBarSettings } from "./ProgressBarSettings";

registry.register({
  type: "progressBar",
  label: "Fortschrittsbalken",
  icon: "BarChart3",
  category: "erweitert",
  defaultProps: { content: "Fortschritt" },
  defaultStyles: {},
  renderComponent: ProgressBarRender,
  settingsComponent: ProgressBarSettings,
});
