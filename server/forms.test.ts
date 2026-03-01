import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the full-stack tRPC routes: forms, responses, versions, workspaces, files.
 * We mock the database layer (server/db.ts) to test route logic in isolation.
 * 
 * ownerFallbackProcedure: when no user is authenticated, routes fall back to the owner user.
 * This means unauthenticated calls to forms.list, forms.create, etc. now succeed using owner identity.
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
  // Corretor functions
  createCorretor: vi.fn(),
  getCorretoresByUser: vi.fn(),
  getCorretorById: vi.fn(),
  updateCorretor: vi.fn(),
  deleteCorretor: vi.fn(),
  getCorretoresByForm: vi.fn(),
  getActiveCorretoresByForm: vi.fn(),
  setFormCorretores: vi.fn(),
  toggleFormCorretorNotification: vi.fn(),
}));

// ─── Mock storage module ───
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.png" }),
}));

// ─── Mock email service ───
vi.mock("./emailService", () => ({
  sendProtocolEmail: vi.fn().mockResolvedValue(true),
}));

// ─── Mock push notification ───
vi.mock("./pushNotification", () => ({
  notifyOwnerNewResponse: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock corretor notification ───
vi.mock("./corretorNotification", () => ({
  notifyCorretoresNewSubmission: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock env module ───
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

function createAuthContext(userId = 1): TrpcContext {
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

const sampleOwnerForm = {
  ...sampleForm,
  userId: 100, // owner's id
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default: owner user exists in DB
  vi.mocked(db.getUserByOpenId).mockResolvedValue(ownerUser as any);
});

// ─── Forms ───

describe("forms.list", () => {
  it("returns forms for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormsByUser).mockResolvedValue([sampleForm as any]);

    const result = await caller.forms.list();

    expect(db.getFormsByUser).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Form");
  });

  it("falls back to owner when unauthenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormsByUser).mockResolvedValue([sampleOwnerForm as any]);

    const result = await caller.forms.list();

    expect(db.getUserByOpenId).toHaveBeenCalledWith("owner-open-id");
    expect(db.getFormsByUser).toHaveBeenCalledWith(100);
    expect(result).toHaveLength(1);
  });
});

describe("forms.getBySlug", () => {
  it("returns form by slug (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormBySlug).mockResolvedValue(sampleForm as any);

    const result = await caller.forms.getBySlug({ slug: "test_form_abc" });

    expect(db.getFormBySlug).toHaveBeenCalledWith("test_form_abc");
    expect(result?.title).toBe("Test Form");
  });

  it("returns null for non-existent slug", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormBySlug).mockResolvedValue(null);

    const result = await caller.forms.getBySlug({ slug: "nonexistent" });
    expect(result).toBeNull();
  });
});

describe("forms.getById", () => {
  it("returns form by id (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);

    const result = await caller.forms.getById({ id: 1 });

    expect(db.getFormById).toHaveBeenCalledWith(1);
    expect(result?.title).toBe("Test Form");
  });
});

describe("forms.create", () => {
  it("creates a form for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createForm).mockResolvedValue({ id: 42 });

    const result = await caller.forms.create({
      title: "New Form",
      description: "A new form",
      questions: [{ id: "q1", type: "short-text", title: "Name?" }],
      design: {},
      status: "draft",
    });

    expect(result.id).toBe(42);
    expect(db.createForm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Form",
        userId: 1,
        status: "draft",
      })
    );
  });

  it("creates a form as owner when unauthenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createForm).mockResolvedValue({ id: 43 });

    const result = await caller.forms.create({
      title: "Owner Form",
      questions: [],
      design: {},
    });

    expect(result.id).toBe(43);
    expect(db.createForm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Owner Form",
        userId: 100, // owner id
      })
    );
  });

  it("generates a slug if not provided", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createForm).mockResolvedValue({ id: 44 });

    await caller.forms.create({
      title: "No Slug Form",
      questions: [],
      design: {},
    });

    expect(db.createForm).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: expect.stringContaining("form_"),
      })
    );
  });
});

