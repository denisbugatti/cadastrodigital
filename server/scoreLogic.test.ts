import { describe, expect, it } from "vitest";

/**
 * Tests for score-based conditional logic types and data structures.
 * Validates that ScoreRule, ConditionalLogic, and related types work correctly.
 */

// Import types from builderTypes
import type { ScoreRule, ConditionalLogic, BuilderQuestion } from "../client/src/lib/builderTypes";

describe("ScoreRule type", () => {
  it("creates a valid score rule with min and max", () => {
    const rule: ScoreRule = {
      id: "sr_1",
      scoreMin: 10,
      scoreMax: 20,
      goToQuestionId: "q_target",
    };
    expect(rule.id).toBe("sr_1");
    expect(rule.scoreMin).toBe(10);
    expect(rule.scoreMax).toBe(20);
    expect(rule.goToQuestionId).toBe("q_target");
  });

  it("allows null for scoreMin (no lower bound)", () => {
    const rule: ScoreRule = {
      id: "sr_2",
      scoreMin: null,
      scoreMax: 50,
      goToQuestionId: "q_target",
    };
    expect(rule.scoreMin).toBeNull();
    expect(rule.scoreMax).toBe(50);
  });

  it("allows null for scoreMax (no upper bound)", () => {
    const rule: ScoreRule = {
      id: "sr_3",
      scoreMin: 80,
      scoreMax: null,
      goToQuestionId: "q_target",
    };
    expect(rule.scoreMin).toBe(80);
    expect(rule.scoreMax).toBeNull();
  });

  it("allows null for both (always matches)", () => {
    const rule: ScoreRule = {
      id: "sr_4",
      scoreMin: null,
      scoreMax: null,
      goToQuestionId: "next",
    };
    expect(rule.scoreMin).toBeNull();
    expect(rule.scoreMax).toBeNull();
  });
});

describe("ConditionalLogic with scoreRules", () => {
  it("includes scoreRules array in ConditionalLogic", () => {
    const logic: ConditionalLogic = {
      enabled: true,
      branches: [],
      rules: [],
      scoreRules: [
        { id: "sr_1", scoreMin: 0, scoreMax: 30, goToQuestionId: "q_low" },
        { id: "sr_2", scoreMin: 31, scoreMax: 70, goToQuestionId: "q_mid" },
        { id: "sr_3", scoreMin: 71, scoreMax: null, goToQuestionId: "q_high" },
      ],
      defaultGoTo: "next",
    };
    expect(logic.scoreRules).toHaveLength(3);
    expect(logic.scoreRules[0].goToQuestionId).toBe("q_low");
    expect(logic.scoreRules[2].scoreMax).toBeNull();
  });

  it("defaults to empty scoreRules", () => {
    const logic: ConditionalLogic = {
      enabled: false,
      branches: [],
      rules: [],
      scoreRules: [],
      defaultGoTo: "next",
    };
    expect(logic.scoreRules).toHaveLength(0);
  });
});

describe("Score evaluation logic", () => {
  /**
   * Simulates the score evaluation logic from useFormEngine.
   * Tests the matching algorithm without React hooks.
   */
  function evaluateScoreRules(
    scoreRules: ScoreRule[],
    totalScore: number
  ): string | null {
    for (const sr of scoreRules) {
      const minOk = sr.scoreMin === null || sr.scoreMin === undefined || totalScore >= sr.scoreMin;
      const maxOk = sr.scoreMax === null || sr.scoreMax === undefined || totalScore <= sr.scoreMax;
      if (minOk && maxOk) {
        return sr.goToQuestionId;
      }
    }
    return null; // no match
  }

  it("matches a score within range", () => {
    const rules: ScoreRule[] = [
      { id: "sr_1", scoreMin: 0, scoreMax: 30, goToQuestionId: "q_low" },
      { id: "sr_2", scoreMin: 31, scoreMax: 70, goToQuestionId: "q_mid" },
      { id: "sr_3", scoreMin: 71, scoreMax: null, goToQuestionId: "q_high" },
    ];
    expect(evaluateScoreRules(rules, 15)).toBe("q_low");
    expect(evaluateScoreRules(rules, 50)).toBe("q_mid");
    expect(evaluateScoreRules(rules, 90)).toBe("q_high");
  });

  it("matches boundary values (inclusive)", () => {
    const rules: ScoreRule[] = [
      { id: "sr_1", scoreMin: 0, scoreMax: 30, goToQuestionId: "q_low" },
      { id: "sr_2", scoreMin: 31, scoreMax: 70, goToQuestionId: "q_mid" },
    ];
    expect(evaluateScoreRules(rules, 0)).toBe("q_low");
    expect(evaluateScoreRules(rules, 30)).toBe("q_low");
    expect(evaluateScoreRules(rules, 31)).toBe("q_mid");
    expect(evaluateScoreRules(rules, 70)).toBe("q_mid");
  });

  it("returns null when no rule matches", () => {
    const rules: ScoreRule[] = [
      { id: "sr_1", scoreMin: 10, scoreMax: 20, goToQuestionId: "q_target" },
    ];
    expect(evaluateScoreRules(rules, 5)).toBeNull();
    expect(evaluateScoreRules(rules, 25)).toBeNull();
  });

  it("first match wins (top to bottom)", () => {
    const rules: ScoreRule[] = [
      { id: "sr_1", scoreMin: null, scoreMax: null, goToQuestionId: "q_catch_all" },
      { id: "sr_2", scoreMin: 50, scoreMax: 100, goToQuestionId: "q_specific" },
    ];
    // First rule always matches (no bounds), so q_catch_all wins
    expect(evaluateScoreRules(rules, 75)).toBe("q_catch_all");
  });

  it("handles null scoreMin (no lower bound)", () => {
    const rules: ScoreRule[] = [
      { id: "sr_1", scoreMin: null, scoreMax: 50, goToQuestionId: "q_low" },
    ];
    expect(evaluateScoreRules(rules, 0)).toBe("q_low");
    expect(evaluateScoreRules(rules, -10)).toBe("q_low");
    expect(evaluateScoreRules(rules, 50)).toBe("q_low");
    expect(evaluateScoreRules(rules, 51)).toBeNull();
  });

  it("handles null scoreMax (no upper bound)", () => {
    const rules: ScoreRule[] = [
      { id: "sr_1", scoreMin: 80, scoreMax: null, goToQuestionId: "q_high" },
    ];
    expect(evaluateScoreRules(rules, 79)).toBeNull();
    expect(evaluateScoreRules(rules, 80)).toBe("q_high");
    expect(evaluateScoreRules(rules, 1000)).toBe("q_high");
  });
});

