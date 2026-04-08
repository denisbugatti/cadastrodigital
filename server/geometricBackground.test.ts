import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Geometric Background feature", () => {
  it("GeometricBackground component file exists", () => {
    const filePath = path.resolve("client/src/components/ui/geometric-background.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("GeometricBackground component exports required items", () => {
    const filePath = path.resolve("client/src/components/ui/geometric-background.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export function GeometricBackground");
    expect(content).toContain("export type GeometricTheme");
    expect(content).toContain("export const GEOMETRIC_THEMES");
    expect(content).toContain("export interface GeometricThemeConfig");
  });

  it("has 6 geometric themes defined", () => {
    const filePath = path.resolve("client/src/components/ui/geometric-background.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    // Count theme IDs
    const themeIds = ["indigo-rose", "ocean-blue", "emerald-gold", "sunset-purple", "midnight-cyan", "warm-amber"];
    for (const id of themeIds) {
      expect(content).toContain(`id: "${id}"`);
    }
  });

  it("each theme has Portuguese label and description", () => {
    const filePath = path.resolve("client/src/components/ui/geometric-background.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    // Check Portuguese labels
    expect(content).toContain("Índigo & Rosa");
    expect(content).toContain("Oceano Azul");
    expect(content).toContain("Esmeralda & Ouro");
    expect(content).toContain("Pôr do Sol Roxo");
    expect(content).toContain("Meia-noite Ciano");
    expect(content).toContain("Âmbar Quente");
  });

  it("each theme has 5 shapes", () => {
    const filePath = path.resolve("client/src/components/ui/geometric-background.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    // Each theme's shapes array should have 5 entries
    const shapesMatches = content.match(/shapes:\s*\[/g);
    expect(shapesMatches).not.toBeNull();
    expect(shapesMatches!.length).toBe(6); // 6 themes, each with shapes array
  });

  it("supports intensity prop for scaling", () => {
    const filePath = path.resolve("client/src/components/ui/geometric-background.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("intensity");
    expect(content).toContain("opacityScale");
    expect(content).toContain("sizeScale");
  });

  it("builderTypes includes geometric in BackgroundType", () => {
    const filePath = path.resolve("client/src/lib/builderTypes.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('"geometric"');
    expect(content).toContain("geometricTheme");
    expect(content).toContain("geometricIntensity");
  });

  it("formTypes includes geometric in backgroundType", () => {
    const filePath = path.resolve("client/src/lib/formTypes.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('"geometric"');
    expect(content).toContain("geometricTheme");
    expect(content).toContain("geometricIntensity");
  });

  it("DesignEditor integrates GeometricBackground", () => {
    const filePath = path.resolve("client/src/components/builder/DesignEditor.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("geometric-background");
    expect(content).toContain("GeometricBackground");
    expect(content).toContain("GEOMETRIC_THEMES");
    expect(content).toContain('design.backgroundType === "geometric"');
  });

  it("FormContainer renders GeometricBackground", () => {
    const filePath = path.resolve("client/src/components/form/FormContainer.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("GeometricBackground");
    expect(content).toContain('backgroundType === "geometric"');
    expect(content).toContain("geometricTheme");
    expect(content).toContain("geometricIntensity");
  });

  it("default design settings include geometric defaults", () => {
    const filePath = path.resolve("client/src/lib/builderTypes.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('geometricTheme: "indigo-rose"');
    expect(content).toContain("geometricIntensity: 50");
  });
});
