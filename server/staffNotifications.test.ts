import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for staff in-app notifications:
 * - staffNotifications.list
 * - staffNotifications.unreadCount
 * - staffNotifications.markRead
 * - staffNotifications.markAllRead
 * - Notification creation on response submit
 */

// ─── Mock db module ───
vi.mock("./db", () => ({
  getFormsByUser: vi.fn(),
  getFormBySlug: vi.fn(),
  getFormById: vi.fn(),
  createForm: vi.fn(),
  updateForm: vi.fn(),
  deleteForm: vi.fn(),
  duplicateForm: vi.fn(),
  createResponse: vi.fn(),
  getResponsesByForm: vi.fn(),
  getResponsesByFormWithSearch: vi.fn(),
  getResponseById: vi.fn(),
  updateResponse: vi.fn(),
  createVersion: vi.fn(),
  getVersionsByForm: vi.fn(),
  getVersionById: vi.fn(),
  deleteVersion: vi.fn(),
  createFileRecord: vi.fn(),
  getFilesByForm: vi.fn(),
  deleteFileRecord: vi.fn(),
  createWorkspace: vi.fn(),
  getWorkspacesByUser: vi.fn(),
  getWorkspaceById: vi.fn(),
  updateWorkspace: vi.fn(),
  deleteWorkspace: vi.fn(),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  createCorretor: vi.fn(),
  getCorretoresByUser: vi.fn(),
  getCorretorById: vi.fn(),
  updateCorretor: vi.fn(),
  deleteCorretor: vi.fn(),
  getCorretoresByForm: vi.fn(),
  getActiveCorretoresByForm: vi.fn(),
  setFormCorretores: vi.fn(),
  toggleFormCorretorNotification: vi.fn(),
  logActivity: vi.fn().mockResolvedValue({ id: 1 }),
  getActivityTimeline: vi.fn().mockResolvedValue([]),
  // Form assignments
  getFormAssignments: vi.fn(),
  getFormAssignmentsBatch: vi.fn(),
  setFormAssignments: vi.fn(),
  getFormIdsByStaff: vi.fn(),
  // Staff notifications
  getStaffNotifications: vi.fn(),
  countUnreadStaffNotifications: vi.fn(),
  markStaffNotificationRead: vi.fn(),
  markAllStaffNotificationsRead: vi.fn(),
  createStaffNotification: vi.fn(),
  createStaffNotificationsBatch: vi.fn(),
  // Notification preferences
  getNotificationPreferencesForStaff: vi.fn().mockImplementation((staffIds: number[]) => {
    // Default: all enabled
    const map = new Map();
    for (const id of staffIds) {
      map.set(id, { inApp: true, push: true });
    }
    return Promise.resolve(map);
  }),
  getStaffNotificationPreferences: vi.fn(),
  upsertStaffNotificationPreference: vi.fn(),
  isNotificationEnabled: vi.fn(),
  NOTIFICATION_TYPES: [
    { key: "new_response", label: "Novas respostas", description: "..." },
    { key: "response_approved", label: "Cadastro aprovado", description: "..." },
    { key: "response_rejected", label: "Cadastro rejeitado", description: "..." },
  ],
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.png" }),
}));

vi.mock("./emailService", () => ({
  sendProtocolEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./pushNotification", () => ({
  notifyOwnerNewResponse: vi.fn().mockResolvedValue(undefined),
  notifyCorretorPush: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./corretorNotification", () => ({
  notifyCorretoresNewSubmission: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    appId: "test-app",
    cookieSecret: "test-secret",
    databaseUrl: "",
    oAuthServerUrl: "",
    ownerOpenId: "owner-open-id",
    isProduction: false,
    forgeApiUrl: "",
    forgeApiKey: "",
  },
}));

import * as db from "./db";

// ─── Helpers ───

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

