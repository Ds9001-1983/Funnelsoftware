import { registry } from "../../registry/element-registry";
import { QuizRender } from "./QuizRender";
import { QuizSettings } from "./QuizSettings";

registry.register({
  type: "quiz",
  label: "Quiz",
  icon: "Brain",
  category: "funnel",
  defaultProps: { quizConfig: undefined },
  defaultStyles: {},
  renderComponent: QuizRender,
  settingsComponent: QuizSettings,
});
