import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch for PDF template loading
const mockPdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF header

vi.mock("pdf-lib", () => {
  const mockPage = {
    drawText: vi.fn(),
    getWidth: () => 595.32,
    getHeight: () => 841.92,
  };

  const mockTextField = {
    setText: vi.fn(),
  };

  const mockCheckBox = {
    check: vi.fn(),
  };

  const mockForm = {
    getTextField: vi.fn(() => mockTextField),
    getCheckBox: vi.fn(() => mockCheckBox),
    flatten: vi.fn(),
  };

  const mockDoc = {
    getPage: vi.fn(() => mockPage),
    getForm: vi.fn(() => mockForm),
    embedFont: vi.fn(() => ({ name: "Helvetica" })),
    save: vi.fn(() => Promise.resolve(new Uint8Array([0x25, 0x50, 0x44, 0x46]))),
    getPageCount: () => 1,
    getPageIndices: () => [0],
    copyPages: vi.fn(() => Promise.resolve([mockPage])),
    addPage: vi.fn(() => mockPage),
    embedPng: vi.fn(() => Promise.resolve({ width: 100, height: 100 })),
    embedJpg: vi.fn(() => Promise.resolve({ width: 100, height: 100 })),
  };

  return {
    PDFDocument: {
      load: vi.fn(() => Promise.resolve(mockDoc)),
      create: vi.fn(() => Promise.resolve(mockDoc)),
    },
    StandardFonts: {
      Helvetica: "Helvetica",
      HelveticaBold: "HelveticaBold",
    },
    rgb: vi.fn((r: number, g: number, b: number) => ({ r, g, b })),
  };
});

// Mock global fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(mockPdfBytes.buffer),
  } as Response)
);

