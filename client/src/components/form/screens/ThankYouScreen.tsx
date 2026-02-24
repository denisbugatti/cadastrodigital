/**
 * FormFlow Thank You Screen (Light Theme)
 * Clean celebration screen with checkmark animation.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { CheckCircle2 } from "lucide-react";

interface ThankYouScreenProps {
  question: Question;
}

export function ThankYouScreen({ question }: ThankYouScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Animated checkmark */}
      <motion.div
        className="mb-8 w-24 h-24 rounded-full flex items-center justify-center bg-emerald-50 border-2 border-emerald-200"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
        >
          <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
      >
        {question.title}
      </motion.h1>

      {/* Subtitle */}
      {question.subtitle && (
        <motion.p
          className="mt-5 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed max-w-lg"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {/* Decorative dots */}
      <motion.div
        className="mt-10 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        {["bg-brand", "bg-emerald-400", "bg-amber-400"].map((color, i) => (
          <motion.div
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${color}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8 + i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
          />
        ))}
      </motion.div>
    </div>
  );
}
