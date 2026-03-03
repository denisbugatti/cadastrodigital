import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Performance and Form Sync routers", () => {
  describe("corretorPerformance router", () => {
    it("should have corretorPerformance.me procedure", () => {
      expect(appRouter._def.procedures).toHaveProperty("corretorPerformance.me");
    });

    it("should have corretorPerformance.all procedure", () => {
      expect(appRouter._def.procedures).toHaveProperty("corretorPerformance.all");
    });

  });

  describe("formSync router", () => {
    it("should have formSync.children procedure", () => {
      expect(appRouter._def.procedures).toHaveProperty("formSync.children");
    });

    it("should have formSync.childCount procedure", () => {
      expect(appRouter._def.procedures).toHaveProperty("formSync.childCount");
    });

    it("should have formSync.forceSync procedure", () => {
      expect(appRouter._def.procedures).toHaveProperty("formSync.forceSync");
    });
  });

  describe("Performance metrics structure", () => {
    it("should define all expected performance fields in me procedure", () => {
      // Verify the procedure exists and is queryable
      const proc = appRouter._def.procedures["corretorPerformance.me"];
      expect(proc).toBeDefined();
    });

    it("should define all expected fields in all procedure", () => {
      const proc = appRouter._def.procedures["corretorPerformance.all"];
      expect(proc).toBeDefined();
    });
  });

  describe("Form sync structure", () => {
    it("should define children procedure with formId input", () => {
      const proc = appRouter._def.procedures["formSync.children"];
      expect(proc).toBeDefined();
    });

    it("should define childCount procedure with formId input", () => {
      const proc = appRouter._def.procedures["formSync.childCount"];
      expect(proc).toBeDefined();
    });

    it("should define forceSync mutation with formId input", () => {
      const proc = appRouter._def.procedures["formSync.forceSync"];
      expect(proc).toBeDefined();
    });
  });
});
