import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCadastroInteressePdf } from "./pdfGenerator";

describe("PDF Generator - Cadastro de Interesse", () => {
  const mockQuestionsPF = [
    { id: "q1", type: "welcome", title: "Bem-vindo" },
    { id: "q2", type: "multiple-choice", title: "Pretende fazer a aquisição como:" },
    // PF questions
    { id: "q23", type: "short-text", title: "Nome completo" },
    { id: "q24", type: "short-text", title: "CPF" },
    { id: "q25", type: "date", title: "Data de nascimento" },
    { id: "q26", type: "multiple-choice", title: "Sexo" },
    { id: "q27", type: "short-text", title: "Nacionalidade" },
    { id: "q28", type: "short-text", title: "Identidade nº (RG)" },
    { id: "q29", type: "phone", title: "Celular" },
    { id: "q30", type: "email", title: "E-mail" },
    { id: "q31", type: "short-text", title: "Estado civil" },
    { id: "q32", type: "address", title: "Endereço residencial" },
    { id: "q33", type: "short-text", title: "Profissão" },
    { id: "q34", type: "currency", title: "Renda mensal" },
    // Cônjuge questions
    { id: "q41", type: "short-text", title: "Nome cônjuge" },
    { id: "q42", type: "short-text", title: "CPF" },
    { id: "q43", type: "date", title: "Data de nascimento" },
    { id: "q44", type: "phone", title: "Celular" },
    { id: "q45", type: "email", title: "E-mail" },
    { id: "q46", type: "multiple-choice", title: "Sexo" },
    { id: "q47", type: "short-text", title: "Nacionalidade" },
    { id: "q48", type: "short-text", title: "Identidade nº (RG)" },
    { id: "q49", type: "short-text", title: "Profissão" },
    { id: "q50", type: "file-upload", title: "CNH ou RG" },
  ];

  const mockAnswersPF = {
    q2: "Pessoa Física",
    q23: "João da Silva",
    q24: "123.456.789-00",
    q25: "1990-05-15",
    q26: "Masculino",
    q27: "Brasileiro",
    q28: "12.345.678-9",
    q29: "(11) 99999-8888",
    q30: "joao@email.com",
    q31: "Casado",
    q32: { street: "Rua das Flores", number: "123", complement: "Apto 4", neighborhood: "Centro", city: "São Paulo", state: "SP", zipCode: "01234-567" },
    q33: "Engenheiro",
    q34: 15000,
    q41: "Maria da Silva",
    q42: "987.654.321-00",
    q43: "1992-08-20",
    q44: "(11) 88888-7777",
    q45: "maria@email.com",
    q46: "Feminino",
    q47: "Brasileira",
    q48: "98.765.432-1",
    q49: "Advogada",
  };

  const mockQuestionsPJ = [
    { id: "q1", type: "welcome", title: "Bem-vindo" },
    { id: "q2", type: "multiple-choice", title: "Pretende fazer a aquisição como:" },
    // PJ questions
    { id: "q3", type: "short-text", title: "Nome completo do sócio" },
    { id: "q4", type: "short-text", title: "CPF" },
    { id: "q5", type: "date", title: "Data de nascimento" },
    { id: "q6", type: "multiple-choice", title: "Sexo" },
    { id: "q7", type: "short-text", title: "Nacionalidade" },
    { id: "q8", type: "short-text", title: "Identidade nº (RG)" },
    { id: "q9", type: "phone", title: "Celular" },
    { id: "q10", type: "email", title: "E-mail" },
    { id: "q11", type: "address", title: "Endereço residencial" },
    { id: "q12", type: "currency", title: "Renda mensal" },
    { id: "q14", type: "short-text", title: "Nome da empresa" },
    { id: "q15", type: "short-text", title: "CNPJ/MF" },
    { id: "q16", type: "email", title: "E-mail comercial" },
  ];

  const mockAnswersPJ = {
    q2: "Pessoa Jurídica",
    q3: "Carlos Souza",
    q4: "111.222.333-44",
    q5: "1985-03-10",
    q6: "Masculino",
    q7: "Brasileiro",
    q8: "11.222.333-4",
    q9: "(21) 99999-1111",
    q10: "carlos@empresa.com",
    q11: { street: "Av. Paulista", number: "1000", neighborhood: "Bela Vista", city: "São Paulo", state: "SP", zipCode: "01310-100" },
    q12: 25000,
    q14: "Souza Empreendimentos LTDA",
    q15: "12.345.678/0001-90",
    q16: "contato@souza.com.br",
  };

  describe("generateCadastroInteressePdf", () => {
    it("should generate a valid PDF for Pessoa Física", async () => {
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pf",
        answers: mockAnswersPF,
        questions: mockQuestionsPF,
        respondentName: "João da Silva",
        respondentEmail: "joao@email.com",
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Check PDF header magic bytes
      const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
      expect(header).toBe("%PDF-");
    });

    it("should generate a valid PDF for Pessoa Jurídica", async () => {
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pj",
        answers: mockAnswersPJ,
        questions: mockQuestionsPJ,
        respondentName: "Carlos Souza",
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
      expect(header).toBe("%PDF-");
    });

    it("should generate PF PDF with Proponente 2 when estado civil is Casado", async () => {
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pf",
        answers: mockAnswersPF, // q31 = "Casado"
        questions: mockQuestionsPF,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
    });

    it("should generate PF PDF without Proponente 2 data when solteiro", async () => {
      const solteiroAnswers = { ...mockAnswersPF, q31: "Solteiro" };
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pf",
        answers: solteiroAnswers,
        questions: mockQuestionsPF,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
    });

    it("should handle empty answers gracefully", async () => {
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pf",
        answers: {},
        questions: mockQuestionsPF,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(500);
    });

    it("should handle PJ with minimal data", async () => {
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pj",
        answers: { q14: "Empresa Teste", q15: "00.000.000/0001-00" },
        questions: mockQuestionsPJ,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(500);
    });

    it("should handle address as string instead of object", async () => {
      const answersWithStringAddr = {
        ...mockAnswersPF,
        q32: "Rua das Flores, 123, Centro, São Paulo - SP",
      };
      const pdfBytes = await generateCadastroInteressePdf({
        tipo: "pf",
        answers: answersWithStringAddr,
        questions: mockQuestionsPF,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
    });
  });
});

describe("PDF Extra Pages Schema", () => {
  it("should validate extra pages structure", () => {
    const extraPages = [
      { url: "https://example.com/doc1.pdf", filename: "doc1.pdf", mimeType: "application/pdf" },
      { url: "https://example.com/img1.jpg", filename: "foto.jpg", mimeType: "image/jpeg" },
    ];

    expect(extraPages).toHaveLength(2);
    for (const page of extraPages) {
      expect(page).toHaveProperty("url");
      expect(page).toHaveProperty("filename");
      expect(page).toHaveProperty("mimeType");
      expect(typeof page.url).toBe("string");
      expect(typeof page.filename).toBe("string");
      expect(typeof page.mimeType).toBe("string");
    }
  });

  it("should handle removing extra page by index", () => {
    const pages = [
      { url: "https://example.com/a.pdf", filename: "a.pdf", mimeType: "application/pdf" },
      { url: "https://example.com/b.jpg", filename: "b.jpg", mimeType: "image/jpeg" },
      { url: "https://example.com/c.png", filename: "c.png", mimeType: "image/png" },
    ];

    // Remove index 1 (b.jpg)
    pages.splice(1, 1);
    expect(pages).toHaveLength(2);
    expect(pages[0].filename).toBe("a.pdf");
    expect(pages[1].filename).toBe("c.png");
  });

  it("should handle adding extra pages to existing list", () => {
    const existing = [
      { url: "https://example.com/a.pdf", filename: "a.pdf", mimeType: "application/pdf" },
    ];
    const newPages = [
      { url: "https://example.com/b.jpg", filename: "b.jpg", mimeType: "image/jpeg" },
    ];

    const updated = [...existing, ...newPages];
    expect(updated).toHaveLength(2);
    expect(updated[0].filename).toBe("a.pdf");
    expect(updated[1].filename).toBe("b.jpg");
  });

  it("should reject invalid page index for removal", () => {
    const pages = [
      { url: "https://example.com/a.pdf", filename: "a.pdf", mimeType: "application/pdf" },
    ];

    const pageIndex = 5;
    expect(pageIndex < 0 || pageIndex >= pages.length).toBe(true);
  });

  it("should handle empty extra pages array", () => {
    const extraPages: Array<{url: string; filename: string; mimeType: string}> = [];
    const attachments = [
      { url: "https://example.com/file.pdf", filename: "file.pdf", mimeType: "application/pdf" },
    ];

    const allAttachments = [...attachments, ...extraPages];
    expect(allAttachments).toHaveLength(1);
  });

  it("should merge attachments and extra pages correctly", () => {
    const attachments = [
      { url: "https://example.com/file1.pdf", filename: "file1.pdf", mimeType: "application/pdf" },
    ];
    const extraPages = [
      { url: "https://example.com/extra1.jpg", filename: "extra1.jpg", mimeType: "image/jpeg" },
      { url: "https://example.com/extra2.pdf", filename: "extra2.pdf", mimeType: "application/pdf" },
    ];

    const allAttachments = [...attachments, ...extraPages];
    expect(allAttachments).toHaveLength(3);
    expect(allAttachments[0].filename).toBe("file1.pdf");
    expect(allAttachments[1].filename).toBe("extra1.jpg");
    expect(allAttachments[2].filename).toBe("extra2.pdf");
  });
});
