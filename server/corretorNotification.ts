/**
 * Corretor Notification Service — One Innovation Design
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
      <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 8px 0 4px;">Novo Cadastro Recebido</h1>
      <p style="color: #94a3b8; font-size: 14px; margin: 0;">${formTitle}</p>
    </div>

    <!-- Greeting -->
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Ol&aacute; <strong style="color: #ffffff;">${corretorName}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.6;">
        Um novo cadastro foi recebido e atribu&iacute;do a voc&ecirc;.
      </p>
    </div>

    <!-- Protocol Code -->
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background: rgba(59,130,246,0.15); border: 1.5px solid rgba(59,130,246,0.3); border-radius: 10px; padding: 16px 32px;">
        <p style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 6px;">Protocolo</p>
        <span style="color: #60a5fa; font-size: 22px; font-weight: 700; letter-spacing: 0.15em; font-family: monospace;">${protocolCode}</span>
      </div>
    </div>

    <!-- Client Details -->
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h2 style="color: #f1f5f9; font-size: 15px; font-weight: 600; margin: 0 0 16px;">Dados do Cliente</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Nome</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${respondentName || "N&atilde;o informado"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">E-mail</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${respondentEmail || "N&atilde;o informado"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">Telefone</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${respondentPhone || "N&atilde;o informado"}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #94a3b8; font-size: 13px;">Data</td>
          <td style="padding: 10px 0; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right;">${dateStr}</td>
        </tr>
      </table>
    </div>

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
      subject: `Novo cadastro: ${params.protocolCode} — ${params.formTitle}`,
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
