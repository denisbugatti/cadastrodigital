import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";

describe("Response Folders Router", () => {
  it("should have folders.list procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.list");
  });

  it("should have folders.create procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.create");
  });

  it("should have folders.update procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.update");
  });

  it("should have folders.delete procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.delete");
  });

  it("should have folders.assign procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.assign");
  });

  it("should have folders.unassign procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.unassign");
  });

  it("should have folders.assignments procedure", () => {
    expect(appRouter._def.procedures).toHaveProperty("folders.assignments");
  });
});
