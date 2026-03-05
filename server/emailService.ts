/**
 * Email Service — One Innovation Design System
 * All emails use inline HTML with dark background + white text for guaranteed visibility.
 * Sender: one@cadastrodigital.com.br
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

const FROM_EMAIL = "one@cadastrodigital.com.br";
const FROM_NAME = "One Innovation";

/**
 * Generic helper to send an email with inline HTML.
 */
async function sendHtmlEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error("[Email] Send error:", error);
      return false;
    }
    console.log(`[Email] Sent to ${params.to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed:", (err as Error).message);
    return false;
  }
}

/* ─── Shared HTML wrapper ─── */
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0f1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    ${content}
    <!-- Footer -->
    <div style="text-align: center; padding: 24px 0 8px; border-top: 1px solid #1e293b; margin-top: 32px;">
      <p style="color: #64748b; font-size: 12px; margin: 0;">One Innovation — Cadastro Digital</p>
    </div>
  </div>
</body>
</html>`;
}

function headerBlock(emoji: string, title: string, subtitle?: string): string {
  return `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); padding: 12px 24px; border-radius: 12px; margin-bottom: 16px;">
        <span style="font-size: 28px;">${emoji}</span>
      </div>
      <h1 style="color: #f1f5f9; font-size: 22px; font-weight: 700; margin: 8px 0 4px;">${title}</h1>
      ${subtitle ? `<p style="color: #94a3b8; font-size: 14px; margin: 0;">${subtitle}</p>` : ""}
    </div>`;
}

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 10px 16px; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #1e293b;">${label}</td>
      <td style="padding: 10px 16px; color: #f1f5f9; font-size: 14px; font-weight: 500; text-align: right; border-bottom: 1px solid #1e293b;">${value}</td>
    </tr>`;
}

function ctaButton(url: string, text: string, color: string = "#3b82f6"): string {
  return `
    <div style="text-align: center; margin: 28px 0;">
      <a href="${url}" target="_blank" style="display: inline-block; background: ${color}; color: #ffffff; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none;">${text}</a>
    </div>`;
}

function cardBlock(content: string): string {
  return `
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      ${content}
    </div>`;
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 1: CONVITE PARA CORRETORES/GERENTES (Boas-vindas)
   ═══════════════════════════════════════════════════════════════ */

export interface InviteEmailParams {
  to: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  inviteeName?: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<boolean> {
  const { to, inviterName, role, inviteUrl, inviteeName } = params;

  const roleLabel: Record<string, string> = {
    diretor: "Diretor(a)",
    gerente: "Gerente",
    corretor: "Corretor(a)",
  };
  const roleDisplay = roleLabel[role] || role;
  const name = inviteeName || "Olá";

  const html = emailWrapper(`
    ${headerBlock("🎉", "Bem-vindo(a) à One Innovation!")}
    ${cardBlock(`
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Olá <strong style="color: #ffffff;">${name}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">
        <strong style="color: #f1f5f9;">${inviterName}</strong> convidou você para fazer parte da equipe como <strong style="color: #3b82f6;">${roleDisplay}</strong>.
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
        Clique no botão abaixo para criar sua conta e começar.
      </p>
    `)}
    ${ctaButton(inviteUrl, "Aceitar Convite")}
    <p style="color: #64748b; font-size: 12px; text-align: center;">Se você não esperava este convite, pode ignorar este e-mail.</p>
  `);

  return sendHtmlEmail({ to, subject: `Bem-vindo(a) à One Innovation — ${inviterName} convidou você`, html });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 2: CADASTRO COMPLETO — PENDENTE DE APROVAÇÃO
   ═══════════════════════════════════════════════════════════════ */

export interface ProtocolEmailParams {
  to: string;
  respondentName?: string;
  protocolCode: string;
  formTitle: string;
}

export async function sendProtocolEmail(params: ProtocolEmailParams): Promise<boolean> {
  const { to, respondentName, protocolCode, formTitle } = params;
  const name = respondentName || "Olá";

  const html = emailWrapper(`
    ${headerBlock("✅", "Cadastro Recebido!", formTitle)}
    ${cardBlock(`
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Olá <strong style="color: #ffffff;">${name}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
        Seu cadastro foi recebido com sucesso e está em análise. Guarde o código de protocolo abaixo:
      </p>
      <div style="text-align: center; margin: 20px 0;">
        <div style="display: inline-block; background: rgba(59,130,246,0.15); border: 1.5px solid rgba(59,130,246,0.3); border-radius: 10px; padding: 16px 32px;">
          <span style="color: #60a5fa; font-size: 24px; font-weight: 700; letter-spacing: 0.15em; font-family: monospace;">${protocolCode}</span>
        </div>
      </div>
      <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0; text-align: center; line-height: 1.5;">
        Você receberá uma notificação quando seu cadastro for analisado.
      </p>
    `)}
  `);

  return sendHtmlEmail({ to, subject: `Protocolo ${protocolCode} — Cadastro recebido com sucesso`, html });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 3: CADASTRO APROVADO — PARABÉNS!
   ═══════════════════════════════════════════════════════════════ */

export interface ApprovalEmailParams {
  to: string;
  clientName: string;
}

export async function sendApprovalEmail(params: ApprovalEmailParams): Promise<boolean> {
  const { to, clientName } = params;

  const html = emailWrapper(`
    ${headerBlock("🎉", "Cadastro Aprovado!")}
    ${cardBlock(`
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Parabéns <strong style="color: #ffffff;">${clientName}</strong>!
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">
        Seu cadastro foi <strong style="color: #22c55e;">aprovado</strong> com sucesso! 🎉
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
        Em breve, nosso corretor entrará em contato com os próximos passos.
      </p>
    `)}
    <div style="text-align: center; margin: 24px 0;">
      <div style="display: inline-block; background: rgba(34,197,94,0.12); border: 1.5px solid rgba(34,197,94,0.3); border-radius: 10px; padding: 14px 28px;">
        <span style="color: #22c55e; font-size: 18px; font-weight: 600;">✓ Aprovado</span>
      </div>
    </div>
  `);

  return sendHtmlEmail({ to, subject: `Parabéns, ${clientName}! Seu cadastro foi aprovado!`, html });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 4: REENVIO DE DOCUMENTO / CORREÇÃO DE DADOS
   ═══════════════════════════════════════════════════════════════ */

export interface RejectionEmailParams {
  to: string;
  clientName: string;
  reason: string;
  formUrl?: string;
}

export async function sendRejectionEmail(params: RejectionEmailParams): Promise<boolean> {
  const { to, clientName, reason, formUrl } = params;

  const html = emailWrapper(`
    ${headerBlock("⚠️", "Revisão Necessária")}
    ${cardBlock(`
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Olá <strong style="color: #ffffff;">${clientName}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
        Identificamos um ponto que precisa de atenção no seu cadastro:
      </p>
      <div style="background: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 0 0 16px;">
        <p style="color: #fca5a5; font-size: 14px; margin: 0; line-height: 1.5;">${reason}</p>
      </div>
      <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
        Por favor, corrija o item acima para que possamos dar continuidade ao seu processo.
      </p>
    `)}
    ${formUrl ? ctaButton(formUrl, "Corrigir Cadastro", "#ef4444") : ""}
  `);

  return sendHtmlEmail({ to, subject: `Atenção: Revisão necessária no seu cadastro`, html });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 5: CADÊNCIA DE ABANDONO (cadastro incompleto)
   3 variações para rotação ao longo das semanas
   ═══════════════════════════════════════════════════════════════ */

export interface CadenceEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
  sequenceNumber: number;
  totalInSequence: number;
}

function buildCadenceHtml(variation: number, clientName: string, formTitle: string, formUrl: string): string {
  const name = clientName || "Olá";

  if (variation === 1) {
    return emailWrapper(`
      ${headerBlock("📝", "Seu cadastro está quase pronto!", formTitle)}
      ${cardBlock(`
        <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
          Olá <strong style="color: #ffffff;">${name}</strong>,
        </p>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">
          Notamos que você começou seu cadastro em <strong style="color: #f1f5f9;">${formTitle}</strong> mas ainda não finalizou.
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
          Falta pouco! Continue de onde parou e garanta sua vaga.
        </p>
      `)}
      ${ctaButton(formUrl, "Continuar Cadastro")}
    `);
  }

  if (variation === 2) {
    return emailWrapper(`
      ${headerBlock("🏠", "Não perca essa oportunidade!", formTitle)}
      ${cardBlock(`
        <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
          Olá <strong style="color: #ffffff;">${name}</strong>,
        </p>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">
          Seu cadastro em <strong style="color: #f1f5f9;">${formTitle}</strong> ainda está incompleto. As vagas são limitadas!
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
          Finalize agora e dê o próximo passo rumo ao seu novo apartamento.
        </p>
      `)}
      ${ctaButton(formUrl, "Finalizar Agora", "#f59e0b")}
    `);
  }

  // variation 3
  return emailWrapper(`
    ${headerBlock("⏰", "Lembrete: finalize seu cadastro", formTitle)}
    ${cardBlock(`
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Olá <strong style="color: #ffffff;">${name}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 12px; line-height: 1.6;">
        Este é um lembrete amigável: seu cadastro em <strong style="color: #f1f5f9;">${formTitle}</strong> ainda não foi concluído.
      </p>
      <p style="color: #94a3b8; font-size: 14px; margin: 0; line-height: 1.6;">
        Complete seu cadastro para que possamos prosseguir com o atendimento.
      </p>
    `)}
    ${ctaButton(formUrl, "Completar Cadastro")}
  `);
}

function getCadenceSubject(sequenceNumber: number): string {
  const variation = ((sequenceNumber - 1) % 3) + 1;
  switch (variation) {
    case 1: return "Seu cadastro está quase pronto!";
    case 2: return "Não perca essa oportunidade!";
    case 3:
    default: return "Lembrete: finalize seu cadastro";
  }
}

export async function sendCadenceEmail(params: CadenceEmailParams): Promise<boolean> {
  const { to, clientName, formTitle, formUrl, sequenceNumber, totalInSequence } = params;
  const variation = ((sequenceNumber - 1) % 3) + 1;
  const subject = `${getCadenceSubject(sequenceNumber)} — ${formTitle}`;
  const html = buildCadenceHtml(variation, clientName || "Olá", formTitle, formUrl);

  const result = await sendHtmlEmail({ to, subject, html });

  if (result) {
    console.log(`[Email] Cadence ${sequenceNumber}/${totalInSequence} sent to ${to}`);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 6: CADÊNCIA DE REPROVAÇÃO (precisa corrigir)
   ═══════════════════════════════════════════════════════════════ */

export interface RejectionCadenceEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
  reason: string;
  sequenceNumber: number;
  totalInSequence: number;
}

function buildRejectionCadenceHtml(variation: number, clientName: string, formTitle: string, formUrl: string, reason: string): string {
  const name = clientName || "Olá";

  if (variation === 1) {
    return emailWrapper(`
      ${headerBlock("🔧", "Ajuste necessário no seu cadastro", formTitle)}
      ${cardBlock(`
        <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
          Olá <strong style="color: #ffffff;">${name}</strong>,
        </p>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Precisamos de uma correção no seu cadastro em <strong style="color: #f1f5f9;">${formTitle}</strong>:
        </p>
        <div style="background: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; padding: 14px 16px; border-radius: 0 8px 8px 0;">
          <p style="color: #fca5a5; font-size: 14px; margin: 0; line-height: 1.5;">${reason}</p>
        </div>
      `)}
      ${ctaButton(formUrl, "Corrigir Cadastro", "#ef4444")}
    `);
  }

  if (variation === 2) {
    return emailWrapper(`
      ${headerBlock("✨", "Seu cadastro está quase aprovado!", formTitle)}
      ${cardBlock(`
        <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
          Olá <strong style="color: #ffffff;">${name}</strong>,
        </p>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
          Falta apenas um ajuste para aprovarmos seu cadastro em <strong style="color: #f1f5f9;">${formTitle}</strong>:
        </p>
        <div style="background: rgba(245,158,11,0.08); border-left: 3px solid #f59e0b; padding: 14px 16px; border-radius: 0 8px 8px 0;">
          <p style="color: #fcd34d; font-size: 14px; margin: 0; line-height: 1.5;">${reason}</p>
        </div>
      `)}
      ${ctaButton(formUrl, "Ajustar Agora", "#f59e0b")}
    `);
  }

  // variation 3
  return emailWrapper(`
    ${headerBlock("⚡", "Não perca sua vaga!", formTitle)}
    ${cardBlock(`
      <p style="color: #f1f5f9; font-size: 16px; margin: 0 0 16px; line-height: 1.6;">
        Olá <strong style="color: #ffffff;">${name}</strong>,
      </p>
      <p style="color: #cbd5e1; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
        Seu cadastro em <strong style="color: #f1f5f9;">${formTitle}</strong> precisa de uma correção para ser aprovado:
      </p>
      <div style="background: rgba(239,68,68,0.08); border-left: 3px solid #ef4444; padding: 14px 16px; border-radius: 0 8px 8px 0;">
        <p style="color: #fca5a5; font-size: 14px; margin: 0; line-height: 1.5;">${reason}</p>
      </div>
      <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0; line-height: 1.5;">
        Corrija o quanto antes para garantir sua vaga.
      </p>
    `)}
    ${ctaButton(formUrl, "Corrigir e Garantir Vaga", "#ef4444")}
  `);
}

function getRejectionCadenceSubject(sequenceNumber: number): string {
  const variation = ((sequenceNumber - 1) % 3) + 1;
  switch (variation) {
    case 1: return "Lembrete: ajuste necessário no seu cadastro";
    case 2: return "Seu cadastro está quase aprovado!";
    case 3:
    default: return "Não perca sua vaga — corrija seu cadastro";
  }
}

export async function sendRejectionCadenceEmail(params: RejectionCadenceEmailParams): Promise<boolean> {
  const { to, clientName, formTitle, formUrl, reason, sequenceNumber, totalInSequence } = params;
  const variation = ((sequenceNumber - 1) % 3) + 1;
  const subject = getRejectionCadenceSubject(sequenceNumber);
  const html = buildRejectionCadenceHtml(variation, clientName || "Olá", formTitle, formUrl, reason);

  const result = await sendHtmlEmail({ to, subject, html });

  if (result) {
    console.log(`[Email] Rejection cadence ${sequenceNumber}/${totalInSequence} sent to ${to}`);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   LEGACY: Follow-up Email (simple, single send)
   Kept for backwards compatibility
   ═══════════════════════════════════════════════════════════════ */

export interface FollowUpEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
}

export async function sendFollowUpEmail(params: FollowUpEmailParams): Promise<boolean> {
  return sendCadenceEmail({
    ...params,
    sequenceNumber: 1,
    totalInSequence: 1,
  });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL: Weekly Summary Report for Admin
   Sent every Monday at 9am BRT with weekly statistics.
   ═══════════════════════════════════════════════════════════════ */

import type { WeeklyStats } from "./db";

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function buildWeeklySummaryHtml(stats: WeeklyStats): string {
  const periodStr = `${formatDate(stats.period.start)} — ${formatDate(stats.period.end)}`;

  const corretorRows = stats.corretores.length > 0
    ? stats.corretores.map((c, i) => `
        <tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 12px 16px; color: #94a3b8; font-size: 14px;">${i + 1}</td>
          <td style="padding: 12px 16px; color: #f1f5f9; font-size: 14px; font-weight: 500;">${c.name}</td>
          <td style="padding: 12px 16px; color: #f1f5f9; font-size: 14px; text-align: center;">${c.validationsCount}</td>
          <td style="padding: 12px 16px; color: #22c55e; font-size: 14px; text-align: center;">${c.approvedCount}</td>
          <td style="padding: 12px 16px; color: #ef4444; font-size: 14px; text-align: center;">${c.rejectedCount}</td>
        </tr>
      `).join("")
    : `<tr><td colspan="5" style="padding: 24px; text-align: center; color: #64748b; font-size: 14px;">Nenhum corretor ativo no período</td></tr>`;

  return emailWrapper(`
    ${headerBlock("📊", "Resumo Semanal", `One Innovation — ${periodStr}`)}

    <!-- Stats Cards -->
    <div style="margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: separate; border-spacing: 8px;">
        <tr>
          <td style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 20px; text-align: center; width: 50%;">
            <div style="color: #3b82f6; font-size: 32px; font-weight: 800; line-height: 1;">${stats.responses.total}</div>
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;">Total Respostas</div>
          </td>
          <td style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 20px; text-align: center; width: 50%;">
            <div style="color: #22c55e; font-size: 32px; font-weight: 800; line-height: 1;">+${stats.responses.newThisWeek}</div>
            <div style="color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px;">Novas esta semana</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Validation Stats -->
    ${cardBlock(`
      <h2 style="color: #f1f5f9; font-size: 16px; font-weight: 600; margin: 0 0 16px;">Validações da Semana</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="text-align: center; padding: 8px;">
            <div style="color: #f1f5f9; font-size: 28px; font-weight: 700;">${stats.validation.totalValidated}</div>
            <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Validadas</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="color: #22c55e; font-size: 28px; font-weight: 700;">${stats.validation.approvalRate}%</div>
            <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Aprovação</div>
          </td>
          <td style="text-align: center; padding: 8px;">
            <div style="color: #ef4444; font-size: 28px; font-weight: 700;">${stats.validation.rejectionRate}%</div>
            <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Reprovação</div>
          </td>
        </tr>
      </table>
    `)}

    <!-- Status Breakdown -->
    ${cardBlock(`
      <h2 style="color: #f1f5f9; font-size: 16px; font-weight: 600; margin: 0 0 16px;">Status das Respostas</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #22c55e; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
            <span style="color: #cbd5e1; font-size: 14px;">Aprovadas</span>
          </td>
          <td style="text-align: right; padding: 8px 0;"><span style="color: #f1f5f9; font-size: 14px; font-weight: 600;">${stats.responses.approved}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #ef4444; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
            <span style="color: #cbd5e1; font-size: 14px;">Reprovadas</span>
          </td>
          <td style="text-align: right; padding: 8px 0;"><span style="color: #f1f5f9; font-size: 14px; font-weight: 600;">${stats.responses.rejected}</span></td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; background: #f59e0b; border-radius: 50%; margin-right: 8px; vertical-align: middle;"></span>
            <span style="color: #cbd5e1; font-size: 14px;">Pendentes</span>
          </td>
          <td style="text-align: right; padding: 8px 0;"><span style="color: #f1f5f9; font-size: 14px; font-weight: 600;">${stats.responses.pending}</span></td>
        </tr>
      </table>
    `)}

    <!-- Corretores Ranking -->
    ${cardBlock(`
      <h2 style="color: #f1f5f9; font-size: 16px; font-weight: 600; margin: 0 0 16px;">🏆 Ranking de Corretores</h2>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #1e293b;">
            <th style="padding: 8px 16px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left;">#</th>
            <th style="padding: 8px 16px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: left;">Corretor</th>
            <th style="padding: 8px 16px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">Total</th>
            <th style="padding: 8px 16px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">✓</th>
            <th style="padding: 8px 16px; color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; text-align: center;">✗</th>
          </tr>
        </thead>
        <tbody>
          ${corretorRows}
        </tbody>
      </table>
    `)}

    <!-- Formulários -->
    ${cardBlock(`
      <h2 style="color: #f1f5f9; font-size: 16px; font-weight: 600; margin: 0 0 12px;">Formulários</h2>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 4px 0;"><span style="color: #cbd5e1; font-size: 14px;">Total de formulários</span></td>
          <td style="text-align: right;"><span style="color: #f1f5f9; font-size: 14px; font-weight: 600;">${stats.forms.totalForms}</span></td>
        </tr>
        <tr>
          <td style="padding: 4px 0;"><span style="color: #cbd5e1; font-size: 14px;">Publicados</span></td>
          <td style="text-align: right;"><span style="color: #22c55e; font-size: 14px; font-weight: 600;">${stats.forms.totalPublished}</span></td>
        </tr>
      </table>
    `)}
  `);
}

export async function sendWeeklySummaryEmail(params: {
  to: string;
  stats: WeeklyStats;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const periodStr = `${formatDate(params.stats.period.start)} — ${formatDate(params.stats.period.end)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [params.to],
      subject: `📊 Resumo Semanal — ${periodStr} | ${params.stats.responses.newThisWeek} novas respostas`,
      html: buildWeeklySummaryHtml(params.stats),
    });

    if (error) {
      console.error("[Email] Weekly summary send error:", error);
      return false;
    }
    console.log(`[Email] Weekly summary sent to ${params.to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Weekly summary failed:", (err as Error).message);
    return false;
  }
}

// Export for testing
export { buildWeeklySummaryHtml };
