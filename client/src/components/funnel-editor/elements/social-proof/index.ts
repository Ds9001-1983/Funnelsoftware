import { registry } from "../../registry/element-registry";
import { SocialProofRender } from "./SocialProofRender";
import { SocialProofSettings } from "./SocialProofSettings";

registry.register({
  type: "socialProof",
  label: "Social Proof",
  icon: "Award",
  category: "erweitert",
  defaultProps: { socialProofType: "badges" },
  defaultStyles: {},
  renderComponent: SocialProofRender,
  settingsComponent: SocialProofSettings,
});
