/**
 * FormFlow Question Header — Typeform/Respondi-style
 * "1 →" prefix with large title and subtitle.
 * Inherits text color from parent container (adapts to any background).
 */

import { motion } from "framer-motion";

interface QuestionHeaderProps {
  number?: number;
  title: string;
  subtitle?: string;
  showNumber?: boolean;
}

export function QuestionHeader({
  number,
  title,
  subtitle,
  showNumber = true,
}: QuestionHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 md:mb-10">
      {/* Title with inline number → */}
      <motion.h2
        className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-snug tracking-tight"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {showNumber && number !== undefined && (
          <span className="inline-flex items-baseline gap-1.5 mr-2">
            <span className="font-bold opacity-80">{number}</span>
            <span className="opacity-60">→</span>
          </span>
        )}
        {title}
      </motion.h2>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="mt-2.5 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg leading-relaxed opacity-55"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
