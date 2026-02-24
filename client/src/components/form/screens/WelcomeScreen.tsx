/**
 * FormFlow Welcome Screen — Typeform-style
 * Full-screen colored background with centered content.
 * Supports builder design settings (colors, font, logo).
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { ArrowRight } from "lucide-react";

interface DesignProps {
  backgroundColor?: string;
  questionColor?: string;
  answerColor?: string;
  buttonColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  backgroundImage?: string;
}

export interface WelcomeScreenProps {
  question: Question;
  onStart: () => void;
  design?: DesignProps;
}

export function WelcomeScreen({ question, onStart, design }: WelcomeScreenProps) {
  const bgColor = design?.backgroundColor || "#3B82F6";
  const buttonColor = design?.buttonColor || "#FFFFFF";
  const fontFamily = design?.fontFamily || "Plus Jakarta Sans, sans-serif";
  const logoUrl = design?.logoUrl;
  const buttonText = question.buttonText || "Começar";
  const showButton = question.showButton !== false;
  const hasImage = !!question.imageUrl;

  // Determine text color based on background brightness
  const isLightBg = isLightColor(bgColor);
  const textColor = isLightBg ? "#1E293B" : "#FFFFFF";
  const subtitleColor = isLightBg ? "rgba(30,41,59,0.7)" : "rgba(255,255,255,0.75)";
  const btnTextColor = isLightColor(buttonColor) ? "#1E293B" : "#FFFFFF";
  const hintColor = isLightBg ? "rgba(30,41,59,0.4)" : "rgba(255,255,255,0.4)";

  return (
    <div
      className="w-full h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* Background image overlay */}
      {question.imageUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${question.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.15,
          }}
        />
      )}

      {/* Logo top-left (if set in design) */}
      {logoUrl && (
        <motion.div
          className="absolute top-6 left-6 z-10"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 sm:h-10 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </motion.div>
      )}

      {/* Centered content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          style={{ color: textColor, fontFamily }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {question.title}
        </motion.h1>

        {/* Subtitle */}
        {question.subtitle && (
          <motion.p
            className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl leading-relaxed"
            style={{ color: subtitleColor, fontFamily }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {question.subtitle}
          </motion.p>
        )}

        {/* CTA Button */}
        {showButton && (
          <motion.div
            className="mt-8 sm:mt-10 flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={onStart}
              className="px-8 py-3.5 sm:py-4 rounded-lg text-base sm:text-lg font-semibold shadow-lg flex items-center gap-3 transition-all"
              style={{
                backgroundColor: buttonColor,
                color: btnTextColor,
                fontFamily,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {buttonText}
              <ArrowRight size={18} />
            </motion.button>

            {/* Enter hint */}
            <motion.span
              className="text-xs sm:text-sm hidden sm:inline-flex items-center gap-1"
              style={{ color: hintColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              pressione <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: hintColor }}>Enter ↵</kbd>
            </motion.span>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Helper to determine if a hex color is light */
function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
