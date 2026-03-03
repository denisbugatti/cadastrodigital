/**
 * Cron Scheduler — Email Cadence System
 * Runs two jobs:
 *   1. enrollIncomplete: Enrolls incomplete responses (>24h old) into abandono cadence
 *   2. processDue: Sends due cadence emails
 *
 * Schedule: Every day at 9:00 AM BRT (12:00 UTC)
 * Cadence emails only go out on Mon/Wed/Fri, but enrollment runs daily.
 */

import * as db from "./db";
import {
  sendCadenceEmail,
  sendRejectionCadenceEmail,
} from "./emailService";
import { notifyOwner } from "./_core/notification";
import { sendPushToUser, sendPushToStaffUser } from "./pushNotification";

/** How often to check (in ms). We check every 60 seconds. */
const CHECK_INTERVAL_MS = 60 * 1000;

/** Track if jobs already ran today to avoid duplicates */
let lastEnrollDate = "";
let lastProcessDate = "";
let lastInactivityCheckDate = "";

/**
 * Get the current site URL from environment or fallback.
 * In production, this should be set via SITE_URL env var.
 */
function getSiteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.VITE_APP_URL ||
    "https://one.cadastrodigital.com.br"
  );
}

/**
 * Check if it's time to run the enrollment job.
 * Runs daily at 12:00 UTC (9:00 AM BRT).
 */
function shouldRunEnroll(now: Date): boolean {
  const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
  if (dateKey === lastEnrollDate) return false;

  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  // Run at 12:00 UTC (9:00 BRT)
  return utcHour === 12 && utcMinute === 0;
}

/**
 * Check if it's time to process due cadence emails.
 * Runs at 12:00 UTC (9:00 AM BRT) on Mon(1), Wed(3), Fri(5).
 */
function shouldProcessDue(now: Date): boolean {
  const dateKey = now.toISOString().slice(0, 10);
  if (dateKey === lastProcessDate) return false;

  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

  // Run at 12:00 UTC on Mon/Wed/Fri
  return utcHour === 12 && utcMinute === 0 && [1, 3, 5].includes(utcDay);
}

/**
 * Enroll incomplete responses into the abandono cadence.
 */
async function runEnrollIncomplete(): Promise<void> {
  console.log("[Cron] Starting enrollment of incomplete responses...");
  try {
    const incompleteResponses = await db.getIncompleteResponsesForFollowUp(24);
    let enrolled = 0;

    for (const response of incompleteResponses) {
      if (!response.respondentEmail) continue;
      try {
        await db.createEmailCadence({
          responseId: response.id,
          formId: response.formId,
          cadenceType: "abandono",
          recipientEmail: response.respondentEmail,
          recipientName: response.respondentName || undefined,
        });
        enrolled++;
      } catch (err) {
        // Duplicate cadence or other error — skip
        console.warn(
          `[Cron] Enroll failed for response ${response.id}:`,
          (err as Error)?.message?.substring(0, 80)
        );
      }
    }

    console.log(
      `[Cron] Enrollment complete: ${enrolled} new cadences from ${incompleteResponses.length} incomplete responses`
    );
  } catch (err) {
    console.error("[Cron] Enrollment error:", (err as Error).message);
  }
}

/**
 * Process all due cadence emails (both abandono and reprovacao).
 */
async function runProcessDue(): Promise<void> {
  console.log("[Cron] Processing due cadence emails...");
  try {
    const dueCadences = await db.getDueCadences();
    if (dueCadences.length === 0) {
      console.log("[Cron] No due cadences to process.");
      return;
    }

    const siteUrl = getSiteUrl();
    let sent = 0;
    let failed = 0;

    for (const cadence of dueCadences) {
      const formUrl = cadence.formSlug
        ? `${siteUrl}/${cadence.formSlug}?continue=${cadence.responseId}`
        : `${siteUrl}/form/${cadence.formId}?continue=${cadence.responseId}`;

      try {
        let success = false;
        const nextSeq = cadence.sequenceNumber + 1;

        if (cadence.cadenceType === "abandono") {
          success = await sendCadenceEmail({
            to: cadence.recipientEmail,
            clientName: cadence.recipientName ?? undefined,
            formTitle: cadence.formTitle,
            formUrl,
            sequenceNumber: nextSeq,
            totalInSequence: cadence.maxSequence,
          });
        } else {
          success = await sendRejectionCadenceEmail({
            to: cadence.recipientEmail,
            clientName: cadence.recipientName ?? undefined,
            formTitle: cadence.formTitle,
            formUrl,
            reason:
              cadence.rejectionReason ||
              "Documento ou dado precisa de correção",
            sequenceNumber: nextSeq,
            totalInSequence: cadence.maxSequence,
          });
        }

        if (success) {
          await db.advanceCadence(cadence.id);
          sent++;
        } else {
          failed++;
        }
      } catch (err) {
        console.error(
          `[Cron] Cadence ${cadence.id} failed:`,
          (err as Error).message
        );
        failed++;
      }
    }

    console.log(
      `[Cron] Cadence processing complete: ${sent} sent, ${failed} failed, ${dueCadences.length} total`
    );
  } catch (err) {
    console.error("[Cron] Process due error:", (err as Error).message);
  }
}

