/**
 * FormFlow Welcome Screen — Respondi/Typeform-style
 * Full-screen colored background with centered content.
 * Logo top-left (LARGE on desktop), button with Enter hint.
 * Adapts text color to background brightness.
 * Font sizes match Respondi: title 32px, subtitle 24px, button 16px.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { ArrowRight } from "lucide-react";

interface DesignProps {
  backgroundColor?: string;
  questionColor?: string;
  answerColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  backgroundImage?: string;
  backgroundType?: string;
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
  const btnTextColor = design?.buttonTextColor || (isLightColor(buttonColor) ? "#1E293B" : "#FFFFFF");
  const hintColor = isLightBg ? "rgba(30,41,59,0.4)" : "rgba(255,255,255,0.45)";

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: (design?.backgroundType === 'geometric' || design?.backgroundType === 'webgl') ? 'transparent' : bgColor, fontFamily }}
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

      {/* Logo top-left — LARGE on desktop */}
      {logoUrl && (
        <motion.div
          className="absolute top-4 left-4 z-10"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 lg:h-28 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      )}

      {/* Centered content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-2xl mx-auto">
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
              className="h-16 mx-auto"
            />
          </motion.div>
        )}

        {/* Title — 32px matching Respondi */}
        <motion.h1
          className="leading-tight tracking-tight text-2xl sm:text-3xl md:text-[32px]"
          style={{
            color: textColor,
            fontFamily,
            fontWeight: 400,
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {question.title}
        </motion.h1>

        {/* Subtitle — 24px matching Respondi */}
        {question.subtitle && (
          <motion.p
            className="mt-2 sm:mt-3 leading-relaxed text-base sm:text-lg md:text-xl"
            style={{
              color: subtitleColor,
              fontFamily,
              fontWeight: 400,
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {question.subtitle}
          </motion.p>
        )}

        {/* CTA Button + Enter hint (Respondi-style) — 16px button text */}
        {showButton && (
          <motion.div
            className="mt-5 sm:mt-7 flex items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              onClick={onStart}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg font-medium shadow-lg flex items-center gap-2 sm:gap-2.5 transition-all text-sm sm:text-base"
              style={{
                backgroundColor: buttonColor,
                color: btnTextColor,
                fontFamily,
                fontSize: "16px",
                fontWeight: 400,
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
