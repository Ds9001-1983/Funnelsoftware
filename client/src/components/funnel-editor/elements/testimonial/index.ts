import { registry } from "../../registry/element-registry";
import { TestimonialRender } from "./TestimonialRender";
import { TestimonialSettings } from "./TestimonialSettings";

registry.register({
  type: "testimonial",
  label: "Testimonial",
  icon: "Star",
  category: "erweitert",
  defaultProps: {
    slides: [
      { id: "slide-1", text: "Großartiger Service!", author: "Kunde", role: "Position" },
    ],
  },
  defaultStyles: {},
  renderComponent: TestimonialRender,
  settingsComponent: TestimonialSettings,
});