const ownerUser: AuthenticatedUser = {
  id: 100,
  openId: "owner-open-id",
  email: "owner@example.com",
  name: "Owner",
  loginMethod: "manus",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createStaffContext(staffUserId = 1, role = "corretor"): TrpcContext {
  const user: AuthenticatedUser = {
    id: staffUserId,
    openId: "test-user-open-id",
    email: "test@example.com",
    name: "Test Corretor",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    customSession: {
      type: "staff" as const,
      staffUserId,
      email: "test@example.com",
      role,
      name: "Test Corretor",
    },
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as any,
    res: {
      setHeader: vi.fn(),
    } as any,
  };
}

const caller = (ctx: TrpcContext) => appRouter.createCaller(ctx);

// ─── Tests ───

describe("Staff In-App Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getUserByOpenId).mockResolvedValue(ownerUser as any);
  });

  describe("staffNotifications.list", () => {
    it("returns notifications for the current staff user", async () => {
      const mockNotifications = [
        {
          id: 1,
          staffUserId: 1,
          type: "new_response",
          title: "📋 Nova resposta em Formulário Teste",
          body: "João enviou uma resposta",
          isRead: false,
          link: "/corretor/respostas",
          metadata: { formId: 100 },
          createdAt: new Date(),
        },
        {
          id: 2,
          staffUserId: 1,
          type: "new_response",
          title: "📋 Nova resposta parcial em Formulário Teste",
          body: "Maria iniciou uma resposta",
          isRead: true,
          link: "/corretor/respostas",
          metadata: { formId: 100, isComplete: false },
          createdAt: new Date(),
        },
      ];
      vi.mocked(db.getStaffNotifications).mockResolvedValue(mockNotifications);

      const ctx = createStaffContext(1, "corretor");
      const result = await caller(ctx).staffNotifications.list({ limit: 50 });

      expect(result).toHaveLength(2);
      expect(db.getStaffNotifications).toHaveBeenCalledWith(1, 50, 0);
    });

    it("returns empty array when no staffUserId in session", async () => {
      const ctx = createStaffContext(1, "corretor");
      (ctx.customSession as any).staffUserId = undefined;
      const result = await caller(ctx).staffNotifications.list();
      expect(result).toEqual([]);
    });
  });

  describe("staffNotifications.unreadCount", () => {
    it("returns unread count for the current staff user", async () => {
      vi.mocked(db.countUnreadStaffNotifications).mockResolvedValue(5);

      const ctx = createStaffContext(1, "corretor");
      const result = await caller(ctx).staffNotifications.unreadCount();

      expect(result).toBe(5);
      expect(db.countUnreadStaffNotifications).toHaveBeenCalledWith(1);
    });

    it("returns 0 when no staffUserId in session", async () => {
      const ctx = createStaffContext(1, "corretor");
      (ctx.customSession as any).staffUserId = undefined;
      const result = await caller(ctx).staffNotifications.unreadCount();
      expect(result).toBe(0);
    });
  });

  describe("staffNotifications.markRead", () => {
    it("marks a specific notification as read", async () => {
      vi.mocked(db.markStaffNotificationRead).mockResolvedValue(undefined);

      const ctx = createStaffContext(1, "corretor");
      await caller(ctx).staffNotifications.markRead({ id: 42 });

      expect(db.markStaffNotificationRead).toHaveBeenCalledWith(42, 1);
    });
  });

  describe("staffNotifications.markAllRead", () => {
    it("marks all notifications as read for the current staff user", async () => {
      vi.mocked(db.markAllStaffNotificationsRead).mockResolvedValue(undefined);

      const ctx = createStaffContext(1, "corretor");
      await caller(ctx).staffNotifications.markAllRead();

      expect(db.markAllStaffNotificationsRead).toHaveBeenCalledWith(1);
    });
  });

  describe("Notification creation on response submit", () => {
    it("creates in-app notifications for all assigned staff when response is submitted", async () => {
      const mockForm = {
        id: 100,
        title: "Formulário Teste",
        userId: 100,
        questions: [],
        assignedCorretorId: null,
      };
      vi.mocked(db.createResponse).mockResolvedValue({
        id: 1,
        protocolCode: "ABC123",
        formId: 100,
      } as any);
      vi.mocked(db.getFormById).mockResolvedValue(mockForm as any);
      vi.mocked(db.getActiveCorretoresByForm).mockResolvedValue([]);
      vi.mocked(db.getFormAssignments).mockResolvedValue([
        { id: 1, formId: 100, staffUserId: 10, assignedBy: null, createdAt: new Date() },
        { id: 2, formId: 100, staffUserId: 20, assignedBy: null, createdAt: new Date() },
      ]);
      vi.mocked(db.createStaffNotificationsBatch).mockResolvedValue(undefined);

      const ctx: TrpcContext = {
        user: null,
        customSession: null,
        req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
        res: { setHeader: vi.fn() } as any,
      };

      await caller(ctx).responses.submit({
        formId: 100,
        answers: { q1: "answer" },
        respondentName: "João Silva",
        respondentEmail: "joao@test.com",
        isComplete: true,
      });

      // Verify in-app notifications were created for both assigned staff
      expect(db.createStaffNotificationsBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            staffUserId: 10,
            type: "new_response",
            title: "✅ Novo cadastro realizado com sucesso!",
          }),
          expect.objectContaining({
            staffUserId: 20,
            type: "new_response",
            title: "✅ Novo cadastro realizado com sucesso!",
          }),
        ])
      );
    });

    it("creates in-app notifications even for incomplete/partial responses", async () => {
      const mockForm = {
        id: 100,
        title: "Formulário Teste",
        userId: 100,
        questions: [],
        assignedCorretorId: null,
      };
      vi.mocked(db.createResponse).mockResolvedValue({
        id: 2,
        protocolCode: null,
        formId: 100,
      } as any);
      vi.mocked(db.getFormById).mockResolvedValue(mockForm as any);
      vi.mocked(db.getActiveCorretoresByForm).mockResolvedValue([]);
      vi.mocked(db.getFormAssignments).mockResolvedValue([
        { id: 1, formId: 100, staffUserId: 10, assignedBy: null, createdAt: new Date() },
      ]);
      vi.mocked(db.createStaffNotificationsBatch).mockResolvedValue(undefined);

      const ctx: TrpcContext = {
        user: null,
        customSession: null,
        req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
        res: { setHeader: vi.fn() } as any,
      };

      await caller(ctx).responses.submit({
        formId: 100,
        answers: { q1: "partial" },
        respondentName: "Maria",
        isComplete: false,
      });

      // Verify notification was created even for partial response
      expect(db.createStaffNotificationsBatch).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            staffUserId: 10,
            type: "new_response",
            metadata: expect.objectContaining({ isComplete: false }),
          }),
        ])
      );
    });

    it("does not create in-app notifications when no staff is assigned", async () => {
      const mockForm = {
        id: 100,
        title: "Formulário Teste",
        userId: 100,
        questions: [],
        assignedCorretorId: null,
      };
      vi.mocked(db.createResponse).mockResolvedValue({
        id: 3,
        protocolCode: "DEF456",
        formId: 100,
      } as any);
      vi.mocked(db.getFormById).mockResolvedValue(mockForm as any);
      vi.mocked(db.getActiveCorretoresByForm).mockResolvedValue([]);
      vi.mocked(db.getFormAssignments).mockResolvedValue([]);

      const ctx: TrpcContext = {
        user: null,
        customSession: null,
        req: { protocol: "https", headers: {}, ip: "127.0.0.1" } as any,
        res: { setHeader: vi.fn() } as any,
      };

      await caller(ctx).responses.submit({
        formId: 100,
        answers: { q1: "answer" },
        isComplete: true,
      });

      // Should NOT create in-app notifications
      expect(db.createStaffNotificationsBatch).not.toHaveBeenCalled();
    });
  });
});
