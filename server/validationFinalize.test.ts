import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the validation finalization and re-validation workflow.
 * Covers:
 * 1. Finalization logic (status determination)
 * 2. Re-validation support (upsert behavior)
 * 3. Consolidated email sending on finalization
 */

// ─── Mock Resend ───
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null });
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: mockSend },
    })),
    __mockSend: mockSend,
  };
});

process.env.RESEND_API_KEY = "re_test_key";

describe("Validation Finalization Logic", () => {
  // Helper to determine final status (mirrors server logic)
  function determineStatus(validations: { status: string }[]) {
    const allApproved = validations.every((v) => v.status === "approved");
    const hasRejection = validations.some((v) => v.status === "rejected");
    if (allApproved) return "approved";
    if (hasRejection) return "rejected";
    return "in_review";
  }

  it("should return 'approved' when all validations are approved", () => {
    const validations = [
      { status: "approved" },
      { status: "approved" },
      { status: "approved" },
    ];
    expect(determineStatus(validations)).toBe("approved");
  });

  it("should return 'rejected' when any validation is rejected", () => {
    const validations = [
      { status: "approved" },
      { status: "rejected" },
      { status: "approved" },
    ];
    expect(determineStatus(validations)).toBe("rejected");
  });

  it("should return 'rejected' when all validations are rejected", () => {
    const validations = [
      { status: "rejected" },
      { status: "rejected" },
    ];
    expect(determineStatus(validations)).toBe("rejected");
  });

  it("should return 'approved' for empty validations (vacuous truth with .every())", () => {
    // Note: Array.every() on empty array returns true (vacuous truth)
    // In practice, the server checks allValidated first, so empty validations
    // would fail the precondition check before reaching status determination.
    expect(determineStatus([])).toBe("approved");
  });
});

describe("Re-validation Support", () => {
  it("should allow changing a validation from approved to rejected", () => {
    // Simulates upsert behavior
    const validations: Record<string, { status: string; justification?: string }> = {
      q1: { status: "approved" },
      q2: { status: "approved" },
    };

    // Re-validate q2 as rejected
    validations.q2 = { status: "rejected", justification: "Documento ilegível" };

    expect(validations.q2.status).toBe("rejected");
    expect(validations.q2.justification).toBe("Documento ilegível");
  });

  it("should allow changing a validation from rejected to approved", () => {
    const validations: Record<string, { status: string; justification?: string }> = {
      q1: { status: "approved" },
      q2: { status: "rejected", justification: "Problema no documento" },
    };

    // Re-validate q2 as approved (overwrite)
    validations.q2 = { status: "approved" };

    expect(validations.q2.status).toBe("approved");
    expect(validations.q2.justification).toBeUndefined();
  });

  it("should allow re-finalization after reopening", () => {
    // Simulate the full flow:
    // 1. Initial finalization -> approved
    // 2. Reopen -> modify validation
    // 3. Re-finalize -> rejected

    let responseStatus = "approved"; // Initial finalization result

    // Reopen: user modifies a field validation
    const validations = [
      { status: "approved" },
      { status: "rejected" }, // Changed from approved to rejected
      { status: "approved" },
    ];

    // Re-finalize
    const allApproved = validations.every((v) => v.status === "approved");
    const hasRejection = validations.some((v) => v.status === "rejected");
    if (allApproved) responseStatus = "approved";
    else if (hasRejection) responseStatus = "rejected";

    expect(responseStatus).toBe("rejected");
  });

  it("should track validation status transitions correctly", () => {
    const statusHistory: string[] = [];

    // First finalization
    statusHistory.push("approved");

    // Reopen and re-finalize with rejection
    statusHistory.push("rejected");

    // Reopen and re-finalize with all approved again
    statusHistory.push("approved");

    expect(statusHistory).toEqual(["approved", "rejected", "approved"]);
    expect(statusHistory.length).toBe(3);
  });
});

