/**
 * FormFlow Question Header — Typeform/Respondi-style
 * "1 →" prefix with large title and subtitle.
 * Inherits text color from parent container (adapts to any background).
 * Font sizes match Respondi: title 24px, subtitle 16px.
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
    <div className="mb-8">
      {/* Title with inline number → — 24px matching Respondi */}
      <motion.h2
        className="font-display leading-snug tracking-tight"
        style={{
          fontSize: "24px",
          fontWeight: 400,
          lineHeight: "28.8px",
        }}
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

      {/* Subtitle — 16px */}
      {subtitle && (
        <motion.p
          className="mt-3 leading-relaxed opacity-55"
          style={{
            fontSize: "16px",
            fontWeight: 400,
          }}
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
