/**
 * FormFlow — Dark Futuristic Design
 * Statement screen - informational screen with no input, just a message.
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
        className="mb-8 w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{
          background: "oklch(0.65 0.2 250 / 0.1)",
          border: "1.5px solid oklch(0.65 0.2 250 / 0.2)",
        }}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
      >
        <MessageSquare size={28} className="text-neon-blue" />
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

      {/* Subtitle / message */}
      {question.subtitle && (
        <motion.p
          className="mt-5 text-lg text-muted-foreground font-body leading-relaxed max-w-lg"
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
        className="mt-8 px-6 py-3 rounded-full bg-neon-blue text-white font-body font-medium text-base glow-blue hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Continuar
        <ArrowRight size={16} />
      </motion.button>

      <motion.p
        className="mt-5 text-xs text-muted-foreground/40 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        Pressione <kbd className="kbd-dark">Enter ↵</kbd> para continuar
      </motion.p>
    </div>
  );
}
