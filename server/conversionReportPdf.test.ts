import { describe, it, expect } from "vitest";
import { generateConversionReportPdf } from "./conversionReportPdf";

describe("generateConversionReportPdf", () => {
  const sampleStats = {
    total: 150,
    complete: 100,
    incomplete: 50,
    approved: 60,
    rejected: 15,
    inReview: 25,
    pending: 0,
    completionRate: 67,
    approvalRate: 60,
    daily: [
      { date: "2026-03-01", label: "01/03", started: 10, completed: 7, approved: 4 },
      { date: "2026-03-02", label: "02/03", started: 12, completed: 8, approved: 5 },
      { date: "2026-03-03", label: "03/03", started: 8, completed: 5, approved: 3 },
    ],
  };

  it("should generate a valid PDF buffer", async () => {
    const result = await generateConversionReportPdf({
      formTitle: "Cadastro de Interesse - Lançamento Alpha",
      period: "30d",
      stats: sampleStats,
      generatedAt: new Date("2026-03-03T12:00:00Z"),
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(1000);
    // PDF magic bytes: %PDF
    expect(result.slice(0, 4).toString()).toBe("%PDF");
  });

  it("should generate PDF for all period types", async () => {
    for (const period of ["7d", "30d", "90d", "all"] as const) {
      const result = await generateConversionReportPdf({
        formTitle: "Test Form",
        period,
        stats: sampleStats,
        generatedAt: new Date(),
      });
      expect(result).toBeInstanceOf(Buffer);
      expect(result.slice(0, 4).toString()).toBe("%PDF");
    }
  });

  it("should handle empty stats gracefully", async () => {
    const emptyStats = {
      total: 0,
      complete: 0,
      incomplete: 0,
      approved: 0,
      rejected: 0,
      inReview: 0,
      pending: 0,
      completionRate: 0,
      approvalRate: 0,
      daily: [],
    };

    const result = await generateConversionReportPdf({
      formTitle: "Empty Form",
      period: "7d",
      stats: emptyStats,
      generatedAt: new Date(),
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.slice(0, 4).toString()).toBe("%PDF");
  });

  it("should handle large daily data", async () => {
    const largeDailyStats = {
      ...sampleStats,
      daily: Array.from({ length: 90 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        label: `${String(i + 1).padStart(2, "0")}/01`,
        started: Math.floor(Math.random() * 20),
        completed: Math.floor(Math.random() * 15),
        approved: Math.floor(Math.random() * 10),
      })),
    };

    const result = await generateConversionReportPdf({
      formTitle: "Large Data Form",
      period: "90d",
      stats: largeDailyStats,
      generatedAt: new Date(),
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(1000);
  });

  it("should handle special characters in form title", async () => {
    const result = await generateConversionReportPdf({
      formTitle: "Formulário com Acentuação & Símbolos (Teste)",
      period: "30d",
      stats: sampleStats,
      generatedAt: new Date(),
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.slice(0, 4).toString()).toBe("%PDF");
  });
});
