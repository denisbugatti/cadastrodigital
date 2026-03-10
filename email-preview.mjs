/**
 * Generate email preview HTML files with sample data.
 * Run: node email-preview.mjs
 */
import fs from "fs";

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAnswerRows(answers) {
  if (!answers || answers.length === 0) return "";
  const rows = answers.map((a) => {
    const displayValue = a.isFile
      ? `<a href="${escapeHtml(a.value)}" target="_blank" style="color: #60a5fa; text-decoration: underline; font-size: 13px;">Ver arquivo</a>`
      : `<span style="color: #f1f5f9; font-size: 13px; word-break: break-word;">${escapeHtml(a.value)}</span>`;
    return `
      <tr>
        <td style="padding: 10px 16px; color: #94a3b8; font-size: 12px; border-bottom: 1px solid #1e293b; vertical-align: top; width: 35%;">${escapeHtml(a.label)}</td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #1e293b; vertical-align: top;">${displayValue}</td>
      </tr>`;
  }).join("");
  return `
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h2 style="color: #f1f5f9; font-size: 15px; font-weight: 600; margin: 0 0 16px;">Respostas do Formulário</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${rows}
      </table>
    </div>`;
}

function buildFileSection(files) {
  if (!files || files.length === 0) return "";
  const fileRows = files.map((f) => {
    const isImage = f.mimeType?.startsWith("image/");
    const icon = isImage ? "🖼️" : "📎";
    return `
      <tr>
        <td style="padding: 8px 16px; border-bottom: 1px solid #1e293b;">
          <span style="font-size: 16px; margin-right: 8px;">${icon}</span>
          <a href="${escapeHtml(f.url)}" target="_blank" style="color: #60a5fa; font-size: 13px; text-decoration: underline; word-break: break-all;">${escapeHtml(f.filename)}</a>
        </td>
      </tr>`;
  }).join("");
  return `
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h2 style="color: #f1f5f9; font-size: 15px; font-weight: 600; margin: 0 0 16px;">📁 Arquivos Anexados (${files.length})</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        ${fileRows}
      </table>
    </div>`;
}