/**
 * Check if it's time to run the inactivity check.
 * Runs daily at 13:00 UTC (10:00 AM BRT).
 */
function shouldRunInactivityCheck(now: Date): boolean {
  const dateKey = now.toISOString().slice(0, 10);
  if (dateKey === lastInactivityCheckDate) return false;

  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();

  return utcHour === 13 && utcMinute === 0;
}

/**
 * Check for inactive corretores (7+ days without validating) and notify admin.
 */
async function runInactivityCheck(): Promise<void> {
  console.log("[Cron] Checking for inactive corretores...");
  try {
    const inactiveCorretores = await db.getInactiveCorretores(7);

    if (inactiveCorretores.length === 0) {
      console.log("[Cron] No inactive corretores found.");
      return;
    }

    // Build notification content
    const corretorLines = inactiveCorretores.map((c) => {
      const days = c.daysSinceLastValidation !== null
        ? `${c.daysSinceLastValidation} dias sem validar`
        : "Nunca validou";
      const forms = c.assignedFormCount > 0
        ? `${c.assignedFormCount} formulário(s) atribuído(s)`
        : "Nenhum formulário atribuído";
      return `• ${c.name} (${c.email}) — ${days}, ${forms}`;
    });

    const title = `⚠️ ${inactiveCorretores.length} corretor(es) inativo(s) há 7+ dias`;
    const content = [
      `Os seguintes corretores estão inativos (sem validar respostas nos últimos 7 dias):`,
      "",
      ...corretorLines,
      "",
      `Acesse /equipe para gerenciar a equipe ou /performance para ver métricas detalhadas.`,
    ].join("\n");

    // Send notification to owner via Manus notification service
    const sent = await notifyOwner({ title, content });
    if (sent) {
      console.log(`[Cron] Inactivity notification sent to owner: ${inactiveCorretores.length} inactive corretores`);
    } else {
      console.warn("[Cron] Failed to send inactivity notification to owner");
    }

    // Also send push notification to owner
    try {
      const { getUserByOpenId } = await import("./db");
      const { ENV } = await import("./_core/env");
      const ownerUser = await getUserByOpenId(ENV.ownerOpenId);
      if (ownerUser) {
        await sendPushToUser(ownerUser.id, {
          title: `⚠️ ${inactiveCorretores.length} corretor(es) inativo(s)`,
          body: `${inactiveCorretores.map(c => c.name).join(", ")} — 7+ dias sem validar respostas`,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          url: "/performance",
          tag: "inactive-corretores",
          data: {
            type: "inactive_corretores",
            count: inactiveCorretores.length,
            timestamp: Date.now(),
          },
        });
      }
    } catch (pushErr: any) {
      console.warn("[Cron] Failed to send push for inactivity:", pushErr?.message?.substring(0, 100));
    }

  } catch (err) {
    console.error("[Cron] Inactivity check error:", (err as Error).message);
  }
}

/**
 * The main tick function called every minute.
 */
async function tick(): Promise<void> {
  const now = new Date();

  if (shouldRunEnroll(now)) {
    lastEnrollDate = now.toISOString().slice(0, 10);
    await runEnrollIncomplete();
  }

  if (shouldProcessDue(now)) {
    lastProcessDate = now.toISOString().slice(0, 10);
    await runProcessDue();
  }

  if (shouldRunInactivityCheck(now)) {
    lastInactivityCheckDate = now.toISOString().slice(0, 10);
    await runInactivityCheck();
  }
}

/**
 * Start the cron scheduler.
 * Call this once during server startup.
 */
export function startCronScheduler(): void {
  console.log(
    "[Cron] Scheduler started. Enrollment: daily at 9am BRT. Processing: Mon/Wed/Fri at 9am BRT. Inactivity check: daily at 10am BRT."
  );

  // Run the tick every minute
  setInterval(() => {
    tick().catch((err) =>
      console.error("[Cron] Tick error:", (err as Error).message)
    );
  }, CHECK_INTERVAL_MS);

  // Also run immediately on startup to catch any missed jobs
  // (e.g., if server was down during scheduled time)
  setTimeout(() => {
    console.log("[Cron] Running initial catch-up check...");
    runEnrollIncomplete().catch((err) =>
      console.error("[Cron] Initial enroll error:", (err as Error).message)
    );
    // Only process due on Mon/Wed/Fri
    const today = new Date().getUTCDay();
    if ([1, 3, 5].includes(today)) {
      runProcessDue().catch((err) =>
        console.error("[Cron] Initial process error:", (err as Error).message)
      );
    }
  }, 10_000); // Wait 10 seconds after startup for DB to be ready
}
