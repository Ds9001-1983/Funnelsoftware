import { registry } from "../../registry/element-registry";
import { InputRender } from "./InputRender";
import { InputSettings } from "./InputSettings";

registry.register({
  type: "input",
  label: "Eingabefeld",
  icon: "Type",
  category: "formular",
  defaultProps: { placeholder: "Eingabe...", label: "", required: false },
  defaultStyles: {},
  renderComponent: InputRender,
  settingsComponent: InputSettings,
});
