/**
 * Builder Redesign Tests
 * Validates the new Typeform-style 3-column layout improvements
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("BuilderSidebar Redesign", () => {
  const filePath = path.resolve("client/src/components/builder/BuilderSidebar.tsx");

  it("has typeColorMap for colored type icons", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("typeColorMap");
  });

  it("uses colored icons in SortableQuestionItem", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("colors.bg");
    expect(content).toContain("colors.text");
  });

  it("has Add button at the bottom with border-t", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("border-t border-border");
    expect(content).toContain("Adicionar pergunta");
  });

  it("type picker opens upward (bottom-16)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("bottom-16");
  });
});

describe("BuilderLivePreview Redesign", () => {
  const filePath = path.resolve("client/src/components/builder/BuilderLivePreview.tsx");

  it("has navigation props", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("hasPrev");
    expect(content).toContain("hasNext");
    expect(content).toContain("onNavigatePrev");
    expect(content).toContain("onNavigateNext");
  });

  it("has Desktop/Mobile toggle", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("isMobile");
    expect(content).toContain("Desktop");
    expect(content).toContain("Mobile");
  });

  it("applies mobile width when isMobile is true", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("w-[375px]");
  });

  it("has helpful footer hint about inline editing", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Clique no título para editar");
  });
});

describe("BuilderConfigPanel Redesign", () => {
  const filePath = path.resolve("client/src/components/builder/BuilderConfigPanel.tsx");

  it("has typeColorMap for colored header icon", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("typeColorMap");
  });

  it("has colored icon in header", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("colors.bg");
    expect(content).toContain("colors.text");
  });

  it("has question type subtitle labels", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("Tela especial");
    expect(content).toContain("Declaração");
    expect(content).toContain("Pergunta");
  });
});

describe("Builder.tsx navigation wiring", () => {
  const filePath = path.resolve("client/src/pages/Builder.tsx");

  it("passes navigation props to BuilderLivePreview", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain("hasPrev=");
    expect(content).toContain("hasNext=");
    expect(content).toContain("onNavigatePrev=");
    expect(content).toContain("onNavigateNext=");
  });
});

describe("FormContainer backgroundType fix", () => {
  const filePath = path.resolve("client/src/components/form/FormContainer.tsx");

  it("uses backgroundType variable name (not bgType)", () => {
    const content = fs.readFileSync(filePath, "utf-8");
    expect(content).toContain('backgroundType === "paths"');
    expect(content).toContain('backgroundType === "aurora"');
    expect(content).toContain('backgroundType === "shaders"');
  });
});
