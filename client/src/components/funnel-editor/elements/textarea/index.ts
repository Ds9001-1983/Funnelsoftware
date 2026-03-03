import { registry } from "../../registry/element-registry";
import { TextareaRender } from "./TextareaRender";
import { TextareaSettings } from "./TextareaSettings";

registry.register({
  type: "textarea",
  label: "Textbereich",
  icon: "MessageSquare",
  category: "formular",
  defaultProps: { placeholder: "Nachricht...", label: "", required: false },
  defaultStyles: {},
  renderComponent: TextareaRender,
  settingsComponent: TextareaSettings,
});
