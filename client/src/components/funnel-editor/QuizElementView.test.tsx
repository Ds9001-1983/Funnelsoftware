import { useState } from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import userEvent from "@testing-library/user-event";
import { QuizElementView, getQuizAnswersFromFormValues } from "./QuizElementView";
import type { QuizConfig } from "./QuizElement";

const testConfig: QuizConfig = {
  questions: [
    {
      id: "q1",
      question: "Erste Frage?",
      answers: [
        { id: "a1", text: "Antwort A", points: { r1: 3, r2: 0 } },
        { id: "a2", text: "Antwort B", points: { r1: 0, r2: 3 } },
      ],
    },
    {
      id: "q2",
      question: "Zweite Frage?",
      answers: [
        { id: "a3", text: "Antwort C", points: { r1: 3, r2: 0 } },
        { id: "a4", text: "Antwort D", points: { r1: 0, r2: 3 } },
      ],
    },
  ],
  results: [
    { id: "r1", title: "Der Macher", description: "Du packst an.", minPoints: 0, maxPoints: 6, color: "#10B981" },
    { id: "r2", title: "Der Denker", description: "Du planst gern.", minPoints: 0, maxPoints: 6, color: "#2563EB" },
  ],
  showProgressBar: true,
  shuffleQuestions: false,
  shuffleAnswers: false,
};

/** Harness: hält formValues wie public-funnel.tsx in useState. */
function Harness({
  initialValues = {},
  onValuesChange,
}: {
  initialValues?: Record<string, string>;
  onValuesChange?: (values: Record<string, string>) => void;
}) {
  const [formValues, setFormValues] = useState<Record<string, string>>(initialValues);
  const updateFormValue = (id: string, value: string) => {
    setFormValues((prev) => {
      const next = { ...prev, [id]: value };
      onValuesChange?.(next);
      return next;
    });
  };
  return (
    <QuizElementView
      elementId="el-1"
      config={testConfig}
      textColor="#1a1a1a"
      primaryColor="#7C3AED"
      formValues={formValues}
      updateFormValue={updateFormValue}
    />
  );
}

describe("QuizElementView", () => {
  it("zeigt die erste Frage mit Fortschrittsanzeige", () => {
    render(<Harness />);
    expect(screen.getByText("Erste Frage?")).toBeInTheDocument();
    expect(screen.getByText("Frage 1 von 2")).toBeInTheDocument();
    expect(screen.getByText("Antwort A")).toBeInTheDocument();
    expect(screen.getByText("Antwort B")).toBeInTheDocument();
  });

  it("springt nach einer Antwort automatisch zur nächsten Frage", async () => {
    const user = userEvent.setup();
    let values: Record<string, string> = {};
    render(<Harness onValuesChange={(v) => (values = v)} />);

    await user.click(screen.getByText("Antwort A"));

    expect(screen.getByText("Zweite Frage?")).toBeInTheDocument();
    expect(screen.getByText("Frage 2 von 2")).toBeInTheDocument();
    expect(values["el-1:q1"]).toBe("a1");
  });

  it("zeigt nach der letzten Antwort das Ergebnis und schreibt den Titel in formValues", async () => {
    const user = userEvent.setup();
    let values: Record<string, string> = {};
    render(<Harness onValuesChange={(v) => (values = v)} />);

    await user.click(screen.getByText("Antwort A")); // q1 → r1 +3
    await user.click(screen.getByText("Antwort C")); // q2 → r1 +3

    expect(screen.getByText("Dein Ergebnis")).toBeInTheDocument();
    expect(screen.getByText("Der Macher")).toBeInTheDocument();
    expect(screen.getByText("Du packst an.")).toBeInTheDocument();
    expect(values["el-1"]).toBe("Der Macher");
  });

  it("setzt das Quiz über 'Quiz neu starten' zurück", async () => {
    const user = userEvent.setup();
    let values: Record<string, string> = {};
    render(<Harness onValuesChange={(v) => (values = v)} />);

    await user.click(screen.getByText("Antwort B"));
    await user.click(screen.getByText("Antwort D"));
    expect(screen.getByText("Der Denker")).toBeInTheDocument();

    await user.click(screen.getByText("Quiz neu starten"));

    expect(screen.getByText("Erste Frage?")).toBeInTheDocument();
    expect(values["el-1"]).toBe("");
    expect(values["el-1:q1"]).toBe("");
  });

  it("stellt den Zustand aus vorbefüllten formValues wieder her", () => {
    render(<Harness initialValues={{ "el-1:q1": "a1" }} />);
    // Frage 1 ist beantwortet → direkt bei Frage 2.
    expect(screen.getByText("Zweite Frage?")).toBeInTheDocument();

    render(<Harness initialValues={{ "el-1:q1": "a1", "el-1:q2": "a3" }} />);
    // Alles beantwortet → Ergebnisansicht.
    expect(screen.getByText("Der Macher")).toBeInTheDocument();
  });

  it("rendert nichts ohne Fragen", () => {
    const { container } = render(
      <QuizElementView
        elementId="el-1"
        config={{ ...testConfig, questions: [] }}
        textColor="#1a1a1a"
        primaryColor="#7C3AED"
        formValues={{}}
        updateFormValue={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

describe("getQuizAnswersFromFormValues", () => {
  it("liest nur die Antworten des eigenen Elements", () => {
    const answers = getQuizAnswersFromFormValues("el-1", testConfig.questions, {
      "el-1:q1": "a1",
      "el-2:q1": "fremd",
      "el-1": "Der Macher",
    });
    expect(answers).toEqual({ q1: "a1" });
  });

  it("ignoriert geleerte Antworten (Neustart)", () => {
    const answers = getQuizAnswersFromFormValues("el-1", testConfig.questions, {
      "el-1:q1": "",
      "el-1:q2": "a4",
    });
    expect(answers).toEqual({ q2: "a4" });
  });
});
