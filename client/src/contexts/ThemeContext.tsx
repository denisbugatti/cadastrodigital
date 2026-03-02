import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

type ThemeMode = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  /** The user's preference: light, dark, or system */
  mode: ThemeMode;
  /** The actual applied theme after resolving "system" */
  theme: ResolvedTheme;
  /** Set the theme mode (light/dark/system) */
  setMode: (mode: ThemeMode) => void;
  /** Legacy toggle between light and dark */
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  switchable?: boolean;
}

/** Detect the system's preferred color scheme */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Resolve a mode to an actual theme */
function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  return mode;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme-mode");
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
      // Migrate from old "theme" key
      const oldStored = localStorage.getItem("theme");
      if (oldStored === "light" || oldStored === "dark") {
        return oldStored;
      }
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(mode));

  // Apply the resolved theme to the DOM
  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [resolvedTheme]);

  // Persist the mode
  useEffect(() => {
    if (switchable) {
      localStorage.setItem("theme-mode", mode);
      // Clean up old key
      localStorage.removeItem("theme");
    }
  }, [mode, switchable]);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (mode !== "system") {
      setResolvedTheme(resolveTheme(mode));
      return;
    }

    // Set initial resolved theme
    setResolvedTheme(getSystemTheme());

    // Listen for changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    if (!switchable) return;
    setModeState(newMode);
  }, [switchable]);

  // Legacy toggleTheme for backward compatibility
  const toggleTheme = switchable
    ? () => {
        setModeState(prev => {
          if (prev === "system") return "dark";
          return prev === "light" ? "dark" : "light";
        });
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ mode, theme: resolvedTheme, setMode, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
