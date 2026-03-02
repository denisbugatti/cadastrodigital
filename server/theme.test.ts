import { describe, it, expect } from "vitest";

/**
 * Theme toggle feature tests
 * 
 * The theme toggle is a purely frontend feature using ThemeContext.
 * These tests verify:
 * 1. The ThemeContext module exports correctly and supports system mode
 * 2. The Settings page includes the Aparência tab with 3 options
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

    it("supports three modes: light, dark, and system", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain('"light"');
      expect(content).toContain('"dark"');
      expect(content).toContain('"system"');
      expect(content).toContain("ThemeMode");
    });

    it("supports switchable mode with localStorage persistence", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("switchable");
      expect(content).toContain("localStorage");
      expect(content).toContain("theme-mode");
    });

    it("detects system preference via prefers-color-scheme", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("prefers-color-scheme: dark");
      expect(content).toContain("matchMedia");
    });

    it("listens for system theme changes in real time", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("addEventListener");
      expect(content).toContain("removeEventListener");
      expect(content).toContain("change");
    });

    it("provides setMode function to switch between modes", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("setMode");
      expect(content).toContain("mode: ThemeMode");
    });

    it("resolves system mode to actual light/dark theme", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain("resolveTheme");
      expect(content).toContain("getSystemTheme");
      expect(content).toContain("ResolvedTheme");
    });

    it("applies dark class to document root", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      expect(content).toContain('root.classList.add("dark")');
      expect(content).toContain('root.classList.remove("dark")');
    });

    it("migrates from old theme localStorage key", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/contexts/ThemeContext.tsx"),
        "utf-8"
      );
      // Should read old "theme" key for migration
      expect(content).toContain('getItem("theme")');
      // Should clean up old key
      expect(content).toContain('removeItem("theme")');
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
          continue;
        }
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

    it("provides light, dark, and system theme options", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain('"light"');
      expect(content).toContain('"dark"');
      expect(content).toContain('"system"');
      expect(content).toContain("Claro");
      expect(content).toContain("Escuro");
      expect(content).toContain("Sistema");
    });

    it("uses setMode to change theme instead of toggleTheme", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("setMode");
      expect(content).toContain("mode");
    });

    it("displays system option with Monitor icon", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("Monitor");
      expect(content).toContain("Segue a preferência do seu dispositivo");
    });

    it("uses 3-column grid for theme options", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("sm:grid-cols-3");
    });
  });

  describe("Theme-aware components (no hardcoded bg-white)", () => {
    it("Dashboard.tsx uses bg-background instead of bg-white for header", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Dashboard.tsx"),
        "utf-8"
      );
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

    it("Settings.tsx uses bg-card for cards", () => {
      const content = readFileSync(
        resolve(projectRoot, "client/src/pages/Settings.tsx"),
        "utf-8"
      );
      expect(content).toContain("bg-card");
    });
  });
});
