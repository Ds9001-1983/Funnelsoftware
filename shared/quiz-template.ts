import type { PageElement } from "./schema";

/**
 * Das Quiz-Element des „Interaktives Quiz“-Templates — EINE Quelle für
 * Client-Templates (client/src/lib/templates.ts) und Server-Seed
 * (server/storage.ts), damit Fragen/Punkte-Matrix/Ergebnisse nicht
 * auseinanderdriften.
 */
export const quizTemplateElement: PageElement = {
  id: "el-quiz-1",
  type: "quiz",
  required: true,
  quizConfig: {
    questions: [
      {
        id: "q-1",
        question: "Was beschreibt dich am besten?",
        answers: [
          { id: "a-1-1", text: "Kreativ", points: { "r-1": 3, "r-2": 0 } },
          { id: "a-1-2", text: "Analytisch", points: { "r-1": 0, "r-2": 3 } },
          { id: "a-1-3", text: "Teamplayer", points: { "r-1": 2, "r-2": 1 } },
          { id: "a-1-4", text: "Führungspersönlichkeit", points: { "r-1": 1, "r-2": 2 } },
        ],
      },
      {
        id: "q-2",
        question: "Wie triffst du Entscheidungen?",
        answers: [
          { id: "a-2-1", text: "Mit dem Bauch", points: { "r-1": 3, "r-2": 0 } },
          { id: "a-2-2", text: "Datenbasiert", points: { "r-1": 0, "r-2": 3 } },
          { id: "a-2-3", text: "Im Team", points: { "r-1": 2, "r-2": 1 } },
          { id: "a-2-4", text: "Spontan", points: { "r-1": 3, "r-2": 0 } },
        ],
      },
      {
        id: "q-3",
        question: "Was motiviert dich am meisten?",
        answers: [
          { id: "a-3-1", text: "Neue Ideen umsetzen", points: { "r-1": 3, "r-2": 0 } },
          { id: "a-3-2", text: "Messbare Ergebnisse", points: { "r-1": 0, "r-2": 3 } },
          { id: "a-3-3", text: "Gemeinsame Erfolge", points: { "r-1": 2, "r-2": 2 } },
        ],
      },
    ],
    results: [
      {
        id: "r-1",
        title: "Der Innovator",
        description: "Du denkst groß, probierst Neues aus und findest kreative Lösungen.",
        minPoints: 5,
        maxPoints: 9,
        color: "#10B981",
      },
      {
        id: "r-2",
        title: "Der Stratege",
        description: "Du planst voraus, entscheidest faktenbasiert und behältst den Überblick.",
        minPoints: 5,
        maxPoints: 9,
        color: "#2563EB",
      },
    ],
    showProgressBar: true,
    shuffleQuestions: false,
    shuffleAnswers: false,
  },
};
