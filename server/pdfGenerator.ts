/**
 * PDF Generator for Cadastro de Interesse (PF / PJ)
 * Fills AcroForm fields in the original Innova PDF templates.
 * Both PF and PJ templates include:
 *   - Page 1: Protocolo de Entrada
 *   - Page 2: Ficha de Cadastro (PF or PJ)
 */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

// ─── CDN URLs for the PDF templates (v2 — with AcroForm fields) ───
const PF_TEMPLATE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/FICHAPF_TEMPLATE_v2_3e43d33d.pdf";
const PJ_TEMPLATE_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/FICHAPJ_TEMPLATE_v2_b91826e4.pdf";

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
  corretorName?: string;
  corretorCpf?: string;
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
  const empty = { full: "", bairro: "", cidade: "", estado: "", cep: "" };
  if (!addr) return empty;

  // If addr is a JSON string, parse it first
  if (typeof addr === "string") {
    const trimmed = addr.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed === "object" && parsed !== null) {
          return formatAddress(parsed); // recurse with parsed object
        }
      } catch {
        // Not valid JSON, treat as plain text
      }
    }
    // Plain text address — can't split into parts
    return { full: trimmed, bairro: "", cidade: "", estado: "", cep: "" };
  }

  if (typeof addr !== "object") return empty;

  // Build "Rua X, 123, Complemento" from structured fields
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

/** Split phone into DDD + number */
function splitPhone(phone: string): { ddd: string; number: string } {
  if (!phone) return { ddd: "", number: "" };
  const s = String(phone).replace(/[^\d]/g, "");
  if (s.length >= 10) {
    return { ddd: s.substring(0, 2), number: s.substring(2) };
  }
  return { ddd: "", number: s };
}

// ─── Estado Civil mapping ───

interface EstadoCivilResult {
  checkbox: "solteiro" | "casado" | "uniao_estavel" | "divorciado" | "viuvo";
  regime?: "comunhao_parcial" | "comunhao_universal" | "separacao_total" | "pacto_nupcial";
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

  return { checkbox: "solteiro", needsConjuge: false };
}

// ─── Radio button value mapping for AcroForm ───

/** Map estado civil to the AcroForm radio button value for Group2/Group5 */
function getEstadoCivilRadioValue(ec: EstadoCivilResult): string | null {
  const map: Record<string, string> = {
    solteiro: "Escolha1",
    casado: "Escolha2",
    uniao_estavel: "Escolha3",
    divorciado: "Escolha4",
    viuvo: "Escolha5",
  };
  return map[ec.checkbox] || null;
}

/** Map regime de casamento to the AcroForm radio button value for Group3/Group6 */
function getRegimeRadioValue(regime?: string): string | null {
  if (!regime) return null;
  const map: Record<string, string> = {
    comunhao_parcial: "Escolha1",
    comunhao_universal: "Escolha2",
    separacao_total: "Escolha3",
    pacto_nupcial: "Escolha4",
  };
  return map[regime] || null;
}

