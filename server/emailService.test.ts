import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the email service — Resend templates.
 * Tests that correct template aliases and variables are passed to Resend.
 * Weekly summary still uses inline HTML.
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

describe("Email Service — Resend Templates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  describe("sendInviteEmail", () => {
    it("should send invite email using template one-invite-staff", async () => {
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
      expect(call.template).toBeDefined();
      expect(call.template.id).toBe("41d689fb-2ed7-469a-9e3d-6204085bd5bc"); // one-invite-staff
      expect(call.template.variables.INVITEE_NAME).toBe("Maria Santos");
      expect(call.template.variables.INVITER_NAME).toBe("João Silva");
      expect(call.template.variables.ROLE_DISPLAY).toBe("Corretor(a)");
      expect(call.template.variables.INVITE_URL).toBe("https://example.com/invite/abc123");
    });

    it("should use 'Olá' when inviteeName is not provided", async () => {
      await sendInviteEmail({
        to: "gerente@test.com",
        inviterName: "Admin",
        role: "gerente",
        inviteUrl: "https://example.com/invite/xyz",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.template.variables.INVITEE_NAME).toBe("Olá");
      expect(call.template.variables.ROLE_DISPLAY).toBe("Gerente");
    });

    it("should map role labels correctly", async () => {
      const roleMappings = [
        ["diretor", "Diretor(a)"],
        ["gerente", "Gerente"],
        ["corretor", "Corretor(a)"],
      ];

      for (const [role, expected] of roleMappings) {
        vi.clearAllMocks();
        mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
        await sendInviteEmail({
          to: "t@t.com",
          inviterName: "A",
          role,
          inviteUrl: "http://x.com",
        });
        const call = mockSend.mock.calls[0][0];
        expect(call.template.variables.ROLE_DISPLAY).toBe(expected);
      }
    });
  });

  describe("sendProtocolEmail", () => {
    it("should send protocol email using template one-protocol-pending", async () => {
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
      expect(call.template.id).toBe("1d4c3ca1-026d-42ef-83c7-3b37cedcb802"); // one-protocol-pending
      expect(call.template.variables.CLIENT_NAME).toBe("Carlos Oliveira");
      expect(call.template.variables.PROTOCOL_CODE).toBe("ABC-123");
      expect(call.template.variables.FORM_TITLE).toBe("One Innovation");
    });

    it("should use 'Olá' when respondentName is not provided", async () => {
      await sendProtocolEmail({
        to: "cliente@test.com",
        protocolCode: "XYZ-789",
        formTitle: "Formulário Teste",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.template.variables.CLIENT_NAME).toBe("Olá");
    });
  });

  describe("sendApprovalEmail", () => {
    it("should send approval email using template one-approval", async () => {
      const result = await sendApprovalEmail({
        to: "cliente@test.com",
        clientName: "Ana Paula",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Ana Paula");
      expect(call.subject).toContain("aprovado");
      expect(call.template.id).toBe("bd17dc65-aa61-4ba9-8444-4f9baa841c2e"); // one-approval
      expect(call.template.variables.CLIENT_NAME).toBe("Ana Paula");
    });
  });

  describe("sendRejectionEmail", () => {
    it("should send rejection email using template one-rejection", async () => {
      const result = await sendRejectionEmail({
        to: "cliente@test.com",
        clientName: "Pedro",
        reason: "CPF inválido",
        formUrl: "https://example.com/form/123",
      });

      expect(result).toBe(true);
      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Revisão necessária");
      expect(call.template.id).toBe("9a49a11e-5022-4e3d-bf2b-cdeb80e13ac9"); // one-rejection
      expect(call.template.variables.CLIENT_NAME).toBe("Pedro");
      expect(call.template.variables.REASON).toBe("CPF inválido");
      expect(call.template.variables.FORM_URL).toBe("https://example.com/form/123");
    });

    it("should handle missing formUrl gracefully", async () => {
      await sendRejectionEmail({
        to: "cliente@test.com",
        clientName: "Pedro",
        reason: "Documento ilegível",
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.template.variables.FORM_URL).toBe("");
    });
  });

  describe("sendCadenceEmail", () => {
    it("should use template one-cadence-abandono-v1 for sequence 1", async () => {
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
      expect(call.template.id).toBe("dd26aab4-fdf6-4d3f-97f3-5915686d4a67"); // one-cadence-abandono-v1
      expect(call.template.variables.CLIENT_NAME).toBe("Lucas");
      expect(call.template.variables.FORM_TITLE).toBe("Cadastro Premium");
      expect(call.template.variables.FORM_URL).toBe("https://example.com/form/1");
    });

    it("should use template v2 for sequence 2", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 2,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("oportunidade");
      expect(call.template.id).toBe("9cb9b98c-7330-4280-9f15-258cbaaeca48"); // one-cadence-abandono-v2
    });

    it("should use template v3 for sequence 3", async () => {
      await sendCadenceEmail({
        to: "cliente@test.com",
        formTitle: "Cadastro",
        formUrl: "https://example.com/form/1",
        sequenceNumber: 3,
        totalInSequence: 24,
      });

      const call = mockSend.mock.calls[0][0];
      expect(call.subject).toContain("Lembrete");
      expect(call.template.id).toBe("0d780f6f-08cf-45d6-9f7c-bf8afeb58358"); // one-cadence-abandono-v3
    });

    it("should rotate variations cyclically (seq 4 = V1, seq 5 = V2, seq 6 = V3)", async () => {
      const expectedSubjects = ["quase pronto", "oportunidade", "Lembrete"];
      const expectedTemplates = ["dd26aab4-fdf6-4d3f-97f3-5915686d4a67", "9cb9b98c-7330-4280-9f15-258cbaaeca48", "0d780f6f-08cf-45d6-9f7c-bf8afeb58358"]; // v1, v2, v3

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
        expect(call.template.id).toBe(expectedTemplates[(seq - 1) % 3]);
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
      expect(call.template.variables.CLIENT_NAME).toBe("Olá");
    });
  });

  describe("sendRejectionCadenceEmail", () => {
    it("should use template one-cadence-rejection-v1 for sequence 1", async () => {
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
      expect(call.template.id).toBe("73360690-8866-4c88-9a65-b8dc053c1ef1"); // one-cadence-rejection-v1
      expect(call.template.variables.REASON).toBe("Comprovante de renda desatualizado");
    });

    it("should use rejection v2 template for sequence 2", async () => {
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
      expect(call.template.id).toBe("7771cbf0-4b04-4254-824a-21ac3440a1ed"); // one-cadence-rejection-v2
    });

    it("should use rejection v3 template for sequence 3", async () => {
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
      expect(call.template.id).toBe("ac1d6bb6-499e-4ab1-8794-62518cc7e0bd"); // one-cadence-rejection-v3
    });

    it("should include reason and client data in template variables", async () => {
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
      expect(call.template.variables.CLIENT_NAME).toBe("Maria");
      expect(call.template.variables.REASON).toBe("RG vencido");
      expect(call.template.variables.FORM_TITLE).toBe("Cadastro One");
      expect(call.template.variables.FORM_URL).toBe("http://example.com/form");
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
      expect(call.template.id).toBe("dd26aab4-fdf6-4d3f-97f3-5915686d4a67"); // one-cadence-abandono-v1
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

  describe("Template-based emails", () => {
    it("all template emails should use template property instead of html", async () => {
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
        // Template emails should have template property
        expect(call.template).toBeDefined();
        expect(call.template.id).toBeDefined();
        expect(call.template.variables).toBeDefined();
        // Template emails should NOT have html property
        expect(call.html).toBeUndefined();
      }
    });
  });
});
