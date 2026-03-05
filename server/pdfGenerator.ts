/**
 * PDF Generator for Cadastro de Interesse (PF / PJ)
 * Overlays form response data onto the original Innova PDF templates.
 * - PF: text overlay (no form fields in original)
 * - PJ: fills existing form fields in original
 */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

// ─── CDN URLs for the original PDF templates ───
const PF_TEMPLATE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/FICHAPF_TEMPLATE_55882937.pdf";
const PJ_TEMPLATE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/FICHAPJ_856f110c.pdf";
const PROTOCOLO_TEMPLATE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/ProtocolodeentradaemBRANCO_581f4fb5.pdf";

// ─── Types ───

interface ResponseAnswers {
  [questionId: string]: any;
}

interface FormQuestion {
  id: string;
  type: string;
  title: string;
  label?: string;
  subtitle?: string;
  choices?: Array<{ id: string; label: string; score?: number }>;
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
  createdAt?: Date;
}

// ─── Helpers ───

function findAnswer(answers: ResponseAnswers, questions: FormQuestion[], titlePattern: string | RegExp, startIdx = 0): { value: any; idx: number } | null {
  for (let i = startIdx; i < questions.length; i++) {
    const q = questions[i];
    const label = q.label || q.title || "";
    const matches = typeof titlePattern === "string"
      ? label.toLowerCase().includes(titlePattern.toLowerCase())
      : titlePattern.test(label);
    if (matches && answers[q.id] !== undefined) {
      return { value: answers[q.id], idx: i };
    }
  }
  return null;
}

function findAnswerValue(answers: ResponseAnswers, questions: FormQuestion[], titlePattern: string | RegExp, startIdx = 0): any {
  return findAnswer(answers, questions, titlePattern, startIdx)?.value ?? "";
}

/** Get answer by exact question ID */
function getById(answers: ResponseAnswers, id: string): any {
  return answers[id] ?? "";
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

function parseDateParts(val: any): { day: string; month: string; year: string } {
  if (!val) return { day: "", month: "", year: "" };
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return { day: "", month: "", year: "" };
    return {
      day: String(d.getDate()).padStart(2, "0"),
      month: String(d.getMonth() + 1).padStart(2, "0"),
      year: String(d.getFullYear()),
    };
  } catch {
    return { day: "", month: "", year: "" };
  }
}

