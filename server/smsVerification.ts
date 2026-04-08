import { ENV } from "./_core/env";
import twilio from "twilio";

const client = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);

/* ── Rate Limiting ─────────────────────────────────────────────────── */

const RATE_LIMIT_MAX = 5;          // max sends per phone
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/** In-memory store: normalized phone → array of timestamps (ms) */
const rateLimitStore = new Map<string, number[]>();

/**
 * Check if a phone number has exceeded the rate limit.
 * Cleans up expired entries on every call.
 * Returns { allowed, remaining, retryAfterMs }.
 */
export function checkRateLimit(phone: string): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  const key = normalizePhone(phone);

  // Get or create entry
  let timestamps = rateLimitStore.get(key) ?? [];

  // Remove expired timestamps (older than window)
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitStore.set(key, timestamps);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    // Earliest timestamp still in window → when it expires
    const oldestInWindow = timestamps[0];
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - timestamps.length,
    retryAfterMs: 0,
  };
}

/** Record a send attempt for rate limiting. */
function recordSend(phone: string): void {
  const key = normalizePhone(phone);
  const timestamps = rateLimitStore.get(key) ?? [];
  timestamps.push(Date.now());
  rateLimitStore.set(key, timestamps);
}

/** Periodic cleanup of stale entries (every 5 min). */
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore.entries()) {
    const active = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (active.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, active);
    }
  }
}, 5 * 60 * 1000);

/* ── Phone Normalization ───────────────────────────────────────────── */

/**
 * Normalize phone number to E.164 format for Brazil.
 * Accepts: +5511999999999, 5511999999999, 11999999999, (11) 99999-9999, etc.
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) {
    return `+${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 11) {
    return `+55${digits}`;
  }

  if (phone.startsWith("+")) {
    return phone;
  }

  return `+55${digits}`;
}

/* ── Send Verification Code ────────────────────────────────────────── */

/**
 * Send a verification code via SMS to the given phone number.
 * Enforces rate limiting: max 5 sends per number per 10 minutes.
 */
export async function sendVerificationCode(phone: string): Promise<{
  success: boolean;
  sid?: string;
  error?: string;
  rateLimited?: boolean;
  retryAfterSeconds?: number;
  remaining?: number;
}> {
  // Check rate limit first
  const limit = checkRateLimit(phone);
  if (!limit.allowed) {
    const retryAfterSeconds = Math.ceil(limit.retryAfterMs / 1000);
    const retryMinutes = Math.ceil(retryAfterSeconds / 60);
    console.warn(
      `[SMS Verify] Rate limited: ${normalizePhone(phone)} — retry after ${retryAfterSeconds}s`
    );
    return {
      success: false,
      rateLimited: true,
      retryAfterSeconds,
      remaining: 0,
      error: `Limite de envios atingido. Tente novamente em ${retryMinutes} minuto${retryMinutes > 1 ? "s" : ""}.`,
    };
  }

  try {
    const normalizedPhone = normalizePhone(phone);

    const verification = await client.verify.v2
      .services(ENV.twilioVerifyServiceSid)
      .verifications.create({
        to: normalizedPhone,
        channel: "sms",
      });

    // Record successful send for rate limiting
    recordSend(phone);

    return {
      success: true,
      sid: verification.sid,
      remaining: limit.remaining - 1,
    };
  } catch (err: any) {
    console.error("[SMS Verify] Failed to send code:", err?.message);
    return {
      success: false,
      error: err?.message || "Falha ao enviar código SMS",
    };
  }
}

/* ── Check Verification Code ───────────────────────────────────────── */

/**
 * Check a verification code submitted by the user.
 * Returns whether the code is valid.
 */
export async function checkVerificationCode(
  phone: string,
  code: string
): Promise<{
  success: boolean;
  valid: boolean;
  error?: string;
}> {
  try {
    const normalizedPhone = normalizePhone(phone);

    const verificationCheck = await client.verify.v2
      .services(ENV.twilioVerifyServiceSid)
      .verificationChecks.create({
        to: normalizedPhone,
        code,
      });

    return {
      success: true,
      valid: verificationCheck.status === "approved",
    };
  } catch (err: any) {
    console.error("[SMS Verify] Failed to check code:", err?.message);
    return {
      success: false,
      valid: false,
      error: err?.message || "Falha ao verificar código",
    };
  }
}

export { normalizePhone };

/** Exposed for testing only */
export const _testing = {
  rateLimitStore,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  recordSend,
};
