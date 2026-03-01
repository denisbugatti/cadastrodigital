/**
 * Tests for the expanded conditional logic system.
 * Tests the evaluateRule logic and builderToForm conversion for condition-based rules.
 */
import { describe, it, expect } from "vitest";
import type { ConditionOperator, ConditionalRule, BuilderQuestion, BuilderForm } from "../client/src/lib/builderTypes";
import { builderToFormData } from "../client/src/lib/builderToForm";

// ─── Helper: evaluate a rule against a value (mirrors useFormEngine logic) ───

function evaluateRule(rule: { operator: string; value: string }, responseValue: any): boolean {
  const op = rule.operator;
  const compareVal = rule.value;

  const isAnswered = responseValue !== null && responseValue !== undefined && responseValue !== "" &&
    !(Array.isArray(responseValue) && responseValue.length === 0) &&
    !(typeof responseValue === "object" && !Array.isArray(responseValue) && Object.values(responseValue).every((v) => !v));

  if (op === "is_answered") return isAnswered;
  if (op === "is_empty") return !isAnswered;

  if (!isAnswered) return false;

  const strValue = typeof responseValue === "object" ? JSON.stringify(responseValue) : String(responseValue).toLowerCase();
  const strCompare = compareVal.toLowerCase();

  switch (op) {
    case "equals":
      return strValue === strCompare;
    case "not_equals":
      return strValue !== strCompare;
    case "contains":
      return strValue.includes(strCompare);
    case "not_contains":
      return !strValue.includes(strCompare);
    case "greater_than": {
      const num = parseFloat(String(responseValue));
      const cmp = parseFloat(compareVal);
      return !isNaN(num) && !isNaN(cmp) && num > cmp;
    }
    case "less_than": {
      const num = parseFloat(String(responseValue));
      const cmp = parseFloat(compareVal);
      return !isNaN(num) && !isNaN(cmp) && num < cmp;
    }
    case "greater_equal": {
      const num = parseFloat(String(responseValue));
      const cmp = parseFloat(compareVal);
      return !isNaN(num) && !isNaN(cmp) && num >= cmp;
    }
    case "less_equal": {
      const num = parseFloat(String(responseValue));
      const cmp = parseFloat(compareVal);
      return !isNaN(num) && !isNaN(cmp) && num <= cmp;
    }
    default:
      return false;
  }
}

// ─── Tests: evaluateRule ───

describe("Conditional Logic — evaluateRule", () => {
  describe("is_answered / is_empty", () => {
    it("is_answered returns true for non-empty string", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, "hello")).toBe(true);
    });

    it("is_answered returns false for empty string", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, "")).toBe(false);
    });

    it("is_answered returns false for null", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, null)).toBe(false);
    });

    it("is_answered returns false for undefined", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, undefined)).toBe(false);
    });

    it("is_answered returns false for empty array", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, [])).toBe(false);
    });

    it("is_answered returns true for non-empty array", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, ["a"])).toBe(true);
    });

    it("is_answered returns false for empty object (all falsy values)", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, { street: "", city: "" })).toBe(false);
    });

    it("is_answered returns true for object with some values", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, { street: "Rua A", city: "" })).toBe(true);
    });

    it("is_empty returns true for empty string", () => {
      expect(evaluateRule({ operator: "is_empty", value: "" }, "")).toBe(true);
    });

    it("is_empty returns false for non-empty string", () => {
      expect(evaluateRule({ operator: "is_empty", value: "" }, "hello")).toBe(false);
    });

    it("is_answered returns true for number 0", () => {
      expect(evaluateRule({ operator: "is_answered", value: "" }, 0)).toBe(true);
    });
  });

  describe("equals / not_equals (case-insensitive)", () => {
    it("equals matches same string (case-insensitive)", () => {
      expect(evaluateRule({ operator: "equals", value: "Hello" }, "hello")).toBe(true);
    });

    it("equals does not match different string", () => {
      expect(evaluateRule({ operator: "equals", value: "world" }, "hello")).toBe(false);
    });

    it("not_equals returns true for different strings", () => {
      expect(evaluateRule({ operator: "not_equals", value: "world" }, "hello")).toBe(true);
    });

    it("not_equals returns false for same string", () => {
      expect(evaluateRule({ operator: "not_equals", value: "hello" }, "Hello")).toBe(false);
    });

    it("equals works with numbers", () => {
      expect(evaluateRule({ operator: "equals", value: "42" }, 42)).toBe(true);
    });
  });

  describe("contains / not_contains", () => {
    it("contains matches substring", () => {
      expect(evaluateRule({ operator: "contains", value: "ell" }, "hello")).toBe(true);
    });

    it("contains does not match missing substring", () => {
      expect(evaluateRule({ operator: "contains", value: "xyz" }, "hello")).toBe(false);
    });

    it("not_contains returns true when substring is missing", () => {
      expect(evaluateRule({ operator: "not_contains", value: "xyz" }, "hello")).toBe(true);
    });

    it("not_contains returns false when substring exists", () => {
      expect(evaluateRule({ operator: "not_contains", value: "ell" }, "hello")).toBe(false);
    });
  });

  describe("numeric comparisons", () => {
    it("greater_than: 10 > 5 is true", () => {
      expect(evaluateRule({ operator: "greater_than", value: "5" }, 10)).toBe(true);
    });

    it("greater_than: 5 > 10 is false", () => {
      expect(evaluateRule({ operator: "greater_than", value: "10" }, 5)).toBe(false);
    });

    it("greater_than: 5 > 5 is false", () => {
      expect(evaluateRule({ operator: "greater_than", value: "5" }, 5)).toBe(false);
    });

    it("less_than: 3 < 10 is true", () => {
      expect(evaluateRule({ operator: "less_than", value: "10" }, 3)).toBe(true);
    });

    it("less_than: 10 < 3 is false", () => {
      expect(evaluateRule({ operator: "less_than", value: "3" }, 10)).toBe(false);
    });

    it("greater_equal: 5 >= 5 is true", () => {
      expect(evaluateRule({ operator: "greater_equal", value: "5" }, 5)).toBe(true);
    });

    it("greater_equal: 4 >= 5 is false", () => {
      expect(evaluateRule({ operator: "greater_equal", value: "5" }, 4)).toBe(false);
    });

    it("less_equal: 5 <= 5 is true", () => {
      expect(evaluateRule({ operator: "less_equal", value: "5" }, 5)).toBe(true);
    });

    it("less_equal: 6 <= 5 is false", () => {
      expect(evaluateRule({ operator: "less_equal", value: "5" }, 6)).toBe(false);
    });

    it("numeric comparison with string value", () => {
      expect(evaluateRule({ operator: "greater_than", value: "5" }, "10")).toBe(true);
    });

    it("numeric comparison with non-numeric returns false", () => {
      expect(evaluateRule({ operator: "greater_than", value: "5" }, "abc")).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false for unknown operator", () => {
      expect(evaluateRule({ operator: "unknown_op", value: "" }, "hello")).toBe(false);
    });

    it("non-existence operators return false for empty value", () => {
      expect(evaluateRule({ operator: "equals", value: "test" }, "")).toBe(false);
    });

    it("non-existence operators return false for null", () => {
      expect(evaluateRule({ operator: "contains", value: "test" }, null)).toBe(false);
    });
  });
});

