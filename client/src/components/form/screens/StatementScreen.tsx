/**
 * FormFlow Statement / Cover Screen
 * Beautiful cover-style screen that acts as a section divider.
 * Adapts to form design colors — works on both light and dark backgrounds.
 * Used for "Check List de documentos", section headers, etc.
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
  const fontFamily = design?.fontFamily || "Plus Jakarta Sans, sans-serif";

  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto px-5 sm:px-8">
      {/* Decorative accent line */}
      <motion.div
        className="w-12 h-1 rounded-full mb-8"
        style={{ backgroundColor: buttonColor }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Icon with glow */}
      {question.imageUrl ? (
        <motion.img
          src={question.imageUrl}
          alt=""
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-6"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
        />
      ) : (
        <motion.div
          className="mb-6 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: `${buttonColor}15`,
            border: `1px solid ${buttonColor}30`,
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
        >
          <Sparkles size={24} style={{ color: buttonColor }} />
        </motion.div>
      )}

      {/* Title */}
      <motion.h2
        className="font-display text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight"
        style={{ fontFamily }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {question.title}
      </motion.h2>

      {/* Subtitle / Description */}
      {question.subtitle && (
        <motion.p
          className="mt-4 text-base sm:text-lg leading-relaxed opacity-60 max-w-md"
          style={{ fontFamily }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {/* Hint — the OK button at the bottom handles navigation */}
      <motion.p
        className="mt-8 text-sm opacity-40"
        style={{ fontFamily }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.6 }}
      >
        Clique em <strong>OK</strong> para continuar
      </motion.p>
    </div>
  );
}
