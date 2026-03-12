import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateCadastroInteressePdf } from "./pdfGenerator";

describe("PDF Generator - Cadastro de Interesse", () => {
  const mockQuestionsPF = [
    { id: "q1", type: "welcome", title: "Bem-vindo" },
    { id: "q2", type: "multiple-choice", title: "Pretende fazer a aquisição como:" },
    // PF questions — using the q*_pf_* IDs that the generator expects
    { id: "q23_pf_nome", type: "short-text", title: "Nome completo" },
    { id: "q24_pf_cpf", type: "short-text", title: "CPF" },
    { id: "q25_pf_nascimento", type: "date", title: "Data de nascimento" },
    { id: "q26_pf_sexo", type: "multiple-choice", title: "Sexo" },
    { id: "q27_pf_nacionalidade", type: "short-text", title: "Nacionalidade" },
    { id: "q28_pf_estado_civil", type: "short-text", title: "Estado civil" },
    { id: "q29_pf_rg", type: "short-text", title: "Identidade nº (RG)" },
    { id: "q30_pf_celular", type: "phone", title: "Celular" },
    { id: "q31_pf_email", type: "email", title: "E-mail" },
    { id: "q32_pf_endereco", type: "address", title: "Endereço residencial" },
    { id: "q33_pf_profissao", type: "short-text", title: "Profissão" },
    { id: "q34_pf_renda", type: "currency", title: "Renda mensal" },
    // Cônjuge questions
    { id: "q41_conjuge_nome", type: "short-text", title: "Nome cônjuge" },
    { id: "q42_conjuge_cpf", type: "short-text", title: "CPF" },
    { id: "q43_conjuge_nascimento", type: "date", title: "Data de nascimento" },
    { id: "q44_conjuge_celular", type: "phone", title: "Celular" },
    { id: "q45_conjuge_email", type: "email", title: "E-mail" },
    { id: "q46_conjuge_sexo", type: "multiple-choice", title: "Sexo" },
    { id: "q47_conjuge_nacionalidade", type: "short-text", title: "Nacionalidade" },
    { id: "q48_conjuge_rg", type: "short-text", title: "Identidade nº (RG)" },
    { id: "q49_conjuge_profissao", type: "short-text", title: "Profissão" },
  ];

  const mockAnswersPF: Record<string, any> = {
    q2: "Pessoa Física",
    q23_pf_nome: "João da Silva",
    q24_pf_cpf: "123.456.789-00",
    q25_pf_nascimento: "1990-05-15",
    q26_pf_sexo: "Masculino",
    q27_pf_nacionalidade: "Brasileiro",
    q28_pf_estado_civil: "Casado",
    q29_pf_rg: "12.345.678-9",
    q30_pf_celular: "(11) 99999-8888",
    q31_pf_email: "joao@email.com",
    q32_pf_endereco: { street: "Rua das Flores", number: "123", complement: "Apto 4", neighborhood: "Centro", city: "São Paulo", state: "SP", zipCode: "01234-567" },
    q33_pf_profissao: "Engenheiro",
    q34_pf_renda: 15000,
    q41_conjuge_nome: "Maria da Silva",
    q42_conjuge_cpf: "987.654.321-00",
    q43_conjuge_nascimento: "1992-08-20",
    q44_conjuge_celular: "(11) 88888-7777",
    q45_conjuge_email: "maria@email.com",
    q46_conjuge_sexo: "Feminino",
    q47_conjuge_nacionalidade: "Brasileira",
    q48_conjuge_rg: "98.765.432-1",
    q49_conjuge_profissao: "Advogada",
  };

  const mockQuestionsPJ = [
    { id: "q1", type: "welcome", title: "Bem-vindo" },
    { id: "q2", type: "multiple-choice", title: "Pretende fazer a aquisição como:" },
    // PJ questions — using the q*_pj_* IDs
    { id: "q3_pj_nome_socio", type: "short-text", title: "Nome completo do sócio" },
    { id: "q4_pj_cpf", type: "short-text", title: "CPF" },
    { id: "q5_pj_nascimento", type: "date", title: "Data de nascimento" },
    { id: "q6_pj_sexo", type: "multiple-choice", title: "Sexo" },
    { id: "q7_pj_nacionalidade", type: "short-text", title: "Nacionalidade" },
    { id: "q8_pj_rg", type: "short-text", title: "Identidade nº (RG)" },
    { id: "q9_pj_celular", type: "phone", title: "Celular" },
    { id: "q10_pj_email", type: "email", title: "E-mail" },
    { id: "q11_pj_endereco", type: "address", title: "Endereço residencial" },
    { id: "q12_pj_renda", type: "currency", title: "Renda mensal" },
    { id: "q14_pj_nome_empresa", type: "short-text", title: "Nome da empresa" },
    { id: "q15_pj_cnpj", type: "short-text", title: "CNPJ/MF" },
    { id: "q16_pj_email_comercial", type: "email", title: "E-mail comercial" },
  ];

  const mockAnswersPJ: Record<string, any> = {
    q2: "Pessoa Jurídica",
    q3_pj_nome_socio: "Carlos Souza",
    q4_pj_cpf: "111.222.333-44",
    q5_pj_nascimento: "1985-03-10",
    q6_pj_sexo: "Masculino",
    q7_pj_nacionalidade: "Brasileiro",
    q8_pj_rg: "11.222.333-4",
    q9_pj_celular: "(21) 99999-1111",
    q10_pj_email: "carlos@empresa.com",
    q11_pj_endereco: { street: "Av. Paulista", number: "1000", neighborhood: "Bela Vista", city: "São Paulo", state: "SP", zipCode: "01310-100" },
    q12_pj_renda: 25000,
    q14_pj_nome_empresa: "Souza Empreendimentos LTDA",
    q15_pj_cnpj: "12.345.678/0001-90",
    q16_pj_email_comercial: "contato@souza.com.br",
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
        answers: mockAnswersPF, // q28_pf_estado_civil = "Casado"
        questions: mockQuestionsPF,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);
    });

    it("should generate PF PDF without Proponente 2 data when solteiro", async () => {
      const solteiroAnswers = { ...mockAnswersPF, q28_pf_estado_civil: "Solteiro" };
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
        answers: { q14_pj_nome_empresa: "Empresa Teste", q15_pj_cnpj: "00.000.000/0001-00" },
        questions: mockQuestionsPJ,
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(500);
    });

    it("should handle address as string instead of object", async () => {
      const answersWithStringAddr = {
        ...mockAnswersPF,
        q32_pf_endereco: "Rua das Flores, 123, Centro, São Paulo - SP",
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
