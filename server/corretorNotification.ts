/**
 * Corretor Notification Service — One Innovation Design
 * Now uses Resend Templates for visual editing in the Resend dashboard.
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

const TEMPLATE_ID = "164cfd9d-0780-4c4d-9841-59f2693d0552";
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

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [corretorEmail],
      subject: `Novo cadastro: ${protocolCode} — ${formTitle}`,
      template: {
        id: TEMPLATE_ID,
        variables: {
          CORRETOR_NAME: corretorName,
          FORM_TITLE: formTitle,
          PROTOCOL_CODE: protocolCode,
          RESPONDENT_NAME: respondentName || "Não informado",
          RESPONDENT_EMAIL: respondentEmail || "Não informado",
          RESPONDENT_PHONE: respondentPhone || "Não informado",
          SUBMITTED_AT: dateStr,
        },
      },
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
