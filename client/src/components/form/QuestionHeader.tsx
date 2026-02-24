/**
 * FormFlow Question Header — Typeform-style
 * "1 →" prefix with large title and subtitle. Mobile-responsive.
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
    <div className="mb-8 sm:mb-10">
      {/* Title with inline number → */}
      <motion.h2
        className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-snug tracking-tight text-inherit"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {showNumber && number !== undefined && (
          <span className="inline-flex items-baseline gap-1.5 mr-2">
            <span className="text-blue-500 font-bold">{number}</span>
            <span className="text-blue-500">→</span>
          </span>
        )}
        {title}
        {/* Required asterisk */}
      </motion.h2>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg opacity-60 font-body leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