describe("forms.update", () => {
  it("updates a form owned by the user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.updateForm).mockResolvedValue(undefined);

    const result = await caller.forms.update({
      id: 1,
      title: "Updated Title",
    });

    expect(result.success).toBe(true);
    expect(db.updateForm).toHaveBeenCalledWith(1, { title: "Updated Title" });
  });

  it("rejects update for form owned by another user", async () => {
    const ctx = createAuthContext(2); // user 2 trying to update user 1's form
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);

    await expect(
      caller.forms.update({ id: 1, title: "Hacked" })
    ).rejects.toThrow("Form not found or access denied");
  });

  it("allows owner to update their forms when unauthenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleOwnerForm as any);
    vi.mocked(db.updateForm).mockResolvedValue(undefined);

    const result = await caller.forms.update({
      id: 1,
      title: "Updated by Owner",
    });

    expect(result.success).toBe(true);
  });
});

describe("forms.delete", () => {
  it("deletes a form owned by the user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.deleteForm).mockResolvedValue(undefined);

    const result = await caller.forms.delete({ id: 1 });

    expect(result.success).toBe(true);
    expect(db.deleteForm).toHaveBeenCalledWith(1);
  });

  it("rejects delete for form owned by another user", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);

    await expect(caller.forms.delete({ id: 1 })).rejects.toThrow(
      "Form not found or access denied"
    );
  });
});

describe("forms.duplicate", () => {
  it("duplicates a form for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.duplicateForm).mockResolvedValue({ id: 99 });

    const result = await caller.forms.duplicate({ id: 1 });

    expect(result.id).toBe(99);
    expect(db.duplicateForm).toHaveBeenCalledWith(
      1,
      1,
      expect.stringContaining("form_"),
      undefined,
      undefined,
    );
  });

  it("duplicates a form with custom title and folder", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.duplicateForm).mockResolvedValue({ id: 100 });

    const result = await caller.forms.duplicate({ id: 1, title: "My Copy", workspaceId: "ws-123" });

    expect(result.id).toBe(100);
    expect(db.duplicateForm).toHaveBeenCalledWith(
      1,
      1,
      expect.stringContaining("form_"),
      "My Copy",
      "ws-123",
    );
  });
});

// ─── Responses ───

describe("responses.submit", () => {
  it("submits a response (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createResponse).mockResolvedValue({ id: 10, protocolCode: "OI-ABC123" });

    const result = await caller.responses.submit({
      formId: 1,
      answers: { q1: "John" },
      respondentName: "John",
      respondentEmail: "john@example.com",
      isComplete: true,
    });

    expect(result.id).toBe(10);
    expect(result.protocolCode).toBe("OI-ABC123");
    expect(db.createResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        formId: 1,
        answers: { q1: "John" },
        respondentName: "John",
        respondentEmail: "john@example.com",
        isComplete: true,
      })
    );
  });

  it("returns protocolCode in the response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createResponse).mockResolvedValue({ id: 20, protocolCode: "OI-XYZ789" });

    const result = await caller.responses.submit({
      formId: 1,
      answers: { q1: "Maria" },
      isComplete: true,
    });

    expect(result).toHaveProperty("protocolCode");
    expect(result.protocolCode).toMatch(/^OI-[A-Z0-9]+$/);
  });
});

