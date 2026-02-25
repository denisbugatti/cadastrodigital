/**
 * FormFlow Welcome Screen — Respondi/Typeform-style
 * Full-screen colored background with centered content.
 * Logo top-left (from design settings), button with Enter hint.
 * Adapts text color to background brightness.
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
  const buttonText = question.buttonText || "começar";
  const showButton = question.showButton !== false;

  // Determine text color based on background brightness
  const isLightBg = isLightColor(bgColor);
  const textColor = isLightBg ? "#1E293B" : "#FFFFFF";
  const subtitleColor = isLightBg ? "rgba(30,41,59,0.65)" : "rgba(255,255,255,0.7)";
  const btnTextColor = isLightColor(buttonColor) ? "#1E293B" : "#FFFFFF";
  const hintColor = isLightBg ? "rgba(30,41,59,0.4)" : "rgba(255,255,255,0.45)";

  return (
    <div
      className="w-full h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* Background image overlay if set */}
      {design?.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${design.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.12,
          }}
        />
      )}

      {/* Logo top-left (like Respondi) */}
      {logoUrl && (
        <motion.div
          className="absolute top-5 left-5 sm:top-7 sm:left-8 z-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-7 sm:h-9 md:h-10 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      )}

      {/* Centered content */}
      <div className="relative z-10 text-center px-6 sm:px-8 max-w-2xl mx-auto">
        {/* Motion icon or custom image */}
        {question.motionIconUrl && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <img
              src={question.motionIconUrl}
              alt=""
              className="h-16 sm:h-20 mx-auto"
            />
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight"
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
            className="mt-3 sm:mt-5 text-sm sm:text-base md:text-lg leading-relaxed"
            style={{ color: subtitleColor, fontFamily }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {question.subtitle}
          </motion.p>
        )}

        {/* CTA Button + Enter hint (Respondi-style) */}
        {showButton && (
          <motion.div
            className="mt-7 sm:mt-9 flex items-center justify-center gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={onStart}
              className="px-7 sm:px-8 py-3 sm:py-3.5 rounded-lg text-sm sm:text-base font-semibold shadow-lg flex items-center gap-2.5 transition-all"
              style={{
                backgroundColor: buttonColor,
                color: btnTextColor,
                fontFamily,
              }}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
              whileTap={{ scale: 0.96 }}
            >
              {buttonText}
              <ArrowRight size={16} />
            </motion.button>

            {/* Enter hint (like Respondi: "carrega em Enter ↵") */}
            <motion.span
              className="text-xs hidden sm:inline-flex items-center gap-1"
              style={{ color: hintColor }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              carrega em{" "}
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{ color: hintColor }}
              >
                Enter
              </kbd>{" "}
              ↵
            </motion.span>
          </motion.div>
        )}
      </div>

      {/* Question counter bottom-right (like Respondi: "7/24") */}
      <motion.div
        className="absolute bottom-5 right-6 sm:bottom-7 sm:right-8 text-xs sm:text-sm font-medium"
        style={{ color: hintColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {/* This is just decorative on welcome, actual counter is in FormContainer */}
      </motion.div>
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
