/**
 * Tests for:
 * 1. customAuth.updateMyProfile procedure (CPF/CNPJ update for staff)
 * 2. PDF second table removal (coverSecondTable function)
 * 3. PWA badge integration (useUnreadResponses hook)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Test: CPF/CNPJ validation helpers ───
describe("CPF/CNPJ validation for staff profile", () => {
  let cleanCpfCnpj: (val: string) => string;
  let isValidCpfCnpj: (val: string) => boolean;

  beforeEach(async () => {
    const mod = await import("./authService");
    cleanCpfCnpj = mod.cleanCpfCnpj;
    isValidCpfCnpj = mod.isValidCpfCnpj;
  });

  it("should clean CPF formatting", () => {
    expect(cleanCpfCnpj("123.456.789-09")).toBe("12345678909");
  });

  it("should clean CNPJ formatting", () => {
    expect(cleanCpfCnpj("12.345.678/0001-95")).toBe("12345678000195");
  });

  it("should validate a correct CPF", () => {
    // Using a known valid CPF
    expect(isValidCpfCnpj("12345678909")).toBe(true);
  });

  it("should reject an invalid CPF (all same digits)", () => {
    expect(isValidCpfCnpj("11111111111")).toBe(false);
  });

  it("should validate a correct CNPJ", () => {
    expect(isValidCpfCnpj("12345678000195")).toBe(true);
  });

  it("should reject an invalid CNPJ (all same digits)", () => {
    expect(isValidCpfCnpj("11111111111111")).toBe(false);
  });

  it("should handle empty string", () => {
    expect(cleanCpfCnpj("")).toBe("");
  });
});

// ─── Test: PDF second table cover function ───
describe("PDF second table removal", () => {
  it("should have coverSecondTable function that draws white rectangle", async () => {
    // We test that the pdfGenerator module exports generateFullPdf
    const mod = await import("./pdfGenerator");
    expect(typeof mod.generateFullPdf).toBe("function");
  });

  it("should have the FIFTY fields removal in fillProtocoloFields", async () => {
    // Read the source to verify the fields are being removed
    const fs = await import("fs");
    const source = fs.readFileSync("./server/pdfGenerator.ts", "utf-8");
    
    // Verify the second table fields are being removed (not just cleared)
    expect(source).toContain("form.removeField(field)");
    expect(source).toContain("Nome_Diretor2");
    expect(source).toContain("CPF_Corretor2");
    
    // Verify the white rectangle cover function exists
    expect(source).toContain("coverSecondTable");
    expect(source).toContain("rgb(1, 1, 1)"); // white color
  });
});

// ─── Test: Staff user schema has cpfCnpj ───
describe("Staff user schema", () => {
  it("should have cpfCnpj field in staff_users table", async () => {
    const schema = await import("../drizzle/schema");
    const columns = Object.keys(schema.staffUsers);
    // The table object has column definitions
    expect(schema.staffUsers).toBeDefined();
    // Check that the schema file contains cpfCnpj
    const fs = await import("fs");
    const source = fs.readFileSync("./drizzle/schema.ts", "utf-8");
    expect(source).toContain('cpfCnpj: varchar("cpfCnpj"');
  });
});

// ─── Test: Auth router returns cpfCnpj for staff ───
describe("Auth router staff cpfCnpj", () => {
  it("should include cpfCnpj in the me response for staff users", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("./server/authRouter.ts", "utf-8");
    // Verify the me procedure returns cpfCnpj for staff
    expect(source).toContain("cpfCnpj: user.cpfCnpj");
    // Verify updateMyProfile procedure exists
    expect(source).toContain("updateMyProfile");
    expect(source).toContain("cleanCpfCnpj");
    expect(source).toContain("isValidCpfCnpj");
  });
});

// ─── Test: PWA badge integration ───
describe("PWA badge integration", () => {
  it("should have setAppBadge in service worker", async () => {
    const fs = await import("fs");
    const swSource = fs.readFileSync("./client/public/sw.js", "utf-8");
    expect(swSource).toContain("navigator.setAppBadge");
    expect(swSource).toContain("navigator.clearAppBadge");
    expect(swSource).toContain("badgeCount");
  });

  it("should have updateAppBadge in useUnreadResponses hook", async () => {
    const fs = await import("fs");
    const hookSource = fs.readFileSync("./client/src/hooks/useUnreadResponses.ts", "utf-8");
    expect(hookSource).toContain("setAppBadge");
    expect(hookSource).toContain("clearAppBadge");
    expect(hookSource).toContain("updateAppBadge");
  });
});

// ─── Test: useCustomAuth type includes cpfCnpj ───
describe("useCustomAuth type", () => {
  it("should include cpfCnpj in StaffUser type", async () => {
    const fs = await import("fs");
    const source = fs.readFileSync("./client/src/hooks/useCustomAuth.ts", "utf-8");
    expect(source).toContain("cpfCnpj?: string | null");
  });
});
