import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the full-stack tRPC routes: forms, responses, versions, workspaces, files.
 * We mock the database layer (server/db.ts) to test route logic in isolation.
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
}));

// ─── Mock storage module ───
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.png" }),
}));

import * as db from "./db";

// ─── Helpers ───

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

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

beforeEach(() => {
  vi.clearAllMocks();
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

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.forms.list()).rejects.toThrow();
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

  it("generates a slug if not provided", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createForm).mockResolvedValue({ id: 43 });

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

  it("rejects unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.forms.create({ title: "Test", questions: [], design: {} })
    ).rejects.toThrow();
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
      expect.stringContaining("form_")
    );
  });
});

// ─── Responses ───

describe("responses.submit", () => {
  it("submits a response (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createResponse).mockResolvedValue({ id: 10 });

    const result = await caller.responses.submit({
      formId: 1,
      answers: { q1: "John" },
      respondentName: "John",
      respondentEmail: "john@example.com",
      isComplete: true,
    });

    expect(result.id).toBe(10);
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
});

describe("responses.listByForm", () => {
  it("returns responses for a form owned by user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);
    vi.mocked(db.getResponsesByForm).mockResolvedValue([
      { id: 10, formId: 1, answers: { q1: "John" }, createdAt: new Date() } as any,
    ]);

    const result = await caller.responses.listByForm({ formId: 1 });

    expect(result).toHaveLength(1);
    expect(db.getResponsesByForm).toHaveBeenCalledWith(1);
  });

  it("rejects listing responses for form owned by another user", async () => {
    const ctx = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.getFormById).mockResolvedValue(sampleForm as any);

    await expect(
      caller.responses.listByForm({ formId: 1 })
    ).rejects.toThrow("Form not found or access denied");
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
});

describe("workspaces.create", () => {
  it("creates a workspace", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    vi.mocked(db.createWorkspace).mockResolvedValue({ id: 2 });

    const result = await caller.workspaces.create({
      name: "New Folder",
      color: "#22c55e",
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
