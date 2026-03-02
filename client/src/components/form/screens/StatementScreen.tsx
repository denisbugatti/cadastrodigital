/**
 * FormFlow Statement / Cover Screen
 * Beautiful cover-style screen that acts as a section divider.
 * Large title, description, decorative elements, and continue button.
 * Adapts to form design colors — works on both light and dark backgrounds.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { ArrowRight, Sparkles } from "lucide-react";

interface StatementScreenProps {
  question: Question;
  onNext: () => void;
  design?: {
    backgroundColor?: string;
    questionColor?: string;
    answerColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    fontFamily?: string;
    logoUrl?: string;
    backgroundImage?: string;
  };
}

export function StatementScreen({ question, onNext, design }: StatementScreenProps) {
  const buttonColor = design?.buttonColor || "#3B82F6";
  const buttonTextColor = design?.buttonTextColor || "#FFFFFF";
  const questionColor = design?.questionColor || "#1E293B";
  const fontFamily = design?.fontFamily || "Plus Jakarta Sans, sans-serif";

  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto px-5 sm:px-8">
      {/* Decorative accent dots */}
      <motion.div
        className="flex items-center gap-1.5 mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${buttonColor}40` }} />
        <div className="w-10 h-1.5 rounded-full" style={{ backgroundColor: buttonColor }} />
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: `${buttonColor}40` }} />
      </motion.div>

      {/* Icon / Image */}
      {question.imageUrl ? (
        <motion.img
          src={question.imageUrl}
          alt=""
          className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-8 rounded-2xl"
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
        />
      ) : (
        <motion.div
          className="mb-8 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${buttonColor}20, ${buttonColor}08)`,
            border: `1.5px solid ${buttonColor}25`,
          }}
          initial={{ opacity: 0, scale: 0.7, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
        >
          <Sparkles size={28} style={{ color: buttonColor }} />
        </motion.div>
      )}

      {/* Title — Large cover-style */}
      <motion.h2
        className="font-display tracking-tight leading-tight"
        style={{
          fontFamily,
          fontSize: "clamp(28px, 5vw, 36px)",
          fontWeight: 600,
          lineHeight: 1.2,
          color: questionColor,
        }}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {question.title}
      </motion.h2>

      {/* Subtitle / Description */}
      {question.subtitle && (
        <motion.p
          className="mt-5 leading-relaxed max-w-lg"
          style={{
            fontFamily,
            fontSize: "clamp(16px, 2.5vw, 18px)",
            fontWeight: 400,
            color: questionColor,
            opacity: 0.55,
          }}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {/* Continue Button */}
      {question.showButton !== false && question.buttonText && (
        <motion.div
          className="mt-9"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.button
            onClick={onNext}
            className="group px-8 py-3.5 rounded-xl font-medium shadow-lg flex items-center gap-3 transition-all"
            style={{
              backgroundColor: buttonColor,
              color: buttonTextColor,
              fontFamily,
              fontSize: "16px",
              fontWeight: 500,
            }}
            whileHover={{ scale: 1.04, boxShadow: `0 10px 35px ${buttonColor}40` }}
            whileTap={{ scale: 0.96 }}
          >
            {question.buttonText}
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </motion.div>
      )}

      {/* Hint — press Enter or OK */}
      {(!question.showButton || !question.buttonText) && (
        <motion.p
          className="mt-10"
          style={{ fontFamily, fontSize: "14px", color: questionColor, opacity: 0.35 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 0.6 }}
        >
          Pressione <strong>Enter ↵</strong> para continuar
        </motion.p>
      )}
    </div>
  );
}