/** Map sexo to the AcroForm radio button value for Group1/Group4 */
function getSexoRadioValue(sexo: any): string | null {
  if (!sexo) return null;
  const s = String(sexo).toLowerCase();
  if (/masc|homem|male/i.test(s)) return "Escolha1";
  if (/fem|mulher|female/i.test(s)) return "Escolha2";
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Shared: Fill Protocolo de Entrada fields (Page 1 of both PDFs)
// ═══════════════════════════════════════════════════════════════

function fillProtocoloFields(
  form: any,
  input: GeneratePdfInput,
) {
  const { answers, tipo } = input;

  function setField(name: string, value: string) {
    try {
      const field = form.getTextField(name);
      field.setText(String(value || ""));
    } catch {
      // Field doesn't exist in this template, skip
    }
  }

  if (tipo === "pj") {
    // PJ: company name as client, CNPJ as CPF
    setField("Nome_Cliente", String(getById(answers, "q14_pj_nome_empresa") || ""));
    setField("E-mail_Cliente", String(getById(answers, "q10_pj_email") || getById(answers, "q16_pj_email_comercial") || ""));
    setField("CPF_Cliente", String(getById(answers, "q15_pj_cnpj") || ""));
    setField("Celular_Cliente", String(getById(answers, "q9_pj_celular") || ""));
  } else {
    // PF: person data
    setField("Nome_Cliente", String(getById(answers, "q23_pf_nome") || input.respondentName || ""));
    setField("E-mail_Cliente", String(getById(answers, "q31_pf_email") || input.respondentEmail || ""));
    setField("CPF_Cliente", String(getById(answers, "q24_pf_cpf") || ""));
    setField("Celular_Cliente", String(getById(answers, "q30_pf_celular") || ""));
  }

  // Empreendimento fields (shared — these come from form context, not always answered)
  // Leave blank if not available — corretor fills manually
  setField("Empreendimento", "");
  setField("Unidade", "");
  setField("FAC", "");
  setField("Nome_Coordenador", "");
  setField("CPF_Coordenador", "");

  // Responsáveis pelo processo — dados fixos da One Innovation
  setField("Nome_Diretor", "BERTOLOTTI");
  setField("CPF_Diretor", "126.382.178-24");
  setField("Nome_Superintendente", "COUTINHO");
  setField("CPF_Superintendente", "30.937.703/0001-01");
  setField("Nome_Gerente", "Denis");
  setField("CPF_Gerente", "48.246.674/0001-05");
  setField("Nome_Corretor", input.corretorName || "");
  setField("CPF_Corretor", input.corretorCpf || "");

  // Remove second table fields (FIFTY section) entirely
  const fieldsToRemove = [
    "Nome_Diretor2", "CPF_Diretor2",
    "Nome_Superintendente2", "CPF_Superintendente2",
    "Nome_Gerente2", "CPF_Gerente2",
    "Nome_Corretor2", "CPF_Corretor2",
  ];
  for (const fieldName of fieldsToRemove) {
    try {
      const field = form.getTextField(fieldName);
      form.removeField(field);
    } catch {
      // Field doesn't exist, skip
    }
  }
}

/**
 * Cover the second "FIFTY" table on page 1 with a white rectangle.
 * The table spans from Y ~210 ("EM CASO DE FIFTY" text) down to Y ~90.
 * Page coordinates: A4 = 595.32 x 841.92, origin at bottom-left.
 */
function coverSecondTable(doc: PDFDocument) {
  try {
    const page = doc.getPage(0);
    // Draw white rectangle over the second table area
    // From the field analysis: second table fields span Y 98 to 210 approx
    // We cover from x=30 to x=570 (full width with margins), y=70 to y=222
    page.drawRectangle({
      x: 30,
      y: 70,
      width: 540,
      height: 152,
      color: rgb(1, 1, 1), // white
    });
  } catch (err) {
    console.warn("[PDF] Failed to cover second table:", err);
  }
}

// ═══════════════════════════════════════════════════════════════
// PF PDF — Fill AcroForm fields in the new template
// ═══════════════════════════════════════════════════════════════

async function generatePfPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { answers } = input;

  const templateBytes = await fetchPdfTemplate(PF_TEMPLATE_URL);
  const doc = await PDFDocument.load(templateBytes);
  const form = doc.getForm();

  function setField(name: string, value: string) {
    try {
      const field = form.getTextField(name);
      field.setText(String(value || ""));
    } catch {
      // Field doesn't exist, skip silently
    }
  }

  function setRadio(name: string, value: string | null) {
    if (!value) return;
    try {
      const field = form.getRadioGroup(name);
      field.select(value);
    } catch {
      // Radio group doesn't exist or value invalid, skip
    }
  }

  function checkBox(name: string) {
    try {
      const field = form.getCheckBox(name);
      field.check();
    } catch {
      // Checkbox doesn't exist, skip
    }
  }

  // ── Fill Protocolo de Entrada (Page 1) ──
  fillProtocoloFields(form, input);

  // Cover the second table ("EM CASO DE FIFTY") with a white rectangle on page 1
  coverSecondTable(doc);

  // ── Fill Ficha PF (Page 2) ──

  // Data do cadastro
  const cadastroDate = input.createdAt ?? new Date();
  const dateParts = parseDateParts(cadastroDate);
  setField("Cad_dia", dateParts.day);
  setField("Cad_mes", dateParts.month);
  setField("Cad_ano", dateParts.year);

  // Empreendimento (page 2 fields)
  setField("End_Empreendimento", "");
  setField("Planta", "");

  // ── Proponente 1 ──
  const pfNome = String(getById(answers, "q23_pf_nome") || input.respondentName || "");
  const pfCpf = String(getById(answers, "q24_pf_cpf") || "");
  const pfNascimento = getById(answers, "q25_pf_nascimento");
  const pfSexo = getById(answers, "q26_pf_sexo");
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

  setField("Propon_1", pfNome);
  setField("CPF_Propon_1", pfCpf);
  setField("Nacion_Propon_1", pfNacionalidade);
  setField("Profis_Propon_1", pfProfissao);

  // Data de nascimento
  const nascParts = parseDateParts(pfNascimento);
  setField("Nasc_Prop1_dia", nascParts.day);
  setField("Nasc_Prop1_mes", nascParts.month);
  setField("Nasc_Prop1_ano", nascParts.year);

  // RG
  setField("RG_Propon_1", pfRg);
  // If RG has a digit separator, split it
  const rgMatch = pfRg.match(/^(.+?)[-\s]?(\d)$/);
  if (rgMatch) {
    setField("RG_Propon_1", rgMatch[1]);
    setField("Dig_RG_Propon_1", rgMatch[2]);
  }

  // Sexo (Group1 radio)
  setRadio("Group1", getSexoRadioValue(pfSexo));

  // Estado civil (Group2 radio)
  setRadio("Group2", getEstadoCivilRadioValue(estadoCivil));

  // Data de casamento (if applicable)
  if (estadoCivil.needsConjuge) {
    const conjCasamento = getById(answers, "q40_conjuge_data_casamento");
    const casParts = parseDateParts(conjCasamento);
    setField("Cas_Prop1_dia", casParts.day);
    setField("Cas_Prop1_mes", casParts.month);
    setField("Cas_Prop1_ano", casParts.year);
  }

  // Regime de casamento (Group3 radio)
  setRadio("Group3", getRegimeRadioValue(estadoCivil.regime));

  // Renda
  setField("Renda_Propon_1", formatCurrency(pfRenda));

  // Telefone / Celular
  const celParts = splitPhone(pfCelular);
  setField("Ddd_Cel_Propon_1", celParts.ddd);
  setField("Cel_Propon_1", celParts.number);

  // Endereço
  setField("End_Propon_1", addr.full);
  setField("Cep_Propon_1", addr.cep);
  setField("Bairro_Propon_1", addr.bairro);
  setField("Cidade_Propon_1", addr.cidade);
  setField("Estado_Propon_1", addr.estado);
  setField("Email_Propon_1", pfEmail);

  // ── Proponente 2 (cônjuge) — only if married ──
  if (estadoCivil.needsConjuge) {
    const conjNome = String(getById(answers, "q41_conjuge_nome") || "");
    const conjCpf = String(getById(answers, "q42_conjuge_cpf") || "");
    const conjNascimento = getById(answers, "q43_conjuge_nascimento");
    const conjCelular = String(getById(answers, "q44_conjuge_celular") || "");
    const conjEmail = String(getById(answers, "q45_conjuge_email") || "");
    const conjSexo = getById(answers, "q46_conjuge_sexo");
    const conjNacionalidade = String(getById(answers, "q47_conjuge_nacionalidade") || "");
    const conjRg = String(getById(answers, "q48_conjuge_rg") || "");
    const conjProfissao = String(getById(answers, "q49_conjuge_profissao") || "");

    setField("Propon_2", conjNome);
    setField("CPF_Propon_2", conjCpf);
    setField("Nacion_Propon_2", conjNacionalidade);
    setField("Profis_Propon_2", conjProfissao);

    const conjNascParts = parseDateParts(conjNascimento);
    setField("Nasc_Prop2_dia", conjNascParts.day);
    setField("Nasc_Prop2_mes", conjNascParts.month);
    setField("Nasc_Prop2_ano", conjNascParts.year);

    // RG cônjuge
    const conjRgMatch = conjRg.match(/^(.+?)[-\s]?(\d)$/);
    if (conjRgMatch) {
      setField("RG_Propon_2", conjRgMatch[1]);
      setField("Dig_RG_Propon_2", conjRgMatch[2]);
    } else {
      setField("RG_Propon_2", conjRg);
    }

    // Sexo cônjuge (Group4 radio)
    setRadio("Group4", getSexoRadioValue(conjSexo));

    // Estado civil cônjuge = same as proponente 1
    setRadio("Group5", getEstadoCivilRadioValue(estadoCivil));

    // Data casamento cônjuge = same
    const casParts2 = parseDateParts(getById(answers, "q40_conjuge_data_casamento"));
    setField("Cas_Prop2_dia", casParts2.day);
    setField("Cas_Prop2_mes", casParts2.month);
    setField("Cas_Prop2_ano", casParts2.year);

    // Regime cônjuge = same
    setRadio("Group6", getRegimeRadioValue(estadoCivil.regime));

    // Celular cônjuge
    const conjCelParts = splitPhone(conjCelular);
    setField("Ddd_Cel_Propon_2", conjCelParts.ddd);
    setField("Cel_Propon_2", conjCelParts.number);

    // Endereço cônjuge = same as proponente 1
    setField("End_Propon_2", addr.full);
    setField("Cep_Propon_2", addr.cep);
    setField("Bairro_Propon_2", addr.bairro);
    setField("Cidade_Propon_2", addr.cidade);
    setField("Estado_Propon_2", addr.estado);
    setField("Email_Propon_2", conjEmail);
  }

  // Flatten form fields to make non-editable
  try {
    form.flatten();
  } catch {
    // Some PDFs have orphaned widget refs that cause flatten to fail.
    // The fields are still filled, so we just skip flattening.
  }

  return await doc.save();
}

