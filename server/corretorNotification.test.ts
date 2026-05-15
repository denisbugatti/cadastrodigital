import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the corretor notification service.
 * Now uses Resend template 'one-corretor-notification' with variables.
 */

// Mock Resend before importing the module
vi.mock("resend", () => {
  const mockSend = vi.fn().mockResolvedValue({ data: { id: "test-id" }, error: null });
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: { send: mockSend },
    })),
    __mockSend: mockSend,
  };
});

// Set env before imports
process.env.RESEND_API_KEY = "re_test_key";

import { sendCorretorNotification } from "./corretorNotification";

const { __mockSend: mockSend } = await import("resend") as any;

describe("Corretor Notification — Resend Template", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  it("should send notification using template one-corretor-notification", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João Silva",
      corretorEmail: "joao@test.com",
      respondentName: "Maria Santos",
      respondentEmail: "maria@test.com",
      respondentPhone: "(11) 99999-9999",
      protocolCode: "ABC-123",
      formTitle: "Cadastro One Innovation",
      submittedAt: new Date("2026-03-09T12:00:00Z"),
    });

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();

    const call = mockSend.mock.calls[0][0];
    expect(call.to).toEqual(["joao@test.com"]);
    expect(call.from).toContain("One Innovation");
    expect(call.from).toContain("one@cadastrodigital.com.br");
    expect(call.subject).toContain("ABC-123");
    expect(call.subject).toContain("Cadastro One Innovation");
    // Should use template, not inline HTML
    expect(call.template).toBeDefined();
    expect(call.template.id).toBe("164cfd9d-0780-4c4d-9841-59f2693d0552"); // one-corretor-notification
    expect(call.template.variables.CORRETOR_NAME).toBe("João Silva");
    expect(call.template.variables.FORM_TITLE).toBe("Cadastro One Innovation");
    expect(call.template.variables.PROTOCOL_CODE).toBe("ABC-123");
    expect(call.template.variables.RESPONDENT_NAME).toBe("Maria Santos");
    expect(call.template.variables.RESPONDENT_EMAIL).toBe("maria@test.com");
    expect(call.template.variables.RESPONDENT_PHONE).toBe("(11) 99999-9999");
    expect(call.template.variables.SUBMITTED_AT).toBeDefined();
  });

  it("should use 'Não informado' for missing respondent info", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "MISS-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
    });

    expect(result).toBe(true);
    const call = mockSend.mock.calls[0][0];
    expect(call.template.variables.RESPONDENT_NAME).toBe("Não informado");
    expect(call.template.variables.RESPONDENT_EMAIL).toBe("Não informado");
    expect(call.template.variables.RESPONDENT_PHONE).toBe("Não informado");
  });

  it("should use abandoned subject when isAbandoned is true", async () => {
    await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      respondentName: "Carlos",
      protocolCode: "ABN-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      isAbandoned: true,
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain("⚠️");
    expect(call.subject).toContain("abandonado");
    expect(call.subject).toContain("Carlos");
  });

  it("should use partial subject when isPartial is true", async () => {
    await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "PRT-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      isPartial: true,
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain("parcial");
    expect(call.subject).toContain("PRT-001");
  });

  it("should use standard subject for complete submissions", async () => {
    await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "NEW-001",
      formTitle: "Cadastro One",
      submittedAt: new Date(),
    });

    const call = mockSend.mock.calls[0][0];
    expect(call.subject).toContain("Novo cadastro");
    expect(call.subject).toContain("NEW-001");
    expect(call.subject).toContain("Cadastro One");
  });

  it("should return false when Resend returns an error", async () => {
    mockSend.mockResolvedValueOnce({ data: null, error: { message: "Send failed" } });

    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "ERR-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
    });

    expect(result).toBe(false);
  });

  it("should return false when Resend throws", async () => {
    mockSend.mockRejectedValueOnce(new Error("Network error"));

    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "ERR-002",
      formTitle: "Cadastro",
      submittedAt: new Date(),
    });

    expect(result).toBe(false);
  });
});
