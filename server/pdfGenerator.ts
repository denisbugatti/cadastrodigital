/**
 * PDF Generator for Cadastro de Interesse (PF / PJ)
 * Generates editable PDF forms filled with response data.
 * Uses pdf-lib to create form fields that can be edited in any PDF reader.
 */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts, PDFTextField } from "pdf-lib";

// ─── Types ───

interface ResponseAnswers {
  [questionId: string]: any;
}

interface FormQuestion {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  options?: any[];
}

interface AddressData {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  cep?: string;
}

interface GeneratePdfInput {
  tipo: "pf" | "pj";
  answers: ResponseAnswers;
  questions: FormQuestion[];
  respondentName?: string;
  respondentEmail?: string;
}

// ─── Helper: find answer by question title pattern ───

function findAnswer(answers: ResponseAnswers, questions: FormQuestion[], titlePattern: string | RegExp, startIdx = 0): { value: any; idx: number } | null {
  for (let i = startIdx; i < questions.length; i++) {
    const q = questions[i];
    const matches = typeof titlePattern === "string"
      ? q.title.toLowerCase().includes(titlePattern.toLowerCase())
      : titlePattern.test(q.title);
    if (matches && answers[q.id] !== undefined) {
      return { value: answers[q.id], idx: i };
    }
  }
  return null;
}

function findAnswerValue(answers: ResponseAnswers, questions: FormQuestion[], titlePattern: string | RegExp, startIdx = 0): any {
  return findAnswer(answers, questions, titlePattern, startIdx)?.value ?? "";
}

function formatAddress(addr: any): { full: string; bairro: string; cidade: string; estado: string; cep: string } {
  if (!addr || typeof addr !== "object") return { full: "", bairro: "", cidade: "", estado: "", cep: "" };
  const parts = [addr.street, addr.number, addr.complement].filter(Boolean).join(", ");
  return {
    full: parts || "",
    bairro: addr.neighborhood || addr.bairro || "",
    cidade: addr.city || addr.cidade || "",
    estado: addr.state || addr.estado || "",
    cep: addr.zipCode || addr.cep || addr.zip || "",
  };
}

function formatCurrency(val: any): string {
  if (!val) return "";
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^\d.,]/g, "").replace(",", "."));
  if (isNaN(num)) return String(val);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(val: any): string {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return String(val);
  }
}

// ─── PDF Layout Constants ───

const COLORS = {
  black: rgb(0, 0, 0),
  darkGray: rgb(0.2, 0.2, 0.2),
  medGray: rgb(0.5, 0.5, 0.5),
  lightGray: rgb(0.85, 0.85, 0.85),
  white: rgb(1, 1, 1),
  headerBg: rgb(0.15, 0.15, 0.15),
  accentBlue: rgb(0.1, 0.4, 0.7),
};

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

// ─── Draw helpers ───

function drawSectionHeader(page: PDFPage, y: number, text: string, font: PDFFont, boldFont: PDFFont): number {
  page.drawRectangle({
    x: MARGIN,
    y: y - 18,
    width: CONTENT_WIDTH,
    height: 20,
    color: rgb(0.9, 0.9, 0.9),
  });
  page.drawText(text.toUpperCase(), {
    x: MARGIN + 6,
    y: y - 14,
    size: 9,
    font: boldFont,
    color: COLORS.black,
  });
  return y - 24;
}

