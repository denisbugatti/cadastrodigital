/**
 * Corretor Notification Service
 * Sends email notifications to corretores (real estate agents) when a new form submission is made.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[CorretorNotification] RESEND_API_KEY not configured. Email sending disabled.");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export interface CorretorNotificationParams {
  corretorName: string;
  corretorEmail: string;
  respondentName?: string;
  respondentEmail?: string;
  respondentPhone?: string;
  protocolCode: string;
  formTitle: string;
  submittedAt: Date;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Send a notification email to a corretor about a new form submission.
 */
export async function sendCorretorNotification(params: CorretorNotificationParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[CorretorNotification] Skipping: Resend not configured.");
    return false;
  }

  const {
    corretorName,
    corretorEmail,
    respondentName,
    respondentEmail,
    respondentPhone,
    protocolCode,
    formTitle,
    submittedAt,
    fromEmail = "onboarding@resend.dev",
    fromName = "Cadastro Digital",
  } = params;

  const dateStr = submittedAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const contactRows = [
    respondentName ? `<tr><td style="padding:8px 12px;color:#666;font-size:13px;border-bottom:1px solid #f0f0f0;">Nome</td><td style="padding:8px 12px;color:#333;font-size:14px;font-weight:500;border-bottom:1px solid #f0f0f0;">${respondentName}</td></tr>` : "",
    respondentEmail ? `<tr><td style="padding:8px 12px;color:#666;font-size:13px;border-bottom:1px solid #f0f0f0;">Email</td><td style="padding:8px 12px;color:#333;font-size:14px;font-weight:500;border-bottom:1px solid #f0f0f0;"><a href="mailto:${respondentEmail}" style="color:#0D8BD9;text-decoration:none;">${respondentEmail}</a></td></tr>` : "",
    respondentPhone ? `<tr><td style="padding:8px 12px;color:#666;font-size:13px;border-bottom:1px solid #f0f0f0;">Telefone</td><td style="padding:8px 12px;color:#333;font-size:14px;font-weight:500;border-bottom:1px solid #f0f0f0;"><a href="tel:${respondentPhone}" style="color:#0D8BD9;text-decoration:none;">${respondentPhone}</a></td></tr>` : "",
  ].filter(Boolean).join("");

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background-color:#0D8BD9;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:0.5px;">
                🔔 Novo Cadastro Recebido
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#333333;font-size:16px;line-height:1.5;">
                Olá, <strong>${corretorName}</strong>!
              </p>
              <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">
                Um novo cadastro foi recebido no formulário <strong>${formTitle}</strong>.
              </p>
              <!-- Protocol Code Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <div style="display:inline-block;background-color:#f0f7ff;border:2px solid #0D8BD9;border-radius:10px;padding:16px 32px;">
                      <p style="margin:0 0 4px;color:#666666;font-size:11px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">
                        Código de Protocolo
                      </p>
                      <p style="margin:0;color:#0D8BD9;font-size:28px;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace;">
                        ${protocolCode}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- Contact Info -->
              ${contactRows ? `
              <p style="margin:0 0 12px;color:#333;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">
                Dados do Interessado
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                ${contactRows}
              </table>
              ` : ""}
              <p style="margin:0 0 8px;color:#888;font-size:13px;">
                📅 Recebido em: ${dateStr}
              </p>
              <p style="margin:16px 0 0;color:#555;font-size:14px;line-height:1.6;">
                Acesse o painel para ver todos os detalhes da resposta e gerar a ficha de cadastro.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;text-align:center;">
              <p style="margin:0;color:#999999;font-size:12px;line-height:1.5;">
                Este é um e-mail automático do Cadastro Digital. Por favor, não responda.
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

Acesse o painel para ver todos os detalhes da resposta e gerar a ficha de cadastro.

---
Este é um e-mail automático do Cadastro Digital. Por favor, não responda.`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
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
  // Import db dynamically to avoid circular dependency
  const db = await import("./db");
  
  const activeCorretores = await db.getActiveCorretoresByForm(params.formId);
  if (activeCorretores.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Try to extract phone from answers
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
