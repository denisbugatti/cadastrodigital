/**
 * Scoring Logic Tests
 * Tests for the scoring feature: score per choice, fixed questionScore,
 * scoringEnabled flag, and support for ALL question types.
 */
import { describe, it, expect } from "vitest";

// Mirrors the scoring calculation from FormContainer (expanded version)
function calculateTotalScore(
  questions: Array<{
    id: string;
    scoringEnabled?: boolean;
    choices?: Array<{ id: string; label: string; score?: number }>;
    questionScore?: number;
  }>,
  responses: Map<string, { questionId: string; value: unknown }>
): number | null {
  const hasScoringQuestions = questions.some((q) => q.scoringEnabled);
  if (!hasScoringQuestions) return null;

  let score = 0;
  responses.forEach((v) => {
    const q = questions.find((q) => q.id === v.questionId);
    if (!q?.scoringEnabled) return;

    // Choice-based questions: score per selected option
    if (q.choices && q.choices.length > 0) {
      if (typeof v.value === "string") {
        const choice = q.choices.find(
          (c) => c.id === v.value || c.label === v.value
        );
        if (choice?.score) score += choice.score;
      }
      if (Array.isArray(v.value)) {
        v.value.forEach((val) => {
          const choice = q.choices!.find(
            (c) => c.id === val || c.label === val
          );
          if (choice?.score) score += choice.score;
        });
      }
    } else {
      // Non-choice questions: fixed questionScore awarded when answered
      const hasValue =
        v.value !== null && v.value !== undefined && v.value !== "";
      if (hasValue && q.questionScore) {
        score += q.questionScore;
      }
    }
  });
  return score;
}

