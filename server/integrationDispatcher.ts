/**
 * Integration Dispatcher — fires webhook/integrations when a response is submitted.
 * Called from the responses.submit procedure after the response is persisted.
 *
 * Supported integrations:
 * - Webhook (generic URL)
 * - Google Sheets (append row via Sheets API v4 with service account)
 * - CRM Manus (POST to webhook URL)
 * - RD Station (conversion API)
 * - Email notification (via Resend)
 * - WhatsApp notification (via wa.me link — logged only)
 */

import { ENV } from "./_core/env";

// ─── Types ───

interface WebhookSettings {
  enabled: boolean;
  url: string;
  method: "POST" | "PUT";
  headers: { key: string; value: string }[];
  sendOnComplete: boolean;
  sendOnPartial: boolean;
  integrations?: {
    rdStation?: { enabled: boolean; apiToken: string; conversionIdentifier: string };
    whatsapp?: { enabled: boolean; phoneNumber: string; message: string };
    email?: { enabled: boolean; recipients: string; subject: string };
    googleSheets?: { enabled: boolean; spreadsheetUrl: string; sheetName: string };
    crmManus?: { enabled: boolean; webhookUrl: string; funnelName: string; stageName: string };
  };
  tracking?: {
    gtm?: { enabled: boolean; containerId: string };
    googleAnalytics?: { enabled: boolean; measurementId: string };
    facebookPixel?: { enabled: boolean; pixelId: string };
    tiktokPixel?: { enabled: boolean; pixelId: string };
  };
}

interface DispatchPayload {
  formId: number;
  formTitle: string;
  responseId: number;
  protocolCode: string | null;
  respondentName: string | null;
  respondentEmail: string | null;
  answers: Record<string, any>;
  questions: any[];
  isComplete: boolean;
  submittedAt: string;
}

interface IntegrationResult {
  integration: string;
  success: boolean;
  error?: string;
}

// ─── Main Dispatcher ───

export async function dispatchIntegrations(
  webhook: WebhookSettings | null | undefined,
  payload: DispatchPayload
): Promise<IntegrationResult[]> {
  if (!webhook) return [];

  const results: IntegrationResult[] = [];
  const shouldFire = payload.isComplete ? webhook.sendOnComplete : webhook.sendOnPartial;

  // 1. Generic Webhook
  if (webhook.enabled && webhook.url && shouldFire) {
    results.push(await fireWebhook(webhook, payload));
  }

  const integrations = webhook.integrations;
  if (!integrations) return results;

  // 2. Google Sheets
  if (integrations.googleSheets?.enabled && integrations.googleSheets.spreadsheetUrl && shouldFire) {
    results.push(await fireGoogleSheets(integrations.googleSheets, payload));
  }

  // 3. CRM Manus
  if (integrations.crmManus?.enabled && integrations.crmManus.webhookUrl && shouldFire) {
    results.push(await fireCrmManus(integrations.crmManus, payload));
  }

  // 4. RD Station
  if (integrations.rdStation?.enabled && integrations.rdStation.apiToken && shouldFire) {
    results.push(await fireRdStation(integrations.rdStation, payload));
  }

  // 5. Email notification
  if (integrations.email?.enabled && integrations.email.recipients && shouldFire) {
    results.push(await fireEmailNotification(integrations.email, payload));
  }

  // 6. WhatsApp notification (log only — opens wa.me link on client side)
  if (integrations.whatsapp?.enabled && integrations.whatsapp.phoneNumber && shouldFire) {
    results.push({
      integration: "whatsapp",
      success: true,
      error: undefined,
    });
  }

  return results;
}

// ─── Generic Webhook ───

