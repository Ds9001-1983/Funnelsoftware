import { registry } from "../../registry/element-registry";
import { TimerRender } from "./TimerRender";
import { TimerSettings } from "./TimerSettings";

registry.register({
  type: "timer",
  label: "Timer",
  icon: "Clock",
  category: "erweitert",
  defaultProps: { timerEndDate: "", timerStyle: "countdown", timerShowDays: true },
  defaultStyles: {},
  renderComponent: TimerRender,
  settingsComponent: TimerSettings,
});
