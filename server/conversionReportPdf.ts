/**
 * Conversion Report PDF Generator
 * Generates a professional PDF report with funnel metrics, conversion rates,
 * and daily breakdown — styled with the One Innovation premium dark design.
 * Uses pdf-lib for server-side PDF generation.
 */
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";

// ─── Types ───

interface ConversionStats {
  total: number;
  complete: number;
  incomplete: number;
  approved: number;
  rejected: number;
  inReview: number;
  pending: number;
  completionRate: number;
  approvalRate: number;
  daily: Array<{
    date: string;
    label: string;
    started: number;
    completed: number;
    approved: number;
  }>;
}

interface ReportInput {
  formTitle: string;
  period: string;
  stats: ConversionStats;
  generatedAt: Date;
}

// ─── Color Palette (One Innovation) ───

const COLORS = {
  bg: rgb(10 / 255, 10 / 255, 15 / 255),          // #0a0a0f
  bgCard: rgb(18 / 255, 18 / 255, 28 / 255),       // #12121c
  bgCardLight: rgb(26 / 255, 26 / 255, 38 / 255),  // #1a1a26
  brand: rgb(13 / 255, 139 / 255, 217 / 255),       // #0D8BD9
  brandLight: rgb(56 / 255, 168 / 255, 232 / 255),  // #38A8E8
  white: rgb(1, 1, 1),
  textPrimary: rgb(240 / 255, 240 / 255, 245 / 255),
  textSecondary: rgb(160 / 255, 160 / 255, 175 / 255),
  textMuted: rgb(120 / 255, 120 / 255, 135 / 255),
  green: rgb(34 / 255, 197 / 255, 94 / 255),        // #22C55E
  amber: rgb(245 / 255, 158 / 255, 11 / 255),       // #F59E0B
  red: rgb(239 / 255, 68 / 255, 68 / 255),          // #EF4444
  purple: rgb(168 / 255, 85 / 255, 247 / 255),      // #A855F7
  blue: rgb(59 / 255, 130 / 255, 246 / 255),        // #3B82F6
  border: rgb(40 / 255, 40 / 255, 55 / 255),        // #282837
};

// ─── Helpers ───

function drawRoundedRect(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  color: ReturnType<typeof rgb>,
  radius = 8
) {
  // Simplified rounded rect using filled rect (pdf-lib doesn't have native rounded rects)
  page.drawRectangle({ x, y, width: w, height: h, color });
}

function periodLabel(period: string): string {
  switch (period) {
    case "7d": return "Últimos 7 dias";
    case "30d": return "Últimos 30 dias";
    case "90d": return "Últimos 90 dias";
    case "all": return "Todo o período";
    default: return period;
  }
}

// ─── Main Generator ───

