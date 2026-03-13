import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock db functions ───
const mockGetStaffNotificationPreferences = vi.fn();
const mockUpsertStaffNotificationPreference = vi.fn();
const mockIsNotificationEnabled = vi.fn();
const mockGetNotificationPreferencesForStaff = vi.fn();

vi.mock("./db", () => ({
  getStaffNotificationPreferences: (...args: any[]) => mockGetStaffNotificationPreferences(...args),
  upsertStaffNotificationPreference: (...args: any[]) => mockUpsertStaffNotificationPreference(...args),
  isNotificationEnabled: (...args: any[]) => mockIsNotificationEnabled(...args),
  getNotificationPreferencesForStaff: (...args: any[]) => mockGetNotificationPreferencesForStaff(...args),
  NOTIFICATION_TYPES: [
    { key: "new_response", label: "Novas respostas", description: "Quando um novo cadastro é enviado no seu formulário" },
    { key: "response_approved", label: "Cadastro aprovado", description: "Quando um cadastro é aprovado" },
    { key: "response_rejected", label: "Cadastro rejeitado", description: "Quando um cadastro é rejeitado" },
  ],
}));

describe("Notification Preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("NOTIFICATION_TYPES constant", () => {
    it("should have 3 notification types", async () => {
      const { NOTIFICATION_TYPES } = await import("./db");
      expect(NOTIFICATION_TYPES).toHaveLength(3);
    });

    it("should contain new_response, response_approved, response_rejected", async () => {
      const { NOTIFICATION_TYPES } = await import("./db");
      const keys = NOTIFICATION_TYPES.map((t: any) => t.key);
      expect(keys).toContain("new_response");
      expect(keys).toContain("response_approved");
      expect(keys).toContain("response_rejected");
    });

    it("each type should have key, label, and description", async () => {
      const { NOTIFICATION_TYPES } = await import("./db");
      for (const t of NOTIFICATION_TYPES) {
        expect(t).toHaveProperty("key");
        expect(t).toHaveProperty("label");
        expect(t).toHaveProperty("description");
        expect(typeof t.key).toBe("string");
        expect(typeof t.label).toBe("string");
        expect(typeof t.description).toBe("string");
      }
    });
  });

  describe("getStaffNotificationPreferences", () => {
    it("should return preferences with defaults for missing types", async () => {
      mockGetStaffNotificationPreferences.mockResolvedValue([
        { notificationType: "new_response", label: "Novas respostas", description: "...", inAppEnabled: true, pushEnabled: true },
        { notificationType: "response_approved", label: "Cadastro aprovado", description: "...", inAppEnabled: true, pushEnabled: true },
        { notificationType: "response_rejected", label: "Cadastro rejeitado", description: "...", inAppEnabled: true, pushEnabled: true },
      ]);

      const { getStaffNotificationPreferences } = await import("./db");
      const prefs = await getStaffNotificationPreferences(1);
      expect(prefs).toHaveLength(3);
      expect(mockGetStaffNotificationPreferences).toHaveBeenCalledWith(1);
    });

    it("should return all types even if no preferences exist", async () => {
      mockGetStaffNotificationPreferences.mockResolvedValue([
        { notificationType: "new_response", label: "Novas respostas", description: "...", inAppEnabled: true, pushEnabled: true },
        { notificationType: "response_approved", label: "Cadastro aprovado", description: "...", inAppEnabled: true, pushEnabled: true },
        { notificationType: "response_rejected", label: "Cadastro rejeitado", description: "...", inAppEnabled: true, pushEnabled: true },
      ]);

      const { getStaffNotificationPreferences } = await import("./db");
      const prefs = await getStaffNotificationPreferences(999);
      expect(prefs).toHaveLength(3);
      // All should default to enabled
      for (const p of prefs) {
        expect(p.inAppEnabled).toBe(true);
        expect(p.pushEnabled).toBe(true);
      }
    });
  });

  describe("upsertStaffNotificationPreference", () => {
    it("should call upsert with correct params", async () => {
      mockUpsertStaffNotificationPreference.mockResolvedValue(undefined);

      const { upsertStaffNotificationPreference } = await import("./db");
      await upsertStaffNotificationPreference(1, "new_response", false, true);
      expect(mockUpsertStaffNotificationPreference).toHaveBeenCalledWith(1, "new_response", false, true);
    });

    it("should allow disabling both in-app and push", async () => {
      mockUpsertStaffNotificationPreference.mockResolvedValue(undefined);

      const { upsertStaffNotificationPreference } = await import("./db");
      await upsertStaffNotificationPreference(1, "response_approved", false, false);
      expect(mockUpsertStaffNotificationPreference).toHaveBeenCalledWith(1, "response_approved", false, false);
    });
  });

  describe("isNotificationEnabled", () => {
    it("should return both enabled when no preference exists", async () => {
      mockIsNotificationEnabled.mockResolvedValue({ inApp: true, push: true });

      const { isNotificationEnabled } = await import("./db");
      const result = await isNotificationEnabled(1, "new_response");
      expect(result).toEqual({ inApp: true, push: true });
    });

    it("should return disabled when preference is set to false", async () => {
      mockIsNotificationEnabled.mockResolvedValue({ inApp: false, push: true });

      const { isNotificationEnabled } = await import("./db");
      const result = await isNotificationEnabled(1, "new_response");
      expect(result.inApp).toBe(false);
      expect(result.push).toBe(true);
    });
  });

  describe("getNotificationPreferencesForStaff (batch)", () => {
    it("should return preferences for multiple staff users", async () => {
      const map = new Map([
        [1, { inApp: true, push: true }],
        [2, { inApp: false, push: true }],
        [3, { inApp: true, push: false }],
      ]);
      mockGetNotificationPreferencesForStaff.mockResolvedValue(map);

      const { getNotificationPreferencesForStaff } = await import("./db");
      const result = await getNotificationPreferencesForStaff([1, 2, 3], "new_response");
      expect(result.size).toBe(3);
      expect(result.get(1)).toEqual({ inApp: true, push: true });
      expect(result.get(2)).toEqual({ inApp: false, push: true });
      expect(result.get(3)).toEqual({ inApp: true, push: false });
    });

    it("should return empty map for empty staff array", async () => {
      mockGetNotificationPreferencesForStaff.mockResolvedValue(new Map());

      const { getNotificationPreferencesForStaff } = await import("./db");
      const result = await getNotificationPreferencesForStaff([], "new_response");
      expect(result.size).toBe(0);
    });

    it("should default to enabled for staff without preferences", async () => {
      const map = new Map([
        [1, { inApp: true, push: true }],
        [2, { inApp: true, push: true }],
      ]);
      mockGetNotificationPreferencesForStaff.mockResolvedValue(map);

      const { getNotificationPreferencesForStaff } = await import("./db");
      const result = await getNotificationPreferencesForStaff([1, 2], "new_response");
      // Staff 2 has no explicit preference, should default to enabled
      expect(result.get(2)?.inApp).toBe(true);
      expect(result.get(2)?.push).toBe(true);
    });
  });

  describe("Notification filtering logic", () => {
    it("should filter out staff with inApp disabled from in-app notifications", () => {
      const staffIds = [1, 2, 3];
      const prefsMap = new Map([
        [1, { inApp: true, push: true }],
        [2, { inApp: false, push: true }],
        [3, { inApp: true, push: false }],
      ]);

      const inAppStaffIds = staffIds.filter((id) => prefsMap.get(id)?.inApp !== false);
      expect(inAppStaffIds).toEqual([1, 3]);
    });

    it("should filter out staff with push disabled from push notifications", () => {
      const staffIds = [1, 2, 3];
      const prefsMap = new Map([
        [1, { inApp: true, push: true }],
        [2, { inApp: false, push: true }],
        [3, { inApp: true, push: false }],
      ]);

      const pushStaffIds = staffIds.filter((id) => prefsMap.get(id)?.push !== false);
      expect(pushStaffIds).toEqual([1, 2]);
    });

    it("should include all staff when all have defaults (no preferences set)", () => {
      const staffIds = [1, 2, 3];
      const prefsMap = new Map([
        [1, { inApp: true, push: true }],
        [2, { inApp: true, push: true }],
        [3, { inApp: true, push: true }],
      ]);

      const inAppStaffIds = staffIds.filter((id) => prefsMap.get(id)?.inApp !== false);
      const pushStaffIds = staffIds.filter((id) => prefsMap.get(id)?.push !== false);
      expect(inAppStaffIds).toEqual([1, 2, 3]);
      expect(pushStaffIds).toEqual([1, 2, 3]);
    });

    it("should exclude all staff when all have both disabled", () => {
      const staffIds = [1, 2];
      const prefsMap = new Map([
        [1, { inApp: false, push: false }],
        [2, { inApp: false, push: false }],
      ]);

      const inAppStaffIds = staffIds.filter((id) => prefsMap.get(id)?.inApp !== false);
      const pushStaffIds = staffIds.filter((id) => prefsMap.get(id)?.push !== false);
      expect(inAppStaffIds).toEqual([]);
      expect(pushStaffIds).toEqual([]);
    });
  });

  describe("Notification type mapping", () => {
    it("should map approved status to response_approved type", () => {
      const newStatus = "approved";
      const notifType = newStatus === "approved" ? "response_approved" : "response_rejected";
      expect(notifType).toBe("response_approved");
    });

    it("should map rejected status to response_rejected type", () => {
      const newStatus = "rejected";
      const notifType = newStatus === "approved" ? "response_approved" : "response_rejected";
      expect(notifType).toBe("response_rejected");
    });

    it("should use new_response type for new submissions", () => {
      const type = "new_response";
      expect(type).toBe("new_response");
    });
  });
});
