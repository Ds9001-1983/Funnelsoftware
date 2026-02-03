import { describe, it, expect } from "vitest";
import {
  calculateQuizResult,
  defaultQuizConfig,
  type QuizConfig,
  type QuizResult,
} from "./QuizElement";

describe("QuizElement", () => {
  describe("calculateQuizResult", () => {
    it("sollte null zurückgeben wenn keine Ergebnisse definiert sind", () => {
      const config: QuizConfig = {
        questions: [],
        results: [],
        showProgressBar: true,
        shuffleQuestions: false,
        shuffleAnswers: false,
      };

      const result = calculateQuizResult(config, {});
      expect(result).toBeNull();
    });

    it("sollte das Ergebnis mit den meisten Punkten zurückgeben", () => {
      const config: QuizConfig = {
        questions: [
          {
            id: "q1",
            question: "Test Frage",
            answers: [
              { id: "a1", text: "Antwort 1", points: { r1: 3, r2: 1 } },
              { id: "a2", text: "Antwort 2", points: { r1: 1, r2: 3 } },
            ],
          },
        ],
        results: [
          {
            id: "r1",
            title: "Ergebnis 1",
            description: "Beschreibung 1",
            minPoints: 0,
            maxPoints: 5,
            color: "#FF0000",
          },
          {
            id: "r2",
            title: "Ergebnis 2",
            description: "Beschreibung 2",
            minPoints: 0,
            maxPoints: 5,
            color: "#00FF00",
          },
        ],
        showProgressBar: true,
        shuffleQuestions: false,
        shuffleAnswers: false,
      };

      // Wähle Antwort 1, die mehr Punkte für r1 gibt
      const result1 = calculateQuizResult(config, { q1: "a1" });
      expect(result1?.id).toBe("r1");
      expect(result1?.title).toBe("Ergebnis 1");

      // Wähle Antwort 2, die mehr Punkte für r2 gibt
      const result2 = calculateQuizResult(config, { q1: "a2" });
      expect(result2?.id).toBe("r2");
      expect(result2?.title).toBe("Ergebnis 2");
    });

    it("sollte Punkte über mehrere Fragen summieren", () => {
      const config: QuizConfig = {
        questions: [
          {
            id: "q1",
            question: "Frage 1",
            answers: [
              { id: "a1", text: "Antwort 1", points: { r1: 2, r2: 1 } },
            ],
          },
          {
            id: "q2",
            question: "Frage 2",
            answers: [
              { id: "a2", text: "Antwort 2", points: { r1: 1, r2: 3 } },
            ],
          },
        ],
        results: [
          {
            id: "r1",
            title: "Ergebnis 1",
            description: "Beschreibung 1",
            minPoints: 0,
            maxPoints: 10,
            color: "#FF0000",
          },
          {
            id: "r2",
            title: "Ergebnis 2",
            description: "Beschreibung 2",
            minPoints: 0,
            maxPoints: 10,
            color: "#00FF00",
          },
        ],
        showProgressBar: true,
        shuffleQuestions: false,
        shuffleAnswers: false,
      };

      // r1: 2+1=3, r2: 1+3=4 -> r2 gewinnt
      const result = calculateQuizResult(config, { q1: "a1", q2: "a2" });
      expect(result?.id).toBe("r2");
    });

    it("sollte ungültige Antworten ignorieren", () => {
      const config: QuizConfig = {
        questions: [
          {
            id: "q1",
            question: "Frage 1",
            answers: [
              { id: "a1", text: "Antwort 1", points: { r1: 5 } },
            ],
          },
        ],
        results: [
          {
            id: "r1",
            title: "Ergebnis 1",
            description: "Beschreibung 1",
            minPoints: 0,
            maxPoints: 10,
            color: "#FF0000",
          },
        ],
        showProgressBar: true,
        shuffleQuestions: false,
        shuffleAnswers: false,
      };

      // Ungültige Antwort-ID
      const result = calculateQuizResult(config, { q1: "invalid" });
      expect(result?.id).toBe("r1"); // Sollte trotzdem ein Ergebnis zurückgeben
    });
  });

  describe("defaultQuizConfig", () => {
    it("sollte eine gültige Standard-Konfiguration haben", () => {
      expect(defaultQuizConfig.questions.length).toBeGreaterThan(0);
      expect(defaultQuizConfig.results.length).toBeGreaterThan(0);
      expect(defaultQuizConfig.showProgressBar).toBe(true);
    });

    it("sollte Fragen mit Antworten haben", () => {
      defaultQuizConfig.questions.forEach((question) => {
        expect(question.id).toBeTruthy();
        expect(question.question).toBeTruthy();
        expect(question.answers.length).toBeGreaterThan(0);
      });
    });

    it("sollte Ergebnisse mit allen erforderlichen Feldern haben", () => {
      defaultQuizConfig.results.forEach((result) => {
        expect(result.id).toBeTruthy();
        expect(result.title).toBeTruthy();
        expect(result.description).toBeTruthy();
        expect(typeof result.minPoints).toBe("number");
        expect(typeof result.maxPoints).toBe("number");
        expect(result.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});
