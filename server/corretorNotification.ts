/**
 * Corretor Notification Service — One Innovation Design
 * Sends email to corretor when a new response is submitted on their form.
 * Includes: all answers (question → response) + file attachment links.
 * Uses inline HTML with dark background + white text for guaranteed visibility.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[CorretorNotification] RESEND_API_KEY not configured.");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

const FROM_EMAIL = "one@cadastrodigital.com.br";
const FROM_NAME = "One Innovation";

export interface CorretorNotificationParams {
  corretorName: string;
  corretorEmail: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentPhone?: string;
  protocolCode: string;
  formTitle: string;
  submittedAt: Date;
  /** Whether this is a partial (incomplete) response */
  isPartial?: boolean;
  /** Whether the client abandoned the form (timeout) */
  isAbandoned?: boolean;
  /** All answers mapped as question title → display value */
  answersDisplay?: Array<{ label: string; value: string; isFile?: boolean }>;
  /** Files attached to this response */
  fileAttachments?: Array<{ filename: string; url: string; mimeType?: string }>;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAnswerRows(answers: Array<{ label: string; value: string; isFile?: boolean }>): string {
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

function buildFileSection(files: Array<{ filename: string; url: string; mimeType?: string }>): string {
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

function buildCorretorNotificationHtml(params: CorretorNotificationParams): string {
  const {
    corretorName,
    respondentName,
    respondentEmail,
    respondentPhone,
    protocolCode,
    formTitle,
    submittedAt,
    isPartial,
    isAbandoned,
    answersDisplay,
    fileAttachments,
  } = params;

  const dateStr = submittedAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
      <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 8px 0 4px;">${isAbandoned ? "Formul\u00e1rio Abandonado" : isPartial ? "Nova Resposta Parcial" : "Novo Cadastro Recebido"}</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">${escapeHtml(formTitle)}</p>
      ${isAbandoned
        ? `<div style="display: inline-block; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.4); border-radius: 6px; padding: 4px 12px; margin-top: 10px;"><span style="color: #f87171; font-size: 12px; font-weight: 600;">&#9888; CLIENTE ABANDONOU O FORMUL\u00c1RIO</span></div>`
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

export async function sendCorretorNotification(params: CorretorNotificationParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [params.corretorEmail],
      subject: params.isAbandoned
        ? `⚠️ Formulário abandonado: ${params.respondentName ?? "Cliente"} — ${params.formTitle}`
        : params.isPartial
          ? `Resposta parcial: ${params.protocolCode} — ${params.formTitle}`
          : `Novo cadastro: ${params.protocolCode} — ${params.formTitle}`,
      html: buildCorretorNotificationHtml(params),
    });

    if (error) {
      console.error("[CorretorNotification] Resend error:", error);
      return false;
    }
    console.log(`[CorretorNotification] Email sent to ${params.corretorName} <${params.corretorEmail}> (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[CorretorNotification] Failed:", (err as Error).message);
    return false;
  }
}

/**
 * Parse answers from the response and map them to question titles.
 * Also extracts file upload URLs.
 */
function buildAnswersDisplay(
  answers: Record<string, any>,
  questions: any[]
): { answersDisplay: Array<{ label: string; value: string; isFile?: boolean }>; fileUrls: Array<{ filename: string; url: string; mimeType?: string }> } {
  const answersDisplay: Array<{ label: string; value: string; isFile?: boolean }> = [];
  const fileUrls: Array<{ filename: string; url: string; mimeType?: string }> = [];

  // Skip non-content question types
  const skipTypes = new Set(["welcome", "thank-you", "statement"]);

  for (const q of questions) {
    if (skipTypes.has(q.type)) continue;

    const answer = answers[q.id];
    if (answer === undefined || answer === null || answer === "") continue;

    const label = q.title || q.id;

    // Handle file-upload type
    if (q.type === "file-upload") {
      try {
        const fileData = typeof answer === "string" ? JSON.parse(answer) : answer;
        if (fileData && fileData.url) {
          answersDisplay.push({
            label,
            value: fileData.url,
            isFile: true,
          });
          fileUrls.push({
            filename: fileData.filename || "arquivo",
            url: fileData.url,
            mimeType: fileData.mimeType,
          });
        } else {
          answersDisplay.push({ label, value: String(answer) });
        }
      } catch {
        answersDisplay.push({ label, value: String(answer) });
      }
      continue;
    }

    // Handle address type (object)
    if (q.type === "address" && typeof answer === "object") {
      const addr = answer as any;
      let line = addr.street || "";
      if (addr.number) line += `, ${addr.number}`;
      if (addr.complement) line += ` \u2014 ${addr.complement}`;
      if (addr.neighborhood) line += ` \u2014 ${addr.neighborhood}`;
      const cityState = [addr.city, addr.state].filter(Boolean).join("/");
      if (cityState) line += `, ${cityState}`;
      if (addr.cep) line += ` \u2014 CEP ${addr.cep}`;
      answersDisplay.push({ label, value: line || JSON.stringify(answer) });
      continue;
    }

    // Handle matrix type (object of row→column)
    if (q.type === "matrix" && typeof answer === "object" && !Array.isArray(answer)) {
      const matrixStr = Object.entries(answer)
        .map(([row, col]) => `${row}: ${col}`)
        .join("; ");
      answersDisplay.push({ label, value: matrixStr || "—" });
      continue;
    }

    // Handle ranking (array)
    if (q.type === "ranking" && Array.isArray(answer)) {
      answersDisplay.push({ label, value: answer.join(" → ") });
      continue;
    }

    // Handle multiple-select (array)
    if (Array.isArray(answer)) {
      answersDisplay.push({ label, value: answer.join(", ") });
      continue;
    }

    // Handle choice-based questions — map choice ID to label
    if (q.choices && typeof answer === "string") {
      const choice = q.choices.find((c: any) => c.id === answer);
      answersDisplay.push({ label, value: choice?.label || answer });
      continue;
    }

    // Handle yes-no
    if (q.type === "yes-no") {
      answersDisplay.push({ label, value: answer === true || answer === "true" ? "Sim" : "Não" });
      continue;
    }

    // Handle checkbox
    if (q.type === "checkbox") {
      answersDisplay.push({ label, value: answer === true || answer === "true" ? "Aceito" : "Não aceito" });
      continue;
    }

    // Try to parse JSON string (address, etc.) before falling back to stringify
    if (typeof answer === "string" && answer.startsWith("{")) {
      try {
        const parsed = JSON.parse(answer);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          // Check if it's an address-like object
          if (parsed.cep || parsed.street || parsed.city || parsed.state || parsed.neighborhood) {
            let line = parsed.street || "";
            if (parsed.number) line += `, ${parsed.number}`;
            if (parsed.complement) line += ` \u2014 ${parsed.complement}`;
            if (parsed.neighborhood) line += ` \u2014 ${parsed.neighborhood}`;
            const cityState = [parsed.city, parsed.state].filter(Boolean).join("/");
            if (cityState) line += `, ${cityState}`;
            if (parsed.cep) line += ` \u2014 CEP ${parsed.cep}`;
            answersDisplay.push({ label, value: line });
            continue;
          }
          // Generic object: render as key: value pairs
          const pairs = Object.entries(parsed)
            .filter(([, v]) => v !== null && v !== undefined && v !== "")
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");
          answersDisplay.push({ label, value: pairs || String(answer) });
          continue;
        }
      } catch {}
    }

    // Default: stringify
    answersDisplay.push({ label, value: String(answer) });
  }

  return { answersDisplay, fileUrls };
}

/**
 * Notify all active corretores assigned to a form about a new submission.
 * Now includes full response data and file links.
 */
export async function notifyCorretoresNewSubmission(params: {
  formId: number;
  protocolCode: string;
  formTitle: string;
  respondentName?: string;
  respondentEmail?: string;
  answers?: Record<string, any>;
  questions?: any[];
  responseId?: number;
  isPartial?: boolean;
  isAbandoned?: boolean;
}): Promise<{ sent: number; failed: number }> {
  const db = await import("./db");
  const staffDb = await import("./staffDb");
  
  // 1. Legacy: get corretores from form_corretores table
  const legacyCorretores = await db.getActiveCorretoresByForm(params.formId);

  // 2. New: get staff users from form_assignments table
  const assignments = await db.getFormAssignments(params.formId);
  const staffRecipients: Array<{ name: string; email: string }> = [];
  
  for (const assignment of assignments) {
    try {
      const staffUser = await staffDb.getStaffUserById(assignment.staffUserId);
      if (staffUser && staffUser.active && staffUser.email) {
        staffRecipients.push({ name: staffUser.name, email: staffUser.email });
      }
    } catch (err) {
      console.warn(`[CorretorNotification] Failed to fetch staff user ${assignment.staffUserId}:`, (err as Error)?.message?.substring(0, 80));
    }
  }

  // 3. Merge both lists, deduplicate by email
  const allRecipients: Array<{ name: string; email: string }> = [];
  const seenEmails = new Set<string>();

  for (const c of legacyCorretores) {
    const email = c.email?.toLowerCase();
    if (email && !seenEmails.has(email)) {
      seenEmails.add(email);
      allRecipients.push({ name: c.name, email: c.email });
    }
  }

  for (const s of staffRecipients) {
    const email = s.email?.toLowerCase();
    if (email && !seenEmails.has(email)) {
      seenEmails.add(email);
      allRecipients.push({ name: s.name, email: s.email });
    }
  }

  if (allRecipients.length === 0) {
    console.log(`[CorretorNotification] No recipients found for form ${params.formId} (legacy: ${legacyCorretores.length}, assignments: ${assignments.length})`);
    return { sent: 0, failed: 0 };
  }

  console.log(`[CorretorNotification] Found ${allRecipients.length} recipient(s) for form ${params.formId}: ${allRecipients.map(r => r.email).join(", ")}`);

  // Build structured answers display and extract file URLs
  let answersDisplay: Array<{ label: string; value: string; isFile?: boolean }> = [];
  let fileAttachments: Array<{ filename: string; url: string; mimeType?: string }> = [];
  let respondentPhone: string | undefined;

  if (params.answers && params.questions) {
    const parsed = buildAnswersDisplay(params.answers, params.questions);
    answersDisplay = parsed.answersDisplay;
    fileAttachments = parsed.fileUrls;

    // Extract phone from answers
    for (const q of params.questions) {
      if (/telefone|celular|whatsapp|phone/i.test(q.title) && params.answers[q.id]) {
        respondentPhone = String(params.answers[q.id]);
        break;
      }
    }
  }

  // Also get files from the database (files table) for this response
  if (params.responseId) {
    try {
      const dbFiles = await db.getFilesByResponse(params.responseId);
      for (const f of dbFiles) {
        // Avoid duplicates (file might already be in answersDisplay from the answer JSON)
        const alreadyIncluded = fileAttachments.some((fa) => fa.url === f.url);
        if (!alreadyIncluded) {
          fileAttachments.push({
            filename: f.filename,
            url: f.url,
            mimeType: f.mimeType ?? undefined,
          });
        }
      }
    } catch (err) {
      console.warn("[CorretorNotification] Failed to fetch files from DB:", (err as Error)?.message?.substring(0, 80));
    }
  }

  let sent = 0;
  let failed = 0;

  for (const recipient of allRecipients) {
    try {
      const success = await sendCorretorNotification({
        corretorName: recipient.name,
        corretorEmail: recipient.email,
        respondentName: params.respondentName,
        respondentEmail: params.respondentEmail,
        respondentPhone,
        protocolCode: params.protocolCode,
        formTitle: params.formTitle,
        submittedAt: new Date(),
        isPartial: params.isPartial,
        isAbandoned: params.isAbandoned,
        answersDisplay,
        fileAttachments,
      });
      if (success) sent++;
      else failed++;
    } catch (err) {
      console.warn(`[CorretorNotification] Failed for ${recipient.email}:`, (err as Error)?.message?.substring(0, 80));
      failed++;
    }
  }

  console.log(`[CorretorNotification] Notified ${sent}/${allRecipients.length} corretores for form ${params.formId}`);
  return { sent, failed };
}
