import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  // Ignore build output, node_modules, and generated files
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".manus-logs/**",
      "drizzle/migrations/**",
      "scripts/**",
    ],
  },

  // Base JS recommended rules (relaxed)
  js.configs.recommended,

  // TypeScript support
  ...tseslint.configs.recommended,

  // React Hooks rules — the main reason for this config
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // CRITICAL: Prevents hooks called conditionally (after early returns, inside if blocks, etc.)
      "react-hooks/rules-of-hooks": "error",
      // Warns about missing dependencies in useEffect/useMemo/useCallback
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Relax rules that are too noisy for this project
  {
    rules: {
      // Allow `any` type — project uses it extensively for form data
      "@typescript-eslint/no-explicit-any": "off",
      // Allow unused vars with underscore prefix
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      }],
      // Allow empty functions (common in React for default props)
      "@typescript-eslint/no-empty-function": "off",
      // Allow require imports (used in some server files)
      "@typescript-eslint/no-require-imports": "off",
      // Allow non-null assertions (common with tRPC context)
      "@typescript-eslint/no-non-null-assertion": "off",
      // Allow empty object types
      "@typescript-eslint/no-empty-object-type": "off",
      // Prefer const but don't error
      "prefer-const": "warn",
      // Allow empty catch blocks
      "no-empty": ["warn", { allowEmptyCatch: true }],
      // Allow unused expressions (common in ternaries for side effects)
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      // Allow constant binary expressions (common in JSX conditional rendering)
      "no-constant-binary-expression": "off",
      // Allow non-null asserted optional chain (common with tRPC data)
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
    },
  },

  // Only apply react-hooks rules to React component files
  {
    files: ["client/src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // Disable react-hooks for server files (no React there)
  {
    files: ["server/**/*.{ts,tsx}", "drizzle/**/*.ts", "shared/**/*.ts"],
    rules: {
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];