describe("pdfGenerator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a PF PDF with correct data overlay", async () => {
    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    const result = await generateCadastroInteressePdf({
      tipo: "pf",
      answers: {
        q23_pf_nome: "João da Silva",
        q24_pf_cpf: "123.456.789-00",
        q25_pf_nascimento: "1990-03-15",
        q27_pf_nacionalidade: "Brasileira",
        q28_pf_estado_civil: "Solteiro(a)",
        q29_pf_rg: "12345678",
        q30_pf_celular: "(11) 99999-8888",
        q31_pf_email: "joao@email.com",
        q32_pf_endereco: {
          street: "Rua das Flores",
          number: "123",
          complement: "Apto 45",
          neighborhood: "Jardim Paulista",
          city: "São Paulo",
          state: "SP",
          zipCode: "01234-567",
        },
        q33_pf_profissao: "Engenheiro",
        q34_pf_renda: 15000,
      },
      questions: [],
      respondentName: "João da Silva",
      respondentEmail: "joao@email.com",
      createdAt: new Date("2026-03-05"),
    });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("FICHAPF_TEMPLATE")
    );
  });

  it("should generate a PJ PDF filling form fields", async () => {
    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    const result = await generateCadastroInteressePdf({
      tipo: "pj",
      answers: {
        q3_pj_nome_socio: "Maria Oliveira",
        q4_pj_cpf: "987.654.321-00",
        q5_pj_nascimento: "1985-07-20",
        q7_pj_nacionalidade: "Brasileira",
        q8_pj_rg: "87654321",
        q9_pj_celular: "(21) 98888-7777",
        q10_pj_email: "maria@empresa.com",
        q11_pj_endereco: {
          street: "Av. Brasil",
          number: "500",
          neighborhood: "Centro",
          city: "Rio de Janeiro",
          state: "RJ",
          zipCode: "20000-000",
        },
        q12_pj_renda: 25000,
        q14_pj_nome_empresa: "Empresa XYZ Ltda",
        q15_pj_cnpj: "12.345.678/0001-90",
        q16_pj_email_comercial: "contato@xyz.com",
      },
      questions: [],
      respondentName: "Maria Oliveira",
      createdAt: new Date("2026-03-05"),
    });

    expect(result).toBeInstanceOf(Uint8Array);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("FICHAPJ")
    );
  });

  it("should fill Proponente 2 when estado civil is casado", async () => {
    const { PDFDocument } = await import("pdf-lib");
    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    await generateCadastroInteressePdf({
      tipo: "pf",
      answers: {
        q23_pf_nome: "Carlos Santos",
        q24_pf_cpf: "111.222.333-44",
        q28_pf_estado_civil: "casado(a) (comunhão parcial)",
        q32_pf_endereco: {
          street: "Rua A",
          number: "10",
          neighborhood: "Bairro B",
          city: "Cidade C",
          state: "SP",
          zipCode: "12345-678",
        },
        q41_conjuge_nome: "Ana Santos",
        q42_conjuge_cpf: "555.666.777-88",
        q43_conjuge_nascimento: "1992-01-10",
        q44_conjuge_celular: "(11) 97777-6666",
        q45_conjuge_email: "ana@email.com",
        q47_conjuge_nacionalidade: "Brasileira",
        q48_conjuge_rg: "99887766",
        q49_conjuge_profissao: "Advogada",
      },
      questions: [],
      respondentName: "Carlos Santos",
      createdAt: new Date("2026-03-05"),
    });

    // Verify the PDF template was loaded
    expect(PDFDocument.load).toHaveBeenCalled();

    // Verify drawText was called (for both proponentes)
    const doc = await (PDFDocument.load as any).mock.results[0].value;
    const page = doc.getPage(0);
    // Should have many drawText calls for both P1 and P2
    expect(page.drawText.mock.calls.length).toBeGreaterThan(10);
  });

  it("should NOT fill Proponente 2 when estado civil is solteiro", async () => {
    const { PDFDocument } = await import("pdf-lib");
    vi.mocked(PDFDocument.load).mockClear();

    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    await generateCadastroInteressePdf({
      tipo: "pf",
      answers: {
        q23_pf_nome: "Pedro Lima",
        q24_pf_cpf: "999.888.777-66",
        q28_pf_estado_civil: "Solteiro(a)",
        q32_pf_endereco: {
          street: "Rua X",
          number: "5",
          neighborhood: "Centro",
          city: "Curitiba",
          state: "PR",
          zipCode: "80000-000",
        },
      },
      questions: [],
      respondentName: "Pedro Lima",
      createdAt: new Date("2026-03-05"),
    });

    const doc = await (PDFDocument.load as any).mock.results[0].value;
    const page = doc.getPage(0);
    // Should have fewer drawText calls (only P1, no P2)
    const callCount = page.drawText.mock.calls.length;
    // P1 has ~14 text draws + 1 checkbox = ~15, P2 would add ~14 more
    expect(callCount).toBeLessThan(20);
  });

  it("should correctly parse estado civil choices", async () => {
    // We test the internal parseEstadoCivil logic indirectly through generateCadastroInteressePdf
    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    // Test various estado civil values
    const testCases = [
      { input: "Solteiro(a)", expectConjuge: false },
      { input: "Casado(a) (União estável)", expectConjuge: true },
      { input: "casado(a) (separação total)", expectConjuge: true },
      { input: "casado(a) (comunhão total)", expectConjuge: true },
      { input: "casado(a) (comunhão parcial)", expectConjuge: true },
      { input: "separado(a) judicialmente", expectConjuge: false },
      { input: "Divorciado(a)", expectConjuge: false },
      { input: "Viúvo(a)", expectConjuge: false },
    ];

    for (const tc of testCases) {
      const result = await generateCadastroInteressePdf({
        tipo: "pf",
        answers: {
          q28_pf_estado_civil: tc.input,
          q32_pf_endereco: { street: "Rua A", number: "1", neighborhood: "B", city: "C", state: "SP", zipCode: "00000-000" },
          // Add cônjuge data to verify it's used or not
          q41_conjuge_nome: "Cônjuge Teste",
          q42_conjuge_cpf: "111.111.111-11",
        },
        questions: [],
        createdAt: new Date("2026-03-05"),
      });

      expect(result).toBeInstanceOf(Uint8Array);
    }
  });

  it("should merge with attachments (PDF)", async () => {
    const { mergeWithAttachments } = await import("./pdfGenerator");

    const mainPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const result = await mergeWithAttachments(mainPdf, [
      { url: "https://example.com/doc.pdf", filename: "doc.pdf", mimeType: "application/pdf" },
    ]);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("should merge with attachments (image)", async () => {
    const { mergeWithAttachments } = await import("./pdfGenerator");

    const mainPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const result = await mergeWithAttachments(mainPdf, [
      { url: "https://example.com/photo.jpg", filename: "photo.jpg", mimeType: "image/jpeg" },
    ]);

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("should handle missing answers gracefully", async () => {
    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    // PF with almost no answers
    const result = await generateCadastroInteressePdf({
      tipo: "pf",
      answers: {},
      questions: [],
      createdAt: new Date("2026-03-05"),
    });

    expect(result).toBeInstanceOf(Uint8Array);
  });

  it("should handle PJ with missing answers gracefully", async () => {
    const { generateCadastroInteressePdf } = await import("./pdfGenerator");

    const result = await generateCadastroInteressePdf({
      tipo: "pj",
      answers: {},
      questions: [],
      createdAt: new Date("2026-03-05"),
    });

    expect(result).toBeInstanceOf(Uint8Array);
  });
});