function drawLabelValue(
  page: PDFPage,
  y: number,
  label: string,
  value: string,
  font: PDFFont,
  boldFont: PDFFont,
  x: number = MARGIN,
  width: number = CONTENT_WIDTH,
  pdfDoc?: PDFDocument,
  fieldName?: string,
): number {
  // Label
  page.drawText(label.toUpperCase(), {
    x: x + 4,
    y: y - 10,
    size: 6.5,
    font: font,
    color: COLORS.medGray,
  });

  // Box
  page.drawRectangle({
    x: x,
    y: y - 28,
    width: width,
    height: 16,
    borderColor: COLORS.lightGray,
    borderWidth: 0.5,
    color: COLORS.white,
  });

  // If pdfDoc provided, create an editable form field
  if (pdfDoc && fieldName) {
    const form = pdfDoc.getForm();
    const field = form.createTextField(fieldName);
    field.setText(String(value || ""));
    field.addToPage(page, {
      x: x + 2,
      y: y - 28,
      width: width - 4,
      height: 16,
      borderWidth: 0,
    });
    field.setFontSize(8);
  } else {
    // Static text fallback
    page.drawText(String(value || ""), {
      x: x + 4,
      y: y - 24,
      size: 8,
      font: font,
      color: COLORS.black,
      maxWidth: width - 8,
    });
  }

  return y - 32;
}

function drawTwoColumns(
  page: PDFPage,
  y: number,
  label1: string, value1: string,
  label2: string, value2: string,
  font: PDFFont, boldFont: PDFFont,
  pdfDoc?: PDFDocument,
  fieldName1?: string, fieldName2?: string,
): number {
  const colWidth = (CONTENT_WIDTH - 10) / 2;
  drawLabelValue(page, y, label1, value1, font, boldFont, MARGIN, colWidth, pdfDoc, fieldName1);
  drawLabelValue(page, y, label2, value2, font, boldFont, MARGIN + colWidth + 10, colWidth, pdfDoc, fieldName2);
  return y - 32;
}

function drawThreeColumns(
  page: PDFPage,
  y: number,
  labels: string[], values: string[],
  font: PDFFont, boldFont: PDFFont,
  pdfDoc?: PDFDocument,
  fieldNames?: string[],
): number {
  const colWidth = (CONTENT_WIDTH - 20) / 3;
  for (let i = 0; i < 3; i++) {
    drawLabelValue(page, y, labels[i] || "", values[i] || "", font, boldFont,
      MARGIN + i * (colWidth + 10), colWidth, pdfDoc, fieldNames?.[i]);
  }
  return y - 32;
}

function drawCheckbox(page: PDFPage, y: number, label: string, checked: boolean, font: PDFFont, x: number = MARGIN): number {
  // Checkbox box
  page.drawRectangle({
    x: x,
    y: y - 10,
    width: 10,
    height: 10,
    borderColor: COLORS.darkGray,
    borderWidth: 0.5,
    color: COLORS.white,
  });
  if (checked) {
    page.drawText("X", { x: x + 1.5, y: y - 9, size: 8, font, color: COLORS.black });
  }
  page.drawText(label, { x: x + 14, y: y - 8, size: 7.5, font, color: COLORS.black });
  return y - 16;
}

// ─── Header with INNOVA branding ───

function drawHeader(page: PDFPage, font: PDFFont, boldFont: PDFFont, title: string, subtitle: string): number {
  // Dark header bar
  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 70,
    width: PAGE_WIDTH,
    height: 70,
    color: COLORS.headerBg,
  });

  // INNOVA text
  page.drawText("INNOVA", {
    x: PAGE_WIDTH - MARGIN - 120,
    y: PAGE_HEIGHT - 35,
    size: 22,
    font: boldFont,
    color: COLORS.white,
  });
  page.drawText("NEGÓCIOS IMOBILIÁRIOS", {
    x: PAGE_WIDTH - MARGIN - 120,
    y: PAGE_HEIGHT - 50,
    size: 7,
    font: font,
    color: COLORS.white,
  });

  // Title
  page.drawText(title, {
    x: MARGIN,
    y: PAGE_HEIGHT - 100,
    size: 14,
    font: boldFont,
    color: COLORS.black,
  });
  page.drawText(subtitle, {
    x: MARGIN,
    y: PAGE_HEIGHT - 116,
    size: 10,
    font: boldFont,
    color: COLORS.black,
  });

  // Date
  const today = new Date().toLocaleDateString("pt-BR");
  page.drawText(`DATA DO CADASTRO: ${today}`, {
    x: PAGE_WIDTH - MARGIN - 140,
    y: PAGE_HEIGHT - 100,
    size: 8,
    font: font,
    color: COLORS.darkGray,
  });

  return PAGE_HEIGHT - 130;
}

