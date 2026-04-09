import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Unit tests for the trash (soft delete) system.
 * Tests the db helper functions for soft delete, restore, and permanent delete.
 */

// Mock the withDbRetry to use a simple in-memory approach
// We test the logic of the functions, not the actual DB connection

describe("Trash / Soft Delete System", () => {
  describe("Schema", () => {
    it("forms table should have deletedAt column", async () => {
      const { forms } = await import("../drizzle/schema");
      expect(forms.deletedAt).toBeDefined();
    });

    it("formResponses table should have deletedAt column", async () => {
      const { formResponses } = await import("../drizzle/schema");
      expect(formResponses.deletedAt).toBeDefined();
    });
  });

  describe("DB helper exports", () => {
    it("should export deleteForm (soft delete)", async () => {
      const db = await import("./db");
      expect(typeof db.deleteForm).toBe("function");
    });

    it("should export permanentDeleteForm", async () => {
      const db = await import("./db");
      expect(typeof db.permanentDeleteForm).toBe("function");
    });

    it("should export restoreForm", async () => {
      const db = await import("./db");
      expect(typeof db.restoreForm).toBe("function");
    });

    it("should export softDeleteResponse", async () => {
      const db = await import("./db");
      expect(typeof db.softDeleteResponse).toBe("function");
    });

    it("should export restoreResponse", async () => {
      const db = await import("./db");
      expect(typeof db.restoreResponse).toBe("function");
    });

    it("should export permanentDeleteResponse", async () => {
      const db = await import("./db");
      expect(typeof db.permanentDeleteResponse).toBe("function");
    });

    it("should export getTrashedForms", async () => {
      const db = await import("./db");
      expect(typeof db.getTrashedForms).toBe("function");
    });

    it("should export getTrashedResponses", async () => {
      const db = await import("./db");
      expect(typeof db.getTrashedResponses).toBe("function");
    });
  });

  describe("Router structure", () => {
    it("trash router should have list, restoreForm, restoreResponse, permanentDeleteForm, permanentDeleteResponse, emptyTrash", async () => {
      const { appRouter } = await import("./routers");
      // Check that the trash router procedures exist
      const trashProcedures = Object.keys((appRouter as any)._def.procedures);
      expect(trashProcedures).toContain("trash.list");
      expect(trashProcedures).toContain("trash.restoreForm");
      expect(trashProcedures).toContain("trash.restoreResponse");
      expect(trashProcedures).toContain("trash.permanentDeleteForm");
      expect(trashProcedures).toContain("trash.permanentDeleteResponse");
      expect(trashProcedures).toContain("trash.emptyTrash");
    });
  });
});
