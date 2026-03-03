import { registry } from "../../registry/element-registry";
import { TextRender } from "./TextRender";
import { TextSettings } from "./TextSettings";

registry.register({
  type: "text",
  label: "Text",
  icon: "AlignLeft",
  category: "basis",
  defaultProps: { content: "Text eingeben..." },
  defaultStyles: { fontSize: "sm" },
  renderComponent: TextRender,
  settingsComponent: TextSettings,
});