// ─── Proponente / Sócio block ───

function drawPersonBlock(
  page: PDFPage,
  y: number,
  label: string,
  data: {
    nome: string;
    sexo: string;
    cpf: string;
    nacionalidade: string;
    dataNasc: string;
    identidade: string;
    profissao: string;
    estadoCivil: string;
    dataCasamento: string;
    regimeCasamento: string;
    rendaMensal: string;
    telResidencial: string;
    celular: string;
    endereco: string;
    cep: string;
    bairro: string;
    cidade: string;
    estado: string;
    email: string;
  },
  font: PDFFont,
  boldFont: PDFFont,
  pdfDoc: PDFDocument,
  prefix: string,
  isPJ: boolean = false,
): number {
  y = drawSectionHeader(page, y, label, font, boldFont);

  // Row 1: Nome + Sexo
  const col2w = 100;
  const col1w = CONTENT_WIDTH - col2w - 10;
  drawLabelValue(page, y, "Nome", data.nome, font, boldFont, MARGIN, col1w, pdfDoc, `${prefix}_nome`);
  drawLabelValue(page, y, "Sexo", data.sexo, font, boldFont, MARGIN + col1w + 10, col2w, pdfDoc, `${prefix}_sexo`);
  y -= 32;

  // Row 2: CPF + Nacionalidade + Data Nasc
  y = drawThreeColumns(page, y,
    ["CPF Nº", "Nacionalidade", "Data de Nasc."],
    [data.cpf, data.nacionalidade, data.dataNasc],
    font, boldFont, pdfDoc,
    [`${prefix}_cpf`, `${prefix}_nacionalidade`, `${prefix}_datanasc`],
  );

  // Row 3: Identidade + Profissão
  y = drawTwoColumns(page, y,
    "Identidade Nº", data.identidade,
    isPJ ? "Renda Mensal R$" : "Profissão", isPJ ? data.rendaMensal : data.profissao,
    font, boldFont, pdfDoc,
    `${prefix}_identidade`, isPJ ? `${prefix}_renda` : `${prefix}_profissao`,
  );

  if (!isPJ) {
    // Row 4: Estado Civil + Data Casamento
    y = drawTwoColumns(page, y,
      "Estado Civil", data.estadoCivil,
      "Data de Casamento", data.dataCasamento,
      font, boldFont, pdfDoc,
      `${prefix}_estadocivil`, `${prefix}_datacasamento`,
    );

    // Row 5: Regime Casamento + Renda Mensal
    y = drawTwoColumns(page, y,
      "Regime de Casamento", data.regimeCasamento,
      "Renda Mensal R$", data.rendaMensal,
      font, boldFont, pdfDoc,
      `${prefix}_regimecasamento`, `${prefix}_renda`,
    );
  }

  // Row: Tel + Celular
  y = drawTwoColumns(page, y,
    "Tel. Residencial", data.telResidencial,
    "Celular", data.celular,
    font, boldFont, pdfDoc,
    `${prefix}_telresidencial`, `${prefix}_celular`,
  );

  // Row: Endereço + CEP
  const cepW = 80;
  const endW = CONTENT_WIDTH - cepW - 10;
  drawLabelValue(page, y, "Endereço Residencial / Nº / Complemento", data.endereco, font, boldFont, MARGIN, endW, pdfDoc, `${prefix}_endereco`);
  drawLabelValue(page, y, "CEP", data.cep, font, boldFont, MARGIN + endW + 10, cepW, pdfDoc, `${prefix}_cep`);
  y -= 32;

  // Row: Bairro + Cidade + Estado
  y = drawThreeColumns(page, y,
    ["Bairro Residencial", "Cidade Residencial", "Estado"],
    [data.bairro, data.cidade, data.estado],
    font, boldFont, pdfDoc,
    [`${prefix}_bairro`, `${prefix}_cidade`, `${prefix}_estado`],
  );

  // Row: Email
  y = drawLabelValue(page, y, "E-mail", data.email, font, boldFont, MARGIN, CONTENT_WIDTH, pdfDoc, `${prefix}_email`);

  return y - 8;
}

