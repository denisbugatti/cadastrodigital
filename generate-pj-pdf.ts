/**
 * Generate a PJ Cadastro de Interesse PDF with fictitious data
 */
import { generateCadastroInteressePdf } from "./server/pdfGenerator";
import { writeFileSync } from "fs";

const questions = [
  { id: "q1_welcome", type: "welcome", title: "Bem vindos ao cadastro online" },
  { id: "q2_tipo_pessoa", type: "multiple-choice", title: "Você pretende fazer essa aquisição como:" },
  { id: "q3_pj_nome_socio", type: "name", title: "Nome completo do sócio" },
  { id: "q4_pj_cpf", type: "cpf", title: "CPF" },
  { id: "q5_pj_nascimento", type: "date", title: "Data de nascimento" },
  { id: "q6_pj_sexo", type: "multiple-choice", title: "Sexo" },
  { id: "q7_pj_nacionalidade", type: "short-text", title: "Nacionalidade" },
  { id: "q8_pj_rg", type: "number", title: "Identidade nº (RG)" },
  { id: "q9_pj_celular", type: "phone", title: "Celular" },
  { id: "q10_pj_email", type: "email", title: "E-mail" },
  { id: "q11_pj_endereco", type: "address", title: "Endereço residencial" },
  { id: "q12_pj_renda", type: "currency", title: "Renda mensal: R$" },
  { id: "q13_pj_dados_empresa", type: "statement", title: "Dados da empresa" },
  { id: "q14_pj_nome_empresa", type: "name", title: "Nome da empresa" },
  { id: "q15_pj_cnpj", type: "cnpj", title: "CNPJ/MF" },
  { id: "q16_pj_email_comercial", type: "email", title: "E-mail comercial" },
  { id: "q17_pj_cnh", type: "file-upload", title: "CNH" },
  { id: "q18_pj_checklist", type: "statement", title: "Check List de documentos da empresa" },
  { id: "q19_pj_contrato_social", type: "file-upload", title: "Contrato Social" },
  { id: "q20_pj_cnpj_doc", type: "file-upload", title: "CNPJ" },
  { id: "q21_pj_comp_endereco_fiscal", type: "file-upload", title: "Comprovante de endereço fiscal da empresa" },
  { id: "q22_pj_comp_residencial", type: "file-upload", title: "Comprovante residencial do sócio" },
  { id: "q51_unidades", type: "multiple-choice", title: "Quantas unidade você tem interesse?" },
  { id: "q52_thankyou", type: "thank-you", title: "Parabéns seu cadastro foi concluído com sucesso!" },
];

const answers: Record<string, any> = {
  // Tipo
  q2_tipo_pessoa: "Pessoa Jurídica",

  // === DADOS DO SÓCIO ===
  q3_pj_nome_socio: "Ricardo Almeida Santos",
  q4_pj_cpf: "847.523.196-04",
  q5_pj_nascimento: "1985-03-15",
  q6_pj_sexo: "Masculino",
  q7_pj_nacionalidade: "Brasileira",
  q8_pj_rg: 32456789,
  q9_pj_celular: "(11) 98765-4321",
  q10_pj_email: "ricardo.santos@techbrasil.com.br",
  q11_pj_endereco: {
    cep: "04538-132",
    street: "Av. Brigadeiro Faria Lima",
    number: "1811",
    complement: "Apto 142, Torre Norte",
    neighborhood: "Jardim Paulistano",
    city: "São Paulo",
    state: "SP",
  },
  q12_pj_renda: "45000.00",

  // === DADOS DA EMPRESA ===
  q14_pj_nome_empresa: "TechBrasil Soluções Digitais Ltda",
  q15_pj_cnpj: "32.456.789/0001-52",
  q16_pj_email_comercial: "contato@techbrasil.com.br",

  // === DOCUMENTOS (simulando que foram enviados) ===
  q17_pj_cnh: "CNH_Ricardo_Santos.pdf",
  q19_pj_contrato_social: "Contrato_Social_TechBrasil.pdf",
  q20_pj_cnpj_doc: "CNPJ_TechBrasil.pdf",
  q21_pj_comp_endereco_fiscal: "Comprovante_Endereco_Fiscal.pdf",
  q22_pj_comp_residencial: "Comprovante_Residencial_Ricardo.pdf",

  // Unidades
  q51_unidades: "1 unidade",
};

async function main() {
  console.log("Gerando PDF PJ com dados fictícios...");

  const pdfBytes = await generateCadastroInteressePdf({
    tipo: "pj",
    answers,
    questions,
    respondentName: "Ricardo Almeida Santos",
    respondentEmail: "ricardo.santos@techbrasil.com.br",
  });

  const outputPath = "/home/ubuntu/Cadastro_Interesse_PJ_Ficticio.pdf";
  writeFileSync(outputPath, pdfBytes);
  console.log(`✅ PDF gerado com sucesso: ${outputPath}`);
  console.log(`   Tamanho: ${(pdfBytes.length / 1024).toFixed(1)} KB`);
}

main().catch(console.error);