// ─── Tests: builderToForm conversion for condition-based rules ───

describe("Conditional Logic — builderToForm conversion", () => {
  const makeBuilderForm = (questions: Partial<BuilderQuestion>[]): BuilderForm => ({
    id: "test-form",
    title: "Test Form",
    description: "",
    questions: questions.map((q, i) => ({
      id: `q${i}`,
      type: "text" as any,
      title: `Question ${i}`,
      subtitle: "",
      required: false,
      choices: [],
      conditionalLogic: { enabled: false, branches: [], rules: [], defaultGoTo: "next" },
      scoringEnabled: false,
      questionScore: 0,
      ...q,
    })),
    design: {
      theme: "dark",
      primaryColor: "#000",
      backgroundColor: "#fff",
      fontFamily: "Inter",
      buttonColor: "#000",
      buttonTextColor: "#fff",
      progressBarColor: "#000",
    },
    settings: {
      showProgressBar: true,
      enableKeyboardNavigation: true,
      autoAdvance: false,
    },
  });

  it("converts condition-based rules correctly", () => {
    const form = makeBuilderForm([
      {
        id: "q1",
        type: "text" as any,
        title: "Name",
        conditionalLogic: {
          enabled: true,
          branches: [],
          rules: [
            { id: "r1", operator: "is_answered" as ConditionOperator, value: "", goToQuestionId: "q3" },
            { id: "r2", operator: "is_empty" as ConditionOperator, value: "", goToQuestionId: "q2" },
          ],
          defaultGoTo: "next",
        },
      },
      { id: "q2", title: "Fallback" },
      { id: "q3", title: "Target" },
    ]);

    const result = builderToFormData(form);
    const q1 = result.questions.find((q) => q.id === "q1");
    expect(q1?.conditionalLogic?.enabled).toBe(true);
    expect(q1?.conditionalLogic?.rules).toHaveLength(2);
    expect(q1?.conditionalLogic?.rules?.[0]).toEqual({
      id: "r1",
      operator: "is_answered",
      value: "",
      goToQuestionId: "q3",
    });
    expect(q1?.conditionalLogic?.rules?.[1]).toEqual({
      id: "r2",
      operator: "is_empty",
      value: "",
      goToQuestionId: "q2",
    });
  });

  it("converts choice-based branches alongside rules", () => {
    const form = makeBuilderForm([
      {
        id: "q1",
        type: "multiple-choice" as any,
        title: "Choose",
        choices: [
          { id: "c1", label: "Option A" },
          { id: "c2", label: "Option B" },
        ],
        conditionalLogic: {
          enabled: true,
          branches: [
            { choiceId: "c1", goToQuestionId: "q3" },
            { choiceId: "c2", goToQuestionId: "q2" },
          ],
          rules: [],
          defaultGoTo: "next",
        },
      },
      { id: "q2", title: "Target B" },
      { id: "q3", title: "Target A" },
    ]);

    const result = builderToFormData(form);
    const q1 = result.questions.find((q) => q.id === "q1");
    expect(q1?.conditionalLogic?.enabled).toBe(true);
    expect(q1?.conditionalLogic?.branches).toHaveLength(2);
    expect(q1?.conditionalLogic?.branches?.[0]).toEqual({
      choiceId: "c1",
      goToQuestionId: "q3",
    });
  });

  it("preserves defaultGoTo in conversion", () => {
    const form = makeBuilderForm([
      {
        id: "q1",
        type: "currency" as any,
        title: "Budget",
        conditionalLogic: {
          enabled: true,
          branches: [],
          rules: [
            { id: "r1", operator: "greater_than" as ConditionOperator, value: "1000", goToQuestionId: "q3" },
          ],
          defaultGoTo: "q2",
        },
      },
      { id: "q2", title: "Low budget path" },
      { id: "q3", title: "High budget path" },
    ]);

    const result = builderToFormData(form);
    const q1 = result.questions.find((q) => q.id === "q1");
    expect(q1?.conditionalLogic?.defaultGoTo).toBe("q2");
    expect(q1?.conditionalLogic?.rules?.[0]?.operator).toBe("greater_than");
    expect(q1?.conditionalLogic?.rules?.[0]?.value).toBe("1000");
  });
});