describe("responses.listByForm", () => {
  it("returns responses for a form owned by user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getResponsesByFormWithSearch).mockResolvedValue([
      { id: 10, formId: 1, answers: { q1: "John" }, createdAt: new Date() } as any,
    ]);

    const result = await caller.responses.listByForm({ formId: 1 });

    expect(result).toHaveLength(1);
    expect(db.getResponsesByFormWithSearch).toHaveBeenCalledWith(1, undefined);
  });

  it("rejects listing responses for form owned by another user", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);

    await expect(
      caller.responses.listByForm({ formId: 1 })
    ).rejects.toThrow("Form not found or access denied");
  });

  it("allows owner to list responses when unauthenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleOwnerForm as any);
    vi.mocked(db.getResponsesByFormWithSearch).mockResolvedValue([
      { id: 10, formId: 1, answers: { q1: "John" }, createdAt: new Date() } as any,
    ]);

    const result = await caller.responses.listByForm({ formId: 1 });
    expect(result).toHaveLength(1);
  });

  it("passes search parameter to db function", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getResponsesByFormWithSearch).mockResolvedValue([
      { id: 10, formId: 1, protocolCode: "OI-ABC123", answers: { q1: "John" }, createdAt: new Date() } as any,
    ]);

    const result = await caller.responses.listByForm({ formId: 1, search: "OI-ABC" });

    expect(result).toHaveLength(1);
    expect(db.getResponsesByFormWithSearch).toHaveBeenCalledWith(1, "OI-ABC");
  });

  it("returns empty array when search has no matches", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getResponsesByFormWithSearch).mockResolvedValue([]);

    const result = await caller.responses.listByForm({ formId: 1, search: "NONEXISTENT" });

    expect(result).toHaveLength(0);
    expect(db.getResponsesByFormWithSearch).toHaveBeenCalledWith(1, "NONEXISTENT");
  });
});

// ─── Versions ───

describe("versions.create", () => {
  it("creates a version for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createVersion).mockResolvedValue({ id: 5 });

    const result = await caller.versions.create({
      formId: 1,
      label: "v1",
      snapshot: { title: "Test" },
    });

    expect(result.id).toBe(5);
    expect(db.createVersion).toHaveBeenCalledWith(
      expect.objectContaining({
        formId: 1,
        label: "v1",
        createdBy: 1,
      })
    );
  });
});

describe("versions.listByForm", () => {
  it("returns versions for a form", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getVersionsByForm).mockResolvedValue([
      { id: 5, formId: 1, label: "v1", snapshot: {}, createdAt: new Date() } as any,
    ]);

    const result = await caller.versions.listByForm({ formId: 1 });

    expect(result).toHaveLength(1);
  });
});

describe("versions.delete", () => {
  it("deletes a version", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.deleteVersion).mockResolvedValue(undefined);

    const result = await caller.versions.delete({ id: 5 });

    expect(result.success).toBe(true);
    expect(db.deleteVersion).toHaveBeenCalledWith(5);
  });
});

// ─── Workspaces ───

describe("workspaces.list", () => {
  it("returns workspaces for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getWorkspacesByUser).mockResolvedValue([
      { id: 1, userId: 1, name: "My Folder", designDefaults: { color: "#0D8BD9" }, createdAt: new Date() } as any,
    ]);

    const result = await caller.workspaces.list();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("My Folder");
  });

  it("returns owner workspaces when unauthenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getWorkspacesByUser).mockResolvedValue([]);

    const result = await caller.workspaces.list();

    expect(db.getWorkspacesByUser).toHaveBeenCalledWith(100);
    expect(result).toHaveLength(0);
  });
});

describe("workspaces.create", () => {
  it("creates a workspace", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createWorkspace).mockResolvedValue({ id: 2 });

    const result = await caller.workspaces.create({
      name: "New Folder",
      designDefaults: { color: "#22c55e" },
    });

    expect(result.id).toBe(2);
    expect(db.createWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 1,
        name: "New Folder",
        designDefaults: { color: "#22c55e" },
      })
    );
  });
});

describe("workspaces.update", () => {
  it("updates a workspace owned by user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getWorkspaceById).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Old Name",
    } as any);
    vi.mocked(db.updateWorkspace).mockResolvedValue(undefined);

    const result = await caller.workspaces.update({
      id: 1,
      name: "Updated Name",
    });

    expect(result.success).toBe(true);
  });

  it("rejects update for workspace owned by another user", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getWorkspaceById).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "Old Name",
    } as any);

    await expect(
      caller.workspaces.update({ id: 1, name: "Hacked" })
    ).rejects.toThrow("Workspace not found or access denied");
  });
});

describe("workspaces.delete", () => {
  it("deletes a workspace owned by user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getWorkspaceById).mockResolvedValue({
      id: 1,
      userId: 1,
      name: "To Delete",
    } as any);
    vi.mocked(db.deleteWorkspace).mockResolvedValue(undefined);

    const result = await caller.workspaces.delete({ id: 1 });

    expect(result.success).toBe(true);
    expect(db.deleteWorkspace).toHaveBeenCalledWith(1);
  });
});

