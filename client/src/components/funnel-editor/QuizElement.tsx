import { useState } from "react";
import { Plus, Trash2, GripVertical, Trophy, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

/**
 * Quiz-Frage mit Punktewerten für jede Antwort
 */
export interface QuizQuestion {
  id: string;
  question: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  text: string;
  points: Record<string, number>; // resultId -> points
}

/**
 * Quiz-Ergebnis mit Beschreibung und Punktebereich
 */
export interface QuizResult {
  id: string;
  title: string;
  description: string;
  minPoints: number;
  maxPoints: number;
  color: string;
}

/**
 * Quiz-Konfiguration für ein Element
 */
export interface QuizConfig {
  questions: QuizQuestion[];
  results: QuizResult[];
  showProgressBar: boolean;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
}

interface QuizEditorProps {
  config: QuizConfig;
  onChange: (config: QuizConfig) => void;
}

/**
 * Quiz-Editor Komponente für den Funnel-Editor.
 * Ermöglicht das Erstellen von Quiz-Fragen mit Ergebnis-Mapping.
 */
export function QuizEditor({ config, onChange }: QuizEditorProps) {
  const [activeSection, setActiveSection] = useState<string>("questions");

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: "Neue Frage",
      answers: [
        { id: `a-${Date.now()}-1`, text: "Antwort 1", points: {} },
        { id: `a-${Date.now()}-2`, text: "Antwort 2", points: {} },
      ],
    };
    onChange({
      ...config,
      questions: [...config.questions, newQuestion],
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    onChange({
      ...config,
      questions: config.questions.map((q) =>
        q.id === questionId ? { ...q, ...updates } : q
      ),
    });
  };

  const removeQuestion = (questionId: string) => {
    onChange({
      ...config,
      questions: config.questions.filter((q) => q.id !== questionId),
    });
  };

  const addAnswer = (questionId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (!question) return;

    const newAnswer: QuizAnswer = {
      id: `a-${Date.now()}`,
      text: `Antwort ${question.answers.length + 1}`,
      points: {},
    };

    updateQuestion(questionId, {
      answers: [...question.answers, newAnswer],
    });
  };

  const updateAnswer = (
    questionId: string,
    answerId: string,
    updates: Partial<QuizAnswer>
  ) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (!question) return;

    updateQuestion(questionId, {
      answers: question.answers.map((a) =>
        a.id === answerId ? { ...a, ...updates } : a
      ),
    });
  };

  const removeAnswer = (questionId: string, answerId: string) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (!question || question.answers.length <= 2) return;

    updateQuestion(questionId, {
      answers: question.answers.filter((a) => a.id !== answerId),
    });
  };

  const addResult = () => {
    const newResult: QuizResult = {
      id: `r-${Date.now()}`,
      title: "Neues Ergebnis",
      description: "Beschreibung des Ergebnisses...",
      minPoints: 0,
      maxPoints: 10,
      color: "#7C3AED",
    };
    onChange({
      ...config,
      results: [...config.results, newResult],
    });
  };

  const updateResult = (resultId: string, updates: Partial<QuizResult>) => {
    onChange({
      ...config,
      results: config.results.map((r) =>
        r.id === resultId ? { ...r, ...updates } : r
      ),
    });
  };

  const removeResult = (resultId: string) => {
    onChange({
      ...config,
      results: config.results.filter((r) => r.id !== resultId),
    });
  };

  const setAnswerPoints = (
    questionId: string,
    answerId: string,
    resultId: string,
    points: number
  ) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (!question) return;

    const answer = question.answers.find((a) => a.id === answerId);
    if (!answer) return;

    updateAnswer(questionId, answerId, {
      points: { ...answer.points, [resultId]: points },
    });
  };

  return (
    <div className="space-y-4">
      <Accordion
        type="single"
        collapsible
        value={activeSection}
        onValueChange={setActiveSection}
      >
        {/* Fragen-Sektion */}
        <AccordionItem value="questions">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span>Fragen</span>
              <Badge variant="secondary">{config.questions.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {config.questions.map((question, qIndex) => (
                <Card key={question.id} className="border-l-4 border-l-primary">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Frage {qIndex + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-auto"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2 px-4 space-y-3">
                    <Input
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question.id, { question: e.target.value })
                      }
                      placeholder="Deine Frage..."
                    />

                    <div className="space-y-2">
                      <Label className="text-xs">Antworten</Label>
                      {question.answers.map((answer, aIndex) => (
                        <div key={answer.id} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">
                            {aIndex + 1}.
                          </span>
                          <Input
                            value={answer.text}
                            onChange={(e) =>
                              updateAnswer(question.id, answer.id, {
                                text: e.target.value,
                              })
                            }
                            className="flex-1 h-8"
                            placeholder="Antwort..."
                          />
                          {question.answers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeAnswer(question.id, answer.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-8"
                        onClick={() => addAnswer(question.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Antwort hinzufügen
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-2" />
                Frage hinzufügen
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Ergebnisse-Sektion */}
        <AccordionItem value="results">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span>Ergebnisse</span>
              <Badge variant="secondary">{config.results.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {config.results.map((result) => (
                <Card key={result.id}>
                  <CardContent className="py-3 px-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={result.color}
                        onChange={(e) =>
                          updateResult(result.id, { color: e.target.value })
                        }
                        className="w-10 h-8 p-1 cursor-pointer"
                      />
                      <Input
                        value={result.title}
                        onChange={(e) =>
                          updateResult(result.id, { title: e.target.value })
                        }
                        placeholder="Ergebnis-Titel"
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeResult(result.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <Textarea
                      value={result.description}
                      onChange={(e) =>
                        updateResult(result.id, { description: e.target.value })
                      }
                      placeholder="Beschreibung des Ergebnisses..."
                      rows={2}
                    />

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <Label className="text-xs">Min. Punkte</Label>
                        <Input
                          type="number"
                          value={result.minPoints}
                          onChange={(e) =>
                            updateResult(result.id, {
                              minPoints: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Max. Punkte</Label>
                        <Input
                          type="number"
                          value={result.maxPoints}
                          onChange={(e) =>
                            updateResult(result.id, {
                              maxPoints: parseInt(e.target.value) || 0,
                            })
                          }
                          className="h-8"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" className="w-full" onClick={addResult}>
                <Plus className="h-4 w-4 mr-2" />
                Ergebnis hinzufügen
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Punkte-Mapping-Sektion */}
        <AccordionItem value="mapping">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Punkte-Mapping</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {config.results.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Füge zuerst Ergebnisse hinzu, um Punkte zuzuweisen.
                </p>
              ) : (
                config.questions.map((question, qIndex) => (
                  <Card key={question.id}>
                    <CardHeader className="py-2 px-4">
                      <CardTitle className="text-sm">
                        Frage {qIndex + 1}: {question.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 px-4">
                      <div className="space-y-2">
                        {question.answers.map((answer) => (
                          <div
                            key={answer.id}
                            className="flex items-center gap-2 p-2 bg-muted/50 rounded"
                          >
                            <span className="text-sm flex-1 truncate">
                              {answer.text}
                            </span>
                            {config.results.map((result) => (
                              <div
                                key={result.id}
                                className="flex items-center gap-1"
                              >
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: result.color }}
                                  title={result.title}
                                />
                                <Select
                                  value={String(answer.points[result.id] || 0)}
                                  onValueChange={(v) =>
                                    setAnswerPoints(
                                      question.id,
                                      answer.id,
                                      result.id,
                                      parseInt(v)
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-14 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[0, 1, 2, 3, 4, 5].map((p) => (
                                      <SelectItem key={p} value={String(p)}>
                                        {p} Pkt
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

/**
 * Standard-Quiz-Konfiguration für neue Quiz-Elemente
 */
export const defaultQuizConfig: QuizConfig = {
  questions: [
    {
      id: "q-1",
      question: "Wie würdest du dich selbst beschreiben?",
      answers: [
        { id: "a-1-1", text: "Kreativ und innovativ", points: { "r-1": 3, "r-2": 1 } },
        { id: "a-1-2", text: "Analytisch und strukturiert", points: { "r-1": 1, "r-2": 3 } },
        { id: "a-1-3", text: "Kommunikativ und teamorientiert", points: { "r-1": 2, "r-2": 2 } },
      ],
    },
  ],
  results: [
    {
      id: "r-1",
      title: "Der Visionär",
      description: "Du denkst groß und siehst Möglichkeiten, wo andere Hindernisse sehen.",
      minPoints: 0,
      maxPoints: 5,
      color: "#7C3AED",
    },
    {
      id: "r-2",
      title: "Der Stratege",
      description: "Du planst voraus und gehst methodisch an Herausforderungen heran.",
      minPoints: 6,
      maxPoints: 10,
      color: "#2563EB",
    },
  ],
  showProgressBar: true,
  shuffleQuestions: false,
  shuffleAnswers: false,
};

/**
 * Berechnet das Quiz-Ergebnis basierend auf den gegebenen Antworten
 */
export function calculateQuizResult(
  config: QuizConfig,
  answers: Record<string, string> // questionId -> answerId
): QuizResult | null {
  const resultPoints: Record<string, number> = {};

  // Initialisiere Punkte für alle Ergebnisse
  config.results.forEach((result) => {
    resultPoints[result.id] = 0;
  });

  // Summiere Punkte basierend auf Antworten
  Object.entries(answers).forEach(([questionId, answerId]) => {
    const question = config.questions.find((q) => q.id === questionId);
    if (!question) return;

    const answer = question.answers.find((a) => a.id === answerId);
    if (!answer) return;

    Object.entries(answer.points).forEach(([resultId, points]) => {
      resultPoints[resultId] = (resultPoints[resultId] || 0) + points;
    });
  });

  // Finde das Ergebnis mit den meisten Punkten
  let maxPoints = -1;
  let winningResult: QuizResult | null = null;

  config.results.forEach((result) => {
    const points = resultPoints[result.id] || 0;
    if (points > maxPoints) {
      maxPoints = points;
      winningResult = result;
    }
  });

  return winningResult;
}
