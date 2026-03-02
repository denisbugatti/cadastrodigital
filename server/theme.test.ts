import { describe, it, expect } from "vitest";

/**
 * Theme toggle feature tests
 * 
 * The theme toggle is a purely frontend feature using ThemeContext.
 * These tests verify:
 * 1. The ThemeContext module exports correctly
 * 2. The Settings page includes the Aparência tab
 * 3. The CSS variables for dark mode are defined
 * 4. The ThemeProvider is configured as switchable in App.tsx
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const projectRoot = resolve(import.meta.dirname, "..");

describe("Theme toggle feature", () => {
  describe("ThemeContext", () => {
    it("exports ThemeProvider and useTheme", async () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("export function ThemeProvider");
      expect(content).toContain("export function useTheme");
    });

    it("supports switchable mode with localStorage persistence", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("switchable");
      expect(content).toContain('localStorage.getItem("theme")');
      expect(content).toContain('localStorage.setItem("theme"');
    });

    it("toggles between light and dark themes", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("toggleTheme");
      expect(content).toContain('root.classList.add("dark")');
      expect(content).toContain('root.classList.remove("dark")');
    });
  });

  describe("App.tsx ThemeProvider configuration", () => {
    it("has ThemeProvider with switchable=true", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/App.tsx"),
        "utf-8"
      );
      expect(content).toContain("switchable={true}");
    });
  });

  describe("CSS dark mode variables", () => {
    it("defines .dark class with CSS variables in index.css", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/index.css"),
        "utf-8"
      );
      expect(content).toContain(".dark {");
      expect(content).toContain("--background:");
      expect(content).toContain("--foreground:");
      expect(content).toContain("--card:");
      expect(content).toContain("--primary:");
      expect(content).toContain("--border:");
    });

    it("uses oklch color format for dark mode variables", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/index.css"),
        "utf-8"
      );
      // Extract the .dark block
      const darkStart = content.indexOf(".dark {");
      const darkEnd = content.indexOf("}", darkStart);
      const darkBlock = content.substring(darkStart, darkEnd);
      
      // All color values should use oklch
      const colorLines = darkBlock.split("\n").filter(line => line.includes("--") && line.includes(":"));
      for (const line of colorLines) {
        if (line.includes("oklch") || line.includes("rem")) {
          // Valid - uses oklch or is a non-color value like radius
          continue;
        }
        // If it's not oklch and not a non-color value, fail
        expect(line).toContain("oklch");
      }
    });
  });

  describe("Settings page Aparência tab", () => {
    it("includes Aparência tab with theme options", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("aparencia");
      expect(content).toContain("AppearanceTab");
      expect(content).toContain("Aparência");
    });

    it("imports useTheme from ThemeContext", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain('import { useTheme } from "@/contexts/ThemeContext"');
    });

    it("provides light and dark theme options", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain('"light"');
      expect(content).toContain('"dark"');
      expect(content).toContain("Claro");
      expect(content).toContain("Escuro");
    });

    it("calls toggleTheme when selecting a different theme", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("toggleTheme()");
    });
  });

  describe("Theme-aware components (no hardcoded bg-white)", () => {
    it("Dashboard.tsx uses bg-background instead of bg-white for header", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Dashboard.tsx"),
        "utf-8"
      );
      // Header should use bg-background, not bg-white
      expect(content).not.toMatch(/header.*bg-white\//);
      expect(content).toContain("bg-background/80 backdrop-blur");
    });

    it("Dashboard.tsx uses bg-popover for dropdown menus", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Dashboard.tsx"),
        "utf-8"
      );
      expect(content).toContain("bg-popover");
    });

    it("Builder.tsx uses bg-background instead of bg-white for header", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Builder.tsx"),
        "utf-8"
      );
      // Should not have bg-white in header
      const headerLine = content.split("\n").find(l => l.includes("border-b") && l.includes("bg-") && l.includes("flex items-center justify-between"));
      if (headerLine) {
        expect(headerLine).not.toContain("bg-white");
      }
    });

    it("Settings.tsx uses bg-card for cards instead of bg-background", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("bg-card");
    });
  });
});