describe("Score calculation", () => {
  /**
   * Simulates the calculateCurrentScore logic from useFormEngine.
   */
  interface SimpleQuestion {
    id: string;
    scoringEnabled?: boolean;
    questionScore?: number;
    choices?: Array<{ id: string; label: string; score?: number }>;
  }

  function calculateScore(
    questions: SimpleQuestion[],
    responses: Map<string, { questionId: string; value: any }>
  ): number {
    let score = 0;
    responses.forEach((v) => {
      const q = questions.find((q2) => q2.id === v.questionId);
      if (!q?.scoringEnabled) return;
      if (q.choices && q.choices.length > 0) {
        if (typeof v.value === "string") {
          const choice = q.choices.find((c) => c.id === v.value || c.label === v.value);
          if (choice?.score) score += choice.score;
        }
        if (Array.isArray(v.value)) {
          v.value.forEach((val: string) => {
            const choice = q.choices!.find((c) => c.id === val || c.label === val);
            if (choice?.score) score += choice.score;
          });
        }
      } else {
        const hasValue = v.value !== null && v.value !== undefined && v.value !== "";
        if (hasValue && q.questionScore) {
          score += q.questionScore;
        }
      }
    });
    return score;
  }

  it("calculates score from choice-based questions", () => {
    const questions: SimpleQuestion[] = [
      {
        id: "q1",
        scoringEnabled: true,
        choices: [
          { id: "c1", label: "Opção A", score: 10 },
          { id: "c2", label: "Opção B", score: 20 },
          { id: "c3", label: "Opção C", score: 30 },
        ],
      },
    ];
    const responses = new Map([
      ["q1", { questionId: "q1", value: "c2" }],
    ]);
    expect(calculateScore(questions, responses)).toBe(20);
  });

  it("calculates score from multiple-select questions", () => {
    const questions: SimpleQuestion[] = [
      {
        id: "q1",
        scoringEnabled: true,
        choices: [
          { id: "c1", label: "A", score: 5 },
          { id: "c2", label: "B", score: 10 },
          { id: "c3", label: "C", score: 15 },
        ],
      },
    ];
    const responses = new Map([
      ["q1", { questionId: "q1", value: ["c1", "c3"] }],
    ]);
    expect(calculateScore(questions, responses)).toBe(20); // 5 + 15
  });

  it("calculates score from non-choice questions with questionScore", () => {
    const questions: SimpleQuestion[] = [
      { id: "q1", scoringEnabled: true, questionScore: 25 },
    ];
    const responses = new Map([
      ["q1", { questionId: "q1", value: "any answer" }],
    ]);
    expect(calculateScore(questions, responses)).toBe(25);
  });

  it("does not count unanswered questions", () => {
    const questions: SimpleQuestion[] = [
      { id: "q1", scoringEnabled: true, questionScore: 25 },
    ];
    const responses = new Map([
      ["q1", { questionId: "q1", value: "" }],
    ]);
    expect(calculateScore(questions, responses)).toBe(0);
  });

  it("does not count questions without scoringEnabled", () => {
    const questions: SimpleQuestion[] = [
      { id: "q1", scoringEnabled: false, questionScore: 25 },
    ];
    const responses = new Map([
      ["q1", { questionId: "q1", value: "answered" }],
    ]);
    expect(calculateScore(questions, responses)).toBe(0);
  });

  it("accumulates score across multiple questions", () => {
    const questions: SimpleQuestion[] = [
      {
        id: "q1",
        scoringEnabled: true,
        choices: [
          { id: "c1", label: "A", score: 10 },
          { id: "c2", label: "B", score: 20 },
        ],
      },
      { id: "q2", scoringEnabled: true, questionScore: 15 },
      {
        id: "q3",
        scoringEnabled: true,
        choices: [
          { id: "c3", label: "X", score: 5 },
          { id: "c4", label: "Y", score: 30 },
        ],
      },
    ];
    const responses = new Map([
      ["q1", { questionId: "q1", value: "c1" }],  // 10
      ["q2", { questionId: "q2", value: "filled" }], // 15
      ["q3", { questionId: "q3", value: "c4" }],  // 30
    ]);
    expect(calculateScore(questions, responses)).toBe(55);
  });
});
