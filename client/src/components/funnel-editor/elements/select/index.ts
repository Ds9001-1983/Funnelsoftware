import { registry } from "../../registry/element-registry";
import { SelectRender } from "./SelectRender";
import { SelectSettings } from "./SelectSettings";

registry.register({
  type: "select",
  label: "Auswahl",
  icon: "ChevronDown",
  category: "formular",
  defaultProps: { placeholder: "Option wählen...", options: ["Option 1", "Option 2"], label: "", required: false },
  defaultStyles: {},
  renderComponent: SelectRender,
  settingsComponent: SelectSettings,
});
