/**
 * FormFlow Thank You Screen — Typeform-style
 * Full-screen celebration with design settings support.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface DesignProps {
  backgroundColor?: string;
  questionColor?: string;
  answerColor?: string;
  buttonColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  backgroundImage?: string;
}

export interface ThankYouScreenProps {
  question: Question;
  design?: DesignProps;
}

export function ThankYouScreen({ question, design }: ThankYouScreenProps) {
  const bgColor = design?.backgroundColor || "#FFFFFF";
  const buttonColor = design?.buttonColor || "#3B82F6";
  const fontFamily = design?.fontFamily || "Plus Jakarta Sans, sans-serif";
  const showButton = question.showButton === true;
  const buttonText = question.buttonText || "Enviar outra resposta";
  const redirectUrl = question.redirectUrl;

  const isLightBg = isLightColor(bgColor);
  const textColor = isLightBg ? "#1E293B" : "#FFFFFF";
  const subtitleColor = isLightBg ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.7)";
  const btnTextColor = isLightColor(buttonColor) ? "#1E293B" : "#FFFFFF";

  // Auto-redirect if URL is set
  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => {
        window.open(redirectUrl, "_blank");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [redirectUrl]);

  return (
    <div
      className="w-full h-screen flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: bgColor, fontFamily }}
    >
      {/* Centered content */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Checkmark animation */}
        <motion.div
          className="mb-8 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mx-auto"
          style={{
            backgroundColor: isLightBg ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.2)",
            border: `2px solid ${isLightBg ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.4)"}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
          >
            <CheckCircle2 size={40} className="text-emerald-500" strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight"
          style={{ color: textColor, fontFamily }}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {question.subtitle}
          </motion.p>
        )}

        {/* Action buttons */}
        <motion.div
          className="mt-8 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          {showButton && (
            <motion.button
              onClick={() => window.location.reload()}
              className="px-8 py-3.5 rounded-lg text-base font-semibold shadow-lg transition-all"
              style={{
                backgroundColor: buttonColor,
                color: btnTextColor,
                fontFamily,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {buttonText}
            </motion.button>
          )}

          {redirectUrl && (
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ color: isLightBg ? buttonColor : "rgba(255,255,255,0.8)" }}
            >
              <ExternalLink size={14} />
              Visitar link
            </a>
          )}
        </motion.div>

        {/* Redirect notice */}
        {redirectUrl && (
          <motion.p
            className="mt-4 text-xs"
            style={{ color: subtitleColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Você será redirecionado em 3 segundos...
          </motion.p>
        )}

        {/* Decorative dots */}
        {!redirectUrl && (
          <motion.div
            className="mt-10 flex gap-2 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {["#3B82F6", "#10B981", "#F59E0B"].map((color, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.9 + i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
