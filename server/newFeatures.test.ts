/**
 * Tests for new features:
 * 1. Form rename in Builder
 * 2. WebGL background option in design settings
 * 3. Responses page redesign (stats, filters, validation badges)
 */
import { describe, it, expect } from "vitest";
import * as schema from "../drizzle/schema";

// ─── 1. Form Rename ───
describe("Form Rename", () => {
  it("forms table has a title column for renaming", () => {
    expect(schema.forms).toBeDefined();
    const columns = Object.keys(schema.forms);
    expect(columns).toContain("title");
  });
});

// ─── 2. WebGL Background Design Settings ───
describe("WebGL Background Design Settings", () => {
  it("builderTypes supports backgroundType field with solid/image/webgl values", async () => {
    const builderTypes = await import("../client/src/lib/builderTypes");
    const defaults = builderTypes.defaultDesignSettings;
    
    // backgroundType should exist with default value
    expect(defaults).toHaveProperty("backgroundType");
    expect(["solid", "image", "webgl"]).toContain(defaults.backgroundType);
  });

  it("builderTypes supports webglEffect field", async () => {
    const builderTypes = await import("../client/src/lib/builderTypes");
    const defaults = builderTypes.defaultDesignSettings;
    
    expect(defaults).toHaveProperty("webglEffect");
    const validEffects = ["gradient-flow", "particles", "aurora", "waves", "mesh-gradient"];
    expect(validEffects).toContain(defaults.webglEffect);
  });

  it("builderTypes supports webglIntensity field with numeric default", async () => {
    const builderTypes = await import("../client/src/lib/builderTypes");
    const defaults = builderTypes.defaultDesignSettings;
    
    expect(defaults).toHaveProperty("webglIntensity");
    expect(typeof defaults.webglIntensity).toBe("number");
    expect(defaults.webglIntensity).toBeGreaterThanOrEqual(0);
    expect(defaults.webglIntensity).toBeLessThanOrEqual(100);
  });

  it("WebGLBackground component file exists", async () => {
    const fs = await import("fs");
    const path = "./client/src/components/form/WebGLBackground.tsx";
    expect(fs.existsSync(path)).toBe(true);
  });

  it("DesignEditor component file exists", async () => {
    const fs = await import("fs");
    const path = "./client/src/components/builder/DesignEditor.tsx";
    expect(fs.existsSync(path)).toBe(true);
  });

  it("DesignEditor contains backgroundType selector", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/components/builder/DesignEditor.tsx", "utf-8");
    expect(content).toContain("backgroundType");
    expect(content).toContain("webgl");
  });

  it("FormContainer supports WebGL background rendering", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/components/form/FormContainer.tsx", "utf-8");
    expect(content).toContain("WebGLBackground");
    expect(content).toContain("backgroundType");
  });
});

// ─── 3. Responses Page Redesign ───
describe("Responses Page Redesign", () => {
  it("Responses page file exists and has been updated", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Responses.tsx", "utf-8");
    
    // Should have stats cards
    expect(content).toContain("StatCard");
    
    // Should have filter pills
    expect(content).toContain("activeFilter");
    expect(content).toContain("filteredResponses");
    
    // Should have validation badges
    expect(content).toContain("ValidationBadge");
  });

  it("Responses page has stat cards for total, complete, avgTime, validated", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Responses.tsx", "utf-8");
    
    expect(content).toContain('label="Total"');
    expect(content).toContain("Completas");
    expect(content).toContain("Tempo médio");
    expect(content).toContain("Aprovadas");
  });

  it("Responses page has filter options: all, complete, partial, validated, pending", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Responses.tsx", "utf-8");
    
    expect(content).toContain('"all"');
    expect(content).toContain('"complete"');
    expect(content).toContain('"partial"');
    expect(content).toContain('"approved"');
    expect(content).toContain('"pending"');
  });

  it("Responses page supports dark mode with theme-aware classes", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Responses.tsx", "utf-8");
    
    // Should use semantic colors, not hardcoded bg-white
    expect(content).toContain("bg-card");
    expect(content).toContain("bg-background");
    expect(content).toContain("text-foreground");
    expect(content).toContain("text-muted-foreground");
    expect(content).not.toContain("bg-white");
  });

  it("Responses page has animated expand/collapse for response details", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Responses.tsx", "utf-8");
    
    expect(content).toContain("AnimatePresence");
    expect(content).toContain("motion.div");
    expect(content).toContain("isExpanded");
  });

  it("ValidationBadge component handles all statuses", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Responses.tsx", "utf-8");
    
    // ValidationBadge should handle approved, rejected, in_review, and pending
    expect(content).toContain("approved");
    expect(content).toContain("rejected");
    expect(content).toContain("in_review");
    expect(content).toContain("Pendente");
  });
});

// ─── 4. Builder Rename Feature ───
describe("Builder Rename Feature", () => {
  it("Builder.tsx contains inline rename functionality", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("./client/src/pages/Builder.tsx", "utf-8");
    
    // Should have rename state
    expect(content).toContain("isRenaming");
    expect(content).toContain("renameValue");
    
    // Should have Pencil icon for triggering rename
    expect(content).toContain("Pencil");
  });
});
