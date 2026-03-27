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
 *
 * Features:
 * - Logs every dispatch attempt to integration_logs table
 * - Automatic retry with exponential backoff for temporary failures
 * - Manual retry via tRPC endpoint
 */

import { ENV } from "./_core/env";
import * as db from "./db";

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
    googleSheets?: {
      enabled: boolean;
      spreadsheetUrl: string;
      sheetName: string;
      serviceAccountJson?: string;
      serviceAccountEmail?: string;
    };
    crmManus?: { enabled: boolean; webhookUrl: string; funnelName: string; stageName: string };
  };
  tracking?: {
    gtm?: { enabled: boolean; containerId: string };
    googleAnalytics?: { enabled: boolean; measurementId: string };
    facebookPixel?: { enabled: boolean; pixelId: string };
    tiktokPixel?: { enabled: boolean; pixelId: string };
  };
}

export interface DispatchPayload {
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

export interface IntegrationResult {
  integration: string;
  success: boolean;
  error?: string;
  httpStatus?: number;
  durationMs?: number;
  logId?: number;
}

// ─── Retry Configuration ───

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [60_000, 300_000, 900_000]; // 1min, 5min, 15min

function getNextRetryAt(retryCount: number): Date | null {
  if (retryCount >= MAX_RETRIES) return null;
  const delayMs = RETRY_DELAYS_MS[retryCount] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
  return new Date(Date.now() + delayMs);
}

/**
 * Determine if an error is temporary (worth retrying).
 */
function isTemporaryError(error: string, httpStatus?: number): boolean {
  if (httpStatus && httpStatus >= 500) return true; // Server errors
  if (httpStatus === 429) return true; // Rate limited
  if (httpStatus === 408) return true; // Timeout
  const tempPatterns = [
    "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "ENETUNREACH",
    "socket hang up", "network", "timeout", "ENOTFOUND",
    "fetch failed", "AbortError",
  ];
  const lowerErr = error.toLowerCase();
  return tempPatterns.some((p) => lowerErr.includes(p.toLowerCase()));
}

// ─── Logging Helper ───

async function logIntegration(
  formId: number,
  responseId: number,
  integrationType: string,
  result: { success: boolean; error?: string; httpStatus?: number; durationMs?: number },
  requestPayload?: Record<string, any>,
  responseBody?: string,
): Promise<number | null> {
  try {
    const isRetryable = !result.success && result.error && isTemporaryError(result.error, result.httpStatus);
    const status = result.success ? "success" : (isRetryable ? "retrying" : "failure");
    const nextRetryAt = isRetryable ? getNextRetryAt(0) : null;

    const log = await db.createIntegrationLog({
      formId,
      responseId,
      integrationType,
      status,
      httpStatus: result.httpStatus,
      errorMessage: result.error,
      requestPayload: requestPayload ? { ...requestPayload, _truncated: true } : undefined,
      responseBody: responseBody?.substring(0, 2000),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      nextRetryAt: nextRetryAt ?? undefined,
      durationMs: result.durationMs,
    });
    return log.id;
  } catch (err) {
    console.warn("[IntegrationLog] Failed to log:", (err as Error)?.message?.substring(0, 200));
    return null;
  }
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
    const result = await fireWebhook(webhook, payload);
    const logId = await logIntegration(
      payload.formId, payload.responseId, "webhook", result,
      { url: webhook.url, method: webhook.method },
    );
    results.push({ ...result, logId: logId ?? undefined });
  }

  const integrations = webhook.integrations;
  if (!integrations) return results;

  // 2. Google Sheets
  if (integrations.googleSheets?.enabled && integrations.googleSheets.spreadsheetUrl && shouldFire) {
    const result = await fireGoogleSheets(integrations.googleSheets, payload);
    const logId = await logIntegration(
      payload.formId, payload.responseId, "googleSheets", result,
      { spreadsheetUrl: integrations.googleSheets.spreadsheetUrl, sheetName: integrations.googleSheets.sheetName },
    );
    results.push({ ...result, logId: logId ?? undefined });
  }

  // 3. CRM Manus
  if (integrations.crmManus?.enabled && integrations.crmManus.webhookUrl && shouldFire) {
    const result = await fireCrmManus(integrations.crmManus, payload);
    const logId = await logIntegration(
      payload.formId, payload.responseId, "crmManus", result,
      { webhookUrl: integrations.crmManus.webhookUrl },
    );
    results.push({ ...result, logId: logId ?? undefined });
  }

  // 4. RD Station
  if (integrations.rdStation?.enabled && integrations.rdStation.apiToken && shouldFire) {
    const result = await fireRdStation(integrations.rdStation, payload);
    const logId = await logIntegration(
      payload.formId, payload.responseId, "rdStation", result,
    );
    results.push({ ...result, logId: logId ?? undefined });
  }

