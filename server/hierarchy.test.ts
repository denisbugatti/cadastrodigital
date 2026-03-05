import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the hierarchy management features:
 * 1. staff.gerentes — list all gerentes
 * 2. staff.corretoresWithManager — list corretores with manager info
 * 3. staff.assignManager — assign a corretor to a gerente
 * 4. corretorPerformance.byManager — per-manager performance metrics
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
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

function createStaffContext(staffRole: string, staffUserId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "staff-user",
    email: "staff@example.com",
    name: "Staff User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        cookie: `staff_token=mock-token`,
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
    customSession: {
      type: "staff" as const,
      staffUserId,
      role: staffRole,
      name: "Staff User",
      email: "staff@example.com",
    },
  };
}

// Mock the staffDb module
vi.mock("./staffDb", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getAllGerentes: vi.fn().mockResolvedValue([
      { id: 10, name: "Gerente A", email: "gerenteA@test.com", phone: null, active: true },
      { id: 20, name: "Gerente B", email: "gerenteB@test.com", phone: null, active: true },
    ]),
    getAllCorretoresWithManager: vi.fn().mockResolvedValue([
      { id: 100, name: "Corretor 1", email: "c1@test.com", phone: null, active: true, managerId: 10, invitedBy: 10 },
      { id: 101, name: "Corretor 2", email: "c2@test.com", phone: null, active: true, managerId: 20, invitedBy: 20 },
      { id: 102, name: "Corretor 3", email: "c3@test.com", phone: null, active: true, managerId: null, invitedBy: null },
    ]),
    getStaffUserById: vi.fn().mockImplementation(async (id: number) => {
      const users: Record<number, any> = {
        10: { id: 10, name: "Gerente A", email: "gerenteA@test.com", role: "gerente", active: true },
        20: { id: 20, name: "Gerente B", email: "gerenteB@test.com", role: "gerente", active: true },
        100: { id: 100, name: "Corretor 1", email: "c1@test.com", role: "corretor", active: true },
        101: { id: 101, name: "Corretor 2", email: "c2@test.com", role: "corretor", active: true },
        102: { id: 102, name: "Corretor 3", email: "c3@test.com", role: "corretor", active: true },
      };
      return users[id] || null;
    }),
    assignCorretorToManager: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock the db module for performance
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getPerformanceByManager: vi.fn().mockResolvedValue([
      {
        id: 10,
        name: "Gerente A",
        email: "gerenteA@test.com",
        active: true,
        corretorCount: 1,
        totalResponses: 50,
        completedResponses: 40,
        approvedResponses: 30,
        rejectedResponses: 5,
        pendingResponses: 10,
        inReviewResponses: 5,
        approvalRate: 60,
        rejectionRate: 10,
        avgValidationTimeMs: 3600000,
        formCount: 3,
        corretores: [
          {
            id: 100,
            name: "Corretor 1",
            totalResponses: 50,
            completedResponses: 40,
            approvedResponses: 30,
            rejectedResponses: 5,
            pendingResponses: 10,
            inReviewResponses: 5,
            approvalRate: 60,
            rejectionRate: 10,
            avgValidationTimeMs: 3600000,
            formCount: 3,
          },
        ],
      },
    ]),
  };
});

// Mock audit log
vi.mock("./auditDb", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("Hierarchy Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("staff.gerentes", () => {
    it("returns a list of all gerentes for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.gerentes();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ id: 10, name: "Gerente A" });
      expect(result[1]).toMatchObject({ id: 20, name: "Gerente B" });
    });
  });

  describe("staff.corretoresWithManager", () => {
    it("returns corretores with their manager assignments", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.corretoresWithManager();

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 100, managerId: 10 });
      expect(result[1]).toMatchObject({ id: 101, managerId: 20 });
      expect(result[2]).toMatchObject({ id: 102, managerId: null });
    });
  });

  describe("staff.assignManager", () => {
    it("assigns a corretor to a gerente", async () => {
      const ctx = createStaffContext("master", 1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.assignManager({
        corretorId: 102,
        managerId: 10,
      });

      expect(result).toEqual({ success: true });
    });

    it("allows unassigning a corretor (managerId = null)", async () => {
      const ctx = createStaffContext("master", 1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.staff.assignManager({
        corretorId: 100,
        managerId: null,
      });

      expect(result).toEqual({ success: true });
    });

    it("rejects assignment of non-corretor", async () => {
      const ctx = createStaffContext("master", 1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.staff.assignManager({
          corretorId: 10, // This is a gerente, not a corretor
          managerId: 20,
        })
      ).rejects.toThrow("Corretor não encontrado");
    });

    it("rejects assignment to non-gerente", async () => {
      const ctx = createStaffContext("master", 1);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.staff.assignManager({
          corretorId: 100,
          managerId: 101, // This is a corretor, not a gerente
        })
      ).rejects.toThrow("Gerente não encontrado");
    });
  });

  describe("corretorPerformance.byManager", () => {
    it("returns per-manager performance metrics for admin", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.corretorPerformance.byManager();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 10,
        name: "Gerente A",
        corretorCount: 1,
        totalResponses: 50,
        approvalRate: 60,
      });
      expect(result[0].corretores).toHaveLength(1);
      expect(result[0].corretores[0]).toMatchObject({
        id: 100,
        name: "Corretor 1",
      });
    });
  });
});
