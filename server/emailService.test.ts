import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the email service templates and cadence logic.
 * We mock Resend so no real emails are sent.
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

describe("Email Service — One Innovation Design", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  describe("sendInviteEmail", () => {
    it("should send invite email with correct subject and recipient", async () => {
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
      expect(call.subject).toContain("Bem-vindo(a)");
      expect(call.subject).toContain("João Silva");
      expect(call.html).toContain("Maria Santos");
      expect(call.html).toContain("Corretor(a)");
      expect(call.html).toContain("https://example.com/invite/abc123");
      expect(call.html).toContain("One Innovation");
    });

    it("should use generic greeting when inviteeName is not provided", async () => {
      await sendInviteEmail({
        to: "gerente@test.com",
        inviterName: "Admin",
        role: "gerente",
        inviteUrl: "https://example.com/invite/xyz",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).toContain("Olá!");
      expect(call.html).toContain("Gerente");
    });

    it("should include One Innovation dark design elements", async () => {
      await sendInviteEmail({
        to: "test@test.com",
        inviterName: "Admin",
        role: "diretor",
        inviteUrl: "https://example.com/invite/xyz",
      });

      const call = mockSend.mock.calls[0][0];
      // Dark background
      expect(call.html).toContain("#0a0a0f");
      // Blue accent
      expect(call.html).toContain("#0D8BD9");
      // Montserrat font
      expect(call.html).toContain("Montserrat");
      // Logo
      expect(call.html).toContain("one-innovation-logo");
    });
  });

  describe("sendProtocolEmail", () => {
    it("should send protocol email with code and pending status", async () => {
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
      expect(call.html).toContain("pendente de aprovação");
      expect(call.html).toContain("Falta pouco");
      expect(call.html).toContain("Envie o protocolo para seu corretor");
    });

    it("should include text version", async () => {
      await sendProtocolEmail({
        to: "cliente@test.com",
        protocolCode: "XYZ-789",
        formTitle: "Formulário Teste",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.text).toContain("XYZ-789");
      expect(call.text).toContain("Formulário Teste");
    });
  });

  describe("sendApprovalEmail", () => {
    it("should send approval email with congratulations", async () => {
      const result = await sendApprovalEmail({
        to: "cliente@test.com",
        clientName: "Ana Paula",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Parabéns");
      expect(call.subject).toContain("Ana Paula");
      expect(call.html).toContain("aprovado com sucesso");
      expect(call.html).toContain("Ana Paula");
      // Green color for approval
      expect(call.html).toContain("#16a34a");
    });
  });

  describe("sendRejectionEmail", () => {
    it("should send rejection email with reason and amber styling", async () => {
      const result = await sendRejectionEmail({
        to: "cliente@test.com",
        clientName: "Pedro",
        reason: "CPF inválido. RG ilegível.",
        formUrl: "https://example.com/form/1?continue=5",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Revisão necessária");
      expect(call.html).toContain("Pedro");
      expect(call.html).toContain("CPF inválido. RG ilegível.");
      // Amber color for rejection
      expect(call.html).toContain("#f59e0b");
      // CTA button
      expect(call.html).toContain("Corrigir meu cadastro");
      expect(call.html).toContain("https://example.com/form/1?continue=5");
    });

    it("should work without formUrl", async () => {
      await sendRejectionEmail({
        to: "cliente@test.com",
        clientName: "Pedro",
        reason: "Documento ilegível",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.html).not.toContain("Corrigir meu cadastro");
    });
  });

  describe("sendCadenceEmail", () => {
    it("should send cadence email with variation 1", async () => {
      const result = await sendCadenceEmail({
        to: "cliente@test.com",
        clientName: "Lucas",
        formTitle: "Cadastro Premium",
        formUrl: "https://example.com/form/1?continue=10",
        sequenceNumber: 1,
        totalInSequence: 24,
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("quase pronto");
      expect(call.html).toContain("Lucas");
      expect(call.html).toContain("Cadastro Premium");
      expect(call.html).toContain("Continuar meu cadastro");
    });

    it("should send cadence email with variation 2", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 2,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("oportunidade");
      expect(call.html).toContain("Finalizar cadastro agora");
    });

    it("should send cadence email with variation 3", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 3,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Lembrete");
      expect(call.html).toContain("Completar cadastro");
    });

    it("should rotate variations cyclically", async () => {
      // Sequence 4 should be variation 1 again
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 4,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("quase pronto");
    });
  });

  describe("sendRejectionCadenceEmail", () => {
    it("should send rejection cadence with reason and amber styling", async () => {
      const result = await sendRejectionCadenceEmail({
        to: "cliente@test.com",
        clientName: "Fernanda",
        formTitle: "Cadastro One",
        formUrl: "https://example.com/form/1?continue=5",
        reason: "Comprovante de renda desatualizado",
        sequenceNumber: 1,
        totalInSequence: 24,
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("ajuste necessário");
      expect(call.html).toContain("Fernanda");
      expect(call.html).toContain("Comprovante de renda desatualizado");
      expect(call.html).toContain("#f59e0b");
    });

    it("should rotate rejection cadence variations", async () => {
      await sendRejectionCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        reason: "Documento ilegível",
        sequenceNumber: 2,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("quase aprovado");
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
    });
  });

  describe("Error handling", () => {
    it("should return false when Resend returns an error", async () => {
      mockSend.mockResolvedValueOnce({ data: null, error: { message: "Invalid API key" } });

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

  describe("Design consistency", () => {
    it("all emails should use the same design tokens", async () => {
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
        // All should have dark bg
        expect(call.html).toContain("#0a0a0f");
        // All should have Montserrat
        expect(call.html).toContain("Montserrat");
        // All should have the logo
        expect(call.html).toContain("one-innovation-logo");
        // All should have One Innovation footer
        expect(call.html).toContain("One Innovation");
        // All should come from the same sender
        expect(call.from).toContain("one@cadastrodigital.com.br");
      }
    });
  });
});