// ─── Empresa block (PJ only) ───

function drawEmpresaBlock(
  page: PDFPage,
  y: number,
  data: {
    nome: string;
    cnpj: string;
    endereco: string;
    cep: string;
    bairro: string;
    cidade: string;
    estado: string;
    contato: string;
    recado: string;
    email: string;
  },
  font: PDFFont,
  boldFont: PDFFont,
  pdfDoc: PDFDocument,
): number {
  y = drawSectionHeader(page, y, "EMPRESA", font, boldFont);

  y = drawLabelValue(page, y, "Empresa", data.nome, font, boldFont, MARGIN, CONTENT_WIDTH, pdfDoc, "empresa_nome");
  y = drawLabelValue(page, y, "CNPJ/MF", data.cnpj, font, boldFont, MARGIN, CONTENT_WIDTH, pdfDoc, "empresa_cnpj");

  // Endereço + CEP
  const cepW = 80;
  const endW = CONTENT_WIDTH - cepW - 10;
  drawLabelValue(page, y, "Endereço / Nº / Complemento", data.endereco, font, boldFont, MARGIN, endW, pdfDoc, "empresa_endereco");
  drawLabelValue(page, y, "CEP", data.cep, font, boldFont, MARGIN + endW + 10, cepW, pdfDoc, "empresa_cep");
  y -= 32;

  y = drawThreeColumns(page, y,
    ["Bairro", "Cidade", "Estado"],
    [data.bairro, data.cidade, data.estado],
    font, boldFont, pdfDoc,
    ["empresa_bairro", "empresa_cidade", "empresa_estado"],
  );

  y = drawThreeColumns(page, y,
    ["Contato", "Recado", "E-mail"],
    [data.contato, data.recado, data.email],
    font, boldFont, pdfDoc,
    ["empresa_contato", "empresa_recado", "empresa_email"],
  );

  return y - 8;
}

// ─── Check List block ───

function drawCheckList(
  page: PDFPage,
  y: number,
  isPJ: boolean,
  hasConjuge: boolean,
  font: PDFFont,
  boldFont: PDFFont,
  attachedFiles: string[],
): number {
  y = drawSectionHeader(page, y, "CHECK LIST DE DOCUMENTOS", font, boldFont);

  if (isPJ) {
    // Empresa docs
    const hasCnpjDoc = attachedFiles.some(f => /cnpj/i.test(f));
    const hasContratoSocial = attachedFiles.some(f => /contrato/i.test(f));
    y = drawCheckbox(page, y, "CNPJ", hasCnpjDoc, font);
    y = drawCheckbox(page, y, "Contrato Social", hasContratoSocial, font);
    y -= 4;

    // Sócio 1 docs
    page.drawText("SÓCIO 1:", { x: MARGIN, y: y - 8, size: 7, font: boldFont, color: COLORS.black });
    y -= 14;
    const hasCnh = attachedFiles.some(f => /cnh/i.test(f));
    const hasResidencia = attachedFiles.some(f => /resid/i.test(f));
    y = drawCheckbox(page, y, "RG e CPF (ou CNH)", hasCnh, font);
    y = drawCheckbox(page, y, "Comprovante de Residência", hasResidencia, font);
  } else {
    // PF - Proponente 1
    const col1x = MARGIN;
    const col2x = MARGIN + CONTENT_WIDTH / 2 + 5;

    page.drawText("PROPONENTE 1:", { x: col1x, y: y - 8, size: 7, font: boldFont, color: COLORS.black });
    if (hasConjuge) {
      page.drawText("PROPONENTE 2:", { x: col2x, y: y - 8, size: 7, font: boldFont, color: COLORS.black });
    }
    y -= 14;

    const hasCnh = attachedFiles.some(f => /cnh/i.test(f));
    const hasResidencia = attachedFiles.some(f => /resid[eê]ncia/i.test(f));
    const hasEstadoCivil = attachedFiles.some(f => /estado.?civil|casamento/i.test(f));

    // Proponente 1
    y = drawCheckbox(page, y, "RG e CPF (ou CNH)", hasCnh, font, col1x);
    if (hasConjuge) drawCheckbox(page, y + 16, "RG e CPF (ou CNH)", false, font, col2x);

    y = drawCheckbox(page, y, "Comprovante de Residência", hasResidencia, font, col1x);
    if (hasConjuge) drawCheckbox(page, y + 16, "Comprovante de Residência", false, font, col2x);

    y = drawCheckbox(page, y, "Comprovante de Estado Civil", hasEstadoCivil, font, col1x);
    if (hasConjuge) drawCheckbox(page, y + 16, "Comprovante de Estado Civil", false, font, col2x);
  }

  return y - 8;
}

