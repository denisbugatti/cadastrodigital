import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("New Animated Backgrounds (Paths, Aurora, Shaders)", () => {
  // ─── Background Paths ───
  it("BackgroundPaths component file exists", () => {
    const filePath = path.resolve("client/src/components/ui/background-paths.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("BackgroundPaths component exports correctly", () => {
    const filePath = path.resolve("client/src/components/ui/background-paths.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export const BackgroundPaths");
    expect(content).toContain("FloatingPaths");
    expect(content).toContain("motion.path");
  });

  // ─── Aurora Background ───
  it("AuroraBackground component file exists", () => {
    const filePath = path.resolve("client/src/components/ui/aurora-background.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("AuroraBackground component exports correctly", () => {
    const filePath = path.resolve("client/src/components/ui/aurora-background.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export const AuroraBackground");
    expect(content).toContain("showRadialGradient");
    expect(content).toContain("animate-aurora");
  });

  // ─── Background Shaders ───
  it("BackgroundShaders component file exists", () => {
    const filePath = path.resolve("client/src/components/ui/background-shaders.tsx");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("BackgroundShaders component exports correctly", () => {
    const filePath = path.resolve("client/src/components/ui/background-shaders.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("export function BackgroundShaders");
    expect(content).toContain("@paper-design/shaders-react");
  });

  // ─── Type definitions ───
  it("builderTypes includes paths, aurora, shaders in BackgroundType", () => {
    const filePath = path.resolve("client/src/lib/builderTypes.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('"paths"');
    expect(content).toContain('"aurora"');
    expect(content).toContain('"shaders"');
  });

  it("builderTypes does NOT include old background types", () => {
    const filePath = path.resolve("client/src/lib/builderTypes.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    // Old types should be removed
    expect(content).not.toMatch(/BackgroundType.*=.*"solid"/);
    expect(content).not.toMatch(/BackgroundType.*=.*"image"/);
  });

  it("formTypes includes paths, aurora, shaders in backgroundType", () => {
    const filePath = path.resolve("client/src/lib/formTypes.ts");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('"paths"');
    expect(content).toContain('"aurora"');
    expect(content).toContain('"shaders"');
  });

  it("default design settings use paths as default backgroundType", async () => {
    const builderTypes = await import("../client/src/lib/builderTypes");
    const defaults = builderTypes.defaultDesignSettings;
    expect(defaults).toHaveProperty("backgroundType");
    expect(defaults.backgroundType).toBe("paths");
  });

  // ─── Integration ───
  it("DesignEditor integrates new background components", () => {
    const filePath = path.resolve("client/src/components/builder/DesignEditor.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("BackgroundPaths");
    expect(content).toContain("AuroraBackground");
    expect(content).toContain("BackgroundShaders");
    expect(content).toContain("backgroundType");
  });

  it("FormContainer renders new background components", () => {
    const filePath = path.resolve("client/src/components/form/FormContainer.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("BackgroundPaths");
    expect(content).toContain("AuroraBackground");
    expect(content).toContain("BackgroundShaders");
    expect(content).toContain('backgroundType === "paths"');
    expect(content).toContain('backgroundType === "aurora"');
    expect(content).toContain('backgroundType === "shaders"');
  });

  it("FormContainer does NOT reference old background components", () => {
    const filePath = path.resolve("client/src/components/form/FormContainer.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).not.toContain("WebGLBackground");
    expect(content).not.toContain("GeometricBackground");
  });

  it("BuilderLivePreview renders new background components", () => {
    const filePath = path.resolve("client/src/components/builder/BuilderLivePreview.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("BackgroundPaths");
    expect(content).toContain("AuroraBackground");
    expect(content).toContain("BackgroundShaders");
  });

  it("WelcomeScreen uses transparent bg for new background types", () => {
    const filePath = path.resolve("client/src/components/form/screens/WelcomeScreen.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("paths");
    expect(content).toContain("aurora");
    expect(content).toContain("shaders");
    expect(content).toContain("transparent");
  });

  it("ThankYouScreen uses transparent bg for new background types", () => {
    const filePath = path.resolve("client/src/components/form/screens/ThankYouScreen.tsx");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("paths");
    expect(content).toContain("aurora");
    expect(content).toContain("shaders");
    expect(content).toContain("transparent");
  });

  // ─── CSS Aurora Animation ───
  it("index.css includes aurora animation keyframes", () => {
    const filePath = path.resolve("client/src/index.css");
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("@keyframes aurora");
    expect(content).toContain("animate-aurora");
    expect(content).toContain("--blue-500");
    expect(content).toContain("--indigo-300");
  });
});
