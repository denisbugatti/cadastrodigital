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

describe("SMS Verification - sendVerificationCode", () => {
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

  it("should parse settings from JSON string", () => {
    const settingsStr = '{"smsVerification":true}';
    const parsed = JSON.parse(settingsStr);
    expect(parsed.smsVerification).toBe(true);
  });

  it("should handle null settings gracefully", () => {
    const settings = null;
    const smsEnabled = settings ? (settings as any).smsVerification : false;
    expect(smsEnabled).toBe(false);
  });
});
