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

// ─── Invite Email ───

export interface InviteEmailParams {
  to: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn("[Email] Skipping invite email: Resend not configured.");
    return false;
  }

  const {
    to,
    inviterName,
    role,
    inviteUrl,
    fromEmail = "onboarding@resend.dev",
    fromName = "Cadastro Digital",
  } = params;

  const roleLabel: Record<string, string> = {
    diretor: "Diretor",
    gerente: "Gerente",
    corretor: "Corretor",
  };

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#0D8BD9;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Convite para Cadastro Digital</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;">Olá!</p>
              <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6;">
                <strong>${inviterName}</strong> convidou você para fazer parte da plataforma
                <strong>Cadastro Digital</strong> como <strong>${roleLabel[role] || role}</strong>.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <a href="${inviteUrl}" style="display:inline-block;background-color:#0D8BD9;color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#999;font-size:13px;">
                Se o botão não funcionar, copie e cole este link no navegador:<br>
                <a href="${inviteUrl}" style="color:#0D8BD9;word-break:break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">Este convite expira em 7 dias.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: `Convite: ${inviterName} convidou você para o Cadastro Digital`,
      html: htmlContent,
    });
    if (error) {
      console.error("[Email] Invite email error:", error);
      return false;
    }
    console.log(`[Email] Invite sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send invite:", (err as Error).message);
    return false;
  }
}

// ─── Approval Email ───

export interface ApprovalEmailParams {
  to: string;
  clientName: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendApprovalEmail(params: ApprovalEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const {
    to,
    clientName,
    fromEmail = "onboarding@resend.dev",
    fromName = "Cadastro Digital",
  } = params;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#16a34a;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🎉 Parabéns!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#333;font-size:18px;font-weight:600;">
                Olá, ${clientName}!
              </p>
              <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.7;">
                Temos uma ótima notícia! Seu cadastro foi <strong style="color:#16a34a;">aprovado</strong> com sucesso.
              </p>
              <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.7;">
                Você está <strong>apto para poder comprar o seu imóvel da One Innovation</strong>!
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:16px 0;">
                    <div style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:2px solid #16a34a;border-radius:12px;padding:20px 32px;display:inline-block;">
                      <p style="margin:0;color:#15803d;font-size:18px;font-weight:700;">
                        Falta pouco para essa nova conquista se concretizar! 🏠
                      </p>
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;color:#555;font-size:15px;line-height:1.7;">
                Seu corretor entrará em contato para os próximos passos.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">Cadastro Digital — One Innovation</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: "🎉 Parabéns! Seu cadastro foi aprovado!",
      html: htmlContent,
    });
    if (error) {
      console.error("[Email] Approval email error:", error);
      return false;
    }
    console.log(`[Email] Approval email sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send approval:", (err as Error).message);
    return false;
  }
}

// ─── Rejection / Revision Email ───

export interface RejectionEmailParams {
  to: string;
  clientName: string;
  reason: string;
  fromEmail?: string;
  fromName?: string;
}

export async function sendRejectionEmail(params: RejectionEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const {
    to,
    clientName,
    reason,
    fromEmail = "onboarding@resend.dev",
    fromName = "Cadastro Digital",
  } = params;

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#f59e0b;padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Atenção: Revisão Necessária</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#333;font-size:16px;">Olá, ${clientName}!</p>
              <p style="margin:0 0 16px;color:#555;font-size:15px;line-height:1.6;">
                Identificamos que alguns dados ou documentos do seu cadastro precisam de ajuste.
              </p>
              <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:16px;border-radius:4px;margin:0 0 24px;">
                <p style="margin:0;color:#92400e;font-size:14px;font-weight:600;">Motivo:</p>
                <p style="margin:8px 0 0;color:#78350f;font-size:14px;line-height:1.5;">${reason}</p>
              </div>
              <p style="margin:0 0 8px;color:#555;font-size:15px;line-height:1.6;">
                Por favor, acesse seu cadastro e faça as correções necessárias.
                Após a correção, seu cadastro será reavaliado automaticamente.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f9fafb;border-top:1px solid #eaeaea;text-align:center;">
              <p style="margin:0;color:#999;font-size:12px;">Cadastro Digital — One Innovation</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: "Revisão necessária no seu cadastro",
      html: htmlContent,
    });
    if (error) {
      console.error("[Email] Rejection email error:", error);
      return false;
    }
    console.log(`[Email] Rejection email sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed to send rejection:", (err as Error).message);
    return false;
  }
}