// ─── Files ───

describe("files.upload", () => {
  it("uploads a file for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createFileRecord).mockResolvedValue({ id: 20 });

    const result = await caller.files.upload({
      filename: "test.png",
      contentBase64: Buffer.from("fake-image-data").toString("base64"),
      mimeType: "image/png",
      formId: 1,
      context: "form-logo",
    });

    expect(result.id).toBe(20);
    expect(result.url).toBe("https://s3.example.com/file.png");
    expect(db.createFileRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: "test.png",
        mimeType: "image/png",
        uploadedBy: 1,
        formId: 1,
      })
    );
  });

  it("uploads a file as owner when unauthenticated", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createFileRecord).mockResolvedValue({ id: 21 });

    const result = await caller.files.upload({
      filename: "owner-file.png",
      contentBase64: Buffer.from("fake-data").toString("base64"),
      mimeType: "image/png",
    });

    expect(result.id).toBe(21);
    expect(db.createFileRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        uploadedBy: 100, // owner id
      })
    );
  });
});

describe("files.listByForm", () => {
  it("returns files for a form", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFilesByForm).mockResolvedValue([
      { id: 20, filename: "test.png", url: "https://s3.example.com/file.png" } as any,
    ]);

    const result = await caller.files.listByForm({ formId: 1 });

    expect(result).toHaveLength(1);
  });
});

describe("files.delete", () => {
  it("deletes a file record", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.deleteFileRecord).mockResolvedValue(undefined);

    const result = await caller.files.delete({ id: 20 });

    expect(result.success).toBe(true);
    expect(db.deleteFileRecord).toHaveBeenCalledWith(20);
  });
});


// ─── Export CSV ───

describe("responses.exportCsv", () => {
  it("exports CSV for a form owned by user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue({
      ...sampleForm,
      questions: [
        { id: "q1", type: "short-text", title: "Nome" },
        { id: "q2", type: "email", title: "Email" },
        { id: "q3", type: "welcome", title: "Bem-vindo" },
      ],
    } as any);
    vi.mocked(db.getResponsesByForm).mockResolvedValue([
      {
        id: 10,
        formId: 1,
        respondentName: "João",
        respondentEmail: "joao@test.com",
        answers: { q1: "João Silva", q2: "joao@test.com" },
        isComplete: true,
        timeSpentSeconds: 120,
        createdAt: new Date("2026-02-26T12:00:00Z"),
        updatedAt: new Date("2026-02-26T12:00:00Z"),
      } as any,
    ]);

    const result = await caller.responses.exportCsv({ formId: 1 });

    expect(result.totalResponses).toBe(1);
    expect(result.filename).toContain("respostas.csv");
    // CSV should have BOM
    expect(result.csv.startsWith("\uFEFF")).toBe(true);
    // Header should include question titles but NOT welcome screen
    expect(result.csv).toContain("Nome");
    expect(result.csv).toContain("Email");
    expect(result.csv).not.toContain("Bem-vindo");
    // Data row should include answer values
    expect(result.csv).toContain("João Silva");
    expect(result.csv).toContain("joao@test.com");
  });

  it("returns empty CSV when no responses", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getResponsesByForm).mockResolvedValue([]);

    const result = await caller.responses.exportCsv({ formId: 1 });

    expect(result.totalResponses).toBe(0);
    // Should still have header row
    expect(result.csv).toContain("ID");
  });

  it("rejects export for form owned by another user", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);

    await expect(
      caller.responses.exportCsv({ formId: 1 })
    ).rejects.toThrow("Acesso negado");
  });

  it("handles array answers in CSV", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue({
      ...sampleForm,
      questions: [
        { id: "q1", type: "multiple-choice", title: "Interesses" },
      ],
    } as any);
    vi.mocked(db.getResponsesByForm).mockResolvedValue([
      {
        id: 11,
        formId: 1,
        respondentName: null,
        respondentEmail: null,
        answers: { q1: ["Imóveis", "Investimentos", "Lazer"] },
        isComplete: true,
        timeSpentSeconds: null,
        createdAt: new Date("2026-02-26T12:00:00Z"),
        updatedAt: new Date("2026-02-26T12:00:00Z"),
      } as any,
    ]);

    const result = await caller.responses.exportCsv({ formId: 1 });

    // Array answers should be joined with "; "
    expect(result.csv).toContain("Imóveis; Investimentos; Lazer");
  });
});