// ═══════════════════════════════════════════════════════════════
// PJ PDF — Fill AcroForm fields in the new template
// ═══════════════════════════════════════════════════════════════

async function generatePjPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  const { answers } = input;

  const templateBytes = await fetchPdfTemplate(PJ_TEMPLATE_URL);
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

  function setRadio(name: string, value: string | null) {
    if (!value) return;
    try {
      const field = form.getRadioGroup(name);
      field.select(value);
    } catch {
      // Radio group doesn't exist or value invalid, skip
    }
  }

  function checkBox(name: string) {
    try {
      const field = form.getCheckBox(name);
      field.check();
    } catch {
      // Checkbox doesn't exist, skip
    }
  }

  // ── Fill Protocolo de Entrada (Page 1) ──
  fillProtocoloFields(form, input);

  // Cover the second table ("EM CASO DE FIFTY") with a white rectangle on page 1
  coverSecondTable(doc);

  // ── Fill Ficha PJ (Page 2) ──

  // Data do cadastro
  const cadastroDate = input.createdAt ?? new Date();
  const dateParts = parseDateParts(cadastroDate);
  setField("Cad_dia", dateParts.day);
  setField("Cad_mes", dateParts.month);
  setField("Cad_ano", dateParts.year);

  // Empreendimento (page 2)
  setField("End_Empreendimento", "");
  setField("Planta", "");

  // ── Empresa data ──
  setField("Empresa", String(getById(answers, "q14_pj_nome_empresa") || ""));
  setField("CNPJ_Empresa", String(getById(answers, "q15_pj_cnpj") || ""));
  setField("E-mail_Empresa", String(getById(answers, "q16_pj_email_comercial") || ""));

  // Endereço da empresa — usa endereço do sócio 1 como fallback
  const endEmpresa = getById(answers, "q17_pj_endereco_empresa");
  const endSocio = getById(answers, "q11_pj_endereco");
  const addrEmp = formatAddress(endEmpresa || endSocio);
  setField("End_Empresa", addrEmp.full);
  setField("CEP_Empresa", addrEmp.cep);
  setField("Bairro_Empresa", addrEmp.bairro);
  setField("Cidade_Empresa", addrEmp.cidade);
  setField("Estado_Empresa", addrEmp.estado);

  // Contato / Recado
  setField("Contato_Empresa", String(getById(answers, "q18_pj_contato") || ""));
  setField("Recado_Empresa", String(getById(answers, "q19_pj_recado") || ""));

  // ── Sócio 1 ──
  const socioNome = String(getById(answers, "q3_pj_nome_socio") || input.respondentName || "");
  setField("Socio_1", socioNome);
  setField("CPF_Socio_1", String(getById(answers, "q4_pj_cpf") || ""));

  const nascimento = getById(answers, "q5_pj_nascimento");
  const nascParts = parseDateParts(nascimento);
  setField("Nasc_Socio1_dia", nascParts.day);
  setField("Nasc_Socio1_mes", nascParts.month);
  setField("Nasc_Socio1_ano", nascParts.year);

  setField("Nacion_Socio_1", String(getById(answers, "q7_pj_nacionalidade") || ""));

  // RG
  const rg = String(getById(answers, "q8_pj_rg") || "");
  const rgMatch = rg.match(/^(.+?)[-\s]?(\d)$/);
  if (rgMatch) {
    setField("RG_Socio_1", rgMatch[1]);
    setField("Dig_RG_Socio_1", rgMatch[2]);
  } else {
    setField("RG_Socio_1", rg);
  }

  setField("Renda_Socio_1", formatCurrency(getById(answers, "q12_pj_renda")));

  // Celular
  const celular = String(getById(answers, "q9_pj_celular") || "");
  const celParts = splitPhone(celular);
  setField("Ddd_Cel_Socio_1", celParts.ddd);
  setField("Cel_Socio_1", celParts.number);

  setField("Email_Socio_1", String(getById(answers, "q10_pj_email") || ""));

  // Endereço do sócio
  const enderecoRaw = getById(answers, "q11_pj_endereco");
  const addr = formatAddress(enderecoRaw);
  setField("End_Socio_1", addr.full);
  setField("Cep_Socio_1", addr.cep);
  setField("Bairro_Socio_1", addr.bairro);
  setField("Cidade_Socio_1", addr.cidade);
  setField("Estado_Socio_1", addr.estado);

  // Sexo sócio 1 (Group1 radio)
  const sexo1 = getById(answers, "q6_pj_sexo");
  setRadio("Group1", getSexoRadioValue(sexo1));

  // ── Sócio 2 (if available) ──
  const socio2Nome = String(getById(answers, "q20_pj_socio2_nome") || "");
  if (socio2Nome) {
    setField("Socio_2", socio2Nome);
    setField("CPF_Socio_2", String(getById(answers, "q21_pj_socio2_cpf") || ""));

    const nasc2 = getById(answers, "q22_pj_socio2_nascimento");
    const nasc2Parts = parseDateParts(nasc2);
    setField("Nasc_Socio2_dia", nasc2Parts.day);
    setField("Nasc_Socio2_mes", nasc2Parts.month);
    setField("Nasc_Socio2_ano", nasc2Parts.year);

    setField("Nacion_Socio_2", String(getById(answers, "q23_pj_socio2_nacionalidade") || ""));

    const rg2 = String(getById(answers, "q24_pj_socio2_rg") || "");
    const rg2Match = rg2.match(/^(.+?)[-\s]?(\d)$/);
    if (rg2Match) {
      setField("RG_Socio_2", rg2Match[1]);
      setField("Dig_RG_Socio_2", rg2Match[2]);
    } else {
      setField("RG_Socio_2", rg2);
    }

    setField("Renda_Socio_2", formatCurrency(getById(answers, "q25_pj_socio2_renda") || ""));

    const cel2 = String(getById(answers, "q26_pj_socio2_celular") || "");
    const cel2Parts = splitPhone(cel2);
    setField("Ddd_Cel_Socio_2", cel2Parts.ddd);
    setField("Cel_Socio_2", cel2Parts.number);

    setField("Email_Socio_2", String(getById(answers, "q27_pj_socio2_email") || ""));

    const end2 = getById(answers, "q28_pj_socio2_endereco");
    const addr2 = formatAddress(end2);
    setField("End_Socio_2", addr2.full);
    setField("Cep_Socio_2", addr2.cep);
    setField("Bairro_Socio_2", addr2.bairro);
    setField("Cidade_Socio_2", addr2.cidade);
    setField("Estado_Socio_2", addr2.estado);

    const sexo2 = getById(answers, "q29_pj_socio2_sexo");
    setRadio("Group2", getSexoRadioValue(sexo2));
  }

  // Flatten form fields
  try {
    form.flatten();
  } catch {
    // Skip if flatten fails
  }

  return await doc.save();
}

// ═══════════════════════════════════════════════════════════════
// Main exports
// ═══════════════════════════════════════════════════════════════

export async function generateCadastroInteressePdf(input: GeneratePdfInput): Promise<Uint8Array> {
  if (input.tipo === "pj") {
    return generatePjPdf(input);
  }
  return generatePfPdf(input);
}

/**
 * Generate the full unified PDF.
 * The new templates already include Protocolo (page 1) + Ficha (page 2),
 * so no separate merging is needed.
 */
export async function generateFullPdf(input: GeneratePdfInput): Promise<Uint8Array> {
  return generateCadastroInteressePdf(input);
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
