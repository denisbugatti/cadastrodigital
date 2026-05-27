/**
 * Email Service — One Innovation
 * Uses Resend templates (managed via Resend dashboard) for all transactional emails.
 * Templates are identified by alias and receive variables for dynamic content.
 * 
 * Template aliases:
 *   one-invite-staff          → Convite Staff
 *   one-protocol-pending      → Cadastro Pendente - Protocolo
 *   one-approval              → Cadastro Aprovado
 *   one-rejection             → Revisão Necessária
 *   one-cadence-abandono-v1/v2/v3  → Cadência Abandono (3 variações)
 *   one-cadence-rejection-v1/v2/v3 → Cadência Reprovação (3 variações)
 * 
 * Emails without a Resend template (sendFollowUpEmail, sendWeeklySummaryEmail) 
 * continue using inline HTML.
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
 * Map of template alias → Resend template UUID.
 * The Resend API requires the UUID (not the alias) in the `template.id` field.
 */
const TEMPLATE_IDS: Record<string, string> = {
  "one-invite-staff":          "41d689fb-2ed7-469a-9e3d-6204085bd5bc",
  "one-protocol-pending":      "1d4c3ca1-026d-42ef-83c7-3b37cedcb802",
  "one-approval":              "bd17dc65-aa61-4ba9-8444-4f9baa841c2e",
  "one-rejection":             "9a49a11e-5022-4e3d-bf2b-cdeb80e13ac9",
  "one-cadence-abandono-v1":   "dd26aab4-fdf6-4d3f-97f3-5915686d4a67",
  "one-cadence-abandono-v2":   "9cb9b98c-7330-4280-9f15-258cbaaeca48",
  "one-cadence-abandono-v3":   "0d780f6f-08cf-45d6-9f7c-bf8afeb58358",
  "one-cadence-rejection-v1":  "73360690-8866-4c88-9a65-b8dc053c1ef1",
  "one-cadence-rejection-v2":  "7771cbf0-4b04-4254-824a-21ac3440a1ed",
  "one-cadence-rejection-v3":  "ac1d6bb6-499e-4ab1-8794-62518cc7e0bd",
  "one-corretor-notification": "164cfd9d-0780-4c4d-9841-59f2693d0552",
};

/**
 * Send an email using a Resend template (by alias → resolved to UUID).
 */
