/**
 * Corretor Notification Service — One Innovation Design
 * Sends email notifications to corretores when a new form submission is made.
 * Uses the same dark premium design as all other emails.
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

/* ─── Design Constants (same as emailService.ts) ─── */
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/one-innovation-logo_b13de89b.jpg";
const FROM_EMAIL = "one@cadastrodigital.com.br";
const FROM_NAME = "One Innovation";
const BG_DARK = "#0a0a0f";
const BG_CARD = "#141420";
const BG_CARD_INNER = "#1a1a2e";
const BLUE = "#0D8BD9";
const BLUE_LIGHT = "#70BEFA";
const TEXT_WHITE = "#f0f0f5";
const TEXT_MUTED = "#9ca3af";
const TEXT_DIM = "#6b7280";
const BORDER = "#2a2a3e";

export interface CorretorNotificationParams {
  corretorName: string;
  corretorEmail: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentPhone?: string;
  protocolCode: string;
  formTitle: string;
  submittedAt: Date;
}

export async function sendCorretorNotification(params: CorretorNotificationParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const {
    corretorName,
    corretorEmail,
    respondentName,
    respondentEmail,
    respondentPhone,
    protocolCode,
    formTitle,
    submittedAt,
  } = params;

  const dateStr = submittedAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const contactRows = [
    respondentName ? `<tr><td style="padding:10px 14px;color:${TEXT_DIM};font-size:12px;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Nome</td><td style="padding:10px 14px;color:${TEXT_WHITE};font-size:14px;font-weight:500;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${respondentName}</td></tr>` : "",
    respondentEmail ? `<tr><td style="padding:10px 14px;color:${TEXT_DIM};font-size:12px;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Email</td><td style="padding:10px 14px;color:${TEXT_WHITE};font-size:14px;font-weight:500;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;"><a href="mailto:${respondentEmail}" style="color:${BLUE_LIGHT};text-decoration:none;">${respondentEmail}</a></td></tr>` : "",
    respondentPhone ? `<tr><td style="padding:10px 14px;color:${TEXT_DIM};font-size:12px;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Telefone</td><td style="padding:10px 14px;color:${TEXT_WHITE};font-size:14px;font-weight:500;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;"><a href="https://wa.me/55${respondentPhone.replace(/\D/g, "")}" style="color:${BLUE_LIGHT};text-decoration:none;">${respondentPhone}</a></td></tr>` : "",
  ].filter(Boolean).join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:${BG_DARK};font-family:'Montserrat','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_DARK};padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Logo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-bottom:24px;">
          <tr>
            <td align="center" style="padding:16px 0;">
              <img src="${LOGO_URL}" alt="One Innovation" width="120" style="display:block;border:0;max-width:120px;height:auto;" />
            </td>
          </tr>
        </table>
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${BG_CARD};border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BLUE},${BLUE}dd);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:0.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Novo Cadastro Recebido
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:${TEXT_WHITE};font-size:18px;font-weight:600;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Olá, ${corretorName}!
              </p>
              <p style="margin:0 0 24px;color:${TEXT_MUTED};font-size:15px;line-height:1.7;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Um novo cadastro foi recebido no formulário <strong style="color:${BLUE_LIGHT}">${formTitle}</strong>.
              </p>
              <!-- Protocol Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <div style="display:inline-block;background-color:${BG_CARD_INNER};border:1px solid ${BLUE};border-radius:12px;padding:18px 36px;">
                      <p style="margin:0 0 6px;color:${TEXT_MUTED};font-size:10px;text-transform:uppercase;letter-spacing:2.5px;font-weight:600;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                        Código de Protocolo
                      </p>
                      <p style="margin:0;color:${BLUE};font-size:26px;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace;">
                        ${protocolCode}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- Contact Info -->
              ${contactRows ? `
              <p style="margin:0 0 12px;color:${TEXT_MUTED};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Dados do Interessado
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;overflow:hidden;margin-bottom:24px;background:${BG_CARD_INNER};">
                ${contactRows}
              </table>
              ` : ""}
              <p style="margin:0 0 8px;color:${TEXT_DIM};font-size:13px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Recebido em: ${dateStr}
              </p>
              <p style="margin:16px 0 0;color:${TEXT_MUTED};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Acesse o painel para ver todos os detalhes e gerar a ficha de cadastro.
              </p>
            </td>
          </tr>
        </table>
        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-top:24px;">
          <tr>
            <td align="center" style="padding:16px 0;">
              <p style="margin:0 0 8px;color:${TEXT_DIM};font-size:11px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;letter-spacing:0.5px;">
                One Innovation — Empreendimentos Inovadores
              </p>
              <p style="margin:0;color:${TEXT_DIM};font-size:11px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Este é um e-mail automático. Por favor, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textContent = `Olá, ${corretorName}!

Um novo cadastro foi recebido no formulário "${formTitle}".

Código de Protocolo: ${protocolCode}

${respondentName ? `Nome: ${respondentName}` : ""}
${respondentEmail ? `Email: ${respondentEmail}` : ""}
${respondentPhone ? `Telefone: ${respondentPhone}` : ""}

Recebido em: ${dateStr}

Acesse o painel para ver todos os detalhes.

---
One Innovation — Empreendimentos Inovadores`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [corretorEmail],
      subject: `Novo cadastro: ${protocolCode} — ${formTitle}`,
      html: htmlContent,
      text: textContent,
    });
    if (error) {
      console.error("[CorretorNotification] Resend error:", error);
      return false;
    }
    console.log(`[CorretorNotification] Email sent to ${corretorName} <${corretorEmail}> (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[CorretorNotification] Failed:", (err as Error).message);
    return false;
  }
}

/**
 * Notify all active corretores assigned to a form about a new submission.
 */
export async function notifyCorretoresNewSubmission(params: {
  formId: number;
  protocolCode: string;
  formTitle: string;
  respondentName?: string;
  respondentEmail?: string;
  answers?: Record<string, any>;
  questions?: any[];
}): Promise<{ sent: number; failed: number }> {
  const db = await import("./db");
  
  const activeCorretores = await db.getActiveCorretoresByForm(params.formId);
  if (activeCorretores.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let respondentPhone: string | undefined;
  if (params.answers && params.questions) {
    for (const q of params.questions) {
      if (/telefone|celular|whatsapp|phone/i.test(q.title) && params.answers[q.id]) {
        respondentPhone = String(params.answers[q.id]);
        break;
      }
    }
  }

  let sent = 0;
  let failed = 0;

  for (const corretor of activeCorretores) {
    try {
      const success = await sendCorretorNotification({
        corretorName: corretor.name,
        corretorEmail: corretor.email,
        respondentName: params.respondentName,
        respondentEmail: params.respondentEmail,
        respondentPhone,
        protocolCode: params.protocolCode,
        formTitle: params.formTitle,
        submittedAt: new Date(),
      });
      if (success) sent++;
      else failed++;
    } catch (err) {
      console.warn(`[CorretorNotification] Failed for ${corretor.email}:`, (err as Error)?.message?.substring(0, 80));
      failed++;
    }
  }

  console.log(`[CorretorNotification] Notified ${sent}/${activeCorretores.length} corretores for form ${params.formId}`);
  return { sent, failed };
}