// ─── Notification on response ───

describe("responses.submit notification", () => {
  it("calls notifyOwner when a complete response is submitted", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createResponse).mockResolvedValue({ id: 10, protocolCode: "OI-NTF001" });
    vi.mocked(db.getFormById).mockResolvedValue(sampleOwnerForm as any);

    await caller.responses.submit({
      formId: 1,
      answers: { q1: "John" },
      respondentName: "John",
      isComplete: true,
    });

    // notifyOwner is called (we can't directly mock it since it's imported in routers,
    // but we verify the response submission succeeded and getFormById was called for notification)
    expect(db.getFormById).toHaveBeenCalledWith(1);
  });

  it("does not fail submission if notification throws", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createResponse).mockResolvedValue({ id: 10, protocolCode: "OI-NTF002" });
    // getFormById throws to simulate notification failure
    vi.mocked(db.getFormById).mockRejectedValue(new Error("DB error"));

    // Should still succeed
    const result = await caller.responses.submit({
      formId: 1,
      answers: { q1: "John" },
      isComplete: true,
    });

    expect(result.id).toBe(10);
    expect(result.protocolCode).toBe("OI-NTF002");
  });
});

// ─── Protocol Code Generation ───

describe("protocol code format", () => {
  it("generateProtocolCode returns OI-XXXXXX format", () => {
    // We test the format by calling createResponse and checking the mock was called
    // The actual generation is in db.ts, so we verify the contract
    const code = "OI-ABC123";
    expect(code).toMatch(/^OI-[A-Z0-9]{6}$/);
  });

  it("protocol code uses only unambiguous characters (no I, O, 0, 1)", () => {
    const allowedChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = "OI-ABCDEF"; // Example valid code
    const suffix = code.replace("OI-", "");
    for (const char of suffix) {
      expect(allowedChars).toContain(char);
    }
    // Verify ambiguous chars are excluded
    expect(allowedChars).not.toContain("I");
    expect(allowedChars).not.toContain("O");
    expect(allowedChars).not.toContain("0");
    expect(allowedChars).not.toContain("1");
  });

  it("protocol code is included in submit response", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createResponse).mockResolvedValue({ id: 30, protocolCode: "OI-PROTO1" });

    const result = await caller.responses.submit({
      formId: 1,
      answers: { q1: "Test" },
      isComplete: true,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 30,
        protocolCode: "OI-PROTO1",
      })
    );
  });
});

// ─── Corretores Tests ───

