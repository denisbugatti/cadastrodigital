import webpush from "web-push";
import { ENV } from "./_core/env";
import { getActivePushSubscriptions, deactivatePushSubscription, getUserByOpenId, getActiveStaffPushSubscriptions, deactivateStaffPushSubscription } from "./db";

/**
 * Initialize web-push with VAPID keys.
 * Must be called before sending any push notifications.
 */
function ensureVapidConfigured() {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) {
    console.warn("[Push] VAPID keys not configured, push notifications disabled");
    return false;
  }
  try {
    webpush.setVapidDetails(
      "mailto:contato@oneinnovation.com.br",
      ENV.vapidPublicKey,
      ENV.vapidPrivateKey
    );
    return true;
  } catch (err: any) {
    console.error("[Push] Failed to configure VAPID:", err?.message);
    return false;
  }
}

let _vapidReady: boolean | null = null;

function isVapidReady(): boolean {
  if (_vapidReady === null) {
    _vapidReady = ensureVapidConfigured();
  }
  return _vapidReady;
}

/**
 * Send a push notification to all active subscriptions for a given user.
 * Automatically deactivates subscriptions that are no longer valid (410 Gone).
 */
export async function sendPushToUser(
  userId: number,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
    data?: Record<string, any>;
  }
): Promise<{ sent: number; failed: number; deactivated: number }> {
  if (!isVapidReady()) {
    console.warn("[Push] VAPID not ready, skipping push notification");
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  const subscriptions = await getActivePushSubscriptions(userId);
  const activeSubscriptions = subscriptions.filter((s: any) => s.active);

  if (activeSubscriptions.length === 0) {
    console.log("[Push] No active subscriptions for user", userId);
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  let deactivated = 0;

  for (const sub of activeSubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payloadString,
        {
          TTL: 60 * 60, // 1 hour TTL
          urgency: "normal",
        }
      );
      sent++;
    } catch (err: any) {
      const statusCode = err?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        // Subscription expired or no longer valid
        await deactivatePushSubscription(sub.id);
        deactivated++;
        console.log(`[Push] Deactivated expired subscription ${sub.id}`);
      } else {
        failed++;
        console.warn(`[Push] Failed to send to subscription ${sub.id}:`, err?.message?.substring(0, 100));
      }
    }
  }

  console.log(`[Push] Results for user ${userId}: sent=${sent}, failed=${failed}, deactivated=${deactivated}`);
  return { sent, failed, deactivated };
}

/**
 * Send push notification to the owner when a new form response is received.
 */
/**
 * Send a push notification to all active subscriptions for a given staff user.
 * Automatically deactivates subscriptions that are no longer valid (410 Gone).
 */
export async function sendPushToStaffUser(
  staffUserId: number,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
    data?: Record<string, any>;
  }
): Promise<{ sent: number; failed: number; deactivated: number }> {
  if (!isVapidReady()) {
    console.warn("[Push] VAPID not ready, skipping staff push notification");
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  const subscriptions = await getActiveStaffPushSubscriptions(staffUserId);
  const activeSubscriptions = subscriptions.filter((s: any) => s.active);

  if (activeSubscriptions.length === 0) {
    console.log("[Push] No active subscriptions for staff user", staffUserId);
    return { sent: 0, failed: 0, deactivated: 0 };
  }

  const payloadString = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  let deactivated = 0;

  for (const sub of activeSubscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        payloadString,
        {
          TTL: 60 * 60,
          urgency: "normal",
        }
      );
      sent++;
    } catch (err: any) {
      const statusCode = err?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await deactivateStaffPushSubscription(sub.id);
        deactivated++;
        console.log(`[Push] Deactivated expired staff subscription ${sub.id}`);
      } else {
        failed++;
        console.warn(`[Push] Failed to send to staff subscription ${sub.id}:`, err?.message?.substring(0, 100));
      }
    }
  }

  console.log(`[Push] Staff results for user ${staffUserId}: sent=${sent}, failed=${failed}, deactivated=${deactivated}`);
  return { sent, failed, deactivated };
}

