import React from "react";
import { Brain } from "lucide-react";
import type { ElementRenderProps } from "../../registry/element-registry";
import { defaultQuizConfig } from "../../QuizElement";

export const QuizRender = React.memo(function QuizRender({
  element,
  textColor,
  primaryColor,
}: ElementRenderProps) {
  const config = element.quizConfig ?? defaultQuizConfig;
  const firstQuestion = config.questions?.[0];

  if (!firstQuestion) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
        <Brain className="w-8 h-8" />
        <span className="text-sm">Quiz konfigurieren</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <h3
        className="text-base font-semibold text-center"
        style={{ color: textColor }}
      >
        {firstQuestion.question}
      </h3>
      <div className="space-y-2">
        {firstQuestion.answers.map((answer) => (
          <div
            key={answer.id}
            className="border rounded-lg p-3 text-sm text-center cursor-pointer hover:border-current transition-colors"
            style={{ color: textColor, borderColor: `${primaryColor}40` }}
          >
            {answer.text}
          </div>
        ))}
      </div>
    </div>
  );
});
