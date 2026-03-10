import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the corretor notification service.
 * Verifies that emails include all response data and file attachment links.
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

describe("Corretor Notification — Inline HTML with answers and files", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  it("should send basic notification with client data", async () => {
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
    expect(call.html).toContain("João Silva");
    expect(call.html).toContain("Maria Santos");
    expect(call.html).toContain("maria@test.com");
    expect(call.html).toContain("(11) 99999-9999");
    expect(call.html).toContain("ABC-123");
    // Dark background + white text
    expect(call.html).toContain("#0a0f1a");
    expect(call.html).toContain("#f1f5f9");
  });

  it("should include all answers in the email", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "XYZ-789",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      answersDisplay: [
        { label: "Nome Completo", value: "Carlos Oliveira" },
        { label: "CPF", value: "123.456.789-00" },
        { label: "E-mail", value: "carlos@email.com" },
        { label: "Telefone", value: "(21) 98765-4321" },
      ],
    });

    expect(result).toBe(true);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("Respostas do Formulário");
    expect(html).toContain("Nome Completo");
    expect(html).toContain("Carlos Oliveira");
    expect(html).toContain("123.456.789-00");
    expect(html).toContain("carlos@email.com");
    expect(html).toContain("(21) 98765-4321");
  });

  it("should include file attachment links in the email", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "FILE-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      fileAttachments: [
        { filename: "rg-frente.jpg", url: "https://s3.example.com/rg-frente.jpg", mimeType: "image/jpeg" },
        { filename: "comprovante.pdf", url: "https://s3.example.com/comprovante.pdf", mimeType: "application/pdf" },
      ],
    });

    expect(result).toBe(true);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("Arquivos Anexados (2)");
    expect(html).toContain("rg-frente.jpg");
    expect(html).toContain("https://s3.example.com/rg-frente.jpg");
    expect(html).toContain("comprovante.pdf");
    expect(html).toContain("https://s3.example.com/comprovante.pdf");
    // Image icon for image files
    expect(html).toContain("🖼️");
    // Paperclip icon for non-image files
    expect(html).toContain("📎");
  });

  it("should include file-upload answers as links", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "UP-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      answersDisplay: [
        { label: "Nome", value: "Ana" },
        { label: "Documento RG", value: "https://s3.example.com/rg.jpg", isFile: true },
      ],
    });

    expect(result).toBe(true);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("Ver arquivo");
    expect(html).toContain("https://s3.example.com/rg.jpg");
  });

  it("should handle empty answers and files gracefully", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "EMPTY-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      answersDisplay: [],
      fileAttachments: [],
    });

    expect(result).toBe(true);
    const html = mockSend.mock.calls[0][0].html;
    // Should not contain the answers section header when empty
    expect(html).not.toContain("Respostas do Formulário");
    expect(html).not.toContain("Arquivos Anexados");
  });

  it("should handle missing respondent info with 'Não informado'", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "MISS-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
    });

    expect(result).toBe(true);
    const html = mockSend.mock.calls[0][0].html;
    // Should show "Não informado" for missing fields
    const notInformedCount = (html.match(/Não informado/g) || []).length;
    expect(notInformedCount).toBeGreaterThanOrEqual(3); // Name, email, phone
  });

  it("should escape HTML in answer values to prevent XSS", async () => {
    const result = await sendCorretorNotification({
      corretorName: "João",
      corretorEmail: "joao@test.com",
      protocolCode: "XSS-001",
      formTitle: "Cadastro",
      submittedAt: new Date(),
      answersDisplay: [
        { label: "Nome", value: '<script>alert("xss")</script>' },
      ],
    });

    expect(result).toBe(true);
    const html = mockSend.mock.calls[0][0].html;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
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