  // 5. Email notification
  if (integrations.email?.enabled && integrations.email.recipients && shouldFire) {
    const result = await fireEmailNotification(integrations.email, payload);
    const logId = await logIntegration(
      payload.formId, payload.responseId, "email", result,
      { recipients: integrations.email.recipients },
    );
    results.push({ ...result, logId: logId ?? undefined });
  }

  // 6. WhatsApp notification (log only — opens wa.me link on client side)
  if (integrations.whatsapp?.enabled && integrations.whatsapp.phoneNumber && shouldFire) {
    const result: IntegrationResult = { integration: "whatsapp", success: true };
    await logIntegration(payload.formId, payload.responseId, "whatsapp", result);
    results.push(result);
  }

  return results;
}

// ─── Retry Logic ───

/**
 * Retry a failed integration by log ID.
 * Called from the tRPC endpoint or the retry worker.
 */
export async function retryIntegration(logId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the log entry
    const logs = await db.getIntegrationLogsByResponse(0); // We need to get by ID
    // Actually, let's query directly
    const allLogs = await db.getIntegrationLogsByForm(0); // Workaround: get the log by querying
    // Better approach: get the specific log
    const { integrationLogs } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Use direct DB query
    const logEntries = await (db as any).withDbRetry
      ? await queryLogById(logId)
      : null;

    if (!logEntries) {
      return { success: false, error: "Log não encontrado" };
    }

    const logEntry = logEntries;

    if (logEntry.status === "success") {
      return { success: false, error: "Integração já foi bem-sucedida" };
    }

    if (logEntry.retryCount >= logEntry.maxRetries) {
      return { success: false, error: "Número máximo de tentativas atingido" };
    }

    // Get the form to rebuild the payload
    const form = await db.getFormById(logEntry.formId);
    if (!form) {
      return { success: false, error: "Formulário não encontrado" };
    }

    // Get the response
    const response = await db.getResponseById(logEntry.responseId);
    if (!response) {
      return { success: false, error: "Resposta não encontrada" };
    }

    const webhook = form.webhook as WebhookSettings | null;
    if (!webhook) {
      return { success: false, error: "Configurações de webhook não encontradas" };
    }

    // Rebuild payload
    const payload: DispatchPayload = {
      formId: form.id,
      formTitle: form.title,
      responseId: response.id,
      protocolCode: response.protocolCode ?? null,
      respondentName: response.respondentName ?? null,
      respondentEmail: response.respondentEmail ?? null,
      answers: response.answers as Record<string, any>,
      questions: form.questions as any[],
      isComplete: response.isComplete,
      submittedAt: response.createdAt.toISOString(),
    };

    // Fire the specific integration
    let result: IntegrationResult;
    const integrations = webhook.integrations;

    switch (logEntry.integrationType) {
      case "webhook":
        result = await fireWebhook(webhook, payload);
        break;
      case "googleSheets":
        if (!integrations?.googleSheets) return { success: false, error: "Google Sheets não configurado" };
        result = await fireGoogleSheets(integrations.googleSheets, payload);
        break;
      case "crmManus":
        if (!integrations?.crmManus) return { success: false, error: "CRM não configurado" };
        result = await fireCrmManus(integrations.crmManus, payload);
        break;
      case "rdStation":
        if (!integrations?.rdStation) return { success: false, error: "RD Station não configurado" };
        result = await fireRdStation(integrations.rdStation, payload);
        break;
      case "email":
        if (!integrations?.email) return { success: false, error: "Email não configurado" };
        result = await fireEmailNotification(integrations.email, payload);
        break;
      default:
        return { success: false, error: `Tipo de integração desconhecido: ${logEntry.integrationType}` };
    }

    // Update the log entry
    const newRetryCount = logEntry.retryCount + 1;
    const isRetryable = !result.success && result.error && isTemporaryError(result.error, result.httpStatus);
    const newStatus = result.success ? "success" : (isRetryable && newRetryCount < MAX_RETRIES ? "retrying" : "failure");
    const nextRetry = newStatus === "retrying" ? getNextRetryAt(newRetryCount) : null;

    await db.updateIntegrationLog(logId, {
      status: newStatus as any,
      httpStatus: result.httpStatus,
      errorMessage: result.error,
      retryCount: newRetryCount,
      nextRetryAt: nextRetry,
      durationMs: result.durationMs,
    });

    return { success: result.success, error: result.error };
  } catch (err) {
    return { success: false, error: (err as Error)?.message?.substring(0, 300) };
  }
}

/**
 * Query a single integration log by ID.
 */
