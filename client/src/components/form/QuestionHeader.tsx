/**
 * FormFlow Question Header (Light Theme)
 * Clean question header with number badge and large typography.
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
    <div className="mb-10">
      {/* Question number badge */}
      {showNumber && number !== undefined && (
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-semibold font-body text-brand bg-brand-lighter border border-brand/20">
            {String(number).padStart(2, "0")}
          </span>
          <div className="h-px w-10 bg-gradient-to-r from-brand/30 to-transparent" />
        </motion.div>
      )}

      {/* Title */}
      <motion.h2
        className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold leading-tight text-foreground tracking-tight"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        {title}
      </motion.h2>

      {/* Subtitle */}
      {subtitle && (
        <motion.p
          className="mt-4 text-lg sm:text-xl text-muted-foreground font-body leading-relaxed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