// ─── Main: Generate Cadastro de Interesse PDF ───

export async function generateCadastroInteressePdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { tipo, answers, questions } = input;
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const titleSuffix = tipo === "pf" ? "PESSOA FÍSICA" : "PESSOA JURÍDICA";
  let y = drawHeader(page, font, boldFont, "CADASTRO DE INTERESSE PARA EMPREENDIMENTO", titleSuffix);

  // Collect attached file names for checklist
  const attachedFiles: string[] = [];
  for (const q of questions) {
    if (q.type === "file-upload" && answers[q.id]) {
      const val = answers[q.id];
      const name = typeof val === "string" ? val : val?.filename || val?.name || q.title;
      attachedFiles.push(String(name));
    }
  }

  if (tipo === "pj") {
    // ─── PJ Flow ───
    // Questions 3-12 are Sócio data, 13-16 are Empresa data

    // Find empresa data
    const empresaNome = findAnswerValue(answers, questions, /nome.*empresa|raz[aã]o.*social/i);
    const empresaCnpj = findAnswerValue(answers, questions, /cnpj/i);
    const empresaEmail = findAnswerValue(answers, questions, /e-?mail.*comerc|e-?mail.*corporat/i);

    // Empresa block
    y = drawEmpresaBlock(page, y, {
      nome: String(empresaNome),
      cnpj: String(empresaCnpj),
      endereco: "",
      cep: "",
      bairro: "",
      cidade: "",
      estado: "",
      contato: "",
      recado: "",
      email: String(empresaEmail),
    }, font, boldFont, pdfDoc);

    // Sócio 1 data (questions at the beginning of PJ flow)
    const socioNome = findAnswerValue(answers, questions, /nome.*s[oó]cio|nome.*completo/i);
    const socioCpf = findAnswerValue(answers, questions, /^cpf$/i);
    const socioDataNasc = formatDate(findAnswerValue(answers, questions, /data.*nascimento/i));
    const socioSexo = findAnswerValue(answers, questions, /sexo/i);
    const socioNacionalidade = findAnswerValue(answers, questions, /nacionalidade/i);
    const socioIdentidade = findAnswerValue(answers, questions, /identidade|rg/i);
    const socioCelular = findAnswerValue(answers, questions, /celular/i);
    const socioEmail = findAnswerValue(answers, questions, /^e-?mail$/i);
    const socioEndereco = findAnswerValue(answers, questions, /endere[cç]o.*residencial/i);
    const socioRenda = formatCurrency(findAnswerValue(answers, questions, /renda.*mensal/i));

    const addr = formatAddress(socioEndereco);

    y = drawPersonBlock(page, y, "SÓCIO 1", {
      nome: String(socioNome),
      sexo: String(socioSexo),
      cpf: String(socioCpf),
      nacionalidade: String(socioNacionalidade),
      dataNasc: socioDataNasc,
      identidade: String(socioIdentidade),
      profissao: "",
      estadoCivil: "",
      dataCasamento: "",
      regimeCasamento: "",
      rendaMensal: socioRenda,
      telResidencial: "",
      celular: String(socioCelular),
      endereco: addr.full,
      cep: addr.cep,
      bairro: addr.bairro,
      cidade: addr.cidade,
      estado: addr.estado,
      email: String(socioEmail),
    }, font, boldFont, pdfDoc, "socio1", true);

    // Sócio 2 - empty editable block
    y = drawPersonBlock(page, y, "SÓCIO 2", {
      nome: "", sexo: "", cpf: "", nacionalidade: "", dataNasc: "",
      identidade: "", profissao: "", estadoCivil: "", dataCasamento: "",
      regimeCasamento: "", rendaMensal: "", telResidencial: "",
      celular: "", endereco: "", cep: "", bairro: "", cidade: "",
      estado: "", email: "",
    }, font, boldFont, pdfDoc, "socio2", true);

    // Check if we need a new page
    if (y < 120) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 40;
    }

    // Check list
    y = drawCheckList(page, y, true, false, font, boldFont, attachedFiles);

  } else {
    // ─── PF Flow ───
    // Questions 23-34 are Proponente 1, 40-49 are Cônjuge/Proponente 2

    // Find the PF section (after PJ questions)
    // We look for questions by title patterns
    const pfNome = findAnswerValue(answers, questions, /^nome.*completo$/i);
    const pfCpf = findAnswerValue(answers, questions, /^cpf$/i);
    const pfDataNasc = formatDate(findAnswerValue(answers, questions, /data.*nascimento/i));
    const pfSexo = findAnswerValue(answers, questions, /^sexo$/i);
    const pfNacionalidade = findAnswerValue(answers, questions, /^nacionalidade$/i);
    const pfEstadoCivil = findAnswerValue(answers, questions, /estado.*civil/i);
    const pfIdentidade = findAnswerValue(answers, questions, /identidade|rg/i);
    const pfCelular = findAnswerValue(answers, questions, /^celular$/i);
    const pfEmail = findAnswerValue(answers, questions, /^e-?mail$/i);
    const pfEndereco = findAnswerValue(answers, questions, /endere[cç]o.*residencial/i);
    const pfProfissao = findAnswerValue(answers, questions, /profiss[aã]o/i);
    const pfRenda = formatCurrency(findAnswerValue(answers, questions, /renda.*mensal/i));

    const addr = formatAddress(pfEndereco);
    const isCasado = /casad|uni[aã]o.*est[aá]vel/i.test(String(pfEstadoCivil));

    y = drawPersonBlock(page, y, "PROPONENTE 1", {
      nome: String(pfNome),
      sexo: String(pfSexo),
      cpf: String(pfCpf),
      nacionalidade: String(pfNacionalidade),
      dataNasc: pfDataNasc,
      identidade: String(pfIdentidade),
      profissao: String(pfProfissao),
      estadoCivil: String(pfEstadoCivil),
      dataCasamento: "",
      regimeCasamento: "",
      rendaMensal: pfRenda,
      telResidencial: "",
      celular: String(pfCelular),
      endereco: addr.full,
      cep: addr.cep,
      bairro: addr.bairro,
      cidade: addr.cidade,
      estado: addr.estado,
      email: String(pfEmail),
    }, font, boldFont, pdfDoc, "prop1", false);

    // Check if we need a new page for Proponente 2
    if (y < 300) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 40;
    }

    // Proponente 2 (cônjuge if married, otherwise empty)
    if (isCasado) {
      const conjNome = findAnswerValue(answers, questions, /nome.*c[oô]njuge/i);
      const conjCpf = findAnswerValue(answers, questions, /cpf/i, 35); // After question 35
      const conjDataNasc = formatDate(findAnswerValue(answers, questions, /data.*nascimento/i, 35));
      const conjSexo = findAnswerValue(answers, questions, /sexo/i, 35);
      const conjNacionalidade = findAnswerValue(answers, questions, /nacionalidade/i, 35);
      const conjIdentidade = findAnswerValue(answers, questions, /identidade|rg/i, 35);
      const conjCelular = findAnswerValue(answers, questions, /celular/i, 35);
      const conjEmail = findAnswerValue(answers, questions, /e-?mail/i, 35);
      const conjProfissao = findAnswerValue(answers, questions, /profiss[aã]o/i, 35);

      y = drawPersonBlock(page, y, "PROPONENTE 2 (CÔNJUGE)", {
        nome: String(conjNome),
        sexo: String(conjSexo),
        cpf: String(conjCpf),
        nacionalidade: String(conjNacionalidade),
        dataNasc: conjDataNasc,
        identidade: String(conjIdentidade),
        profissao: String(conjProfissao),
        estadoCivil: String(pfEstadoCivil),
        dataCasamento: "",
        regimeCasamento: "",
        rendaMensal: "",
        telResidencial: "",
        celular: String(conjCelular),
        endereco: "",
        cep: "",
        bairro: "",
        cidade: "",
        estado: "",
        email: String(conjEmail),
      }, font, boldFont, pdfDoc, "prop2", false);
    } else {
      // Empty Proponente 2 block (editable)
      y = drawPersonBlock(page, y, "PROPONENTE 2", {
        nome: "", sexo: "", cpf: "", nacionalidade: "", dataNasc: "",
        identidade: "", profissao: "", estadoCivil: "", dataCasamento: "",
        regimeCasamento: "", rendaMensal: "", telResidencial: "",
        celular: "", endereco: "", cep: "", bairro: "", cidade: "",
        estado: "", email: "",
      }, font, boldFont, pdfDoc, "prop2", false);
    }

    // Check if we need a new page for checklist
    if (y < 100) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 40;
    }

    // Check list
    y = drawCheckList(page, y, false, isCasado, font, boldFont, attachedFiles);
  }

  // Footer note
  if (y < 60) {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - 40;
  }
  y -= 20;
  page.drawText("* ATENÇÃO: Aprovação Sujeita à consulta junto ao SPC, Associação Comercial, Banco Central, Serasa.", {
    x: MARGIN,
    y: y,
    size: 7,
    font: boldFont,
    color: COLORS.darkGray,
  });

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Merge the cadastro PDF with attached file PDFs/images into a single document.
 * For images (JPG, PNG), they are embedded as full-page images.
 * For PDFs, pages are appended directly.
 */