async function queryLogById(logId: number) {
  try {
    const { integrationLogs } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    // Use the withDbRetry pattern from db.ts
    const results = await (db as any).withDbRetry?.(async (dbConn: any) => {
      return dbConn.select().from(integrationLogs).where(eq(integrationLogs.id, logId)).limit(1);
    });
    return results?.[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Process pending retries — called by a cron job or interval.
 */
export async function processRetryQueue(): Promise<number> {
  try {
    const pendingLogs = await db.getPendingRetryLogs(10);
    let processed = 0;

    for (const log of pendingLogs) {
      try {
        await retryIntegration(log.id);
        processed++;
      } catch (err) {
        console.warn(`[RetryQueue] Failed to retry log ${log.id}:`, (err as Error)?.message?.substring(0, 200));
      }
    }

    return processed;
  } catch (err) {
    console.warn("[RetryQueue] Failed to process:", (err as Error)?.message?.substring(0, 200));
    return 0;
  }
}

// ─── Generic Webhook ───

async function fireWebhook(
  webhook: WebhookSettings,
  payload: DispatchPayload
): Promise<IntegrationResult> {
  const start = Date.now();
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

    const durationMs = Date.now() - start;

    if (!response.ok) {
      return {
        integration: "webhook",
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
        durationMs,
      };
    }

    return { integration: "webhook", success: true, httpStatus: response.status, durationMs };
  } catch (err) {
    return {
      integration: "webhook",
      success: false,
      error: (err as Error).message,
      durationMs: Date.now() - start,
    };
  }
}

// ─── Google Sheets ───

async function fireGoogleSheets(
  config: {
    spreadsheetUrl: string;
    sheetName: string;
    serviceAccountJson?: string;
    serviceAccountEmail?: string;
  },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  const start = Date.now();
  try {
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

    // Strategy 1: Use Service Account JSON key (preferred)
    if (config.serviceAccountJson) {
      const { appendRowToSheet } = await import("./googleSheetsService");
      const result = await appendRowToSheet(
        {
          spreadsheetUrl: config.spreadsheetUrl,
          sheetName: config.sheetName,
          serviceAccountJson: config.serviceAccountJson,
        },
        row,
      );

      const durationMs = Date.now() - start;
      if (!result.success) {
        return { integration: "googleSheets", success: false, error: result.error, durationMs };
      }
      return { integration: "googleSheets", success: true, durationMs };
    }

    // Strategy 2: Fallback to Manus Forge API
    const match = config.spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return { integration: "googleSheets", success: false, error: "URL da planilha inválida", durationMs: Date.now() - start };
    }
    const spreadsheetId = match[1];
    const sheetName = config.sheetName || "Respostas";

    const forgeUrl = ENV.forgeApiUrl;
    const forgeKey = ENV.forgeApiKey;

    if (forgeUrl && forgeKey) {
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

      const durationMs = Date.now() - start;

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return {
          integration: "googleSheets",
          success: false,
          error: `API ${response.status}: ${text.substring(0, 200)}`,
          httpStatus: response.status,
          durationMs,
        };
      }

      return { integration: "googleSheets", success: true, httpStatus: response.status, durationMs };
    }

    return {
      integration: "googleSheets",
      success: false,
      error: "Google Sheets não configurado: adicione a chave de conta de serviço (Service Account JSON)",
      durationMs: Date.now() - start,
    };
  } catch (err) {
    return { integration: "googleSheets", success: false, error: (err as Error).message, durationMs: Date.now() - start };
  }
}

// ─── CRM Manus ───

async function fireCrmManus(
  config: { webhookUrl: string; funnelName: string; stageName: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  const start = Date.now();
  try {
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

    const durationMs = Date.now() - start;

    if (!response.ok) {
      return {
        integration: "crmManus",
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        httpStatus: response.status,
        durationMs,
      };
    }

    return { integration: "crmManus", success: true, httpStatus: response.status, durationMs };
  } catch (err) {
    return { integration: "crmManus", success: false, error: (err as Error).message, durationMs: Date.now() - start };
  }
}

// ─── RD Station ───

async function fireRdStation(
  config: { apiToken: string; conversionIdentifier: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  const start = Date.now();
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

    const durationMs = Date.now() - start;

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        integration: "rdStation",
        success: false,
        error: `HTTP ${response.status}: ${text.substring(0, 200)}`,
        httpStatus: response.status,
        durationMs,
      };
    }

    return { integration: "rdStation", success: true, httpStatus: response.status, durationMs };
  } catch (err) {
    return { integration: "rdStation", success: false, error: (err as Error).message, durationMs: Date.now() - start };
  }
}

// ─── Email Notification ───

async function fireEmailNotification(
  config: { recipients: string; subject: string },
  payload: DispatchPayload
): Promise<IntegrationResult> {
  const start = Date.now();
  try {
    const recipients = config.recipients.split(",").map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return { integration: "email", success: false, error: "Nenhum destinatário configurado", durationMs: Date.now() - start };
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
      return { integration: "email", success: false, error: "RESEND_API_KEY não configurada", durationMs: Date.now() - start };
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

    const durationMs = Date.now() - start;

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return {
        integration: "email",
        success: false,
        error: `Resend ${response.status}: ${text.substring(0, 200)}`,
        httpStatus: response.status,
        durationMs,
      };
    }

    return { integration: "email", success: true, httpStatus: response.status, durationMs };
  } catch (err) {
    return { integration: "email", success: false, error: (err as Error).message, durationMs: Date.now() - start };
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
