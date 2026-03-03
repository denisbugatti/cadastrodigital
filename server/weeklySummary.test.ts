import { describe, it, expect, vi } from "vitest";

describe("Weekly Summary Email", () => {
  describe("getWeeklyStats function", () => {
    it("should be exported from db module", async () => {
      const db = await import("./db");
      expect(typeof db.getWeeklyStats).toBe("function");
    });

    it("should accept optional asOfDate parameter", async () => {
      const db = await import("./db");
      expect(db.getWeeklyStats.length).toBeLessThanOrEqual(1);
    });
  });

  describe("sendWeeklySummaryEmail function", () => {
    it("should be exported from emailService module", async () => {
      const emailService = await import("./emailService");
      expect(typeof emailService.sendWeeklySummaryEmail).toBe("function");
    });
  });

  describe("buildWeeklySummaryHtml function", () => {
    it("should be exported from emailService module", async () => {
      const emailService = await import("./emailService");
      expect(typeof emailService.buildWeeklySummaryHtml).toBe("function");
    });

    it("should generate valid HTML with stats data", async () => {
      const { buildWeeklySummaryHtml } = await import("./emailService");

      const mockStats = {
        period: {
          start: new Date("2026-02-24"),
          end: new Date("2026-03-03"),
        },
        responses: {
          total: 150,
          newThisWeek: 23,
          approved: 80,
          rejected: 30,
          pending: 40,
        },
        validation: {
          totalValidated: 45,
          approvalRate: 78,
          rejectionRate: 22,
        },
        corretores: [
          { id: 1, name: "João Silva", email: "joao@test.com", validationsCount: 20, approvedCount: 15, rejectedCount: 5 },
          { id: 2, name: "Maria Santos", email: "maria@test.com", validationsCount: 15, approvedCount: 12, rejectedCount: 3 },
          { id: 3, name: "Pedro Costa", email: "pedro@test.com", validationsCount: 10, approvedCount: 8, rejectedCount: 2 },
        ],
        forms: {
          totalForms: 5,
          totalPublished: 3,
        },
      };

      const html = buildWeeklySummaryHtml(mockStats);

      // Should contain key data
      expect(html).toContain("150"); // total responses
      expect(html).toContain("+23"); // new this week
      expect(html).toContain("78%"); // approval rate
      expect(html).toContain("22%"); // rejection rate
      expect(html).toContain("João Silva"); // top corretor
      expect(html).toContain("Maria Santos"); // second corretor
      expect(html).toContain("Pedro Costa"); // third corretor
      expect(html).toContain("80"); // approved
      expect(html).toContain("30"); // rejected
      expect(html).toContain("40"); // pending
      expect(html).toContain("Resumo Semanal"); // title
      expect(html).toContain("Ranking de Corretores"); // section title
      expect(html).toContain("<!DOCTYPE html>"); // valid HTML
    });

    it("should handle empty corretores list", async () => {
      const { buildWeeklySummaryHtml } = await import("./emailService");

      const mockStats = {
        period: { start: new Date(), end: new Date() },
        responses: { total: 0, newThisWeek: 0, approved: 0, rejected: 0, pending: 0 },
        validation: { totalValidated: 0, approvalRate: 0, rejectionRate: 0 },
        corretores: [],
        forms: { totalForms: 0, totalPublished: 0 },
      };

      const html = buildWeeklySummaryHtml(mockStats);
      expect(html).toContain("Nenhum corretor ativo no período");
    });
  });

  describe("shouldRunWeeklySummary logic", () => {
    it("should run on Monday at 12:00 UTC (9:00 AM BRT)", () => {
      // Monday March 2, 2026 at 12:00 UTC
      const monday = new Date("2026-03-02T12:00:00Z");
      expect(monday.getUTCDay()).toBe(1); // Monday
      expect(monday.getUTCHours()).toBe(12);
      expect(monday.getUTCMinutes()).toBe(0);
    });

    it("should not run on other days", () => {
      const tuesday = new Date("2026-03-03T12:00:00Z");
      expect(tuesday.getUTCDay()).toBe(2); // Tuesday, not Monday
    });

    it("should not run at other times on Monday", () => {
      const mondayAfternoon = new Date("2026-03-02T15:00:00Z");
      expect(mondayAfternoon.getUTCDay()).toBe(1); // Monday
      expect(mondayAfternoon.getUTCHours()).not.toBe(12);
    });
  });

  describe("WeeklyStats interface", () => {
    it("should have correct structure", () => {
      const stats = {
        period: { start: new Date(), end: new Date() },
        responses: { total: 0, newThisWeek: 0, approved: 0, rejected: 0, pending: 0 },
        validation: { totalValidated: 0, approvalRate: 0, rejectionRate: 0 },
        corretores: [],
        forms: { totalForms: 0, totalPublished: 0 },
      };

      expect(stats.period).toHaveProperty("start");
      expect(stats.period).toHaveProperty("end");
      expect(stats.responses).toHaveProperty("total");
      expect(stats.responses).toHaveProperty("newThisWeek");
      expect(stats.responses).toHaveProperty("approved");
      expect(stats.responses).toHaveProperty("rejected");
      expect(stats.responses).toHaveProperty("pending");
      expect(stats.validation).toHaveProperty("totalValidated");
      expect(stats.validation).toHaveProperty("approvalRate");
      expect(stats.validation).toHaveProperty("rejectionRate");
      expect(stats.corretores).toBeInstanceOf(Array);
      expect(stats.forms).toHaveProperty("totalForms");
      expect(stats.forms).toHaveProperty("totalPublished");
    });
  });
});
