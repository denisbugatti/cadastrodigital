/**
 * Email Service — Sends transactional emails via Resend.
 * Used to notify respondents with their protocol code after form submission.
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured. Email sending disabled.");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

export interface ProtocolEmailParams {
  to: string;
  respondentName?: string;
  protocolCode: string;
  formTitle: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Send the protocol code email to the respondent.
 * Returns true if sent successfully, false otherwise.
 * Silently fails if Resend is not configured (no API key).
 */
export async function sendProtocolEmail(params: ProtocolEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[Email] Skipping email: Resend not configured.");
    return false;
  }

  const {
    to,
    respondentName,
    protocolCode,
    formTitle,
    fromEmail = "onboarding@resend.dev",
    fromName = "Cadastro Digital",
  } = params;

  const greeting = respondentName ? `Olá, ${respondentName}!` : "Olá!";

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
                Cadastro Confirmado
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#333333;font-size:16px;line-height:1.5;">
                ${greeting}
              </p>
              <p style="margin:0 0 24px;color:#555555;font-size:15px;line-height:1.6;">
                Seu cadastro em <strong>${formTitle}</strong> foi recebido com sucesso.
                Abaixo está o seu código de protocolo:
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
              <p style="margin:0 0 8px;color:#555555;font-size:15px;line-height:1.6;">
                Envie este código para o seu corretor poder prosseguir com o seu atendimento.
              </p>
              <p style="margin:0 0 0;color:#333333;font-size:16px;line-height:1.6;font-weight:500;">
                Você está quase lá.<br>
                Falta pouco para o seu próximo apartamento.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;text-align:center;">
              <p style="margin:0;color:#999999;font-size:12px;line-height:1.5;">
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

  const textContent = `${greeting}

Seu cadastro em "${formTitle}" foi recebido com sucesso.

Seu código de protocolo: ${protocolCode}

Envie este código para o seu corretor poder prosseguir com o seu atendimento.

Você está quase lá. Falta pouco para o seu próximo apartamento.

---
Este é um e-mail automático. Por favor, não responda.`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `Seu código de protocolo: ${protocolCode}`,
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return false;
    }

    console.log(`[Email] Protocol email sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send protocol email:", (err as Error).message);
    return false;
  }
}
