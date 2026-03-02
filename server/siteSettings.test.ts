import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests for the site settings feature:
 * 1. Schema validation for siteSettings table
 * 2. OG middleware homepage handling
 * 3. Splash screen PWA-only behavior
 */

// ─── Schema Tests ───
describe("siteSettings schema", () => {
  it("should export siteSettings table from schema", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.siteSettings).toBeDefined();
    // $inferSelect is a TypeScript type, not a runtime property
    // Just verify the table object exists and has columns
    expect(typeof schema.siteSettings).toBe("object");
  });

  it("should have the correct columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.siteSettings;
    // Check that the table has the expected column names
    const columns = Object.keys(table);
    expect(columns).toContain("id");
    expect(columns).toContain("key");
    expect(columns).toContain("ogTitle");
    expect(columns).toContain("ogDescription");
    expect(columns).toContain("ogImage");
    expect(columns).toContain("ogUrl");
    expect(columns).toContain("createdAt");
    expect(columns).toContain("updatedAt");
  });
});

// ─── OG Middleware Tests ───
describe("ogMiddleware", () => {
  it("should export ogMiddleware function", async () => {
    const mod = await import("./ogMiddleware");
    expect(mod.ogMiddleware).toBeDefined();
    expect(typeof mod.ogMiddleware).toBe("function");
  });

  it("should return a middleware function", async () => {
    const mod = await import("./ogMiddleware");
    const middleware = mod.ogMiddleware();
    expect(typeof middleware).toBe("function");
  });

  it("should pass through non-GET requests", async () => {
    const mod = await import("./ogMiddleware");
    const middleware = mod.ogMiddleware();
    const req = { method: "POST", path: "/", headers: {} } as any;
    const res = {} as any;
    const next = vi.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should pass through non-crawler requests", async () => {
    const mod = await import("./ogMiddleware");
    const middleware = mod.ogMiddleware();
    const req = {
      method: "GET",
      path: "/",
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" },
    } as any;
    const res = {} as any;
    const next = vi.fn();
    await middleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should intercept WhatsApp crawler on homepage", async () => {
    const mod = await import("./ogMiddleware");
    const middleware = mod.ogMiddleware();
    const req = {
      method: "GET",
      path: "/",
      headers: { "user-agent": "WhatsApp/2.23.20.0" },
    } as any;
    let statusCode = 0;
    let contentType = "";
    let body = "";
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      set: (headers: any) => {
        contentType = headers["Content-Type"] || "";
        return res;
      },
      end: (html: string) => {
        body = html;
        return res;
      },
    } as any;
    const next = vi.fn();
    await middleware(req, res, next);
    // Should NOT call next (it should handle the request)
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(200);
    expect(contentType).toContain("text/html");
    expect(body).toContain("og:title");
    expect(body).toContain("og:description");
    expect(body).toContain("og:image");
  });

  it("should intercept Facebook crawler on homepage", async () => {
    const mod = await import("./ogMiddleware");
    const middleware = mod.ogMiddleware();
    const req = {
      method: "GET",
      path: "/",
      headers: { "user-agent": "facebookexternalhit/1.1" },
    } as any;
    let statusCode = 0;
    let body = "";
    const res = {
      status: (code: number) => { statusCode = code; return res; },
      set: () => res,
      end: (html: string) => { body = html; return res; },
    } as any;
    const next = vi.fn();
    await middleware(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(statusCode).toBe(200);
    expect(body).toContain("og:title");
  });
});

// ─── Splash Screen Tests ───
describe("splash screen PWA-only logic", () => {
  it("should have splash screen in index.html", async () => {
    const fs = await import("fs");
    const html = fs.readFileSync("client/index.html", "utf-8");
    expect(html).toContain("splash-screen");
  });

  it("should check for standalone display mode", async () => {
    const fs = await import("fs");
    const html = fs.readFileSync("client/index.html", "utf-8");
    expect(html).toContain("display-mode: standalone");
    expect(html).toContain("navigator.standalone");
  });

  it("should remove splash immediately when not in PWA mode", async () => {
    const fs = await import("fs");
    const html = fs.readFileSync("client/index.html", "utf-8");
    // The script should check isStandalone and remove splash if false
    expect(html).toContain("if (!isStandalone)");
    expect(html).toContain("splash.remove()");
  });
});

// ─── DB Helper Tests ───
describe("db site settings helpers", () => {
  it("should export getSiteSettings function", async () => {
    const db = await import("./db");
    expect(db.getSiteSettings).toBeDefined();
    expect(typeof db.getSiteSettings).toBe("function");
  });

  it("should export upsertSiteSettings function", async () => {
    const db = await import("./db");
    expect(db.upsertSiteSettings).toBeDefined();
    expect(typeof db.upsertSiteSettings).toBe("function");
  });
});
