import webpush from "web-push";
import { ENV } from "./_core/env";
import { getActivePushSubscriptions, deactivatePushSubscription, getUserByOpenId } from "./db";

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
export async function notifyOwnerNewResponse(formTitle: string, respondentName?: string) {
  try {
    // Get the owner user
    const ownerUser = await getUserByOpenId(ENV.ownerOpenId);
    if (!ownerUser) {
      console.warn("[Push] Owner user not found, cannot send push notification");
      return;
    }

    const body = respondentName
      ? `${respondentName} enviou uma resposta no formulário "${formTitle}"`
      : `Nova resposta recebida no formulário "${formTitle}"`;

    await sendPushToUser(ownerUser.id, {
      title: "📋 Nova resposta recebida!",
      body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      url: "/dashboard",
      tag: "new-response",
      data: {
        type: "new_response",
        formTitle,
        respondentName,
        timestamp: Date.now(),
      },
    });
  } catch (err: any) {
    // Don't let push notification errors break the response submission flow
    console.error("[Push] Error notifying owner:", err?.message?.substring(0, 100));
  }
}
