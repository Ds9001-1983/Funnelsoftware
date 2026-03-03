import type { ElementSettingsProps } from "../../registry/element-registry";
import { QuizEditor, defaultQuizConfig } from "../../QuizElement";

export function QuizSettings({ element, onUpdate }: ElementSettingsProps) {
  const config = element.quizConfig ?? defaultQuizConfig;

  return (
    <QuizEditor
      config={config}
      onChange={(quizConfig) => onUpdate({ quizConfig })}
    />
  );
}
