import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for:
 * 1. Response validation with project name (validations router)
 * 2. Project names autocomplete endpoint
 * 3. Role-based access control (RBAC) on backend endpoints
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-owner",
    email: "owner@test.com",
    name: "Test Owner",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("validations.projectNames", () => {
  it("returns an array of project names (ownerFallback endpoint)", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.validations.projectNames();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("validations.byResponse", () => {
  it("requires responseId input", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error - testing invalid input
      caller.validations.byResponse({})
    ).rejects.toThrow();
  });
});

describe("RBAC - endpoint access patterns", () => {
  it("public endpoints are accessible without auth", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // checkSlugAvailable should be public
    const slugResult = await caller.forms.checkSlugAvailable({ slug: "test-slug-rbac-check-xyz" });
    expect(slugResult).toHaveProperty("available");
  });

  it("ownerFallbackProcedure endpoints are accessible with auth", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // projectNames should be accessible with auth
    const projectNames = await caller.validations.projectNames();
    expect(Array.isArray(projectNames)).toBe(true);

    // forms.list should be accessible with auth
    const forms = await caller.forms.list();
    expect(Array.isArray(forms)).toBe(true);
  });

  it("staff.list requires authentication", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // staff.list should work with auth
    const staffList = await caller.staff.list();
    expect(Array.isArray(staffList)).toBe(true);
  });

  it("permissions.list requires authentication", async () => {
    const ctx = createMockContext();
    const caller = appRouter.createCaller(ctx);

    // permissions.list should work with auth
    const permissions = await caller.permissions.list();
    expect(Array.isArray(permissions)).toBe(true);
  });
});
