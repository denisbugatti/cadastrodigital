import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for form assignment feature:
 * - forms.getAssignments
 * - forms.getAssignmentsBatch
 * - forms.setAssignments
 * - forms.list filtering by assignments for gerentes
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
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.png" }),
}));

vi.mock("./emailService", () => ({
  sendProtocolEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("./pushNotification", () => ({
  notifyOwnerNewResponse: vi.fn().mockResolvedValue(undefined),
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

function createAuthContext(userId = 1, role = "master"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-open-id",
    email: "test@example.com",
    name: "Test User",
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
      staffUserId: userId,
      email: "test@example.com",
      role,
      name: "Test User",
    },
    req: {
      protocol: "https",
      headers: {},
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "user-agent": "test-agent" },
      ip: "127.0.0.1",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

const sampleForm = {
  id: 1,
  slug: "test_form_abc",
  userId: 1,
  title: "Test Form",
  description: "A test form",
  questions: [{ id: "q1", type: "short-text", title: "Name?" }],
  design: { backgroundColor: "#FFFFFF" },
  webhook: null,
  sharing: null,
  workspaceId: null,
  status: "draft",
  color: "#0D8BD9",
  responseCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleForm2 = {
  ...sampleForm,
  id: 2,
  slug: "test_form_def",
  title: "Test Form 2",
};

const sampleForm3 = {
  ...sampleForm,
  id: 3,
  slug: "test_form_ghi",
  title: "Test Form 3",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.getUserByOpenId).mockResolvedValue(ownerUser as any);
});

// ─── Form Assignments ───

describe("forms.getAssignments", () => {
  it("returns assignments for a form (master)", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormAssignments).mockResolvedValue([
      { id: 1, formId: 1, staffUserId: 10, assignedBy: 1, createdAt: new Date() },
      { id: 2, formId: 1, staffUserId: 20, assignedBy: 1, createdAt: new Date() },
    ] as any);

    const result = await caller.forms.getAssignments({ formId: 1 });

    expect(db.getFormAssignments).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(2);
    expect(result[0].staffUserId).toBe(10);
    expect(result[1].staffUserId).toBe(20);
  });

  it("returns empty array when no assignments exist", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormAssignments).mockResolvedValue([]);

    const result = await caller.forms.getAssignments({ formId: 99 });

    expect(result).toHaveLength(0);
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.forms.getAssignments({ formId: 1 })).rejects.toThrow();
  });

  it("rejects corretor access", async () => {
    const ctx = createAuthContext(1, "corretor");
    const caller = appRouter.createCaller(ctx);

    await expect(caller.forms.getAssignments({ formId: 1 })).rejects.toThrow();
  });

  it("allows gerente access", async () => {
    const ctx = createAuthContext(1, "gerente");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormAssignments).mockResolvedValue([]);

    const result = await caller.forms.getAssignments({ formId: 1 });
    expect(result).toHaveLength(0);
  });
});

describe("forms.getAssignmentsBatch", () => {
  it("returns batch assignments for multiple forms", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormAssignmentsBatch).mockResolvedValue({
      1: [10, 20],
      2: [30],
    });

    const result = await caller.forms.getAssignmentsBatch({ formIds: [1, 2, 3] });

    expect(db.getFormAssignmentsBatch).toHaveBeenCalledWith([1, 2, 3]);
    expect(result).toEqual({ 1: [10, 20], 2: [30] });
  });

  it("returns empty object for empty formIds", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormAssignmentsBatch).mockResolvedValue({});

    const result = await caller.forms.getAssignmentsBatch({ formIds: [] });
    expect(result).toEqual({});
  });
});

describe("forms.setAssignments", () => {
  it("sets assignments for a form (master)", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getFormAssignments).mockResolvedValue([]);
    vi.mocked(db.setFormAssignments).mockResolvedValue(undefined);

    const result = await caller.forms.setAssignments({
      formId: 1,
      staffUserIds: [10, 20, 30],
    });

    expect(result.success).toBe(true);
    expect(db.setFormAssignments).toHaveBeenCalledWith(1, [10, 20, 30], 1);
  });

  it("sets assignments for a form (diretor)", async () => {
    const ctx = createAuthContext(2, "diretor");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getFormAssignments).mockResolvedValue([]);
    vi.mocked(db.setFormAssignments).mockResolvedValue(undefined);

    const result = await caller.forms.setAssignments({
      formId: 1,
      staffUserIds: [10],
    });

    expect(result.success).toBe(true);
  });

  it("rejects gerente from setting assignments", async () => {
    const ctx = createAuthContext(1, "gerente");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.forms.setAssignments({ formId: 1, staffUserIds: [10] })
    ).rejects.toThrow();
  });

  it("rejects corretor from setting assignments", async () => {
    const ctx = createAuthContext(1, "corretor");
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.forms.setAssignments({ formId: 1, staffUserIds: [10] })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.forms.setAssignments({ formId: 1, staffUserIds: [10] })
    ).rejects.toThrow();
  });

  it("throws NOT_FOUND for non-existent form", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(null);

    await expect(
      caller.forms.setAssignments({ formId: 999, staffUserIds: [10] })
    ).rejects.toThrow("Formulário não encontrado");
  });

  it("can clear all assignments", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getFormAssignments).mockResolvedValue([
      { id: 1, formId: 1, staffUserId: 10, assignedBy: 1, createdAt: new Date() },
    ] as any);
    vi.mocked(db.setFormAssignments).mockResolvedValue(undefined);

    const result = await caller.forms.setAssignments({
      formId: 1,
      staffUserIds: [],
    });

    expect(result.success).toBe(true);
    expect(db.setFormAssignments).toHaveBeenCalledWith(1, [], 1);
  });
});

describe("forms.list filtering by assignments for gerentes", () => {
  it("master sees all forms regardless of assignments", async () => {
    const ctx = createAuthContext(1, "master");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormsByUser).mockResolvedValue([sampleForm, sampleForm2, sampleForm3] as any);

    const result = await caller.forms.list();

    expect(result).toHaveLength(3);
    // getFormIdsByStaff should NOT be called for master
    expect(db.getFormIdsByStaff).not.toHaveBeenCalled();
  });

  it("diretor sees all forms regardless of assignments", async () => {
    const ctx = createAuthContext(2, "diretor");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormsByUser).mockResolvedValue([sampleForm, sampleForm2, sampleForm3] as any);

    const result = await caller.forms.list();

    expect(result).toHaveLength(3);
    expect(db.getFormIdsByStaff).not.toHaveBeenCalled();
  });

  it("gerente sees only assigned forms when assignments exist", async () => {
    const ctx = createAuthContext(5, "gerente");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormsByUser).mockResolvedValue([sampleForm, sampleForm2, sampleForm3] as any);
    vi.mocked(db.getFormIdsByStaff).mockResolvedValue([1, 3]); // assigned to forms 1 and 3

    const result = await caller.forms.list();

    expect(db.getFormIdsByStaff).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(2);
    expect(result.map((f: any) => f.id)).toEqual([1, 3]);
  });

  it("gerente sees all forms when no assignments exist (backward compat)", async () => {
    const ctx = createAuthContext(5, "gerente");
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormsByUser).mockResolvedValue([sampleForm, sampleForm2, sampleForm3] as any);
    vi.mocked(db.getFormIdsByStaff).mockResolvedValue([]); // no assignments

    const result = await caller.forms.list();

    expect(db.getFormIdsByStaff).toHaveBeenCalledWith(5);
    expect(result).toHaveLength(3); // sees all forms (backward compat)
  });
});
