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
  sendWeeklySummaryEmail,
} from "./emailService";
import { notifyOwner } from "./_core/notification";
import { sendPushToUser, sendPushToStaffUser } from "./pushNotification";
import { notifyCorretoresNewSubmission } from "./corretorNotification";
import { extractFirstName } from "../shared/respondentName";

/** How often to check (in ms). We check every 60 seconds. */
const CHECK_INTERVAL_MS = 60 * 1000;

/** Track if jobs already ran today to avoid duplicates */
let lastEnrollDate = "";
let lastProcessDate = "";
let lastInactivityCheckDate = "";
let lastWeeklySummaryDate = "";

/** Track last abandonment check (runs every 2 minutes) */
let lastAbandonmentCheckTime = 0;

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
 * Check if it's time to run the weekly summary email.
 * Runs every Monday at 12:00 UTC (9:00 AM BRT).
 */
function shouldRunWeeklySummary(now: Date): boolean {
  const dateKey = now.toISOString().slice(0, 10);
  if (dateKey === lastWeeklySummaryDate) return false;

  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon

  // Run at 12:00 UTC on Monday (1)
  return utcHour === 12 && utcMinute === 0 && utcDay === 1;
}

/**
 * Send weekly summary email to admin with statistics.
 */
async function runWeeklySummary(): Promise<void> {
  console.log("[Cron] Generating weekly summary email...");
  try {
    const stats = await db.getWeeklyStats();

    // Get admin email from environment
    const { ENV } = await import("./_core/env");
    const { getUserByOpenId } = await import("./db");
    const ownerUser = await getUserByOpenId(ENV.ownerOpenId);

    if (!ownerUser?.email) {
      console.warn("[Cron] No owner email found, skipping weekly summary.");
      return;
    }

    const sent = await sendWeeklySummaryEmail({
      to: ownerUser.email,
      stats,
    });

    if (sent) {
      console.log(`[Cron] Weekly summary email sent to ${ownerUser.email}`);
    } else {
      console.warn("[Cron] Failed to send weekly summary email.");
    }

    // Also send push notification as a reminder
    try {
      await sendPushToUser(ownerUser.id, {
        title: `\ud83d\udcca Resumo Semanal Dispon\u00edvel`,
        body: `${stats.responses.newThisWeek} novas respostas, ${stats.validation.approvalRate}% aprovação. Confira seu email!`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        url: "/performance",
        tag: "weekly-summary",
        data: {
          type: "weekly_summary",
          timestamp: Date.now(),
        },
      });
    } catch (pushErr: any) {
      console.warn("[Cron] Failed to send push for weekly summary:", pushErr?.message?.substring(0, 100));
    }

    // Also notify via Manus notification service
    const periodStart = stats.period.start.toLocaleDateString("pt-BR");
    const periodEnd = stats.period.end.toLocaleDateString("pt-BR");
    await notifyOwner({
      title: `\ud83d\udcca Resumo Semanal (${periodStart} — ${periodEnd})`,
      content: [
        `Novas respostas: ${stats.responses.newThisWeek}`,
        `Total: ${stats.responses.total} | Aprovadas: ${stats.responses.approved} | Reprovadas: ${stats.responses.rejected} | Pendentes: ${stats.responses.pending}`,
        `Valida\u00e7\u00f5es: ${stats.validation.totalValidated} | Taxa aprova\u00e7\u00e3o: ${stats.validation.approvalRate}%`,
        `Top corretores: ${stats.corretores.slice(0, 3).map(c => `${c.name} (${c.validationsCount})`).join(", ") || "Nenhum"}`,
      ].join("\n"),
    });

  } catch (err) {
    console.error("[Cron] Weekly summary error:", (err as Error).message);
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

  if (shouldRunWeeklySummary(now)) {
    lastWeeklySummaryDate = now.toISOString().slice(0, 10);
    await runWeeklySummary();
  }

  // Abandonment check runs every 2 minutes
  const timeSinceLastAbandonmentCheck = now.getTime() - lastAbandonmentCheckTime;
  if (timeSinceLastAbandonmentCheck >= 2 * 60 * 1000) {
    lastAbandonmentCheckTime = now.getTime();
    await runAbandonmentCheck();
  }
}

/**
 * Abandonment check — runs every 2 minutes.
 * Finds incomplete responses with no activity for 8+ minutes and notifies the corretor.
 */
async function runAbandonmentCheck(): Promise<void> {
  try {
    const abandoned = await db.getAbandonedResponses(10); // 10 minutes timeout
    if (abandoned.length === 0) return;

    console.log(`[Cron] Found ${abandoned.length} abandoned response(s). Notifying corretores...`);

    for (const resp of abandoned) {
      try {
        // Get the form to access questions
        const form = await db.getFormById(resp.formId);
        const questions: any[] = form?.questions ?? [];

        // Send abandonment notification to corretores (email)
        const result = await notifyCorretoresNewSubmission({
          formId: resp.formId,
          protocolCode: resp.protocolCode ?? `ABANDONO-${resp.id}`,
          formTitle: resp.formTitle,
          respondentName: resp.respondentName ?? undefined,
          respondentEmail: resp.respondentEmail ?? undefined,
          answers: resp.answers,
          questions,
          responseId: resp.id,
          isPartial: true,
          isAbandoned: true,
        });

        // Mark as notified so we don't send again
        await db.markAbandonmentNotified(resp.id);

        // Send in-app notification to assigned staff with the correct abandonment message
        try {
          const abandonForm = await db.getFormById(resp.formId);
          const abandonAssignments = await db.getFormAssignments(resp.formId);
          const abandonStaffIds = abandonAssignments.map((a: any) => a.staffUserId);
          if (abandonForm?.assignedCorretorId && !abandonStaffIds.includes(abandonForm.assignedCorretorId)) {
            abandonStaffIds.push(abandonForm.assignedCorretorId);
          }
          if (abandonStaffIds.length > 0) {
            const abandonFirstName = extractFirstName(
              resp.answers as Record<string, unknown>,
              resp.respondentName
            );
            const abandonDisplayName = abandonFirstName !== "Anônimo" ? abandonFirstName : resp.respondentName;
            const abandonTitle = abandonDisplayName
              ? `⚠️ ${abandonDisplayName} abandonou o cadastro`
              : `⚠️ Um cliente abandonou o cadastro`;
            const abandonBody = `No formulário ${resp.formTitle}`;

            // Also include managers of assigned corretores
            const staffDb = await import("./staffDb");
            const abandonManagerIds = new Set<number>();
            for (const sid of abandonStaffIds) {
              try {
                const su = await staffDb.getStaffUserById(sid);
                if (su?.managerId && !abandonStaffIds.includes(su.managerId)) {
                  abandonManagerIds.add(su.managerId);
                }
              } catch (_) { /* ignore */ }
            }
            const allAbandonStaff = [...abandonStaffIds, ...Array.from(abandonManagerIds)];

            // Check preferences
            const prefsMap = await db.getNotificationPreferencesForStaff(allAbandonStaff, "response_abandoned");

            // In-app notifications
            const inAppIds = allAbandonStaff.filter((id: number) => prefsMap.get(id)?.inApp !== false);
            if (inAppIds.length > 0) {
              await db.createStaffNotificationsBatch(
                inAppIds.map((staffUserId: number) => ({
                  staffUserId,
                  type: "response_abandoned" as any,
                  title: abandonTitle,
                  body: abandonBody,
                  link: abandonManagerIds.has(staffUserId) ? "/gerente/respostas" : "/corretor/respostas",
                  metadata: { formId: resp.formId, formTitle: resp.formTitle, respondentName: resp.respondentName ?? null, responseId: resp.id, isAbandoned: true, isManagerNotification: abandonManagerIds.has(staffUserId) },
                }))
              );
            }

            // Push notifications
            for (const staffUserId of allAbandonStaff) {
              if (prefsMap.get(staffUserId)?.push === false) continue;
              sendPushToStaffUser(staffUserId, {
                title: abandonTitle,
                body: abandonBody,
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-72x72.png",
                url: abandonManagerIds.has(staffUserId) ? "/gerente/respostas" : "/corretor/respostas",
                tag: `abandoned-${resp.id}`,
                data: { type: "response_abandoned", formId: resp.formId, responseId: resp.id, respondentName: resp.respondentName ?? null, timestamp: Date.now() },
              }).catch((pushErr: any) => console.warn(`[Cron] Push for abandonment failed for staff ${staffUserId}:`, pushErr?.message?.substring(0, 100)));
            }
          }
        } catch (abandonNotifErr) {
          console.warn(`[Cron] Failed to send in-app abandonment notification for response #${resp.id}:`, (abandonNotifErr as Error)?.message?.substring(0, 100));
        }

        console.log(`[Cron] Abandonment notification sent for response #${resp.id} (${resp.respondentName ?? "Anônimo"}) to ${result.sent} corretor(es)`);

        // Log activity
        db.logActivity({
          responseId: resp.id,
          formId: resp.formId,
          activityType: "abandonment_detected",
          description: `Cliente ${resp.respondentName ?? resp.respondentEmail ?? "Anônimo"} abandonou o formulário após 10 min de inatividade. Corretor notificado.`,
        }).catch(() => {});
      } catch (err) {
        console.warn(`[Cron] Failed to process abandonment for response #${resp.id}:`, (err as Error)?.message?.substring(0, 100));
      }
    }
  } catch (err) {
    console.error("[Cron] Abandonment check error:", (err as Error).message);
  }
}

/**
 * Start the cron scheduler.
 * Call this once during server startup.
 */
export function startCronScheduler(): void {
  console.log(
    "[Cron] Scheduler started. Enrollment: daily at 9am BRT. Processing: Mon/Wed/Fri at 9am BRT. Inactivity check: daily at 10am BRT. Weekly summary: Mon at 9am BRT. Abandonment check: every 2 min."
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