describe("Scoring Logic", () => {
  describe("Choice-based scoring", () => {
    it("should return null when no questions have scoring enabled", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: false,
          choices: [
            { id: "a", label: "Option A", score: 10 },
            { id: "b", label: "Option B", score: 20 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" });
      expect(calculateTotalScore(questions, responses)).toBeNull();
    });

    it("should calculate score for single choice by id", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A", score: 10 },
            { id: "b", label: "Option B", score: 20 },
            { id: "c", label: "Option C", score: 30 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "b" });
      expect(calculateTotalScore(questions, responses)).toBe(20);
    });

    it("should calculate score for single choice by label", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A", score: 10 },
            { id: "b", label: "Option B", score: 20 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "Option A" });
      expect(calculateTotalScore(questions, responses)).toBe(10);
    });

    it("should calculate score for multiple select (array)", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A", score: 5 },
            { id: "b", label: "Option B", score: 10 },
            { id: "c", label: "Option C", score: 15 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: ["a", "c"] });
      expect(calculateTotalScore(questions, responses)).toBe(20);
    });

    it("should sum scores across multiple questions", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A", score: 10 },
            { id: "b", label: "Option B", score: 20 },
          ],
        },
        {
          id: "q2",
          scoringEnabled: true,
          choices: [
            { id: "x", label: "Option X", score: 5 },
            { id: "y", label: "Option Y", score: 15 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" });
      responses.set("q2", { questionId: "q2", value: "y" });
      expect(calculateTotalScore(questions, responses)).toBe(25);
    });

    it("should ignore questions without scoring enabled", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A", score: 10 },
            { id: "b", label: "Option B", score: 20 },
          ],
        },
        {
          id: "q2",
          scoringEnabled: false,
          choices: [
            { id: "x", label: "Option X", score: 100 },
            { id: "y", label: "Option Y", score: 200 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "b" });
      responses.set("q2", { questionId: "q2", value: "x" });
      expect(calculateTotalScore(questions, responses)).toBe(20);
    });

    it("should handle zero scores correctly", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A", score: 0 },
            { id: "b", label: "Option B", score: 10 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" });
      expect(calculateTotalScore(questions, responses)).toBe(0);
    });

    it("should handle negative scores", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Correto", score: 10 },
            { id: "b", label: "Incorreto", score: -5 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "b" });
      expect(calculateTotalScore(questions, responses)).toBe(-5);
    });
  });

  describe("Fixed questionScore (non-choice questions)", () => {
    it("should award questionScore when a text question is answered", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 5 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "John Doe" });
      expect(calculateTotalScore(questions, responses)).toBe(5);
    });

    it("should NOT award questionScore when a text question is empty", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 5 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "" });
      expect(calculateTotalScore(questions, responses)).toBe(0);
    });

    it("should NOT award questionScore when value is null", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 5 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: null });
      expect(calculateTotalScore(questions, responses)).toBe(0);
    });

    it("should award questionScore for number answers", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 10 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: 42 });
      expect(calculateTotalScore(questions, responses)).toBe(10);
    });

    it("should award questionScore for object answers (e.g., address)", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 15 },
      ];
      const responses = new Map();
      responses.set("q1", {
        questionId: "q1",
        value: { cep: "12345-678", city: "São Paulo" },
      });
      expect(calculateTotalScore(questions, responses)).toBe(15);
    });

    it("should sum questionScores across multiple non-choice questions", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 5 },
        { id: "q2", scoringEnabled: true, questionScore: 10 },
        { id: "q3", scoringEnabled: true, questionScore: 15 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "John" });
      responses.set("q2", { questionId: "q2", value: "john@email.com" });
      responses.set("q3", { questionId: "q3", value: "(11) 99999-9999" });
      expect(calculateTotalScore(questions, responses)).toBe(30);
    });

    it("should NOT award questionScore when scoringEnabled is false", () => {
      const questions = [
        { id: "q1", scoringEnabled: false, questionScore: 100 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "answered" });
      expect(calculateTotalScore(questions, responses)).toBeNull();
    });

    it("should handle questionScore of 0 (no points awarded)", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 0 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "answered" });
      expect(calculateTotalScore(questions, responses)).toBe(0);
    });
  });

  describe("Mixed scoring (choice + non-choice questions)", () => {
    it("should combine choice scores and questionScores", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Sim", score: 10 },
            { id: "b", label: "Não", score: 0 },
          ],
        },
        { id: "q2", scoringEnabled: true, questionScore: 5 },
        {
          id: "q3",
          scoringEnabled: true,
          choices: [
            { id: "p", label: "Alto", score: 30 },
            { id: "q", label: "Baixo", score: 10 },
          ],
        },
        { id: "q4", scoringEnabled: true, questionScore: 8 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" }); // +10
      responses.set("q2", { questionId: "q2", value: "John" }); // +5
      responses.set("q3", { questionId: "q3", value: "p" }); // +30
      responses.set("q4", { questionId: "q4", value: "john@email.com" }); // +8
      expect(calculateTotalScore(questions, responses)).toBe(53);
    });

    it("should handle partial answers in mixed scoring", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Sim", score: 10 },
            { id: "b", label: "Não", score: 0 },
          ],
        },
        { id: "q2", scoringEnabled: true, questionScore: 5 },
        { id: "q3", scoringEnabled: true, questionScore: 15 },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" }); // +10
      responses.set("q2", { questionId: "q2", value: "" }); // +0 (empty)
      responses.set("q3", { questionId: "q3", value: "answered" }); // +15
      expect(calculateTotalScore(questions, responses)).toBe(25);
    });

    it("should handle non-scoring questions mixed with scoring ones", () => {
      const questions = [
        { id: "q1", scoringEnabled: true, questionScore: 10 },
        { id: "q2", scoringEnabled: false }, // no scoring
        {
          id: "q3",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "A", score: 20 },
            { id: "b", label: "B", score: 5 },
          ],
        },
        { id: "q4" }, // no scoringEnabled at all
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "name" }); // +10
      responses.set("q2", { questionId: "q2", value: "ignored" }); // +0
      responses.set("q3", { questionId: "q3", value: "a" }); // +20
      responses.set("q4", { questionId: "q4", value: "also ignored" }); // +0
      expect(calculateTotalScore(questions, responses)).toBe(30);
    });
  });
});
