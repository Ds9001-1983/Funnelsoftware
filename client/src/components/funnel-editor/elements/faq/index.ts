import { registry } from "../../registry/element-registry";
import { FaqRender } from "./FaqRender";
import { FaqSettings } from "./FaqSettings";

registry.register({
  type: "faq",
  label: "FAQ",
  icon: "HelpCircle",
  category: "erweitert",
  defaultProps: {
    faqItems: [
      { id: "faq-1", question: "Häufige Frage?", answer: "Hier steht die Antwort." },
    ],
  },
  defaultStyles: {},
  renderComponent: FaqRender,
  settingsComponent: FaqSettings,
});
