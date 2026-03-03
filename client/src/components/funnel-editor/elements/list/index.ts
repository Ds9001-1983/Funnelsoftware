import { registry } from "../../registry/element-registry";
import { ListRender } from "./ListRender";
import { ListSettings } from "./ListSettings";

registry.register({
  type: "list",
  label: "Liste",
  icon: "List",
  category: "erweitert",
  defaultProps: {
    listStyle: "check",
    listItems: [
      { id: "li-1", text: "Erster Punkt" },
      { id: "li-2", text: "Zweiter Punkt" },
      { id: "li-3", text: "Dritter Punkt" },
    ],
  },
  defaultStyles: {},
  renderComponent: ListRender,
  settingsComponent: ListSettings,
});
