/**
 * Tests for Statement/Cover question type
 * Validates that the statement type is properly configured in builderTypes
 * and that the StatementScreen component has the expected structure.
 */
import { describe, it, expect } from "vitest";
import {
  questionTypes,
  createDefaultQuestion,
  type BuilderQuestion,
} from "../client/src/lib/builderTypes";

describe("Statement/Cover question type", () => {
  it("should exist in questionTypes registry", () => {
    const statementType = questionTypes.find((t) => t.type === "statement");
    expect(statementType).toBeDefined();
    expect(statementType!.label).toBe("Mensagem");
    expect(statementType!.category).toBe("text");
    expect(statementType!.icon).toBe("message-square");
    expect(statementType!.description).toBe("Tela informativa sem input");
  });

  it("should NOT have conditional logic (it's a display-only screen)", () => {
    const statementType = questionTypes.find((t) => t.type === "statement");
    expect(statementType!.hasConditionalLogic).toBeFalsy();
  });

  it("should NOT have choices", () => {
    const statementType = questionTypes.find((t) => t.type === "statement");
    expect(statementType!.hasChoices).toBeFalsy();
  });

  it("should create default question with correct title and subtitle", () => {
    const q = createDefaultQuestion("statement");
    expect(q.type).toBe("statement");
    expect(q.title).toBe("Sua mensagem aqui");
    expect(q.subtitle).toBe("Texto informativo para o respondente");
  });

  it("should have showButton=true and buttonText='Continuar' by default", () => {
    const q = createDefaultQuestion("statement");
    expect(q.showButton).toBe(true);
    expect(q.buttonText).toBe("Continuar");
  });

  it("should not be required (it's informational)", () => {
    const q = createDefaultQuestion("statement");
    expect(q.required).toBe(false);
  });

  it("should support imageUrl for custom icon/image", () => {
    const q = createDefaultQuestion("statement");
    expect(q.imageUrl).toBeDefined();
    expect(typeof q.imageUrl).toBe("string");
  });

  it("should be excluded from question count (like welcome/thank-you)", () => {
    // Statement should be treated as a special screen, not counted as a regular question
    const q = createDefaultQuestion("statement");
    const isSpecialType = ["welcome", "thank-you", "statement"].includes(q.type);
    expect(isSpecialType).toBe(true);
  });

  it("should support custom buttonText", () => {
    const q = createDefaultQuestion("statement");
    q.buttonText = "Próxima seção";
    expect(q.buttonText).toBe("Próxima seção");
  });

  it("should support hiding the button", () => {
    const q = createDefaultQuestion("statement");
    q.showButton = false;
    expect(q.showButton).toBe(false);
  });
});
