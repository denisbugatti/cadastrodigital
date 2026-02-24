/**
 * FormFlow — Dark Futuristic Design
 * Question header with neon number badge, bold Syne title, and subtle glow.
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
      {/* Question number badge with neon accent */}
      {showNumber && number !== undefined && (
        <motion.div
          className="flex items-center gap-3 mb-5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold font-body text-neon-cyan"
            style={{
              background: "oklch(0.75 0.15 195 / 0.1)",
              border: "1px solid oklch(0.75 0.15 195 / 0.2)",
            }}
          >
            {String(number).padStart(2, "0")}
          </span>
          <div
            className="h-px w-10"
            style={{
              background: "linear-gradient(90deg, oklch(0.75 0.15 195 / 0.3), transparent)",
            }}
          />
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
          className="mt-4 text-base sm:text-lg text-muted-foreground font-body leading-relaxed"
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