export async function generateConversionReportPdf(input: ReportInput): Promise<Buffer> {
  const { formTitle, period, stats, generatedAt } = input;
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page dimensions (A4 landscape for presentation style)
  const pageWidth = 841.89; // A4 landscape width
  const pageHeight = 595.28; // A4 landscape height

  // ═══════════════════════════════════════════
  // PAGE 1: Cover + Summary
  // ═══════════════════════════════════════════
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);

  // Background
  page1.drawRectangle({
    x: 0, y: 0,
    width: pageWidth, height: pageHeight,
    color: COLORS.bg,
  });

  // Top accent line
  page1.drawRectangle({
    x: 0, y: pageHeight - 4,
    width: pageWidth, height: 4,
    color: COLORS.brand,
  });

  // Logo area — "ONE INNOVATION" text
  page1.drawText("ONE INNOVATION", {
    x: 60,
    y: pageHeight - 60,
    size: 12,
    font: fontBold,
    color: COLORS.brand,
  });

  // Title
  page1.drawText("Relatório de Conversão", {
    x: 60,
    y: pageHeight - 120,
    size: 36,
    font: fontBold,
    color: COLORS.white,
  });

  // Subtitle
  page1.drawText(formTitle, {
    x: 60,
    y: pageHeight - 155,
    size: 16,
    font: fontRegular,
    color: COLORS.textSecondary,
  });

  // Period and date
  page1.drawText(`${periodLabel(period)}  •  Gerado em ${generatedAt.toLocaleDateString("pt-BR")} às ${generatedAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, {
    x: 60,
    y: pageHeight - 180,
    size: 11,
    font: fontRegular,
    color: COLORS.textMuted,
  });

  // ─── Summary Cards Row ───
  const cardY = pageHeight - 310;
  const cardW = 155;
  const cardH = 90;
  const cardGap = 15;
  const startX = 60;

  const summaryCards = [
    { label: "Iniciados", value: stats.total.toString(), color: COLORS.blue },
    { label: "Completos", value: stats.complete.toString(), color: COLORS.amber },
    { label: "Em Revisão", value: stats.inReview.toString(), color: COLORS.purple },
    { label: "Aprovados", value: stats.approved.toString(), color: COLORS.green },
    { label: "Rejeitados", value: stats.rejected.toString(), color: COLORS.red },
  ];

  summaryCards.forEach((card, i) => {
    const cx = startX + i * (cardW + cardGap);

    // Card background
    drawRoundedRect(page1, cx, cardY, cardW, cardH, COLORS.bgCard);

    // Color accent top bar
    page1.drawRectangle({
      x: cx, y: cardY + cardH - 3,
      width: cardW, height: 3,
      color: card.color,
    });

    // Value
    page1.drawText(card.value, {
      x: cx + 15,
      y: cardY + 45,
      size: 28,
      font: fontBold,
      color: COLORS.white,
    });

    // Label
    page1.drawText(card.label, {
      x: cx + 15,
      y: cardY + 15,
      size: 10,
      font: fontRegular,
      color: COLORS.textSecondary,
    });
  });

  // ─── Conversion Rates Row ───
  const rateY = cardY - 110;
  const rateCardW = 170;
  const rateCardH = 70;

  const rateCards = [
    { label: "Taxa de Conclusão", value: `${stats.completionRate}%`, sub: `${stats.complete} de ${stats.total} iniciados` },
    { label: "Taxa de Aprovação", value: `${stats.approvalRate}%`, sub: `${stats.approved} de ${stats.complete} completos` },
    { label: "Taxa de Rejeição", value: `${stats.complete > 0 ? Math.round((stats.rejected / stats.complete) * 100) : 0}%`, sub: `${stats.rejected} de ${stats.complete} completos` },
    { label: "Incompletos", value: stats.incomplete.toString(), sub: `${stats.total > 0 ? Math.round((stats.incomplete / stats.total) * 100) : 0}% do total` },
  ];

  rateCards.forEach((card, i) => {
    const rx = startX + i * (rateCardW + 12);

    drawRoundedRect(page1, rx, rateY, rateCardW, rateCardH, COLORS.bgCardLight);

    page1.drawText(card.value, {
      x: rx + 15,
      y: rateY + 38,
      size: 22,
      font: fontBold,
      color: COLORS.brand,
    });

    page1.drawText(card.label, {
      x: rx + 15,
      y: rateY + 18,
      size: 9,
      font: fontBold,
      color: COLORS.textPrimary,
    });

    page1.drawText(card.sub, {
      x: rx + 15,
      y: rateY + 5,
      size: 8,
      font: fontRegular,
      color: COLORS.textMuted,
    });
  });

  // Footer
  page1.drawText("Cadastro Digital — One Innovation", {
    x: 60,
    y: 30,
    size: 9,
    font: fontRegular,
    color: COLORS.textMuted,
  });

  page1.drawText("Página 1 de 2", {
    x: pageWidth - 120,
    y: 30,
    size: 9,
    font: fontRegular,
    color: COLORS.textMuted,
  });

  // ═══════════════════════════════════════════
  // PAGE 2: Funnel + Daily Breakdown
  // ═══════════════════════════════════════════
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);

  // Background
  page2.drawRectangle({
    x: 0, y: 0,
    width: pageWidth, height: pageHeight,
    color: COLORS.bg,
  });

  // Top accent line
  page2.drawRectangle({
    x: 0, y: pageHeight - 4,
    width: pageWidth, height: 4,
    color: COLORS.brand,
  });

  // Header
  page2.drawText("ONE INNOVATION", {
    x: 60,
    y: pageHeight - 40,
    size: 10,
    font: fontBold,
    color: COLORS.brand,
  });

  page2.drawText("Funil de Conversão", {
    x: 60,
    y: pageHeight - 70,
    size: 24,
    font: fontBold,
    color: COLORS.white,
  });

  // ─── Funnel Visualization ───
  const funnelStartY = pageHeight - 110;
  const funnelBarMaxW = 500;
  const funnelBarH = 36;
  const funnelGap = 8;
  const funnelX = 160;
  const maxVal = Math.max(stats.total, 1);

  const funnelSteps = [
    { label: "Iniciados", value: stats.total, color: COLORS.blue },
    { label: "Completos", value: stats.complete, color: COLORS.amber },
    { label: "Em Revisão", value: stats.inReview, color: COLORS.purple },
    { label: "Aprovados", value: stats.approved, color: COLORS.green },
    { label: "Rejeitados", value: stats.rejected, color: COLORS.red },
  ];

  funnelSteps.forEach((step, i) => {
    const fy = funnelStartY - i * (funnelBarH + funnelGap);
    const barW = Math.max((step.value / maxVal) * funnelBarMaxW, 8);
    const pct = Math.round((step.value / maxVal) * 100);

    // Label
    page2.drawText(step.label, {
      x: 60,
      y: fy + 12,
      size: 11,
      font: fontRegular,
      color: COLORS.textSecondary,
    });

    // Bar background
    drawRoundedRect(page2, funnelX, fy, funnelBarMaxW, funnelBarH, COLORS.bgCard);

    // Bar fill
    drawRoundedRect(page2, funnelX, fy, barW, funnelBarH, step.color);

    // Value text on bar
    const valueText = `${step.value}  (${pct}%)`;
    const textX = barW > 80 ? funnelX + barW - fontBold.widthOfTextAtSize(valueText, 11) - 10 : funnelX + barW + 10;
    const textColor = barW > 80 ? COLORS.white : COLORS.textPrimary;

    page2.drawText(valueText, {
      x: textX,
      y: fy + 12,
      size: 11,
      font: fontBold,
      color: textColor,
    });
  });

  // ─── Daily Breakdown Table ───
  const tableStartY = funnelStartY - funnelSteps.length * (funnelBarH + funnelGap) - 40;

  page2.drawText("Evolução Diária", {
    x: 60,
    y: tableStartY + 20,
    size: 16,
    font: fontBold,
    color: COLORS.white,
  });

  // Table header
  const tableY = tableStartY - 10;
  const colWidths = [100, 100, 100, 100];
  const colX = [60, 200, 340, 480];
  const headers = ["Data", "Iniciados", "Completos", "Aprovados"];

  // Header background
  drawRoundedRect(page2, 50, tableY - 5, 600, 22, COLORS.bgCard);

  headers.forEach((h, i) => {
    page2.drawText(h, {
      x: colX[i],
      y: tableY,
      size: 10,
      font: fontBold,
      color: COLORS.brand,
    });
  });

  // Table rows — show last 15 days max to fit the page
  const dailyToShow = stats.daily.slice(-15);
  const rowH = 18;

  dailyToShow.forEach((day, i) => {
    const ry = tableY - 25 - i * rowH;

    // Alternate row bg
    if (i % 2 === 0) {
      drawRoundedRect(page2, 50, ry - 4, 600, rowH, COLORS.bgCardLight);
    }

    page2.drawText(day.label, {
      x: colX[0],
      y: ry,
      size: 9,
      font: fontRegular,
      color: COLORS.textPrimary,
    });

    page2.drawText(day.started.toString(), {
      x: colX[1],
      y: ry,
      size: 9,
      font: fontRegular,
      color: COLORS.blue,
    });

    page2.drawText(day.completed.toString(), {
      x: colX[2],
      y: ry,
      size: 9,
      font: fontRegular,
      color: COLORS.amber,
    });

    page2.drawText(day.approved.toString(), {
      x: colX[3],
      y: ry,
      size: 9,
      font: fontRegular,
      color: COLORS.green,
    });
  });

  // Footer
  page2.drawText("Cadastro Digital — One Innovation", {
    x: 60,
    y: 30,
    size: 9,
    font: fontRegular,
    color: COLORS.textMuted,
  });

  page2.drawText("Página 2 de 2", {
    x: pageWidth - 120,
    y: 30,
    size: 9,
    font: fontRegular,
    color: COLORS.textMuted,
  });

  // Serialize
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