async function fireWebhook(
  webhook: WebhookSettings,
  payload: DispatchPayload
): Promise<IntegrationResult> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "FormFlow-Webhook/1.0",
    };
    for (const h of webhook.headers) {
      if (h.key && h.value) headers[h.key] = h.value;
    }

    const body = {
      event: payload.isComplete ? "form.completed" : "form.partial",
      form_id: payload.formId,
      form_title: payload.formTitle,
      response_id: payload.responseId,
      protocol_code: payload.protocolCode,
      submitted_at: payload.submittedAt,
      respondent: {
        name: payload.respondentName,
        email: payload.respondentEmail,
      },
      answers: formatAnswersForWebhook(payload.answers, payload.questions),
    };

    const response = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { integration: "webhook", success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    return { integration: "webhook", success: true };
  } catch (err) {
    return { integration: "webhook", success: false, error: (err as Error).message };
  }
}

// ─── Google Sheets ───

async function fireGoogleSheets(
  config: { spreadsheetUrl: string; sheetName: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  try {
    // Extract spreadsheet ID from URL
    const match = config.spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return { integration: "googleSheets", success: false, error: "URL da planilha inválida" };
    }
    const spreadsheetId = match[1];
    const sheetName = config.sheetName || "Respostas";

    // Build row data: [timestamp, protocol, name, email, ...answers]
    const row: string[] = [
      new Date(payload.submittedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      payload.protocolCode || "",
      payload.respondentName || "",
      payload.respondentEmail || "",
    ];

    // Add answers in question order
    for (const q of payload.questions) {
      if (q.type === "welcome-screen" || q.type === "thank-you-screen") continue;
      const answer = payload.answers[q.id];
      if (answer === undefined || answer === null) {
        row.push("");
      } else if (typeof answer === "object") {
        row.push(JSON.stringify(answer));
      } else {
        row.push(String(answer));
      }
    }

    // Use Google Sheets API v4 via service account or API key
    // For now, we use the Manus built-in data API to append rows
    const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A:Z:append?valueInputOption=USER_ENTERED`;

    // Try using built-in forge API as proxy
    const forgeUrl = ENV.forgeApiUrl;
    const forgeKey = ENV.forgeApiKey;

    if (forgeUrl && forgeKey) {
      // Use Manus data API to call Google Sheets
      const response = await fetch(`${forgeUrl}/v1/data_api/google_sheets/append`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${forgeKey}`,
        },
        body: JSON.stringify({
          spreadsheet_id: spreadsheetId,
          sheet_name: sheetName,
          values: [row],
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return { integration: "googleSheets", success: false, error: `API ${response.status}: ${text.substring(0, 200)}` };
      }

      return { integration: "googleSheets", success: true };
    }

    return { integration: "googleSheets", success: false, error: "Google Sheets API não configurada" };
  } catch (err) {
    return { integration: "googleSheets", success: false, error: (err as Error).message };
  }
}

// ─── CRM Manus ───

