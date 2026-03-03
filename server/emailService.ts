/**
 * Email Service — One Innovation Design System
 * Now uses Resend Templates for all emails.
 * Templates can be edited visually in the Resend dashboard.
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

/* ─── Template IDs from Resend ─── */
const TEMPLATE_IDS = {
  INVITE_STAFF: "41d689fb-2ed7-469a-9e3d-6204085bd5bc",
  PROTOCOL_PENDING: "1d4c3ca1-026d-42ef-83c7-3b37cedcb802",
  APPROVAL: "bd17dc65-aa61-4ba9-8444-4f9baa841c2e",
  REJECTION: "9a49a11e-5022-4e3d-bf2b-cdeb80e13ac9",
  CADENCE_ABANDONO_V1: "dd26aab4-fdf6-4d3f-97f3-5915686d4a67",
  CADENCE_ABANDONO_V2: "9cb9b98c-7330-4280-9f15-258cbaaeca48",
  CADENCE_ABANDONO_V3: "0d780f6f-08cf-45d6-9f7c-bf8afeb58358",
  CADENCE_REJECTION_V1: "73360690-8866-4c88-9a65-b8dc053c1ef1",
  CADENCE_REJECTION_V2: "7771cbf0-4b04-4254-824a-21ac3440a1ed",
  CADENCE_REJECTION_V3: "ac1d6bb6-499e-4ab1-8794-62518cc7e0bd",
  CORRETOR_NOTIFICATION: "164cfd9d-0780-4c4d-9841-59f2693d0552",
} as const;

const FROM_EMAIL = "one@cadastrodigital.com.br";
const FROM_NAME = "One Innovation";

/**
 * Generic helper to send an email using a Resend template.
 * Uses the official Resend `template` parameter with `id` and `variables`.
 * See: https://resend.com/docs/api-reference/emails/send-email
 */
async function sendTemplateEmail(params: {
  templateId: string;
  to: string;
  subject: string;
  data: Record<string, string>;
}): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [params.to],
      subject: params.subject,
      template: {
        id: params.templateId,
        variables: params.data,
      },
    } as any);

    if (error) {
      console.error("[Email] Template send error:", error);
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
    templateId: TEMPLATE_IDS.INVITE_STAFF,
    to,
    subject: `Bem-vindo(a) à One Innovation — ${inviterName} convidou você`,
    data: {
      INVITEE_NAME: inviteeName || "Olá",
      INVITER_NAME: inviterName,
      ROLE_DISPLAY: roleDisplay,
      INVITE_URL: inviteUrl,
    },
  });
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

  return sendTemplateEmail({
    templateId: TEMPLATE_IDS.PROTOCOL_PENDING,
    to,
    subject: `Protocolo ${protocolCode} — Cadastro recebido com sucesso`,
    data: {
      CLIENT_NAME: respondentName || "Olá",
      PROTOCOL_CODE: protocolCode,
      FORM_TITLE: formTitle,
    },
  });
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

  return sendTemplateEmail({
    templateId: TEMPLATE_IDS.APPROVAL,
    to,
    subject: `Parabéns, ${clientName}! Seu cadastro foi aprovado! 🎉`,
    data: {
      CLIENT_NAME: clientName,
    },
  });
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

  return sendTemplateEmail({
    templateId: TEMPLATE_IDS.REJECTION,
    to,
    subject: `Atenção: Revisão necessária no seu cadastro`,
    data: {
      CLIENT_NAME: clientName,
      REASON: reason,
      FORM_URL: formUrl || "",
    },
  });
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
  /** Which email in the cadence sequence (1-based) */
  sequenceNumber: number;
  /** Total emails in the cadence */
  totalInSequence: number;
}

/**
 * Get the cadence template ID and subject based on sequence number.
 * Rotates between 3 different templates for variety.
 */
function getCadenceTemplate(sequenceNumber: number): {
  templateId: string;
  subject: string;
} {
  const variation = ((sequenceNumber - 1) % 3) + 1;

  switch (variation) {
    case 1:
      return {
        templateId: TEMPLATE_IDS.CADENCE_ABANDONO_V1,
        subject: "Seu cadastro está quase pronto!",
      };
    case 2:
      return {
        templateId: TEMPLATE_IDS.CADENCE_ABANDONO_V2,
        subject: "Não perca essa oportunidade!",
      };
    case 3:
    default:
      return {
        templateId: TEMPLATE_IDS.CADENCE_ABANDONO_V3,
        subject: "Lembrete: finalize seu cadastro",
      };
  }
}

export async function sendCadenceEmail(params: CadenceEmailParams): Promise<boolean> {
  const { to, clientName, formTitle, formUrl, sequenceNumber, totalInSequence } = params;
  const template = getCadenceTemplate(sequenceNumber);

  const result = await sendTemplateEmail({
    templateId: template.templateId,
    to,
    subject: `${template.subject} — ${formTitle}`,
    data: {
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

function getRejectionCadenceTemplate(sequenceNumber: number): {
  templateId: string;
  subject: string;
} {
  const variation = ((sequenceNumber - 1) % 3) + 1;

  switch (variation) {
    case 1:
      return {
        templateId: TEMPLATE_IDS.CADENCE_REJECTION_V1,
        subject: "Lembrete: ajuste necessário no seu cadastro",
      };
    case 2:
      return {
        templateId: TEMPLATE_IDS.CADENCE_REJECTION_V2,
        subject: "Seu cadastro está quase aprovado!",
      };
    case 3:
    default:
      return {
        templateId: TEMPLATE_IDS.CADENCE_REJECTION_V3,
        subject: "Não perca sua vaga — corrija seu cadastro",
      };
  }
}

export async function sendRejectionCadenceEmail(params: RejectionCadenceEmailParams): Promise<boolean> {
  const { to, clientName, formTitle, formUrl, reason, sequenceNumber, totalInSequence } = params;
  const template = getRejectionCadenceTemplate(sequenceNumber);

  const result = await sendTemplateEmail({
    templateId: template.templateId,
    to,
    subject: template.subject,
    data: {
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
