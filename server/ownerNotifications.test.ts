import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock web-push module
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({ statusCode: 201 }),
  },
}));

// Mock db module
vi.mock("./db", () => ({
  getActivePushSubscriptions: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
      p256dh: "test-p256dh-key",
      auth: "test-auth-key",
      active: true,
      createdAt: new Date(),
    },
  ]),
  deactivatePushSubscription: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue({
    id: 1,
    openId: "owner-123",
    name: "Owner",
  }),
  getActiveStaffPushSubscriptions: vi.fn().mockResolvedValue([
    {
      id: 10,
      staffUserId: 5,
      endpoint: "https://fcm.googleapis.com/fcm/send/staff-endpoint",
      p256dh: "staff-p256dh-key",
      auth: "staff-auth-key",
      active: true,
      createdAt: new Date(),
    },
  ]),
  deactivateStaffPushSubscription: vi.fn().mockResolvedValue(undefined),
}));

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    vapidPublicKey: "BNtest-public-key-for-testing-purposes-only-1234567890",
    vapidPrivateKey: "test-private-key-for-testing-purposes-only",
    ownerOpenId: "owner-123",
  },
}));

describe("Owner Notification System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("notifyOwnerNewResponse should accept extras parameter with isComplete", async () => {
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    
    // Complete response
    await expect(
      notifyOwnerNewResponse("Cadastro PF", "Maria Silva", {
        isComplete: true,
        protocolCode: "ABC123",
        formId: 1,
        responseId: 42,
      })
    ).resolves.not.toThrow();
  });

  it("notifyOwnerNewResponse should handle partial response", async () => {
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    
    // Partial response
    await expect(
      notifyOwnerNewResponse("Cadastro PJ", "João Santos", {
        isComplete: false,
        formId: 2,
        responseId: 43,
      })
    ).resolves.not.toThrow();
  });

  it("notifyOwnerNewResponse should work without extras (backwards compatible)", async () => {
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    
    await expect(
      notifyOwnerNewResponse("Cadastro PF", "Ricardo")
    ).resolves.not.toThrow();
  });

  it("notifyOwnerNewResponse should work without respondentName", async () => {
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    
    await expect(
      notifyOwnerNewResponse("Cadastro PF", undefined, {
        isComplete: true,
        formId: 1,
        responseId: 44,
      })
    ).resolves.not.toThrow();
  });

  it("notifyOwnerNewResponse should handle missing owner gracefully", async () => {
    const db = await import("./db");
    (db.getUserByOpenId as any).mockResolvedValueOnce(null);

    const { notifyOwnerNewResponse } = await import("./pushNotification");
    await expect(
      notifyOwnerNewResponse("Cadastro PJ", "Test User", {
        isComplete: true,
        formId: 1,
        responseId: 45,
      })
    ).resolves.not.toThrow();
  });

  it("sendPushToUser should be called when notifying owner of complete response", async () => {
    const webpush = await import("web-push");
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    
    await notifyOwnerNewResponse("Cadastro PF", "Maria Silva", {
      isComplete: true,
      protocolCode: "XYZ789",
      formId: 3,
      responseId: 50,
    });

    // web-push sendNotification should have been called
    expect(webpush.default.sendNotification).toHaveBeenCalled();
    
    // Verify the payload contains the correct data
    const callArgs = (webpush.default.sendNotification as any).mock.calls[0];
    const payload = JSON.parse(callArgs[1]);
    expect(payload.title).toContain("cadastro");
    expect(payload.data.isComplete).toBe(true);
    expect(payload.data.protocolCode).toBe("XYZ789");
    expect(payload.data.formId).toBe(3);
    expect(payload.data.responseId).toBe(50);
  });

  it("sendPushToUser should be called when notifying owner of partial response", async () => {
    const webpush = await import("web-push");
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    
    await notifyOwnerNewResponse("Cadastro PJ", "João Santos", {
      isComplete: false,
      formId: 4,
      responseId: 51,
    });

    expect(webpush.default.sendNotification).toHaveBeenCalled();
    
    const callArgs = (webpush.default.sendNotification as any).mock.calls[0];
    const payload = JSON.parse(callArgs[1]);
    expect(payload.title).toContain("começou");
    expect(payload.data.isComplete).toBe(false);
  });

  it("notifyCorretorPush should send push to staff user", async () => {
    const webpush = await import("web-push");
    const { notifyCorretorPush } = await import("./pushNotification");
    
    await notifyCorretorPush({
      staffUserId: 5,
      formTitle: "Cadastro PF",
      respondentName: "Ana Costa",
      protocolCode: "DEF456",
      formId: 1,
    });

    expect(webpush.default.sendNotification).toHaveBeenCalled();
    
    const callArgs = (webpush.default.sendNotification as any).mock.calls[0];
    const payload = JSON.parse(callArgs[1]);
    expect(payload.title).toContain("Nova resposta");
    expect(payload.body).toContain("Ana Costa");
    expect(payload.data.formId).toBe(1);
  });
});