async function fireCrmManus(
  config: { webhookUrl: string; funnelName: string; stageName: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  try {
    // Find name, email, phone from answers
    const contact = extractContactInfo(payload.answers, payload.questions);

    const body = {
      event: "new_lead",
      source: "formflow",
      form_id: payload.formId,
      form_title: payload.formTitle,
      protocol_code: payload.protocolCode,
      funnel_name: config.funnelName || payload.formTitle,
      stage_name: config.stageName || "Novo",
      contact: {
        name: payload.respondentName || contact.name || "",
        email: payload.respondentEmail || contact.email || "",
        phone: contact.phone || "",
      },
      answers: formatAnswersForWebhook(payload.answers, payload.questions),
      submitted_at: payload.submittedAt,
    };

    const response = await fetch(config.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "FormFlow-CRM/1.0",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { integration: "crmManus", success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }

    return { integration: "crmManus", success: true };
  } catch (err) {
    return { integration: "crmManus", success: false, error: (err as Error).message };
  }
}

// ─── RD Station ───

async function fireRdStation(
  config: { apiToken: string; conversionIdentifier: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  try {
    const contact = extractContactInfo(payload.answers, payload.questions);

    const body = {
      event_type: "CONVERSION",
      event_family: "CDP",
      payload: {
        conversion_identifier: config.conversionIdentifier || payload.formTitle,
        name: payload.respondentName || contact.name || "",
        email: payload.respondentEmail || contact.email || "",
        mobile_phone: contact.phone || "",
        cf_form_title: payload.formTitle,
        cf_protocol_code: payload.protocolCode || "",
      },
    };

    const response = await fetch("https://api.rd.services/platform/conversions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { integration: "rdStation", success: false, error: `HTTP ${response.status}: ${text.substring(0, 200)}` };
    }

    return { integration: "rdStation", success: true };
  } catch (err) {
    return { integration: "rdStation", success: false, error: (err as Error).message };
  }
}

// ─── Email Notification ───

async function fireEmailNotification(
  config: { recipients: string; subject: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  try {
    const recipients = config.recipients.split(",").map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return { integration: "email", success: false, error: "Nenhum destinatário configurado" };
    }

    // Build HTML table of answers
    const rows = payload.questions
      .filter((q) => q.type !== "welcome-screen" && q.type !== "thank-you-screen")
      .map((q) => {
        const answer = payload.answers[q.id];
        const displayAnswer = answer === undefined || answer === null
          ? "-"
          : typeof answer === "object"
            ? JSON.stringify(answer)
            : String(answer);
        return `<tr><td style="padding:8px 12px;border:1px solid #e2e8f0;font-weight:600;">${q.title || q.id}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${displayAnswer}</td></tr>`;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1a1a2e;">Nova resposta: ${payload.formTitle}</h2>
        <p style="color:#666;">Protocolo: <strong>${payload.protocolCode || "N/A"}</strong></p>
        <p style="color:#666;">Respondente: <strong>${payload.respondentName || "Anônimo"}</strong> ${payload.respondentEmail ? `(${payload.respondentEmail})` : ""}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <thead><tr><th style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;">Pergunta</th><th style="padding:8px 12px;border:1px solid #e2e8f0;background:#f8fafc;text-align:left;">Resposta</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#999;font-size:12px;margin-top:16px;">Enviado automaticamente por Cadastro Digital</p>
      </div>
    `;

    // Use Resend API
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return { integration: "email", success: false, error: "RESEND_API_KEY não configurada" };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Cadastro Digital <noreply@cadastrodigital.manus.space>",
        to: recipients,
        subject: config.subject || `Nova resposta: ${payload.formTitle}`,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { integration: "email", success: false, error: `Resend ${response.status}: ${text.substring(0, 200)}` };
    }

    return { integration: "email", success: true };
  } catch (err) {
    return { integration: "email", success: false, error: (err as Error).message };
  }
}

// ─── Helpers ───

function formatAnswersForWebhook(answers: Record<string, any>, questions: any[]): Record<string, any> {
  const formatted: Record<string, any> = {};
  for (const q of questions) {
    if (q.type === "welcome-screen" || q.type === "thank-you-screen") continue;
    const key = q.title || q.id;
    formatted[key] = answers[q.id] ?? null;
  }
  return formatted;
}

function extractContactInfo(answers: Record<string, any>, questions: any[]): { name: string; email: string; phone: string } {
  let name = "";
  let email = "";
  let phone = "";

  for (const q of questions) {
    const answer = answers[q.id];
    if (!answer) continue;
    const answerStr = String(answer);

    // Match by question type
    if (q.type === "name" || q.type === "full-name") {
      name = answerStr;
    } else if (q.type === "email") {
      email = answerStr;
    } else if (q.type === "phone" || q.type === "phone-number") {
      phone = answerStr;
    }

    // Match by field label patterns
    const title = (q.title || "").toLowerCase();
    if (!name && (title.includes("nome") || title.includes("name"))) {
      name = answerStr;
    }
    if (!email && (title.includes("email") || title.includes("e-mail"))) {
      email = answerStr;
    }
    if (!phone && (title.includes("telefone") || title.includes("celular") || title.includes("phone") || title.includes("whatsapp"))) {
      phone = answerStr;
    }
  }

  return { name, email, phone };
}
