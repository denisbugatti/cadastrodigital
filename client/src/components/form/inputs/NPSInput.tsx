/**
 * FormFlow — Dark Futuristic Design
 * NPS (Net Promoter Score) input with 0-10 scale and color gradient.
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
  if (score <= 6) return "oklch(0.6 0.22 25)";   // Detractor - red
  if (score <= 8) return "oklch(0.7 0.18 85)";    // Passive - yellow
  return "oklch(0.65 0.18 150)";                    // Promoter - green
}

function getNPSGlow(score: number): string {
  if (score <= 6) return "oklch(0.6 0.22 25 / 0.3)";
  if (score <= 8) return "oklch(0.7 0.18 85 / 0.3)";
  return "oklch(0.65 0.18 150 / 0.3)";
}

export function NPSInput({ value, onChange, labels, onAutoAdvance }: NPSInputProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {Array.from({ length: 11 }, (_, i) => {
          const isActive = value === i;
          const isHovered = hovered === i;
          const displayColor = isActive || isHovered ? getNPSColor(i) : "oklch(0.25 0.02 260)";
          const displayGlow = isActive || isHovered ? getNPSGlow(i) : "transparent";

          return (
            <motion.button
              key={i}
              onClick={() => {
                onChange(i);
                if (onAutoAdvance) setTimeout(onAutoAdvance, 500);
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="w-12 h-12 rounded-xl font-body font-semibold text-base transition-all duration-200 flex items-center justify-center"
              style={{
                background: isActive ? displayColor : "oklch(0.15 0.02 260 / 0.6)",
                border: `1.5px solid ${isActive || isHovered ? displayColor : "oklch(0.3 0.02 260 / 0.4)"}`,
                color: isActive ? "white" : isHovered ? displayColor : "oklch(0.5 0.02 260)",
                boxShadow: isActive ? `0 0 20px ${displayGlow}` : "none",
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              {i}
            </motion.button>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-4 px-1">
        <span className="text-xs text-muted-foreground/50 font-body">
          {labels?.low || "Nada provável"}
        </span>
        <span className="text-xs text-muted-foreground/50 font-body">
          {labels?.high || "Muito provável"}
        </span>
      </div>

      {/* Score display */}
      {value >= 0 && (
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span
            className="text-sm font-body font-medium"
            style={{ color: getNPSColor(value) }}
          >
            {value <= 6 ? "Detrator" : value <= 8 ? "Neutro" : "Promotor"}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