function buildEmail({ corretorName, respondentName, respondentEmail, respondentPhone, protocolCode, formTitle, submittedAt, isPartial, isAbandoned, answersDisplay, fileAttachments }) {
  const dateStr = submittedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 12px 24px; border-radius: 12px; margin-bottom: 16px;">
        <span style="font-size: 28px;">&#128276;</span>
      </div>
      <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 8px 0 4px;">${isAbandoned ? "Formulário Abandonado" : isPartial ? "Nova Resposta Parcial" : "Novo Cadastro Recebido"}</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">${escapeHtml(formTitle)}</p>
      ${isAbandoned
        ? `<div style="display: inline-block; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; padding: 4px 12px; margin-top: 10px;"><span style="color: #f87171; font-size: 12px; font-weight: 600;">&#9888; CLIENTE ABANDONOU O FORMULÁRIO</span></div>`
        : isPartial
          ? `<div style="display: inline-block; background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4); border-radius: 6px; padding: 4px 12px; margin-top: 10px;"><span style="color: #fbbf24; font-size: 12px; font-weight: 600;">&#9888; RESPOSTA PARCIAL</span></div>`
          : ""}
    </div>

    <!-- Greeting -->
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Ol&aacute; <strong style="color: #ffffff;">${escapeHtml(corretorName)}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">
        ${isAbandoned
          ? "O cliente iniciou o preenchimento do formul&aacute;rio mas <strong style='color:#f87171;'>abandonou ap&oacute;s 8 minutos sem atividade</strong>. Abaixo est&atilde;o as respostas que ele preencheu at&eacute; o momento. Recomendamos entrar em contato o quanto antes."
          : isPartial
            ? "Uma resposta parcial foi recebida. O cliente ainda n&atilde;o completou o formul&aacute;rio, mas j&aacute; respondeu algumas perguntas."
            : "Um novo cadastro foi recebido e atribu&iacute;do a voc&ecirc;. Confira os detalhes abaixo."}
      </p>
    </div>

    <!-- Protocol Code -->
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background: rgba(59,130,246,0.15); border: 1.5px solid rgba(59,130,246,0.3); border-radius: 10px; padding: 16px 32px;">
        <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">Protocolo</p>
        <span style="color: #60a5fa; font-size: 22px; font-weight: 700; letter-spacing: 0.15em; font-family: monospace;">${escapeHtml(protocolCode)}</span>
      </div>
    </div>

    <!-- Client Summary -->
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h2 style="color: #f1f5f9; font-size: 15px; font-weight: 600; margin: 0 0 16px;">Dados do Cliente</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Nome</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${escapeHtml(respondentName || "Não informado")}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">E-mail</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${escapeHtml(respondentEmail || "Não informado")}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Telefone</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${escapeHtml(respondentPhone || "Não informado")}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">Data</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right;">${dateStr}</td>
        </tr>
      </table>
    </div>

    <!-- All Answers -->
    ${buildAnswerRows(answersDisplay ?? [])}

    <!-- File Attachments -->
    ${buildFileSection(fileAttachments ?? [])}

    <p style="color: #94a3b8; font-size: 13px; text-align: center; line-height: 1.5;">
      Acesse o painel para validar este cadastro.
    </p>

    <!-- Footer -->
    <div style="text-align: center; padding: 24px 0 8px; border-top: 1px solid #1e293b; margin-top: 32px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">One Innovation &mdash; Cadastro Digital</p>
    </div>

  </div>
</body>
</html>`;
}

// ─── Sample Data ───

const sampleAnswers = [
  { label: "Nome completo", value: "Maria Santos da Silva" },
  { label: "CPF", value: "123.456.789-00" },
  { label: "E-mail", value: "maria.santos@gmail.com" },
  { label: "Telefone / WhatsApp", value: "+55 (11) 99876-5432" },
  { label: "Data de nascimento", value: "15/03/1990" },
  { label: "Estado civil", value: "Casada" },
  { label: "Profissão", value: "Engenheira Civil" },
  { label: "Renda mensal", value: "R$ 12.000,00" },
  { label: "Empreendimento de interesse", value: "Residencial Vista Mar" },
  { label: "Tipo de aquisição", value: "Pessoa Física" },
  { label: "Forma de pagamento", value: "Financiamento bancário" },
  { label: "RG (frente)", value: "https://example.com/rg-frente.jpg", isFile: true },
  { label: "RG (verso)", value: "https://example.com/rg-verso.jpg", isFile: true },
  { label: "Comprovante de renda", value: "https://example.com/holerite.pdf", isFile: true },
];

const sampleFiles = [
  { filename: "RG_frente_maria_santos.jpg", url: "https://example.com/rg-frente.jpg", mimeType: "image/jpeg" },
  { filename: "RG_verso_maria_santos.jpg", url: "https://example.com/rg-verso.jpg", mimeType: "image/jpeg" },
  { filename: "Holerite_marco_2026.pdf", url: "https://example.com/holerite.pdf", mimeType: "application/pdf" },
  { filename: "Comprovante_residencia.pdf", url: "https://example.com/comprovante.pdf", mimeType: "application/pdf" },
];

const partialAnswers = [
  { label: "Nome completo", value: "João Pedro Oliveira" },
  { label: "CPF", value: "987.654.321-00" },
  { label: "E-mail", value: "joao.pedro@hotmail.com" },
  { label: "Telefone / WhatsApp", value: "+55 (21) 98765-4321" },
];

const abandonedAnswers = [
  { label: "Nome completo", value: "Ana Carolina Ferreira" },
  { label: "E-mail", value: "ana.ferreira@outlook.com" },
  { label: "Telefone / WhatsApp", value: "+55 (31) 91234-5678" },
];

// ─── Generate 3 Previews ───

// 1. Complete response
const completeHtml = buildEmail({
  corretorName: "Denis Bugatti",
  respondentName: "Maria Santos da Silva",
  respondentEmail: "maria.santos@gmail.com",
  respondentPhone: "+55 (11) 99876-5432",
  protocolCode: "ONE-2026-A7B3",
  formTitle: "Cadastro Online — Residencial Vista Mar",
  submittedAt: new Date(),
  isPartial: false,
  isAbandoned: false,
  answersDisplay: sampleAnswers,
  fileAttachments: sampleFiles,
});

// 2. Partial response
const partialHtml = buildEmail({
  corretorName: "Denis Bugatti",
  respondentName: "João Pedro Oliveira",
  respondentEmail: "joao.pedro@hotmail.com",
  respondentPhone: "+55 (21) 98765-4321",
  protocolCode: "PARCIAL-4521",
  formTitle: "Cadastro Online — Residencial Vista Mar",
  submittedAt: new Date(),
  isPartial: true,
  isAbandoned: false,
  answersDisplay: partialAnswers,
  fileAttachments: [],
});

// 3. Abandoned response
const abandonedHtml = buildEmail({
  corretorName: "Denis Bugatti",
  respondentName: "Ana Carolina Ferreira",
  respondentEmail: "ana.ferreira@outlook.com",
  respondentPhone: "+55 (31) 91234-5678",
  protocolCode: "ABANDONO-8832",
  formTitle: "Cadastro Online — Residencial Vista Mar",
  submittedAt: new Date(),
  isPartial: true,
  isAbandoned: true,
  answersDisplay: abandonedAnswers,
  fileAttachments: [],
});

// Write files
const outDir = "/home/ubuntu/email-previews";
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/email-completo.html`, completeHtml);
fs.writeFileSync(`${outDir}/email-parcial.html`, partialHtml);
fs.writeFileSync(`${outDir}/email-abandonado.html`, abandonedHtml);

console.log("✅ Previews gerados em /home/ubuntu/email-previews/");
console.log("  - email-completo.html");
console.log("  - email-parcial.html");
console.log("  - email-abandonado.html");
