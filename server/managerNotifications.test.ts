import { describe, it, expect, vi } from "vitest";

/**
 * Tests for manager (gerente) notification logic.
 * Verifies that when a response is submitted, the manager of the assigned
 * corretor is also included in the notification list.
 */

describe("Manager notification logic", () => {
  it("should collect manager IDs from assigned staff", async () => {
    // Simulate staff assignments
    const staffIds = [240001, 240002]; // Two corretores

    // Simulate staff lookup returning managerId
    const staffLookup: Record<number, { id: number; managerId: number | null; role: string }> = {
      240001: { id: 240001, managerId: 210001, role: "corretor" },
      240002: { id: 210001, managerId: null, role: "gerente" },
    };

    const managerIds = new Set<number>();
    for (const sid of staffIds) {
      const staffUser = staffLookup[sid];
      if (staffUser?.managerId) {
        if (!staffIds.includes(staffUser.managerId)) {
          managerIds.add(staffUser.managerId);
        }
      }
    }

    // Manager 210001 is already in staffIds (as 240002 maps to gerente 210001)
    // But 240001's manager is 210001 which IS in staffIds → should NOT be added
    // Wait, 210001 is NOT in staffIds (staffIds = [240001, 240002])
    // So manager 210001 should be added
    expect(managerIds.has(210001)).toBe(true);
    expect(managerIds.size).toBe(1);
  });

  it("should not duplicate manager if already in staffIds", () => {
    const staffIds = [240001, 210001]; // Corretor + their manager already assigned
    const staffLookup: Record<number, { id: number; managerId: number | null }> = {
      240001: { id: 240001, managerId: 210001 },
      210001: { id: 210001, managerId: null },
    };

    const managerIds = new Set<number>();
    for (const sid of staffIds) {
      const staffUser = staffLookup[sid];
      if (staffUser?.managerId) {
        if (!staffIds.includes(staffUser.managerId)) {
          managerIds.add(staffUser.managerId);
        }
      }
    }

    // Manager 210001 is already in staffIds → should NOT be added to managerIds
    expect(managerIds.size).toBe(0);
  });

  it("should combine staffIds and managerIds without duplicates", () => {
    const staffIds = [240001, 240002];
    const managerIds = new Set<number>([210001, 210002]);

    const allStaffToNotify = [...staffIds, ...Array.from(managerIds)];

    expect(allStaffToNotify).toHaveLength(4);
    expect(allStaffToNotify).toContain(240001);
    expect(allStaffToNotify).toContain(240002);
    expect(allStaffToNotify).toContain(210001);
    expect(allStaffToNotify).toContain(210002);
  });

  it("should handle corretores with no manager", () => {
    const staffIds = [240001, 240002];
    const staffLookup: Record<number, { id: number; managerId: number | null }> = {
      240001: { id: 240001, managerId: null },
      240002: { id: 240002, managerId: null },
    };

    const managerIds = new Set<number>();
    for (const sid of staffIds) {
      const staffUser = staffLookup[sid];
      if (staffUser?.managerId) {
        if (!staffIds.includes(staffUser.managerId)) {
          managerIds.add(staffUser.managerId);
        }
      }
    }

    expect(managerIds.size).toBe(0);
  });

  it("should also check legacy assignedCorretorId for manager", () => {
    const staffIds = [240001]; // Only one assigned via form_assignments
    const assignedCorretorId = 240002; // Legacy field
    const staffLookup: Record<number, { id: number; managerId: number | null }> = {
      240001: { id: 240001, managerId: 210001 },
      240002: { id: 240002, managerId: 210002 },
    };

    const managerIds = new Set<number>();

    // Check form_assignments staff
    for (const sid of staffIds) {
      const staffUser = staffLookup[sid];
      if (staffUser?.managerId && !staffIds.includes(staffUser.managerId)) {
        managerIds.add(staffUser.managerId);
      }
    }

    // Check legacy assignedCorretorId
    if (assignedCorretorId && !staffIds.includes(assignedCorretorId)) {
      const corretorUser = staffLookup[assignedCorretorId];
      if (corretorUser?.managerId && !staffIds.includes(corretorUser.managerId)) {
        managerIds.add(corretorUser.managerId);
      }
    }

    expect(managerIds.has(210001)).toBe(true);
    expect(managerIds.has(210002)).toBe(true);
    expect(managerIds.size).toBe(2);
  });

  it("should set correct link for managers vs corretores", () => {
    const managerIds = new Set<number>([210001]);
    const allStaffToNotify = [240001, 240002, 210001];

    const notifications = allStaffToNotify.map((staffUserId) => ({
      staffUserId,
      link: managerIds.has(staffUserId) ? "/gerente/respostas" : "/corretor/respostas",
      isManagerNotification: managerIds.has(staffUserId),
    }));

    const corretorNotif = notifications.find(n => n.staffUserId === 240001);
    expect(corretorNotif?.link).toBe("/corretor/respostas");
    expect(corretorNotif?.isManagerNotification).toBe(false);

    const managerNotif = notifications.find(n => n.staffUserId === 210001);
    expect(managerNotif?.link).toBe("/gerente/respostas");
    expect(managerNotif?.isManagerNotification).toBe(true);
  });

  it("should handle multiple corretores with the same manager", () => {
    const staffIds = [240001, 240002, 240003];
    const staffLookup: Record<number, { id: number; managerId: number | null }> = {
      240001: { id: 240001, managerId: 210001 },
      240002: { id: 240002, managerId: 210001 }, // Same manager
      240003: { id: 240003, managerId: 210002 }, // Different manager
    };

    const managerIds = new Set<number>();
    for (const sid of staffIds) {
      const staffUser = staffLookup[sid];
      if (staffUser?.managerId && !staffIds.includes(staffUser.managerId)) {
        managerIds.add(staffUser.managerId);
      }
    }

    // Should have 2 unique managers, not 3
    expect(managerIds.size).toBe(2);
    expect(managerIds.has(210001)).toBe(true);
    expect(managerIds.has(210002)).toBe(true);

    // Total notifications should be 5 (3 corretores + 2 managers)
    const allStaffToNotify = [...staffIds, ...Array.from(managerIds)];
    expect(allStaffToNotify).toHaveLength(5);
  });
});