async function sendTemplateEmail(params: {
  to: string;
  subject: string;
  templateAlias: string;
  variables: Record<string, string>;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const templateId = TEMPLATE_IDS[params.templateAlias];
  if (!templateId) {
    console.error(`[Email] Unknown template alias: '${params.templateAlias}'. Add it to TEMPLATE_IDS map.`);
    return false;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [params.to],
      subject: params.subject,
      template: {
        id: templateId,
        variables: params.variables,
      },
    } as any);

    if (error) {
      console.error(`[Email] Template send error for '${params.templateAlias}':`, error);
      return false;
    }
    console.log(`[Email] Sent template '${params.templateAlias}' to ${params.to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Template send failed:", (err as Error).message);
    return false;
  }
}

/**
 * Fallback: send an email with inline HTML (for emails without Resend templates).
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

/* ═══════════════════════════════════════════════════════════════
   EMAIL 1: CONVITE PARA CORRETORES/GERENTES (Boas-vindas)
   Template: one-invite-staff
   Variables: INVITEE_NAME, INVITER_NAME, ROLE_DISPLAY, INVITE_URL
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

  return sendTemplateEmail({
    to,
    subject: `Bem-vindo(a) à One Innovation — ${inviterName} convidou você`,
    templateAlias: "one-invite-staff",
    variables: {
      INVITEE_NAME: inviteeName || "Olá",
      INVITER_NAME: inviterName,
      ROLE_DISPLAY: roleDisplay,
      INVITE_URL: inviteUrl,
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 2: CADASTRO COMPLETO — PENDENTE DE APROVAÇÃO
   Template: one-protocol-pending
   Variables: CLIENT_NAME, PROTOCOL_CODE, FORM_TITLE
   ═══════════════════════════════════════════════════════════════ */

export interface ProtocolEmailParams {
  to: string;
  respondentName?: string;
  protocolCode: string;
  formTitle: string;
}

export async function sendProtocolEmail(params: ProtocolEmailParams): Promise<boolean> {
  const { to, respondentName, protocolCode } = params;

  // Always use "One Innovation" — the client registered with One Innovation,
  // not with the specific form/corretor name.
  return sendTemplateEmail({
    to,
    subject: `Protocolo ${protocolCode} — Cadastro recebido com sucesso`,
    templateAlias: "one-protocol-pending",
    variables: {
      CLIENT_NAME: respondentName || "Olá",
      PROTOCOL_CODE: protocolCode,
      FORM_TITLE: "One Innovation",
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 3: CADASTRO APROVADO — PARABÉNS!
   Template: one-approval
   Variables: CLIENT_NAME
   ═══════════════════════════════════════════════════════════════ */

export interface ApprovalEmailParams {
  to: string;
  clientName: string;
}

export async function sendApprovalEmail(params: ApprovalEmailParams): Promise<boolean> {
  const { to, clientName } = params;

  return sendTemplateEmail({
    to,
    subject: `Parabéns, ${clientName}! Seu cadastro foi aprovado!`,
    templateAlias: "one-approval",
    variables: {
      CLIENT_NAME: clientName,
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 4: REENVIO DE DOCUMENTO / CORREÇÃO DE DADOS
   Template: one-rejection
   Variables: CLIENT_NAME, REASON, FORM_URL
   ═══════════════════════════════════════════════════════════════ */

export interface RejectionEmailParams {
  to: string;
  clientName: string;
  reason: string;
  formUrl?: string;
}

export async function sendRejectionEmail(params: RejectionEmailParams): Promise<boolean> {
  const { to, clientName, reason, formUrl } = params;

  return sendTemplateEmail({
    to,
    subject: `Atenção: Revisão necessária no seu cadastro`,
    templateAlias: "one-rejection",
    variables: {
      CLIENT_NAME: clientName,
      REASON: reason,
      FORM_URL: formUrl || "",
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 5: CADÊNCIA DE ABANDONO (cadastro incompleto)
   Templates: one-cadence-abandono-v1, v2, v3
   Variables: CLIENT_NAME, FORM_TITLE, FORM_URL
   ═══════════════════════════════════════════════════════════════ */

export interface CadenceEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
  sequenceNumber: number;
  totalInSequence: number;
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
  const templateAlias = `one-cadence-abandono-v${variation}`;
  const subject = `${getCadenceSubject(sequenceNumber)} — ${formTitle}`;

  const result = await sendTemplateEmail({
    to,
    subject,
    templateAlias,
    variables: {
      CLIENT_NAME: clientName || "Olá",
      FORM_TITLE: formTitle,
      FORM_URL: formUrl,
    },
  });

  if (result) {
    console.log(`[Email] Cadence ${sequenceNumber}/${totalInSequence} sent to ${to}`);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 6: CADÊNCIA DE REPROVAÇÃO (precisa corrigir)
   Templates: one-cadence-rejection-v1, v2, v3
   Variables: CLIENT_NAME, FORM_TITLE, FORM_URL, REASON
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
  const templateAlias = `one-cadence-rejection-v${variation}`;
  const subject = getRejectionCadenceSubject(sequenceNumber);

  const result = await sendTemplateEmail({
    to,
    subject,
    templateAlias,
    variables: {
      CLIENT_NAME: clientName || "Olá",
      FORM_TITLE: formTitle,
      FORM_URL: formUrl,
      REASON: reason,
    },
  });

  if (result) {
    console.log(`[Email] Rejection cadence ${sequenceNumber}/${totalInSequence} sent to ${to}`);
  }
  return result;
}

/* ═══════════════════════════════════════════════════════════════
   LEGACY: Follow-up Email (delegates to cadence v1)
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
   No Resend template — uses inline HTML.
   ═══════════════════════════════════════════════════════════════ */

import type { WeeklyStats } from "./db";

function formatDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ─── Shared HTML wrapper (only for weekly report) ─── */
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

function cardBlock(content: string): string {
  return `
    <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      ${content}
    </div>`;
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

/* ═══════════════════════════════════════════════════════════════
   EMAIL: RECUPERAÇÃO DE SENHA
   Uses inline HTML (no Resend template needed)
   ═══════════════════════════════════════════════════════════════ */

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const { to, name, resetUrl } = params;

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f1117;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1d2e;border-radius:16px;overflow:hidden;max-width:600px;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:40px 40px 30px;text-align:center;">
          <div style="font-size:40px;margin-bottom:12px;">🔐</div>
          <h1 style="color:#ffffff;font-size:24px;font-weight:700;margin:0;">Redefinição de Senha</h1>
          <p style="color:#93c5fd;font-size:14px;margin:8px 0 0;">Cadastro Digital — One Innovation</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <p style="color:#e2e8f0;font-size:16px;margin:0 0 16px;">Olá, <strong>${name}</strong>!</p>
          <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#2563eb);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:10px;letter-spacing:0.5px;">Redefinir Senha</a>
          </td></tr></table>
          <div style="background:#0f1117;border-radius:10px;padding:16px;margin-bottom:24px;">
            <p style="color:#64748b;font-size:13px;margin:0 0 8px;">Ou copie e cole este link no seu navegador:</p>
            <p style="color:#60a5fa;font-size:12px;word-break:break-all;margin:0;">${resetUrl}</p>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.5;margin:0;">
            ⚠️ Este link expira em <strong style="color:#fbbf24;">30 minutos</strong>. Se você não solicitou a redefinição de senha, ignore este email — sua senha permanece a mesma.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#111827;padding:24px 40px;text-align:center;border-top:1px solid #1e293b;">
          <p style="color:#475569;font-size:12px;margin:0;">One Innovation • Plataforma Cadastro Digital</p>
          <p style="color:#374151;font-size:11px;margin:6px 0 0;">Este é um email automático, não responda.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return sendHtmlEmail({
    to,
    subject: `🔐 Redefinição de senha — Cadastro Digital`,
    html,
  });
}

// Export for testing
export { sendTemplateEmail, sendHtmlEmail, buildWeeklySummaryHtml };
