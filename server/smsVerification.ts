import { ENV } from "./_core/env";
import twilio from "twilio";

const client = twilio(ENV.twilioAccountSid, ENV.twilioAuthToken);

/**
 * Normalize phone number to E.164 format for Brazil.
 * Accepts: +5511999999999, 5511999999999, 11999999999, (11) 99999-9999, etc.
 */
function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If already has country code (55) and is 12-13 digits
  if (digits.startsWith("55") && digits.length >= 12 && digits.length <= 13) {
    return `+${digits}`;
  }

  // If it's a Brazilian number without country code (10-11 digits: DDD + number)
  if (digits.length >= 10 && digits.length <= 11) {
    return `+55${digits}`;
  }

  // If it already starts with +, return as-is
  if (phone.startsWith("+")) {
    return phone;
  }

  // Fallback: assume Brazilian number
  return `+55${digits}`;
}

/**
 * Send a verification code via SMS to the given phone number.
 * Returns the verification SID on success.
 */
export async function sendVerificationCode(phone: string): Promise<{
  success: boolean;
  sid?: string;
  error?: string;
}> {
  try {
    const normalizedPhone = normalizePhone(phone);

    const verification = await client.verify.v2
      .services(ENV.twilioVerifyServiceSid)
      .verifications.create({
        to: normalizedPhone,
        channel: "sms",
      });

    return {
      success: true,
      sid: verification.sid,
    };
  } catch (err: any) {
    console.error("[SMS Verify] Failed to send code:", err?.message);
    return {
      success: false,
      error: err?.message || "Falha ao enviar código SMS",
    };
  }
}

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
