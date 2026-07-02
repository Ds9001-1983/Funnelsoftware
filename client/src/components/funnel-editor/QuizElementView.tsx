import { useEffect, useMemo } from "react";
import { RotateCcw } from "lucide-react";
import {
  calculateQuizResult,
  type QuizConfig,
  type QuizQuestion,
} from "./QuizElement";

/**
 * Key-Format der Quiz-Antworten in den funnelweiten formValues:
 * `${elementId}:${questionId}` → answerId. Unter dem reinen elementId-Key
 * steht nach Abschluss der Ergebnis-Titel (damit funktionieren `required`
 * und antwortbasiertes Routing über die bestehende Engine gratis).
 */
const quizAnswerKey = (elementId: string, questionId: string) =>
  `${elementId}:${questionId}`;

/**
 * Liest die Quiz-Antworten eines Elements aus den formValues zurück
 * (eine Quelle der Wahrheit fürs Key-Format — auch vom Lead-Submit genutzt).
 */
export function getQuizAnswersFromFormValues(
  elementId: string,
  questions: QuizQuestion[],
  formValues: Record<string, string>,
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const answerId = formValues[quizAnswerKey(elementId, q.id)];
    if (answerId) answers[q.id] = answerId;
  }
  return answers;
}

/** Deterministisches Fisher-Yates-Shuffle (Seed pro Mount via Math.random). */
function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface QuizElementViewProps {
  elementId: string;
  config: QuizConfig;
  textColor: string;
  primaryColor: string;
  formValues: Record<string, string>;
  updateFormValue: (elementId: string, value: string) => void;
}

/**
 * Interaktives Quiz für Public-Funnel und Editor-Vorschau: eine Frage pro
 * Schritt mit Auto-Advance, optionalem Fortschrittsbalken und Inline-
 * Ergebnis-Karte. Vollständig durch formValues kontrolliert — der aktuelle
 * Schritt ist die erste unbeantwortete Frage, dadurch übersteht der Zustand
 * Seitenwechsel im Funnel.
 */
export function QuizElementView({
  elementId,
  config,
  textColor,
  primaryColor,
  formValues,
  updateFormValue,
}: QuizElementViewProps) {
  // Reihenfolge einmal pro Fragen-Set mischen (stabil, solange das Quiz offen ist).
  const orderedQuestions = useMemo(
    () => (config.shuffleQuestions ? shuffled(config.questions) : config.questions),
    [config.questions, config.shuffleQuestions],
  );

  const answers = getQuizAnswersFromFormValues(elementId, config.questions, formValues);
  const currentQuestion = orderedQuestions.find((q) => !answers[q.id]);
  const isComplete = !currentQuestion && orderedQuestions.length > 0;
  // calculateQuizResult liefert eine Referenz auf das config-Objekt → stabile Identität.
  const result = isComplete ? calculateQuizResult(config, answers) : null;

  const answerOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return config.shuffleAnswers ? shuffled(currentQuestion.answers) : currentQuestion.answers;
  }, [currentQuestion, config.shuffleAnswers]);

  // Nach Abschluss den Ergebnis-Titel unter dem Element-Key ablegen —
  // Guard gegen Endlos-Loop: nur schreiben, wenn sich der Wert ändert.
  const storedValue = formValues[elementId];
  useEffect(() => {
    if (!isComplete) return;
    const title = result?.title ?? "Abgeschlossen";
    if (storedValue !== title) {
      updateFormValue(elementId, title);
    }
  }, [isComplete, result, storedValue, elementId, updateFormValue]);

  const restart = () => {
    for (const q of config.questions) {
      updateFormValue(quizAnswerKey(elementId, q.id), "");
    }
    updateFormValue(elementId, "");
  };

  if (orderedQuestions.length === 0) return null;

  // ===== Ergebnisansicht =====
  if (isComplete) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-left">
        <div className="h-1.5" style={{ backgroundColor: result?.color || primaryColor }} />
        <div className="p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Dein Ergebnis</p>
          {result ? (
            <>
              <h3 className="text-lg font-bold mb-1" style={{ color: result.color }}>
                {result.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{result.description}</p>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Quiz abgeschlossen — danke für deine Antworten!
            </p>
          )}
          <button
            type="button"
            onClick={restart}
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Quiz neu starten
          </button>
        </div>
      </div>
    );
  }

  // ===== Fragenansicht =====
  const currentIndex = orderedQuestions.findIndex((q) => q.id === currentQuestion!.id);
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / orderedQuestions.length) * 100;

  return (
    <div className="space-y-3 text-left">
      {config.showProgressBar && (
        <div className="space-y-1.5">
          <p className="text-xs opacity-70" style={{ color: textColor }}>
            Frage {currentIndex + 1} von {orderedQuestions.length}
          </p>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
        </div>
      )}

      <p className="text-sm font-medium" style={{ color: textColor }}>
        {currentQuestion!.question}
      </p>

      <div className="space-y-2">
        {answerOptions.map((answer) => (
          <button
            key={answer.id}
            type="button"
            onClick={() => updateFormValue(quizAnswerKey(elementId, currentQuestion!.id), answer.id)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 text-sm shadow-sm cursor-pointer transition-colors text-left"
          >
            <span
              className="w-4 h-4 rounded-full border-2 shrink-0"
              style={{ borderColor: "#d1d5db" }}
            />
            <span className="text-gray-900">{answer.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
