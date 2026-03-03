import { describe, expect, it } from "vitest";
import {
  hashPassword,
  verifyPassword,
  cleanCpfCnpj,
  isValidCpf,
  isValidCnpj,
  isValidCpfCnpj,
  generateInviteToken,
} from "./authService";

describe("Password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "WdZQ7eQJXJ";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2a$") || hash.startsWith("$2b$")).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("correct-password");
    const isValid = await verifyPassword("wrong-password", hash);
    expect(isValid).toBe(false);
  });

  it("produces different hashes for same password (salt)", async () => {
    const hash1 = await hashPassword("test123");
    const hash2 = await hashPassword("test123");
    expect(hash1).not.toBe(hash2);
  });
});

describe("CPF validation", () => {
  it("validates a correct CPF", () => {
    // Valid CPF: 529.982.247-25
    expect(isValidCpf("52998224725")).toBe(true);
  });

  it("validates a formatted CPF", () => {
    expect(isValidCpfCnpj("529.982.247-25")).toBe(true);
  });

  it("rejects all same digits", () => {
    expect(isValidCpf("11111111111")).toBe(false);
    expect(isValidCpf("00000000000")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidCpf("1234")).toBe(false);
    expect(isValidCpf("")).toBe(false);
  });

  it("rejects invalid check digits", () => {
    expect(isValidCpf("52998224726")).toBe(false);
  });
});

describe("CNPJ validation", () => {
  it("validates a correct CNPJ", () => {
    // Valid CNPJ: 11.222.333/0001-81
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("validates a formatted CNPJ", () => {
    expect(isValidCpfCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("rejects all same digits", () => {
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidCnpj("1234")).toBe(false);
  });

  it("rejects invalid check digits", () => {
    expect(isValidCnpj("11222333000182")).toBe(false);
  });
});

describe("cleanCpfCnpj", () => {
  it("removes formatting from CPF", () => {
    expect(cleanCpfCnpj("529.982.247-25")).toBe("52998224725");
  });

  it("removes formatting from CNPJ", () => {
    expect(cleanCpfCnpj("11.222.333/0001-81")).toBe("11222333000181");
  });

  it("handles already clean values", () => {
    expect(cleanCpfCnpj("52998224725")).toBe("52998224725");
  });
});

describe("isValidCpfCnpj", () => {
  it("detects CPF by length", () => {
    expect(isValidCpfCnpj("529.982.247-25")).toBe(true);
  });

  it("detects CNPJ by length", () => {
    expect(isValidCpfCnpj("11.222.333/0001-81")).toBe(true);
  });

  it("rejects invalid length", () => {
    expect(isValidCpfCnpj("12345")).toBe(false);
  });
});

describe("Invite token generation", () => {
  it("generates a 32-character token", () => {
    const token = generateInviteToken();
    expect(token).toBeDefined();
    expect(token.length).toBe(32);
  });

  it("generates unique tokens", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateInviteToken());
    }
    expect(tokens.size).toBe(100);
  });
});

describe("Staff and permissions router integration", () => {
  it("staff router exists in appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect(appRouter._def.procedures).toBeDefined();
    // Check that staff procedures exist
    expect((appRouter._def as any).procedures["staff.list"]).toBeDefined();
    expect((appRouter._def as any).procedures["staff.update"]).toBeDefined();
    expect((appRouter._def as any).procedures["staff.delete"]).toBeDefined();
    expect((appRouter._def as any).procedures["staff.invite"]).toBeDefined();
    expect((appRouter._def as any).procedures["staff.invites"]).toBeDefined();
  });

  it("permissions router exists in appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect((appRouter._def as any).procedures["permissions.list"]).toBeDefined();
    expect((appRouter._def as any).procedures["permissions.update"]).toBeDefined();
    expect((appRouter._def as any).procedures["permissions.bulkUpdate"]).toBeDefined();
  });

  it("validations router exists in appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect((appRouter._def as any).procedures["validations.byResponse"]).toBeDefined();
    expect((appRouter._def as any).procedures["validations.validate"]).toBeDefined();
  });

  it("customAuth router exists in appRouter", async () => {
    const { appRouter } = await import("./routers");
    expect((appRouter._def as any).procedures["customAuth.staffLogin"]).toBeDefined();
    expect((appRouter._def as any).procedures["customAuth.clientLogin"]).toBeDefined();
    expect((appRouter._def as any).procedures["customAuth.acceptInvite"]).toBeDefined();
    expect((appRouter._def as any).procedures["customAuth.clientRegister"]).toBeDefined();
  });
});