async function fetchPdfTemplate(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF template: ${response.status}`);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

// ─── Estado Civil mapping ───

interface EstadoCivilResult {
  /** Which checkbox to mark: solteiro, casado, uniao_estavel, divorciado, viuvo */
  checkbox: "solteiro" | "casado" | "uniao_estavel" | "divorciado" | "viuvo";
  /** Which regime checkbox to mark (only if casado) */
  regime?: "comunhao_parcial" | "comunhao_universal" | "separacao_total" | "pacto_nupcial";
  /** Whether cônjuge data should be filled */
  needsConjuge: boolean;
}

function parseEstadoCivil(val: any): EstadoCivilResult {
  const s = String(val).toLowerCase().trim();

  if (/solteiro/i.test(s)) {
    return { checkbox: "solteiro", needsConjuge: false };
  }
  if (/uni[aã]o.*est[aá]vel/i.test(s)) {
    return { checkbox: "uniao_estavel", regime: "comunhao_parcial", needsConjuge: true };
  }
  if (/comunh[aã]o.*parcial/i.test(s)) {
    return { checkbox: "casado", regime: "comunhao_parcial", needsConjuge: true };
  }
  if (/comunh[aã]o.*total|comunh[aã]o.*universal/i.test(s)) {
    return { checkbox: "casado", regime: "comunhao_universal", needsConjuge: true };
  }
  if (/separa[cç][aã]o.*total/i.test(s)) {
    return { checkbox: "casado", regime: "separacao_total", needsConjuge: true };
  }
  if (/casad/i.test(s)) {
    // Generic "casado" — default to comunhão parcial
    return { checkbox: "casado", regime: "comunhao_parcial", needsConjuge: true };
  }
  if (/separad.*judicial/i.test(s)) {
    return { checkbox: "divorciado", needsConjuge: false };
  }
  if (/divorciad/i.test(s)) {
    return { checkbox: "divorciado", needsConjuge: false };
  }
  if (/vi[uú]v/i.test(s)) {
    return { checkbox: "viuvo", needsConjuge: false };
  }

  // Fallback
  return { checkbox: "solteiro", needsConjuge: false };
}

// ═══════════════════════════════════════════════════════════════
// PF PDF — Text overlay on original template (no form fields)
// ═══════════════════════════════════════════════════════════════

/** Proponente 1 field coordinates (verified against grid overlay) */
const PF_P1 = {
  // Value text positions (inside the boxes)
  cpf:            { x: 57,  y: 607 },
  nacionalidade:  { x: 282, y: 607 },
  dataNasc:       { x: 492, y: 607 },
  identidade:     { x: 57,  y: 582 },
  profissao:      { x: 222, y: 582 },
  rendaMensal:    { x: 57,  y: 507 },
  celular:        { x: 435, y: 507 },
  endereco:       { x: 57,  y: 487 },
  cep:            { x: 510, y: 487 },
  bairro:         { x: 57,  y: 467 },
  cidade:         { x: 252, y: 467 },
  estado:         { x: 462, y: 467 },
  email:          { x: 57,  y: 447 },

  // Estado civil checkboxes (X mark positions)
  cb_solteiro:       { x: 67,  y: 553 },
  cb_casado:         { x: 139, y: 553 },
  cb_uniao_estavel:  { x: 211, y: 553 },
  cb_divorciado:     { x: 316, y: 553 },
  cb_viuvo:          { x: 406, y: 553 },

  // Regime de casamento checkboxes
  cb_comunhao_parcial:   { x: 69,  y: 528 },
  cb_comunhao_universal: { x: 216, y: 528 },
  cb_separacao_total:    { x: 376, y: 528 },
  cb_pacto_nupcial:      { x: 486, y: 528 },
};

/** Proponente 2 = same x, y shifted down by ~220 */
const P2_Y_OFFSET = -220;
const PF_P2 = Object.fromEntries(
  Object.entries(PF_P1).map(([k, v]) => [k, { x: v.x, y: v.y + P2_Y_OFFSET }])
) as typeof PF_P1;

/** Data do cadastro position */
const PF_DATE = { day: { x: 440, y: 800 }, month: { x: 460, y: 800 }, year: { x: 480, y: 800 } };

function drawTextAt(page: PDFPage, text: string, x: number, y: number, font: PDFFont, size = 8) {
  if (!text) return;
  page.drawText(String(text), {
    x,
    y,
    size,
    font,
    color: rgb(0, 0, 0),
    maxWidth: 200,
  });
}

function drawCheckMark(page: PDFPage, x: number, y: number, font: PDFFont) {
  page.drawText("X", {
    x,
    y,
    size: 9,
    font,
    color: rgb(0, 0, 0),
  });
}

function fillProponentePF(
  page: PDFPage,
  coords: typeof PF_P1,
  data: {
    cpf: string;
    nacionalidade: string;
    dataNasc: string;
    identidade: string;
    profissao: string;
    rendaMensal: string;
    celular: string;
    endereco: string;
    cep: string;
    bairro: string;
    cidade: string;
    estado: string;
    email: string;
    estadoCivil: EstadoCivilResult;
  },
  font: PDFFont,
  boldFont: PDFFont,
) {
  drawTextAt(page, data.cpf, coords.cpf.x, coords.cpf.y, font);
  drawTextAt(page, data.nacionalidade, coords.nacionalidade.x, coords.nacionalidade.y, font);
  drawTextAt(page, data.dataNasc, coords.dataNasc.x, coords.dataNasc.y, font);
  drawTextAt(page, data.identidade, coords.identidade.x, coords.identidade.y, font);
  drawTextAt(page, data.profissao, coords.profissao.x, coords.profissao.y, font);
  drawTextAt(page, data.rendaMensal, coords.rendaMensal.x, coords.rendaMensal.y, font);
  drawTextAt(page, data.celular, coords.celular.x, coords.celular.y, font);
  drawTextAt(page, data.endereco, coords.endereco.x, coords.endereco.y, font, 7);
  drawTextAt(page, data.cep, coords.cep.x, coords.cep.y, font);
  drawTextAt(page, data.bairro, coords.bairro.x, coords.bairro.y, font);
  drawTextAt(page, data.cidade, coords.cidade.x, coords.cidade.y, font);
  drawTextAt(page, data.estado, coords.estado.x, coords.estado.y, font);
  drawTextAt(page, data.email, coords.email.x, coords.email.y, font, 7);

  // Estado civil checkbox
  const cbKey = `cb_${data.estadoCivil.checkbox}` as keyof typeof coords;
  if (coords[cbKey]) {
    drawCheckMark(page, coords[cbKey].x, coords[cbKey].y, boldFont);
  }

  // Regime de casamento checkbox
  if (data.estadoCivil.regime) {
    const regKey = `cb_${data.estadoCivil.regime}` as keyof typeof coords;
    if (coords[regKey]) {
      drawCheckMark(page, coords[regKey].x, coords[regKey].y, boldFont);
    }
  }
}

async function generatePfPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { answers, questions } = input;

  // Fetch original template
  const templateBytes = await fetchPdfTemplate(PF_TEMPLATE_URL);
  const doc = await PDFDocument.load(templateBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.getPage(0);

  // Data do cadastro
  const cadastroDate = input.createdAt ?? new Date();
  const dateParts = parseDateParts(cadastroDate);
  drawTextAt(page, dateParts.day, PF_DATE.day.x, PF_DATE.day.y, font);
  drawTextAt(page, dateParts.month, PF_DATE.month.x, PF_DATE.month.y, font);
  drawTextAt(page, dateParts.year, PF_DATE.year.x, PF_DATE.year.y, font);

  // Extract PF data from answers
  const pfNome = String(getById(answers, "q23_pf_nome") || input.respondentName || "");
  const pfCpf = String(getById(answers, "q24_pf_cpf") || "");
  const pfNascimento = getById(answers, "q25_pf_nascimento");
  const pfNacionalidade = String(getById(answers, "q27_pf_nacionalidade") || "");
  const pfEstadoCivilRaw = getById(answers, "q28_pf_estado_civil");
  const pfRg = String(getById(answers, "q29_pf_rg") || "");
  const pfCelular = String(getById(answers, "q30_pf_celular") || "");
  const pfEmail = String(getById(answers, "q31_pf_email") || input.respondentEmail || "");
  const pfEnderecoRaw = getById(answers, "q32_pf_endereco");
  const pfProfissao = String(getById(answers, "q33_pf_profissao") || "");
  const pfRenda = getById(answers, "q34_pf_renda");

  const addr = formatAddress(pfEnderecoRaw);
  const estadoCivil = parseEstadoCivil(pfEstadoCivilRaw);

  // If answer is a choice label from the form, also try to match by choice ID
  let estadoCivilParsed = estadoCivil;
  if (typeof pfEstadoCivilRaw === "string") {
    estadoCivilParsed = parseEstadoCivil(pfEstadoCivilRaw);
  }

  // Fill Proponente 1
  fillProponentePF(page, PF_P1, {
    cpf: pfCpf,
    nacionalidade: pfNacionalidade,
    dataNasc: formatDate(pfNascimento),
    identidade: pfRg,
    profissao: pfProfissao,
    rendaMensal: formatCurrency(pfRenda),
    celular: pfCelular,
    endereco: addr.full,
    cep: addr.cep,
    bairro: addr.bairro,
    cidade: addr.cidade,
    estado: addr.estado,
    email: pfEmail,
    estadoCivil: estadoCivilParsed,
  }, font, boldFont);

  // Fill Proponente 2 (cônjuge) if married
  if (estadoCivilParsed.needsConjuge) {
    const conjNome = String(getById(answers, "q41_conjuge_nome") || "");
    const conjCpf = String(getById(answers, "q42_conjuge_cpf") || "");
    const conjNascimento = getById(answers, "q43_conjuge_nascimento");
    const conjCelular = String(getById(answers, "q44_conjuge_celular") || "");
    const conjEmail = String(getById(answers, "q45_conjuge_email") || "");
    const conjNacionalidade = String(getById(answers, "q47_conjuge_nacionalidade") || "");
    const conjRg = String(getById(answers, "q48_conjuge_rg") || "");
    const conjProfissao = String(getById(answers, "q49_conjuge_profissao") || "");

    fillProponentePF(page, PF_P2, {
      cpf: conjCpf,
      nacionalidade: conjNacionalidade,
      dataNasc: formatDate(conjNascimento),
      identidade: conjRg,
      profissao: conjProfissao,
      rendaMensal: "", // Not asked for cônjuge
      celular: conjCelular,
      // Copy address from Proponente 1
      endereco: addr.full,
      cep: addr.cep,
      bairro: addr.bairro,
      cidade: addr.cidade,
      estado: addr.estado,
      email: conjEmail,
      // Copy estado civil from Proponente 1
      estadoCivil: estadoCivilParsed,
    }, font, boldFont);
  }

  return await doc.save();
}

// ═══════════════════════════════════════════════════════════════
// PJ PDF — Fill existing form fields in original template
// ═══════════════════════════════════════════════════════════════

async function generatePjPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { answers } = input;

  // Fetch original template
  const templateBytes = await fetchPdfTemplate(PJ_TEMPLATE_URL);
  const doc = await PDFDocument.load(templateBytes);
  const form = doc.getForm();

  // Helper to safely set a text field
  function setField(name: string, value: string) {
    try {
      const field = form.getTextField(name);
      field.setText(String(value || ""));
    } catch (e) {
      // Field doesn't exist, skip
      console.warn(`[PDF] Field "${name}" not found in PJ template`);
    }
  }

  // Helper to safely check a checkbox
  function checkBox(name: string) {
    try {
      const field = form.getCheckBox(name);
      field.check();
    } catch (e) {
      console.warn(`[PDF] Checkbox "${name}" not found in PJ template`);
    }
  }

  // Data do cadastro
  const cadastroDate = input.createdAt ?? new Date();
  const dateParts = parseDateParts(cadastroDate);
  setField("Cad_dia", dateParts.day);
  setField("Cad_mes", dateParts.month);
  setField("Cad_ano", dateParts.year);

  // Empresa data
  setField("Empresa", String(getById(answers, "q14_pj_nome_empresa") || ""));
  setField("CNPJ_Empresa", String(getById(answers, "q15_pj_cnpj") || ""));
  setField("E-mail_Empresa", String(getById(answers, "q16_pj_email_comercial") || ""));

  // Sócio 1 data
  const socioNome = String(getById(answers, "q3_pj_nome_socio") || input.respondentName || "");
  setField("Socio_1", socioNome);
  setField("CPF_Socio_1", String(getById(answers, "q4_pj_cpf") || ""));

  const nascimento = getById(answers, "q5_pj_nascimento");
  const nascParts = parseDateParts(nascimento);
  setField("Nasc_Socio1_dia", nascParts.day);
  setField("Nasc_Socio1_mes", nascParts.month);
  setField("Nasc_Socio1_ano", nascParts.year);

  setField("Nacion_Socio_1", String(getById(answers, "q7_pj_nacionalidade") || ""));
  setField("RG_Socio_1", String(getById(answers, "q8_pj_rg") || ""));
  setField("Renda_Socio_1", formatCurrency(getById(answers, "q12_pj_renda")));

  // Celular - split DDD and number
  const celular = String(getById(answers, "q9_pj_celular") || "");
  const celMatch = celular.match(/\(?(\d{2})\)?\s*(.+)/);
  if (celMatch) {
    setField("Ddd_Cel_Socio_1", celMatch[1]);
    setField("Cel_Socio_1", celMatch[2].trim());
  } else {
    setField("Cel_Socio_1", celular);
  }

  setField("Email_Socio_1", String(getById(answers, "q10_pj_email") || ""));

  // Endereço do sócio
  const enderecoRaw = getById(answers, "q11_pj_endereco");
  const addr = formatAddress(enderecoRaw);
  setField("End_Socio_1", addr.full);
  setField("Cep_Socio_1", addr.cep);
  setField("Bairro_Socio_1", addr.bairro);
  setField("Cidade_Socio_1", addr.cidade);
  setField("Estado_Socio_1", addr.estado);

  // Flatten form fields to make them non-editable (looks cleaner)
  try {
    form.flatten();
  } catch {
    // Some PDFs have orphaned widget refs that cause flatten to fail.
    // The fields are still filled, so we just skip flattening.
  }

  return await doc.save();
}

// ═══════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// Protocolo de Entrada — Fill form fields in original template
// ═══════════════════════════════════════════════════════════════

async function generateProtocoloPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { answers } = input;

  const templateBytes = await fetchPdfTemplate(PROTOCOLO_TEMPLATE_URL);
  const doc = await PDFDocument.load(templateBytes);
  const form = doc.getForm();

  function setField(name: string, value: string) {
    try {
      const field = form.getTextField(name);
      field.setText(String(value || ""));
    } catch {
      // Field doesn't exist, skip
    }
  }

  if (input.tipo === "pj") {
    // PJ: nome da empresa no campo Nome_Cliente, CNPJ no campo CPF
    setField("Nome_Cliente", String(getById(answers, "q14_pj_nome_empresa") || ""));
    setField("E-mail_Cliente", String(getById(answers, "q10_pj_email") || getById(answers, "q16_pj_email_comercial") || ""));
    setField("CPF_Cliente", String(getById(answers, "q15_pj_cnpj") || ""));
    setField("Celular_Cliente", String(getById(answers, "q9_pj_celular") || ""));
  } else {
    // PF: dados da pessoa física
    setField("Nome_Cliente", String(getById(answers, "q23_pf_nome") || input.respondentName || ""));
    setField("E-mail_Cliente", String(getById(answers, "q31_pf_email") || input.respondentEmail || ""));
    setField("CPF_Cliente", String(getById(answers, "q24_pf_cpf") || ""));
    setField("Celular_Cliente", String(getById(answers, "q30_pf_celular") || ""));
  }

  // Flatten to make non-editable
  try {
    form.flatten();
  } catch {
    // Skip if flatten fails
  }

  return await doc.save();
}

export async function generateCadastroInteressePdf(input: GeneratePdfInput): Promise<Uint8Array> {
  if (input.tipo === "pj") {
    return generatePjPdf(input);
  }
  return generatePfPdf(input);
}

/**
 * Generate the full unified PDF: Protocolo de Entrada + Ficha PF/PJ.
 * Attachments are merged separately by the caller.
 */
export async function generateFullPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  // 1. Generate Protocolo de Entrada
  const protocoloBytes = await generateProtocoloPdf(input);

  // 2. Generate Ficha PF or PJ
  const fichaBytes = await generateCadastroInteressePdf(input);

  // 3. Merge: Protocolo first, then Ficha
  const finalDoc = await PDFDocument.load(protocoloBytes);
  const fichaDoc = await PDFDocument.load(fichaBytes);
  const fichaPages = await finalDoc.copyPages(fichaDoc, fichaDoc.getPageIndices());
  for (const p of fichaPages) {
    finalDoc.addPage(p);
  }

  return await finalDoc.save();
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
  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN = 40;

  const mainDoc = await PDFDocument.load(cadastroPdf);

  for (const att of attachments) {
    try {
      const response = await fetch(att.url);
      if (!response.ok) continue;
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      if (att.mimeType === "application/pdf") {
        const extDoc = await PDFDocument.load(bytes);
        const pages = await mainDoc.copyPages(extDoc, extDoc.getPageIndices());
        for (const p of pages) {
          mainDoc.addPage(p);
        }
      } else if (att.mimeType.startsWith("image/")) {
        let img;
        if (att.mimeType === "image/png") {
          img = await mainDoc.embedPng(bytes);
        } else {
          img = await mainDoc.embedJpg(bytes);
        }

        const scale = Math.min(PAGE_WIDTH / img.width, PAGE_HEIGHT / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;

        const newPage = mainDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        const font = await mainDoc.embedFont(StandardFonts.Helvetica);
        newPage.drawText(att.filename, {
          x: MARGIN,
          y: PAGE_HEIGHT - 20,
          size: 8,
          font,
          color: rgb(0.5, 0.5, 0.5),
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
