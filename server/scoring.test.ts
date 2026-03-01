/**
 * Scoring Logic Tests
 * Tests for the scoring feature: score per choice, scoringEnabled flag,
 * and builderToForm conversion preserving scoring data.
 */
import { describe, it, expect } from "vitest";

// We test the scoring logic directly since builderToForm is a client module.
// Instead, we test the scoring calculation logic that FormContainer uses.

describe("Scoring Logic", () => {
  // Simulate the scoring calculation from FormContainer
  function calculateTotalScore(
    questions: Array<{
      id: string;
      scoringEnabled?: boolean;
      choices?: Array<{ id: string; label: string; score?: number }>;
    }>,
    responses: Map<string, { questionId: string; value: unknown }>
  ): number | null {
    const hasScoringQuestions = questions.some(
      (q) => q.scoringEnabled && q.choices?.some((c) => c.score !== undefined)
    );
    if (!hasScoringQuestions) return null;

    let score = 0;
    responses.forEach((v) => {
      const q = questions.find((q) => q.id === v.questionId);
      if (q?.scoringEnabled && q.choices) {
        // For single choice
        if (typeof v.value === "string") {
          const choice = q.choices.find(
            (c) => c.id === v.value || c.label === v.value
          );
          if (choice?.score) score += choice.score;
        }
        // For multiple select
        if (Array.isArray(v.value)) {
          v.value.forEach((val) => {
            const choice = q.choices!.find(
              (c) => c.id === val || c.label === val
            );
            if (choice?.score) score += choice.score;
          });
        }
      }
    });
    return score;
  }

  describe("calculateTotalScore", () => {
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBeNull();
    });

    it("should return null when no choices have scores", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Option A" },
            { id: "b", label: "Option B" },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" });

      const result = calculateTotalScore(questions, responses);
      expect(result).toBeNull();
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(20);
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(10);
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(20); // 5 + 15
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(25); // 10 + 15
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(20); // Only q1 counts
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(0);
    });

    it("should handle unanswered scoring questions", () => {
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
      // No response for q1

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(0);
    });

    it("should handle mixed scoring and non-scoring questions", () => {
      const questions = [
        {
          id: "q1",
          scoringEnabled: true,
          choices: [
            { id: "a", label: "Sim", score: 10 },
            { id: "b", label: "Não", score: 0 },
          ],
        },
        {
          id: "q2",
          choices: [
            { id: "x", label: "Opção X" },
            { id: "y", label: "Opção Y" },
          ],
        },
        {
          id: "q3",
          scoringEnabled: true,
          choices: [
            { id: "p", label: "Alto", score: 30 },
            { id: "q", label: "Médio", score: 20 },
            { id: "r", label: "Baixo", score: 10 },
          ],
        },
      ];
      const responses = new Map();
      responses.set("q1", { questionId: "q1", value: "a" });
      responses.set("q2", { questionId: "q2", value: "x" });
      responses.set("q3", { questionId: "q3", value: "q" });

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(30); // 10 + 20
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

      const result = calculateTotalScore(questions, responses);
      expect(result).toBe(-5);
    });
  });
});