/**
 * Notify the corretor assigned to a form when a new response arrives.
 */
export async function notifyCorretorPush(params: {
  staffUserId: number;
  formTitle: string;
  respondentName?: string;
  protocolCode?: string;
  formId?: number;
}) {
  try {
    const body = params.respondentName
      ? `${params.respondentName} enviou uma resposta no formulário "${params.formTitle}"`
      : `Nova resposta recebida no formulário "${params.formTitle}"`;

    await sendPushToStaffUser(params.staffUserId, {
      title: "\ud83d\udccb Nova resposta para validar!",
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      url: "/corretor/respostas",
      tag: `new-response-${params.formId || 'unknown'}`,
      data: {
        type: "new_response_corretor",
        formTitle: params.formTitle,
        respondentName: params.respondentName,
        protocolCode: params.protocolCode,
        formId: params.formId,
        timestamp: Date.now(),
      },
    });
  } catch (err: any) {
    console.error("[Push] Error notifying corretor:", err?.message?.substring(0, 100));
  }
}

/**
 * Notify the corretor when a cadastro status changes (approved/rejected).
 */
export async function notifyCorretorStatusChange(params: {
  staffUserId: number;
  formTitle: string;
  respondentName?: string;
  formId?: number;
  status: "approved" | "rejected";
}) {
  try {
    const statusLabel = params.status === "approved" ? "aprovado" : "rejeitado";
    const statusEmoji = params.status === "approved" ? "\u2705" : "\u274c";
    const title = `${statusEmoji} Cadastro ${statusLabel}!`;
    const body = params.respondentName
      ? `O cadastro de ${params.respondentName} no formulário "${params.formTitle}" foi ${statusLabel}.`
      : `Um cadastro no formulário "${params.formTitle}" foi ${statusLabel}.`;

    await sendPushToStaffUser(params.staffUserId, {
      title,
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      url: "/corretor/respostas",
      tag: `status-change-${params.formId || 'unknown'}-${params.status}`,
      data: {
        type: "status_change_corretor",
        formTitle: params.formTitle,
        respondentName: params.respondentName,
        formId: params.formId,
        status: params.status,
        timestamp: Date.now(),
      },
    });
  } catch (err: any) {
    console.error("[Push] Error notifying corretor status change:", err?.message?.substring(0, 100));
  }
}

export async function notifyOwnerNewResponse(
  formTitle: string,
  respondentName?: string,
  extras?: {
    isComplete?: boolean;
    protocolCode?: string;
    formId?: number;
    responseId?: number;
  }
) {
  try {
    // Get the owner user
    const ownerUser = await getUserByOpenId(ENV.ownerOpenId);
    if (!ownerUser) {
      console.warn("[Push] Owner user not found, cannot send push notification");
      return;
    }

    const isComplete = extras?.isComplete !== false;
    const statusLabel = isComplete ? "completa" : "parcial";
    const title = isComplete
      ? "📋 Nova resposta completa!"
      : "📝 Resposta parcial recebida";

    const bodyParts = [
      respondentName
        ? `${respondentName} enviou uma resposta ${statusLabel}`
        : `Nova resposta ${statusLabel} recebida`,
      `Formulário: ${formTitle}`,
    ];
    if (extras?.protocolCode) bodyParts.push(`Protocolo: #${extras.protocolCode}`);

    await sendPushToUser(ownerUser.id, {
      title,
      body: bodyParts.join(" \u2022 "),
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      url: "/dashboard",
      tag: `new-response-${extras?.formId || "unknown"}-${Date.now()}`,
      data: {
        type: "new_response",
        formTitle,
        respondentName,
        isComplete,
        protocolCode: extras?.protocolCode,
        formId: extras?.formId,
        responseId: extras?.responseId,
        timestamp: Date.now(),
      },
    });
  } catch (err: any) {
    // Don't let push notification errors break the response submission flow
    console.error("[Push] Error notifying owner:", err?.message?.substring(0, 100));
  }
}
