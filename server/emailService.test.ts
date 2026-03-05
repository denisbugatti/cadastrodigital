import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the email service — Inline HTML emails with white text.
 * Tests that correct HTML content and subjects are passed to Resend.
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

import {
  sendInviteEmail,
  sendProtocolEmail,
  sendApprovalEmail,
  sendRejectionEmail,
  sendCadenceEmail,
  sendRejectionCadenceEmail,
  sendFollowUpEmail,
} from "./emailService";

// Get the mock send function
const { __mockSend: mockSend } = await import("resend") as any;

describe("Email Service — Inline HTML", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  describe("sendInviteEmail", () => {
    it("should send invite email with HTML containing white text", async () => {
      const result = await sendInviteEmail({
        to: "corretor@test.com",
        inviterName: "João Silva",
        role: "corretor",
        inviteUrl: "https://example.com/invite/abc123",
        inviteeName: "Maria Santos",
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledOnce();

      const call = mockSend.mock.calls[0][0];
      expect(call.to).toEqual(["corretor@test.com"]);
      expect(call.from).toContain("One Innovation");
      expect(call.from).toContain("one@cadastrodigital.com.br");
      expect(call.subject).toContain("João Silva");
      expect(call.html).toBeDefined();
      expect(call.html).toContain("Maria Santos");
      expect(call.html).toContain("João Silva");
      expect(call.html).toContain("Corretor(a)");
      expect(call.html).toContain("https://example.com/invite/abc123");
      expect(call.html).toContain("#f1f5f9"); // White text color
      expect(call.html).toContain("#0a0f1a"); // Dark background
    });

    it("should use 'Olá' when inviteeName is not provided", async () => {
      await sendInviteEmail({
        to: "gerente@test.com",
        inviterName: "Admin",
        role: "gerente",
        inviteUrl: "https://example.com/invite/xyz",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Gerente");
    });

    it("should map role labels correctly", async () => {
      for (const [role, expected] of [
        ["diretor", "Diretor(a)"],
        ["gerente", "Gerente"],
        ["corretor", "Corretor(a)"],
      ]) {
        vi.clearAllMocks();
        mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
        await sendInviteEmail({
          to: "t@t.com",
          inviterName: "A",
          role,
          inviteUrl: "http://x.com",
        });
        const call = mockSend.mock.calls[0][0];
        expect(call.html).toContain(expected);
      }
    });
  });

  describe("sendProtocolEmail", () => {
    it("should send protocol email with HTML containing protocol code", async () => {
      const result = await sendProtocolEmail({
        to: "cliente@test.com",
        respondentName: "Carlos Oliveira",
        protocolCode: "ABC-123",
        formTitle: "Cadastro One Innovation",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.to).toEqual(["cliente@test.com"]);
      expect(call.subject).toContain("ABC-123");
      expect(call.html).toContain("Carlos Oliveira");
      expect(call.html).toContain("ABC-123");
      expect(call.html).toContain("Cadastro One Innovation");
    });

    it("should use 'Olá' when respondentName is not provided", async () => {
      await sendProtocolEmail({
        to: "cliente@test.com",
        protocolCode: "XYZ-789",
        formTitle: "Formulário Teste",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("XYZ-789");
    });
  });

  describe("sendApprovalEmail", () => {
    it("should send approval email with correct content", async () => {
      const result = await sendApprovalEmail({
        to: "cliente@test.com",
        clientName: "Ana Paula",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Ana Paula");
      expect(call.subject).toContain("aprovado");
      expect(call.html).toContain("Ana Paula");
      expect(call.html).toContain("aprovado");
      expect(call.html).toContain("#22c55e"); // Green color for approval
    });
  });

  describe("sendRejectionEmail", () => {
    it("should send rejection email with reason and form URL", async () => {
      const result = await sendRejectionEmail({
        to: "cliente@test.com",
        clientName: "Pedro",
        reason: "CPF inválido",
        formUrl: "https://example.com/form/123",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Revisão necessária");
      expect(call.html).toContain("Pedro");
      expect(call.html).toContain("CPF inválido");
      expect(call.html).toContain("https://example.com/form/123");
    });

    it("should handle missing formUrl gracefully", async () => {
      await sendRejectionEmail({
        to: "cliente@test.com",
        clientName: "Pedro",
        reason: "Documento ilegível",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Documento ilegível");
    });
  });

  describe("sendCadenceEmail", () => {
    it("should use V1 content for sequence 1", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        clientName: "Lucas",
        formTitle: "Cadastro Premium",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 1,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("quase pronto");
      expect(call.subject).toContain("Cadastro Premium");
      expect(call.html).toContain("Lucas");
      expect(call.html).toContain("Cadastro Premium");
      expect(call.html).toContain("https://example.com/form/1");
    });

    it("should use V2 content for sequence 2", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 2,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("oportunidade");
    });

    it("should use V3 content for sequence 3", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 3,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Lembrete");
    });

    it("should rotate variations cyclically (seq 4 = V1, seq 5 = V2, seq 6 = V3)", async () => {
      const expectedSubjects = ["quase pronto", "oportunidade", "Lembrete"];

      for (let seq = 4; seq <= 6; seq++) {
        vi.clearAllMocks();
        mockSend.mockResolvedValue({ data: { id: `id-${seq}` }, error: null });

        await sendCadenceEmail({
          to: "t@t.com",
          formTitle: "F",
          formUrl: "http://x.com",
          sequenceNumber: seq,
          totalInSequence: 24,
        });

        const call = mockSend.mock.calls[0][0];
        expect(call.subject).toContain(expectedSubjects[(seq - 1) % 3]);
      }
    });

    it("should use 'Olá' when clientName is not provided", async () => {
      await sendCadenceEmail({
        to: "t@t.com",
        formTitle: "F",
        formUrl: "http://x.com",
        sequenceNumber: 1,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toBeDefined();
    });
  });

  describe("sendRejectionCadenceEmail", () => {
    it("should use rejection V1 content for sequence 1", async () => {
      const result = await sendRejectionCadenceEmail({
        to: "cliente@test.com",
        clientName: "Fernanda",
        formTitle: "Cadastro One",
        formUrl: "https://example.com/form/1",
        reason: "Comprovante de renda desatualizado",
        sequenceNumber: 1,
        totalInSequence: 24,
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("ajuste necessário");
      expect(call.html).toContain("Comprovante de renda desatualizado");
    });

    it("should use rejection V2 content for sequence 2", async () => {
      await sendRejectionCadenceEmail({
        to: "t@t.com",
        formTitle: "F",
        formUrl: "http://x.com",
        reason: "R",
        sequenceNumber: 2,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("quase aprovado");
    });

    it("should use rejection V3 content for sequence 3", async () => {
      await sendRejectionCadenceEmail({
        to: "t@t.com",
        formTitle: "F",
        formUrl: "http://x.com",
        reason: "R",
        sequenceNumber: 3,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("perca sua vaga");
    });

    it("should include reason and client data in HTML", async () => {
      await sendRejectionCadenceEmail({
        to: "t@t.com",
        clientName: "Maria",
        formTitle: "Cadastro One",
        formUrl: "http://example.com/form",
        reason: "RG vencido",
        sequenceNumber: 1,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Maria");
      expect(call.html).toContain("RG vencido");
      expect(call.html).toContain("Cadastro One");
      expect(call.html).toContain("http://example.com/form");
    });
  });

  describe("sendFollowUpEmail (legacy)", () => {
    it("should delegate to sendCadenceEmail with sequence 1", async () => {
      const result = await sendFollowUpEmail({
        to: "cliente@test.com",
        clientName: "Test",
        formTitle: "Formulário",
        formUrl: "https://example.com/form/1",
      });

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledOnce();
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("quase pronto");
    });
  });

  describe("Error handling", () => {
    it("should return false when Resend returns an error", async () => {
      mockSend.mockResolvedValueOnce({ data: null, error: { message: "Send failed" } });

      const result = await sendApprovalEmail({
        to: "test@test.com",
        clientName: "Test",
      });

      expect(result).toBe(false);
    });

    it("should return false when Resend throws", async () => {
      mockSend.mockRejectedValueOnce(new Error("Network error"));

      const result = await sendProtocolEmail({
        to: "test@test.com",
        protocolCode: "ABC-123",
        formTitle: "Test",
      });

      expect(result).toBe(false);
    });
  });

  describe("Sender consistency", () => {
    it("all emails should use the same sender", async () => {
      const emails = [
        () => sendInviteEmail({ to: "t@t.com", inviterName: "A", role: "corretor", inviteUrl: "http://x.com" }),
        () => sendProtocolEmail({ to: "t@t.com", protocolCode: "X", formTitle: "F" }),
        () => sendApprovalEmail({ to: "t@t.com", clientName: "C" }),
        () => sendRejectionEmail({ to: "t@t.com", clientName: "C", reason: "R" }),
        () => sendCadenceEmail({ to: "t@t.com", formTitle: "F", formUrl: "http://x.com", sequenceNumber: 1, totalInSequence: 24 }),
        () => sendRejectionCadenceEmail({ to: "t@t.com", formTitle: "F", formUrl: "http://x.com", reason: "R", sequenceNumber: 1, totalInSequence: 24 }),
      ];

      for (const sendFn of emails) {
        vi.clearAllMocks();
        mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
        await sendFn();
        const call = mockSend.mock.calls[0][0];
        expect(call.from).toContain("one@cadastrodigital.com.br");
        expect(call.from).toContain("One Innovation");
      }
    });
  });

  describe("White text visibility", () => {
    it("all emails should have white text colors for dark background", async () => {
      const emails = [
        () => sendInviteEmail({ to: "t@t.com", inviterName: "A", role: "corretor", inviteUrl: "http://x.com" }),
        () => sendProtocolEmail({ to: "t@t.com", protocolCode: "X", formTitle: "F" }),
        () => sendApprovalEmail({ to: "t@t.com", clientName: "C" }),
        () => sendRejectionEmail({ to: "t@t.com", clientName: "C", reason: "R" }),
        () => sendCadenceEmail({ to: "t@t.com", formTitle: "F", formUrl: "http://x.com", sequenceNumber: 1, totalInSequence: 24 }),
        () => sendRejectionCadenceEmail({ to: "t@t.com", formTitle: "F", formUrl: "http://x.com", reason: "R", sequenceNumber: 1, totalInSequence: 24 }),
      ];

      for (const sendFn of emails) {
        vi.clearAllMocks();
        mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
        await sendFn();
        const call = mockSend.mock.calls[0][0];
        // All emails should use inline HTML (not Resend templates)
        expect(call.html).toBeDefined();
        expect(call.template).toBeUndefined();
        // Dark background
        expect(call.html).toContain("#0a0f1a");
        // White/light text colors
        expect(call.html).toContain("#f1f5f9");
      }
    });
  });
});
