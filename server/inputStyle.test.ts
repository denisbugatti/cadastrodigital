/**
 * Tests for the Input Style (Efeitos) feature
 * Validates the getInputStyleClasses utility and type definitions
 */
import { describe, it, expect } from "vitest";

// Import the utility function
import { getInputStyleClasses } from "../client/src/hooks/useInputStyle";
import type { InputStyleType } from "../client/src/hooks/useInputStyle";

describe("Input Style Feature", () => {
  describe("getInputStyleClasses", () => {
    it("should return default style with no extra classes", () => {
      const result = getInputStyleClasses("default");
      expect(result.inputClasses).toBe("");
      expect(result.needsGradientWrapper).toBe(false);
      expect(result.removeDefaultBorder).toBe(false);
    });

    it("should return glassmorphism style with backdrop-blur", () => {
      const result = getInputStyleClasses("glassmorphism");
      expect(result.inputClasses).toContain("backdrop-blur");
      expect(result.inputClasses).toContain("bg-white/10");
      expect(result.inputClasses).toContain("rounded-xl");
      expect(result.choiceClasses).toContain("backdrop-blur");
      expect(result.removeDefaultBorder).toBe(true);
    });

    it("should return glass-liquid style with gradient and shadow", () => {
      const result = getInputStyleClasses("glass-liquid");
      expect(result.inputClasses).toContain("bg-gradient-to-br");
      expect(result.inputClasses).toContain("backdrop-blur-lg");
      expect(result.inputClasses).toContain("shadow-lg");
      expect(result.inputClasses).toContain("rounded-2xl");
      expect(result.removeDefaultBorder).toBe(true);
    });

    it("should return neon-glow style with box-shadow", () => {
      const result = getInputStyleClasses("neon-glow");
      expect(result.inputClasses).toContain("border-blue-400");
      expect(result.inputStyles.boxShadow).toBeDefined();
      expect(result.inputStyles.boxShadow).toContain("rgba(59,130,246");
      expect(result.removeDefaultBorder).toBe(true);
    });

    it("should return frost style with heavy blur", () => {
      const result = getInputStyleClasses("frost");
      expect(result.inputClasses).toContain("backdrop-blur-xl");
      expect(result.inputClasses).toContain("bg-white/8");
      expect(result.removeDefaultBorder).toBe(true);
    });

    it("should return neumorphism style with inset shadows", () => {
      const result = getInputStyleClasses("neumorphism");
      expect(result.inputClasses).toContain("bg-[#1a1a2e]");
      expect(result.inputStyles.boxShadow).toBeDefined();
      expect(result.inputStyles.boxShadow).toContain("-5px");
      expect(result.removeDefaultBorder).toBe(true);
    });

    it("should return minimal-line style with bottom border only", () => {
      const result = getInputStyleClasses("minimal-line");
      expect(result.inputClasses).toContain("bg-transparent");
      expect(result.inputStyles.borderBottom).toContain("1px solid");
      expect(result.removeDefaultBorder).toBe(false);
    });

    it("should return gradient-border style with wrapper", () => {
      const result = getInputStyleClasses("gradient-border");
      expect(result.needsGradientWrapper).toBe(true);
      expect(result.gradientWrapperClasses).toContain("bg-gradient-to-r");
      expect(result.gradientWrapperClasses).toContain("from-blue-500");
      expect(result.gradientWrapperClasses).toContain("via-purple-500");
      expect(result.gradientWrapperClasses).toContain("to-pink-500");
      expect(result.gradientInnerClasses).toContain("bg-[#0a0a1a]");
      expect(result.removeDefaultBorder).toBe(true);
    });

    it("should handle undefined style as default", () => {
      const result = getInputStyleClasses(undefined);
      expect(result.inputClasses).toBe("");
      expect(result.needsGradientWrapper).toBe(false);
      expect(result.removeDefaultBorder).toBe(false);
    });

    it("should return choice classes for all styles", () => {
      const styles: InputStyleType[] = [
        "default", "glassmorphism", "glass-liquid", "neon-glow",
        "frost", "neumorphism", "minimal-line", "gradient-border"
      ];
      for (const style of styles) {
        const result = getInputStyleClasses(style);
        expect(result).toHaveProperty("choiceClasses");
        expect(result).toHaveProperty("choiceStyles");
      }
    });
  });

  describe("InputStyle type definitions", () => {
    it("should have all 8 input style types", () => {
      const allStyles: InputStyleType[] = [
        "default",
        "glassmorphism",
        "glass-liquid",
        "neon-glow",
        "frost",
        "neumorphism",
        "minimal-line",
        "gradient-border",
      ];
      expect(allStyles).toHaveLength(8);
      // Verify each returns a valid result
      for (const style of allStyles) {
        const result = getInputStyleClasses(style);
        expect(result).toBeDefined();
        expect(typeof result.inputClasses).toBe("string");
        expect(typeof result.needsGradientWrapper).toBe("boolean");
        expect(typeof result.removeDefaultBorder).toBe("boolean");
      }
    });
  });

  describe("builderToForm inputStyle conversion", () => {
    it("should include inputStyle in the converted form data", async () => {
      const { builderToFormData } = await import("../client/src/lib/builderToForm");
      const { defaultDesignSettings } = await import("../client/src/lib/builderTypes");

      const mockForm = {
        id: "test-1",
        title: "Test Form",
        description: "",
        questions: [],
        design: { ...defaultDesignSettings, inputStyle: "glassmorphism" as const },
        webhook: { enabled: false, url: "", headers: {}, events: [], tracking: {} },
        sharing: { slug: "", customDomain: "" },
        workspaceId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = builderToFormData(mockForm as any);
      expect(result.design?.inputStyle).toBe("glassmorphism");
    });

    it("should default to 'default' when inputStyle is not set", async () => {
      const { builderToFormData } = await import("../client/src/lib/builderToForm");
      const { defaultDesignSettings } = await import("../client/src/lib/builderTypes");

      const mockForm = {
        id: "test-2",
        title: "Test Form",
        description: "",
        questions: [],
        design: { ...defaultDesignSettings },
        webhook: { enabled: false, url: "", headers: {}, events: [], tracking: {} },
        sharing: { slug: "", customDomain: "" },
        workspaceId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = builderToFormData(mockForm as any);
      expect(result.design?.inputStyle).toBe("default");
    });
  });
});
