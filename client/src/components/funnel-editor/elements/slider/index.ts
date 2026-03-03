import { registry } from "../../registry/element-registry";
import { SliderRender } from "./SliderRender";
import { SliderSettings } from "./SliderSettings";

registry.register({
  type: "slider",
  label: "Slider",
  icon: "Image",
  category: "erweitert",
  defaultProps: {
    slides: [{ id: "s1" }, { id: "s2" }, { id: "s3" }],
  },
  defaultStyles: {},
  renderComponent: SliderRender,
  settingsComponent: SliderSettings,
});
