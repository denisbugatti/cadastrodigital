/**
 * FormFlow Welcome Screen (Light Theme)
 * Clean welcome screen with brand accent and smooth entrance.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  question: Question;
  onStart: () => void;
}

export function WelcomeScreen({ question, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon */}
      <motion.div
        className="mb-10 w-20 h-20 rounded-2xl bg-brand-lighter flex items-center justify-center"
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
      >
        <svg width="36" height="36" viewBox="0 0 18 18" fill="none">
          <path
            d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z"
            className="stroke-brand"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M6 7.5H12M6 10.5H9.5"
            className="stroke-brand"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
      >
        {question.title}
      </motion.h1>

      {/* Subtitle */}
      {question.subtitle && (
        <motion.p
          className="mt-5 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed max-w-lg"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {/* CTA Button */}
      <motion.button
        onClick={onStart}
        className="
          mt-10 px-8 py-4 rounded-xl
          bg-brand text-white font-body font-semibold text-lg
          hover:bg-brand-dark
          transition-all duration-300 shadow-lg shadow-brand/20
          flex items-center gap-3
        "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Começar
        <ArrowRight size={18} />
      </motion.button>

      {/* Hint */}
      <motion.p
        className="mt-6 text-sm text-muted-foreground font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Pressione <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd> para começar
      </motion.p>
    </div>
  );
}
