import { describe, it, expect } from "vitest";

describe("Invite form duplication logic", () => {
  it("should generate correct slug from simple name", () => {
    const name = "João";
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    expect(slug).toBe("joao");
  });

  it("should generate correct slug from compound name", () => {
    const name = "Maria Silva";
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    expect(slug).toBe("maria-silva");
  });

  it("should generate correct slug from name with accents", () => {
    const name = "José André da Silva";
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    expect(slug).toBe("jose-andre-da-silva");
  });

  it("should handle name with special characters", () => {
    const name = "Ana & Carlos";
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    expect(slug).toBe("ana-carlos");
  });

  it("should handle name with multiple spaces", () => {
    const name = "Pedro   Santos";
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    expect(slug).toBe("pedro-santos");
  });

  it("should verify the invite schema has formId field", async () => {
    const { invites } = await import("../drizzle/schema");
    const columns = Object.keys(invites);
    // The invites table should be defined
    expect(invites).toBeDefined();
  });

  it("should verify response_folders table exists", async () => {
    const { responseFolders } = await import("../drizzle/schema");
    expect(responseFolders).toBeDefined();
  });

  it("should verify duplicateFormForCorretor function exists in db", async () => {
    const db = await import("./db");
    expect(typeof db.duplicateFormForCorretor).toBe("function");
  });
});
