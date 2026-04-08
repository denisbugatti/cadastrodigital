/**
 * useInputStyle — Hook that returns CSS classes/styles for form inputs
 * based on the selected inputStyle from design settings.
 *
 * Supports: default, glassmorphism, glass-liquid, neon-glow, frost,
 * neumorphism, minimal-line, gradient-border
 */

export type InputStyleType =
  | "default"
  | "glassmorphism"
  | "glass-liquid"
  | "neon-glow"
  | "frost"
  | "neumorphism"
  | "minimal-line"
  | "gradient-border";

interface InputStyleResult {
  /** Classes for text input fields */
  inputClasses: string;
  /** Inline styles for text input fields */
  inputStyles: React.CSSProperties;
  /** Classes for choice/option cards */
  choiceClasses: string;
  /** Inline styles for choice/option cards */
  choiceStyles: React.CSSProperties;
  /** Whether the input needs a gradient wrapper (for gradient-border style) */
  needsGradientWrapper: boolean;
  /** Classes for the gradient wrapper */
  gradientWrapperClasses: string;
  /** Classes for the inner content of gradient wrapper */
  gradientInnerClasses: string;
  /** Whether to remove default border-bottom from text inputs */
  removeDefaultBorder: boolean;
}

export function getInputStyleClasses(
  style: InputStyleType | undefined,
  isLightBg: boolean = false
): InputStyleResult {
  const s = style || "default";

  switch (s) {
    case "glassmorphism":
      return {
        inputClasses: "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4",
        inputStyles: { borderBottom: "none" },
        choiceClasses: "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl",
        choiceStyles: {},
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: true,
      };

    case "glass-liquid":
      return {
        inputClasses:
          "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/25 rounded-2xl px-4 shadow-lg",
        inputStyles: { borderBottom: "none" },
        choiceClasses:
          "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg",
        choiceStyles: {},
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: true,
      };

    case "neon-glow":
      return {
        inputClasses: "bg-transparent border-2 border-blue-400 rounded-xl px-4",
        inputStyles: {
          borderBottom: "none",
          boxShadow: "0 0 15px rgba(59,130,246,0.4), inset 0 0 15px rgba(59,130,246,0.1)",
        },
        choiceClasses: "bg-transparent border-2 border-blue-400/60 rounded-xl",
        choiceStyles: {
          boxShadow: "0 0 10px rgba(59,130,246,0.2)",
        },
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: true,
      };

    case "frost":
      return {
        inputClasses: "bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl px-4",
        inputStyles: { borderBottom: "none" },
        choiceClasses: "bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl",
        choiceStyles: {},
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: true,
      };

    case "neumorphism":
      return {
        inputClasses: "bg-[#1a1a2e] rounded-xl px-4",
        inputStyles: {
          borderBottom: "none",
          boxShadow:
            "5px 5px 10px rgba(0,0,0,0.3), -5px -5px 10px rgba(255,255,255,0.05)",
        },
        choiceClasses: "bg-[#1a1a2e] rounded-xl",
        choiceStyles: {
          boxShadow:
            "3px 3px 6px rgba(0,0,0,0.3), -3px -3px 6px rgba(255,255,255,0.04)",
        },
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: true,
      };

    case "minimal-line":
      return {
        inputClasses: "bg-transparent border-0 px-0",
        inputStyles: { borderBottom: "1px solid rgba(255,255,255,0.3)" },
        choiceClasses: "bg-transparent border border-white/20 rounded-lg",
        choiceStyles: {},
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: false,
      };

    case "gradient-border":
      return {
        inputClasses: "px-4",
        inputStyles: { borderBottom: "none" },
        choiceClasses: "",
        choiceStyles: {},
        needsGradientWrapper: true,
        gradientWrapperClasses:
          "rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]",
        gradientInnerClasses: "bg-[#0a0a1a] rounded-[10px]",
        removeDefaultBorder: true,
      };

    default:
      return {
        inputClasses: "",
        inputStyles: {},
        choiceClasses: "",
        choiceStyles: {},
        needsGradientWrapper: false,
        gradientWrapperClasses: "",
        gradientInnerClasses: "",
        removeDefaultBorder: false,
      };
  }
}
