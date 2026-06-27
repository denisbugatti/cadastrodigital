/**
 * Vitacon "Cadastro de Interesse" PDF — drawn FROM SCRATCH with pdf-lib.
 *
 * Same data and logic as the One PDF (server/pdfGenerator.ts), but:
 *   - new clean design (no AcroForm template overlay)
 *   - Vitacon logo + gray palette (no blue)
 *   - no "One Innovation" text, no fixed One officers
 *   - renders the protocol code in the header (the One PDF doesn't)
 *
 * Reuses the exact extraction/formatting helpers from pdfGenerator.ts so the
 * data shown is identical to the One ficha.
 */

import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import { BRANDS } from "../shared/brands";
import {
  getById,
  formatAddress,
  formatCurrency,
  parseDateParts,
  parseEstadoCivil,
  type GeneratePdfInput,
} from "./pdfGenerator";

export type GenerateVitaconPdfInput = GeneratePdfInput & { protocolCode?: string };

type Color = ReturnType<typeof rgb>;

// A4 portrait
const W = 595.28;
const H = 841.89;
const M = 40;

function hexToRgb(hex: string): Color {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const ACCENT = hexToRgb(BRANDS.vitacon.primaryColor); // Vitacon gray
const INK = rgb(0.13, 0.13, 0.15);
const MUTED = rgb(0.5, 0.5, 0.53);
const HAIR = rgb(0.86, 0.86, 0.88);
const SECTION_BG = rgb(0.95, 0.95, 0.96);

function S(v: any): string {
  return v == null ? "" : String(v);
}

function fmtDate(v: any): string {
  const p = parseDateParts(v);
  return p.day && p.month && p.year ? `${p.day}/${p.month}/${p.year}` : "";
}

function fmtAddress(raw: any): string {
  const a = formatAddress(raw);
  const cityState = a.cidade && a.estado ? `${a.cidade}/${a.estado}` : a.cidade || a.estado;
  return [a.full, a.bairro, cityState, a.cep ? `CEP ${a.cep}` : ""].filter(Boolean).join(" — ");
}

export async function generateVitaconFichaPdf(input: GenerateVitaconPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Try to embed the Vitacon logo; fall back to bold text if missing/unfetchable.
  let logoImg: any = null;
  let logoW = 0;
  const logoH = 24;
  const logoUrl = BRANDS.vitacon.logoUrl;
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl);
      if (res.ok) {
        const bytes = new Uint8Array(await res.arrayBuffer());
        const lower = logoUrl.toLowerCase();
        logoImg = lower.endsWith(".jpg") || lower.endsWith(".jpeg")
          ? await doc.embedJpg(bytes)
          : await doc.embedPng(bytes);
        logoW = (logoImg.width / logoImg.height) * logoH;
      }
    } catch {
      logoImg = null;
    }
  }

  const dateStr = (input.createdAt ?? new Date()).toLocaleDateString("pt-BR");
  const protocol = input.protocolCode || "";

  const pages: PDFPage[] = [];
  let page: PDFPage = null as any;
  let y = 0;

  function drawRight(text: string, yy: number, size: number, font: PDFFont, color: Color) {
    const w = font.widthOfTextAtSize(text, size);
    page.drawText(text, { x: W - M - w, y: yy, size, font, color });
  }

  function truncate(s: string, font: PDFFont, size: number, maxW: number): string {
    if (font.widthOfTextAtSize(s, size) <= maxW) return s;
    let t = s;
    while (t.length > 1 && font.widthOfTextAtSize(t + "…", size) > maxW) t = t.slice(0, -1);
    return t + "…";
  }

  function header() {
    page = doc.addPage([W, H]);
    pages.push(page);
    const top = H - M;
    if (logoImg) {
      page.drawImage(logoImg, { x: M, y: top - logoH, width: logoW, height: logoH });
    } else {
      page.drawText("Vitacon", { x: M, y: top - 19, size: 19, font: bold, color: INK });
    }
    drawRight("CADASTRO DE INTERESSE", top - 6, 7.5, bold, MUTED);
    if (protocol) drawRight(`Protocolo ${protocol}`, top - 19, 10.5, bold, ACCENT);
    drawRight(dateStr, top - 31, 8, reg, MUTED);
    page.drawRectangle({ x: M, y: top - 42, width: W - 2 * M, height: 2.5, color: ACCENT });
    y = top - 62;
  }

  function ensure(space: number) {
    if (y - space < 64) header();
  }

  function sectionHeader(text: string) {
    ensure(64);
    const h = 22;
    page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: SECTION_BG });
    page.drawRectangle({ x: M, y: y - h, width: 3, height: h, color: ACCENT });
    page.drawText(text.toUpperCase(), { x: M + 12, y: y - h + 7.5, size: 9, font: bold, color: INK });
    y -= h + 12;
  }

  const contentW = W - 2 * M;
  const gap = 16;
  const colW = (contentW - gap) / 2;
  const CELL_H = 30;
  const ROW_GAP = 6;
  let col = 0;
  let rowTopY = 0;

  function drawCell(x: number, top: number, w: number, label: string, value: string) {
    page.drawText(label.toUpperCase(), { x, y: top - 9, size: 6.5, font: bold, color: MUTED });
    const text = truncate(value || "—", reg, 9.5, w);
    page.drawText(text, { x, y: top - 22, size: 9.5, font: reg, color: INK });
    page.drawLine({ start: { x, y: top - 27 }, end: { x: x + w, y: top - 27 }, thickness: 0.5, color: HAIR });
  }

  function startGrid() {
    col = 0;
  }

  function field(label: string, value: string, full = false) {
    if (full) {
      if (col === 1) {
        y = rowTopY - CELL_H - ROW_GAP;
        col = 0;
      }
      ensure(CELL_H + ROW_GAP);
      drawCell(M, y, contentW, label, value);
      y -= CELL_H + ROW_GAP;
      return;
    }
    if (col === 0) {
      ensure(CELL_H + ROW_GAP);
      rowTopY = y;
    }
    const x = col === 0 ? M : M + colW + gap;
    drawCell(x, rowTopY, colW, label, value);
    if (col === 1) {
      y = rowTopY - CELL_H - ROW_GAP;
      col = 0;
    } else {
      col = 1;
    }
  }

  function endGrid() {
    if (col === 1) {
      y = rowTopY - CELL_H - ROW_GAP;
      col = 0;
    }
    y -= 8;
  }

  // ─── Build content ───
  const a = input.answers;
  const isPj = input.tipo === "pj";

  header();

  // Page 1 — Protocolo de Entrada
  sectionHeader("Dados do Cliente");
  startGrid();
  field("Nome", isPj ? S(getById(a, "q14_pj_nome_empresa")) : (S(getById(a, "q23_pf_nome")) || S(input.respondentName)));
  field("CPF / CNPJ", isPj ? S(getById(a, "q15_pj_cnpj")) : S(getById(a, "q24_pf_cpf")));
  field("E-mail", isPj ? (S(getById(a, "q10_pj_email")) || S(getById(a, "q16_pj_email_comercial"))) : (S(getById(a, "q31_pf_email")) || S(input.respondentEmail)));
  field("Celular", isPj ? S(getById(a, "q9_pj_celular")) : S(getById(a, "q30_pf_celular")));
  field("Tipo de cadastro", isPj ? "Pessoa Jurídica" : "Pessoa Física");
  field("Data do cadastro", dateStr);
  endGrid();

  sectionHeader("Empreendimento");
  startGrid();
  field("Empreendimento", "");
  field("Unidade", "");
  field("FAC", "");
  field("Coordenador", "");
  endGrid();

  sectionHeader("Responsável pelo Atendimento");
  startGrid();
  field("Corretor", S(input.corretorName));
  field("CPF do Corretor", S(input.corretorCpf));
  endGrid();

  // Page 2 — Ficha de Cadastro
  header();

  if (!isPj) {
    const ec = parseEstadoCivil(getById(a, "q28_pf_estado_civil"));
    sectionHeader("Proponente 1");
    startGrid();
    field("Nome completo", S(getById(a, "q23_pf_nome")) || S(input.respondentName));
    field("CPF", S(getById(a, "q24_pf_cpf")));
    field("Data de nascimento", fmtDate(getById(a, "q25_pf_nascimento")));
    field("Sexo", S(getById(a, "q26_pf_sexo")));
    field("Nacionalidade", S(getById(a, "q27_pf_nacionalidade")));
    field("Estado civil", S(getById(a, "q28_pf_estado_civil")));
    field("RG", S(getById(a, "q29_pf_rg")));
    field("Profissão", S(getById(a, "q33_pf_profissao")));
    field("Renda", formatCurrency(getById(a, "q34_pf_renda")));
    field("Celular", S(getById(a, "q30_pf_celular")));
    field("E-mail", S(getById(a, "q31_pf_email")) || S(input.respondentEmail), true);
    field("Endereço", fmtAddress(getById(a, "q32_pf_endereco")), true);
    endGrid();

    if (ec.needsConjuge) {
      sectionHeader("Cônjuge / Proponente 2");
      startGrid();
      field("Nome completo", S(getById(a, "q41_conjuge_nome")));
      field("CPF", S(getById(a, "q42_conjuge_cpf")));
      field("Data de nascimento", fmtDate(getById(a, "q43_conjuge_nascimento")));
      field("Sexo", S(getById(a, "q46_conjuge_sexo")));
      field("Nacionalidade", S(getById(a, "q47_conjuge_nacionalidade")));
      field("RG", S(getById(a, "q48_conjuge_rg")));
      field("Profissão", S(getById(a, "q49_conjuge_profissao")));
      field("Celular", S(getById(a, "q44_conjuge_celular")));
      field("E-mail", S(getById(a, "q45_conjuge_email")), true);
      endGrid();
    }
  } else {
    sectionHeader("Empresa");
    startGrid();
    field("Razão social", S(getById(a, "q14_pj_nome_empresa")));
    field("CNPJ", S(getById(a, "q15_pj_cnpj")));
    field("E-mail comercial", S(getById(a, "q16_pj_email_comercial")));
    field("Contato", S(getById(a, "q18_pj_contato")));
    field("Recado", S(getById(a, "q19_pj_recado")));
    field("Endereço", fmtAddress(getById(a, "q17_pj_endereco_empresa") || getById(a, "q11_pj_endereco")), true);
    endGrid();

    sectionHeader("Sócio 1");
    startGrid();
    field("Nome completo", S(getById(a, "q3_pj_nome_socio")) || S(input.respondentName));
    field("CPF", S(getById(a, "q4_pj_cpf")));
    field("Data de nascimento", fmtDate(getById(a, "q5_pj_nascimento")));
    field("Sexo", S(getById(a, "q6_pj_sexo")));
    field("Nacionalidade", S(getById(a, "q7_pj_nacionalidade")));
    field("RG", S(getById(a, "q8_pj_rg")));
    field("Renda", formatCurrency(getById(a, "q12_pj_renda")));
    field("Celular", S(getById(a, "q9_pj_celular")));
    field("E-mail", S(getById(a, "q10_pj_email")), true);
    field("Endereço", fmtAddress(getById(a, "q11_pj_endereco")), true);
    endGrid();

    if (S(getById(a, "q20_pj_socio2_nome"))) {
      sectionHeader("Sócio 2");
      startGrid();
      field("Nome completo", S(getById(a, "q20_pj_socio2_nome")));
      field("CPF", S(getById(a, "q21_pj_socio2_cpf")));
      field("Data de nascimento", fmtDate(getById(a, "q22_pj_socio2_nascimento")));
      field("Sexo", S(getById(a, "q29_pj_socio2_sexo")));
      field("Nacionalidade", S(getById(a, "q23_pj_socio2_nacionalidade")));
      field("RG", S(getById(a, "q24_pj_socio2_rg")));
      field("Renda", formatCurrency(getById(a, "q25_pj_socio2_renda")));
      field("Celular", S(getById(a, "q26_pj_socio2_celular")));
      field("E-mail", S(getById(a, "q27_pj_socio2_email")), true);
      field("Endereço", fmtAddress(getById(a, "q28_pj_socio2_endereco")), true);
      endGrid();
    }
  }

  // Footers (page numbers known after all pages drawn)
  const total = pages.length;
  pages.forEach((pg, i) => {
    pg.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: 0.5, color: HAIR });
    pg.drawText(BRANDS.vitacon.pdfFooter, { x: M, y: 28, size: 8, font: reg, color: MUTED });
    const r = `Página ${i + 1} de ${total}`;
    const rw = reg.widthOfTextAtSize(r, 8);
    pg.drawText(r, { x: W - M - rw, y: 28, size: 8, font: reg, color: MUTED });
  });

  return await doc.save();
}
