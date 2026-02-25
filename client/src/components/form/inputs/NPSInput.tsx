/**
 * FormFlow NPS Input — Typeform-style
 * 0-10 scale with color coding, mobile-friendly.
 */

import { motion } from "framer-motion";
import { useState } from "react";

interface NPSInputProps {
  value: number;
  onChange: (value: number) => void;
  labels?: { low: string; high: string };
  onAutoAdvance?: () => void;
}

function getNPSColor(score: number): string {
  if (score <= 6) return "#ef4444";
  if (score <= 8) return "#f59e0b";
  return "#22c55e";
}

function getNPSBg(score: number): string {
  if (score <= 6) return "#fef2f2";
  if (score <= 8) return "#fffbeb";
  return "#f0fdf4";
}

export function NPSInput({ value, onChange, labels, onAutoAdvance }: NPSInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
        {Array.from({ length: 11 }, (_, i) => {
          const isActive = value === i;
          const isHovered = hovered === i;
          return (
            <motion.button
              key={i}
              onClick={() => { onChange(i); if (onAutoAdvance) setTimeout(onAutoAdvance, 500); }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg font-body font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center border touch-manipulation"
              style={{
                background: isActive ? getNPSColor(i) : isHovered ? getNPSBg(i) : "transparent",
                borderColor: isActive || isHovered ? getNPSColor(i) : "rgba(128,128,128,0.2)",
                color: isActive ? "white" : isHovered ? getNPSColor(i) : "rgba(128,128,128,0.6)",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{ delay: 0.3 + i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.08 }}
            >
              {i}
            </motion.button>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 sm:mt-4 px-1">
        <span className="text-xs sm:text-sm opacity-50 font-body">{labels?.low || "Nada provável"}</span>
        <span className="text-xs sm:text-sm opacity-50 font-body">{labels?.high || "Muito provável"}</span>
      </div>
      {value >= 0 && (
        <motion.div className="mt-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-xs sm:text-sm font-body font-medium" style={{ color: getNPSColor(value) }}>
            {value <= 6 ? "Detrator" : value <= 8 ? "Neutro" : "Promotor"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
