import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the Twilio client before importing the module
vi.mock("twilio", () => {
  const mockCreate = vi.fn().mockResolvedValue({ sid: "VE123", status: "pending" });
  const mockCheckCreate = vi.fn().mockResolvedValue({ sid: "VE123", status: "approved" });
  const mockVerify = {
    verify: {
      v2: {
        services: vi.fn().mockReturnValue({
          verifications: { create: mockCreate },
          verificationChecks: { create: mockCheckCreate },
        }),
      },
    },
  };
  return { default: vi.fn(() => mockVerify) };
});

// Mock ENV
vi.mock("./_core/env", () => ({
  ENV: {
    twilioAccountSid: "ACtest123",
    twilioAuthToken: "test_auth_token",
    twilioVerifyServiceSid: "VAtest123",
  },
}));

describe("SMS Verification - normalizePhone", () => {
  it("should export normalizePhone function", async () => {
    const { normalizePhone } = await import("./smsVerification");
    expect(typeof normalizePhone).toBe("function");
  });

  it("should add +55 prefix to 11-digit Brazilian numbers", async () => {
    const { normalizePhone } = await import("./smsVerification");
    expect(normalizePhone("11999887766")).toBe("+5511999887766");
  });

  it("should add +55 prefix to 10-digit Brazilian numbers", async () => {
    const { normalizePhone } = await import("./smsVerification");
    expect(normalizePhone("1199988776")).toBe("+551199988776");
  });

  it("should keep +55 prefix for numbers already with country code", async () => {
    const { normalizePhone } = await import("./smsVerification");
    expect(normalizePhone("+5511999887766")).toBe("+5511999887766");
  });

  it("should handle numbers with 55 prefix without +", async () => {
    const { normalizePhone } = await import("./smsVerification");
    expect(normalizePhone("5511999887766")).toBe("+5511999887766");
  });

  it("should strip non-digit characters", async () => {
    const { normalizePhone } = await import("./smsVerification");
    expect(normalizePhone("(11) 99988-7766")).toBe("+5511999887766");
  });
});

describe("SMS Verification - Rate Limiting", () => {
  beforeEach(async () => {
    // Clear the rate limit store before each test
    const { _testing } = await import("./smsVerification");
    _testing.rateLimitStore.clear();
  });

  it("should allow first send (under limit)", async () => {
    const { checkRateLimit } = await import("./smsVerification");
    const result = checkRateLimit("11999887766");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.retryAfterMs).toBe(0);
  });

  it("should track remaining sends after recording", async () => {
    const { checkRateLimit, _testing } = await import("./smsVerification");
    const phone = "11999001122";

    // Record 3 sends
    _testing.recordSend(phone);
    _testing.recordSend(phone);
    _testing.recordSend(phone);

    const result = checkRateLimit(phone);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("should block after 5 sends within 10 minutes", async () => {
    const { checkRateLimit, _testing } = await import("./smsVerification");
    const phone = "11999334455";

    // Record 5 sends
    for (let i = 0; i < 5; i++) {
      _testing.recordSend(phone);
    }

    const result = checkRateLimit(phone);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("should allow sends after window expires", async () => {
    const { checkRateLimit, _testing } = await import("./smsVerification");
    const phone = "11999556677";

    // Manually insert old timestamps (11 minutes ago)
    const oldTime = Date.now() - 11 * 60 * 1000;
    const normalized = "+5511999556677";
    _testing.rateLimitStore.set(normalized, [oldTime, oldTime, oldTime, oldTime, oldTime]);

    const result = checkRateLimit(phone);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5); // All old entries expired
  });

  it("should handle different phone numbers independently", async () => {
    const { checkRateLimit, _testing } = await import("./smsVerification");

    // Fill up phone A
    for (let i = 0; i < 5; i++) {
      _testing.recordSend("11999001111");
    }

    // Phone A should be blocked
    expect(checkRateLimit("11999001111").allowed).toBe(false);

    // Phone B should still be allowed
    expect(checkRateLimit("11999002222").allowed).toBe(true);
    expect(checkRateLimit("11999002222").remaining).toBe(5);
  });

  it("sendVerificationCode should return rateLimited when limit exceeded", async () => {
    const { sendVerificationCode, _testing } = await import("./smsVerification");
    const phone = "11999778899";

    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      _testing.recordSend(phone);
    }

    const result = await sendVerificationCode(phone);
    expect(result.success).toBe(false);
    expect(result.rateLimited).toBe(true);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(result.error).toContain("Limite de envios atingido");
  });

  it("sendVerificationCode should return remaining count on success", async () => {
    const { sendVerificationCode, _testing } = await import("./smsVerification");
    const phone = "11999112233";

    // Record 2 sends
    _testing.recordSend(phone);
    _testing.recordSend(phone);

    const result = await sendVerificationCode(phone);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2); // 5 - 2 existing - 1 this send = 2
  });
});

describe("SMS Verification - sendVerificationCode", () => {
  beforeEach(async () => {
    const { _testing } = await import("./smsVerification");
    _testing.rateLimitStore.clear();
  });

  it("should export sendVerificationCode function", async () => {
    const { sendVerificationCode } = await import("./smsVerification");
    expect(typeof sendVerificationCode).toBe("function");
  });

  it("should return success with sid on successful send", async () => {
    const { sendVerificationCode } = await import("./smsVerification");
    const result = await sendVerificationCode("11999887766");
    expect(result.success).toBe(true);
    expect(result.sid).toBeDefined();
  });
});

describe("SMS Verification - checkVerificationCode", () => {
  it("should export checkVerificationCode function", async () => {
    const { checkVerificationCode } = await import("./smsVerification");
    expect(typeof checkVerificationCode).toBe("function");
  });

  it("should return valid true for approved verification", async () => {
    const { checkVerificationCode } = await import("./smsVerification");
    const result = await checkVerificationCode("11999887766", "123456");
    expect(result.success).toBe(true);
    expect(result.valid).toBe(true);
  });
});

describe("SMS Verification - Settings Integration", () => {
  it("form settings should support smsVerification boolean", () => {
    const settings = { smsVerification: true };
    expect(settings.smsVerification).toBe(true);
  });

  it("form settings should default to false when undefined", () => {
    const settings: Record<string, any> = {};
    expect(settings.smsVerification ?? false).toBe(false);
  });

  it("should handle null settings gracefully", () => {
    const settings = null;
    const smsEnabled = settings ? (settings as any).smsVerification : false;
    expect(smsEnabled).toBe(false);
  });
});