export async function mergeWithAttachments(
  cadastroPdf: Uint8Array,
  attachments: Array<{ url: string; filename: string; mimeType: string }>,
): Promise<Uint8Array> {
  const mainDoc = await PDFDocument.load(cadastroPdf);

  for (const att of attachments) {
    try {
      const response = await fetch(att.url);
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (att.mimeType === "application/pdf") {
        // Merge PDF pages
        const extDoc = await PDFDocument.load(bytes);
        const pages = await mainDoc.copyPages(extDoc, extDoc.getPageIndices());
        for (const p of pages) {
          mainDoc.addPage(p);
        }
      } else if (att.mimeType.startsWith("image/")) {
        // Embed image as full page
        let img;
        if (att.mimeType === "image/png") {
          img = await mainDoc.embedPng(bytes);
        } else {
          img = await mainDoc.embedJpg(bytes);
        }

        // Scale to fit A4
        const scale = Math.min(PAGE_WIDTH / img.width, PAGE_HEIGHT / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;

        const newPage = mainDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        // Add label
        const font = await mainDoc.embedFont(StandardFonts.Helvetica);
        newPage.drawText(att.filename, {
          x: MARGIN,
          y: PAGE_HEIGHT - 20,
          size: 8,
          font,
          color: COLORS.medGray,
        });
        newPage.drawImage(img, {
          x: (PAGE_WIDTH - w) / 2,
          y: (PAGE_HEIGHT - h) / 2 - 10,
          width: w,
          height: h,
        });
      }
    } catch (err) {
      console.warn(`[PDF] Failed to attach ${att.filename}:`, (err as any)?.message?.substring(0, 100));
    }
  }

  return await mainDoc.save();
}