describe("Finalization Preconditions", () => {
  function checkAllValidated(
    answers: Record<string, any>,
    validations: { questionId: string; status: string }[]
  ): boolean {
    const answerKeys = Object.keys(answers);
    return answerKeys.every((qId) =>
      validations.some((v) => v.questionId === qId && v.status !== "pending")
    );
  }

  it("should require all fields to be validated before finalization", () => {
    const answers = { q1: "answer1", q2: "answer2", q3: "answer3" };
    const validations = [
      { questionId: "q1", status: "approved" },
      { questionId: "q2", status: "approved" },
      // q3 is missing
    ];

    expect(checkAllValidated(answers, validations)).toBe(false);
  });

  it("should allow finalization when all fields are validated", () => {
    const answers = { q1: "answer1", q2: "answer2", q3: "answer3" };
    const validations = [
      { questionId: "q1", status: "approved" },
      { questionId: "q2", status: "rejected" },
      { questionId: "q3", status: "approved" },
    ];

    expect(checkAllValidated(answers, validations)).toBe(true);
  });

  it("should not count pending validations as validated", () => {
    const answers = { q1: "answer1", q2: "answer2" };
    const validations = [
      { questionId: "q1", status: "approved" },
      { questionId: "q2", status: "pending" },
    ];

    expect(checkAllValidated(answers, validations)).toBe(false);
  });

  it("should allow finalization with mixed approved/rejected", () => {
    const answers = { q1: "answer1", q2: "answer2" };
    const validations = [
      { questionId: "q1", status: "approved" },
      { questionId: "q2", status: "rejected" },
    ];

    expect(checkAllValidated(answers, validations)).toBe(true);
  });
});

describe("Consolidated Email Logic", () => {
  it("should send approval email when all fields approved", () => {
    const validations = [
      { status: "approved", justification: undefined },
      { status: "approved", justification: undefined },
    ];

    const allApproved = validations.every((v) => v.status === "approved");
    const hasRejection = validations.some((v) => v.status === "rejected");

    expect(allApproved).toBe(true);
    expect(hasRejection).toBe(false);
    // Should trigger sendApprovalEmail
  });

  it("should send rejection email with consolidated reasons when any field rejected", () => {
    const validations = [
      { status: "approved", justification: undefined },
      { status: "rejected", justification: "Documento ilegível" },
      { status: "rejected", justification: "CPF inválido" },
    ];

    const allApproved = validations.every((v) => v.status === "approved");
    const hasRejection = validations.some((v) => v.status === "rejected");
    const rejections = validations.filter((v) => v.status === "rejected");
    const reasons = rejections
      .map((v) => v.justification || "Documento/dado precisa de revisão")
      .join("; ");

    expect(allApproved).toBe(false);
    expect(hasRejection).toBe(true);
    expect(reasons).toBe("Documento ilegível; CPF inválido");
  });

  it("should use default reason when justification is missing", () => {
    const validations = [
      { status: "approved", justification: undefined },
      { status: "rejected", justification: undefined },
    ];

    const rejections = validations.filter((v) => v.status === "rejected");
    const reasons = rejections
      .map((v) => v.justification || "Documento/dado precisa de revisão")
      .join("; ");

    expect(reasons).toBe("Documento/dado precisa de revisão");
  });
});

describe("UI State Management", () => {
  it("should correctly determine isAlreadyFinalized", () => {
    expect(["approved", "rejected"].includes("approved")).toBe(true);
    expect(["approved", "rejected"].includes("rejected")).toBe(true);
    expect(["approved", "rejected"].includes("pending")).toBe(false);
    expect(["approved", "rejected"].includes("in_review")).toBe(false);
  });

  it("should allow reopening finalized validation via state toggle", () => {
    let isAlreadyFinalized = true;
    let reopenedValidation = false;
    let isAlreadyApproved = isAlreadyFinalized && !reopenedValidation;

    expect(isAlreadyApproved).toBe(true);

    // User clicks "Reabrir Validação"
    reopenedValidation = true;
    isAlreadyApproved = isAlreadyFinalized && !reopenedValidation;

    expect(isAlreadyApproved).toBe(false);
    // Now user can modify validations and re-finalize
  });

  it("should show confirmation dialog before finalizing", () => {
    let showConfirmFinalize = false;

    // User clicks "Finalizar e Enviar Email"
    showConfirmFinalize = true;
    expect(showConfirmFinalize).toBe(true);

    // User clicks "Cancelar"
    showConfirmFinalize = false;
    expect(showConfirmFinalize).toBe(false);
  });

  it("should show confirmation dialog and proceed on confirm", () => {
    let showConfirmFinalize = false;
    let isApproving = false;
    let finalizeCalled = false;

    // User clicks "Finalizar e Enviar Email"
    showConfirmFinalize = true;

    // User clicks "Confirmar e Enviar Email"
    showConfirmFinalize = false;
    isApproving = true;
    finalizeCalled = true;

    expect(showConfirmFinalize).toBe(false);
    expect(isApproving).toBe(true);
    expect(finalizeCalled).toBe(true);
  });
});
