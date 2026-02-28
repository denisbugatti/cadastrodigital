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
  savePushSubscription: vi.fn().mockResolvedValue(undefined),
  removePushSubscription: vi.fn().mockResolvedValue(undefined),
}));

// Mock env
vi.mock("./_core/env", () => ({
  ENV: {
    vapidPublicKey: "BNtest-public-key-for-testing-purposes-only-1234567890",
    vapidPrivateKey: "test-private-key-for-testing-purposes-only",
    ownerOpenId: "owner-123",
  },
}));

describe("Push Notification Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export sendPushToUser and notifyOwnerNewResponse", async () => {
    const mod = await import("./pushNotification");
    expect(mod.sendPushToUser).toBeDefined();
    expect(typeof mod.sendPushToUser).toBe("function");
    expect(mod.notifyOwnerNewResponse).toBeDefined();
    expect(typeof mod.notifyOwnerNewResponse).toBe("function");
  });

  it("sendPushToUser should send to active subscriptions and return results", async () => {
    const { sendPushToUser } = await import("./pushNotification");
    const result = await sendPushToUser(1, {
      title: "Nova resposta!",
      body: 'Formulário "Cadastro PJ" recebeu uma nova resposta.',
      url: "/responses/form_123",
    });
    expect(result).toHaveProperty("sent");
    expect(result).toHaveProperty("failed");
    expect(result).toHaveProperty("deactivated");
    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("sendPushToUser should handle no subscriptions gracefully", async () => {
    const db = await import("./db");
    (db.getActivePushSubscriptions as any).mockResolvedValueOnce([]);

    const { sendPushToUser } = await import("./pushNotification");
    const result = await sendPushToUser(1, {
      title: "Test",
      body: "Test body",
    });
    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
  });

  it("sendPushToUser should deactivate expired subscriptions (410)", async () => {
    const webpush = await import("web-push");
    const db = await import("./db");

    (db.getActivePushSubscriptions as any).mockResolvedValueOnce([
      {
        id: 99,
        userId: 1,
        endpoint: "https://expired.endpoint",
        p256dh: "key",
        auth: "auth",
        active: true,
      },
    ]);
    (webpush.default.sendNotification as any).mockRejectedValueOnce({
      statusCode: 410,
      message: "Gone",
    });

    const { sendPushToUser } = await import("./pushNotification");
    const result = await sendPushToUser(1, {
      title: "Test",
      body: "Test body",
    });
    expect(result.deactivated).toBe(1);
    expect(db.deactivatePushSubscription).toHaveBeenCalledWith(99);
  });

  it("notifyOwnerNewResponse should not throw on error", async () => {
    const { notifyOwnerNewResponse } = await import("./pushNotification");
    // Should not throw even if something goes wrong internally
    await expect(
      notifyOwnerNewResponse("Cadastro PJ", "Ricardo Santos")
    ).resolves.not.toThrow();
  });

  it("notifyOwnerNewResponse should handle missing owner gracefully", async () => {
    const db = await import("./db");
    (db.getUserByOpenId as any).mockResolvedValueOnce(null);

    const { notifyOwnerNewResponse } = await import("./pushNotification");
    await expect(
      notifyOwnerNewResponse("Cadastro PJ")
    ).resolves.not.toThrow();
  });
});
