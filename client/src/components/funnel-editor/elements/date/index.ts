import { registry } from "../../registry/element-registry";
import { DateRender } from "./DateRender";
import { DateSettings } from "./DateSettings";

registry.register({
  type: "date",
  label: "Datum",
  icon: "Calendar",
  category: "formular",
  defaultProps: { label: "", placeholder: "Datum wählen...", includeTime: false, required: false },
  defaultStyles: {},
  renderComponent: DateRender,
  settingsComponent: DateSettings,
});
