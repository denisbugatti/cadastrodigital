/**
 * FormFlow Statement Screen (Light Theme)
 * Informational screen with no input, just a message.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { MessageSquare, ArrowRight } from "lucide-react";

interface StatementScreenProps {
  question: Question;
  onNext: () => void;
}

export function StatementScreen({ question, onNext }: StatementScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon */}
      <motion.div
        className="mb-8 w-16 h-16 rounded-2xl flex items-center justify-center bg-brand-lighter border border-brand/20"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
      >
        <MessageSquare size={28} className="text-brand" />
      </motion.div>

      {/* Title */}
      <motion.h2
        className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
      >
        {question.title}
      </motion.h2>

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

      {/* Continue button */}
      <motion.button
        onClick={onNext}
        className="mt-8 px-6 py-3 rounded-xl bg-brand text-white font-body font-semibold text-base hover:bg-brand-dark transition-all duration-300 shadow-sm flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Continuar
        <ArrowRight size={16} />
      </motion.button>

      <motion.p
        className="mt-5 text-sm text-muted-foreground font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Pressione <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd> para continuar
      </motion.p>
    </div>
  );
}