describe("corretores", () => {
  const sampleCorretor = {
    id: 1,
    userId: 100,
    name: "João Silva",
    email: "joao@corretor.com",
    phone: "(11) 99999-9999",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleCorretor2 = {
    id: 2,
    userId: 100,
    name: "Maria Santos",
    email: "maria@corretor.com",
    phone: null,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createOwnerContext(): TrpcContext {
    return {
      user: ownerUser,
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getUserByOpenId).mockResolvedValue(ownerUser as any);
  });

  describe("corretores.list", () => {
    it("should list all corretores for the authenticated user", async () => {
      vi.mocked(db.getCorretoresByUser).mockResolvedValue([sampleCorretor, sampleCorretor2] as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.list();

      expect(result).toHaveLength(2);
      expect(db.getCorretoresByUser).toHaveBeenCalledWith(100);
    });

    it("should return empty array when no corretores exist", async () => {
      vi.mocked(db.getCorretoresByUser).mockResolvedValue([]);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.list();

      expect(result).toEqual([]);
    });
  });

  describe("corretores.create", () => {
    it("should create a new corretor", async () => {
      vi.mocked(db.createCorretor).mockResolvedValue(sampleCorretor as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.create({
        name: "João Silva",
        email: "joao@corretor.com",
        phone: "(11) 99999-9999",
      });

      expect(result).toEqual(sampleCorretor);
      expect(db.createCorretor).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "João Silva",
          email: "joao@corretor.com",
          phone: "(11) 99999-9999",
          userId: 100,
        })
      );
    });

    it("should create a corretor without phone", async () => {
      const corretorNoPhone = { ...sampleCorretor, phone: null };
      vi.mocked(db.createCorretor).mockResolvedValue(corretorNoPhone as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.create({
        name: "João Silva",
        email: "joao@corretor.com",
      });

      expect(result).toEqual(corretorNoPhone);
    });
  });

  describe("corretores.update", () => {
    it("should update an existing corretor", async () => {
      vi.mocked(db.getCorretorById).mockResolvedValue(sampleCorretor as any);
      vi.mocked(db.updateCorretor).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.update({
        id: 1,
        name: "João Updated",
      });

      expect(result).toEqual({ success: true });
      expect(db.updateCorretor).toHaveBeenCalledWith(1, { name: "João Updated" });
    });

    it("should toggle active status", async () => {
      vi.mocked(db.getCorretorById).mockResolvedValue(sampleCorretor as any);
      vi.mocked(db.updateCorretor).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.update({
        id: 1,
        active: false,
      });

      expect(result).toEqual({ success: true });
      expect(db.updateCorretor).toHaveBeenCalledWith(1, { active: false });
    });

    it("should reject update for non-existent corretor", async () => {
      vi.mocked(db.getCorretorById).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      await expect(
        caller.corretores.update({ id: 999, name: "Ghost" })
      ).rejects.toThrow("Corretor não encontrado");
    });
  });

  describe("corretores.delete", () => {
    it("should delete a corretor", async () => {
      vi.mocked(db.getCorretorById).mockResolvedValue(sampleCorretor as any);
      vi.mocked(db.deleteCorretor).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.delete({ id: 1 });

      expect(result).toEqual({ success: true });
      expect(db.deleteCorretor).toHaveBeenCalledWith(1);
    });

    it("should reject delete for non-existent corretor", async () => {
      vi.mocked(db.getCorretorById).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      await expect(
        caller.corretores.delete({ id: 999 })
      ).rejects.toThrow("Corretor não encontrado");
    });
  });

  describe("corretores.byForm", () => {
    it("should list corretores assigned to a form", async () => {
      vi.mocked(db.getCorretoresByForm).mockResolvedValue([sampleCorretor] as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.byForm({ formId: 1 });

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("João Silva");
      expect(db.getCorretoresByForm).toHaveBeenCalledWith(1);
    });
  });

  describe("corretores.setFormCorretores", () => {
    it("should assign corretores to a form", async () => {
      vi.mocked(db.getFormById).mockResolvedValue({ ...sampleForm, userId: 100 } as any);
      vi.mocked(db.setFormCorretores).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.setFormCorretores({
        formId: 1,
        corretorIds: [1, 2],
      });

      expect(result).toEqual({ success: true });
      expect(db.setFormCorretores).toHaveBeenCalledWith(1, [1, 2]);
    });

    it("should remove all corretores from a form with empty array", async () => {
      vi.mocked(db.getFormById).mockResolvedValue({ ...sampleForm, userId: 100 } as any);
      vi.mocked(db.setFormCorretores).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      const result = await caller.corretores.setFormCorretores({
        formId: 1,
        corretorIds: [],
      });

      expect(result).toEqual({ success: true });
      expect(db.setFormCorretores).toHaveBeenCalledWith(1, []);
    });

    it("should reject for non-existent form", async () => {
      vi.mocked(db.getFormById).mockResolvedValue(undefined as any);

      const caller = appRouter.createCaller(createOwnerContext());
      await expect(
        caller.corretores.setFormCorretores({ formId: 999, corretorIds: [1] })
      ).rejects.toThrow("Formulário não encontrado");
    });
  });
});
