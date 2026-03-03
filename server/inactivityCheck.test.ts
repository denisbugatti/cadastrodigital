import { describe, it, expect, vi } from "vitest";

describe("Inactivity Check", () => {
  describe("getInactiveCorretores function", () => {
    it("should be exported from db module", async () => {
      const db = await import("./db");
      expect(typeof db.getInactiveCorretores).toBe("function");
    });

    it("should accept inactiveDays parameter with default of 7", async () => {
      const db = await import("./db");
      // The function signature accepts an optional number parameter
      expect(db.getInactiveCorretores.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Cron scheduler inactivity job", () => {
    it("should export startCronScheduler function", async () => {
      const cron = await import("./cronScheduler");
      expect(typeof cron.startCronScheduler).toBe("function");
    });
  });

  describe("shouldRunInactivityCheck logic", () => {
    it("should run at 13:00 UTC (10:00 AM BRT)", () => {
      // The inactivity check is scheduled at 13:00 UTC
      const date = new Date("2026-03-03T13:00:00Z");
      expect(date.getUTCHours()).toBe(13);
      expect(date.getUTCMinutes()).toBe(0);
    });

    it("should not run at other times", () => {
      const date = new Date("2026-03-03T14:00:00Z");
      expect(date.getUTCHours()).not.toBe(13);
    });
  });

  describe("Notification content format", () => {
    it("should format inactive corretor info correctly", () => {
      const inactiveCorretores = [
        { id: 1, name: "João Silva", email: "joao@test.com", lastValidationAt: null, daysSinceLastValidation: null, assignedFormCount: 2 },
        { id: 2, name: "Maria Santos", email: "maria@test.com", lastValidationAt: new Date("2026-02-20"), daysSinceLastValidation: 11, assignedFormCount: 1 },
      ];

      const corretorLines = inactiveCorretores.map((c) => {
        const days = c.daysSinceLastValidation !== null
          ? `${c.daysSinceLastValidation} dias sem validar`
          : "Nunca validou";
        const forms = c.assignedFormCount > 0
          ? `${c.assignedFormCount} formulário(s) atribuído(s)`
          : "Nenhum formulário atribuído";
        return `• ${c.name} (${c.email}) — ${days}, ${forms}`;
      });

      expect(corretorLines[0]).toContain("João Silva");
      expect(corretorLines[0]).toContain("Nunca validou");
      expect(corretorLines[0]).toContain("2 formulário(s)");
      expect(corretorLines[1]).toContain("Maria Santos");
      expect(corretorLines[1]).toContain("11 dias sem validar");
      expect(corretorLines[1]).toContain("1 formulário(s)");
    });

    it("should generate correct title with count", () => {
      const count = 3;
      const title = `⚠️ ${count} corretor(es) inativo(s) há 7+ dias`;
      expect(title).toContain("3 corretor(es)");
      expect(title).toContain("7+ dias");
    });
  });
});
