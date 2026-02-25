/**
 * FormFlow Satisfaction Input — Typeform/Respondi-style
 * Emoji faces with hover effects. Works on any background.
 */

import { motion } from "framer-motion";
import { useState } from "react";

interface SatisfactionInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  labels?: { low: string; high: string };
  onAutoAdvance?: (value?: unknown) => void;
}

const FACES = [
  { emoji: "😡", label: "Muito insatisfeito" },
  { emoji: "😞", label: "Insatisfeito" },
  { emoji: "😐", label: "Neutro" },
  { emoji: "😊", label: "Satisfeito" },
  { emoji: "🤩", label: "Muito satisfeito" },
];

export function SatisfactionInput({
  value,
  onChange,
  onAutoAdvance,
}: SatisfactionInputProps) {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {FACES.map((face, i) => {
          const rating = i + 1;
          const isActive = value === rating;
          const isHovered = hovered === rating;
          return (
            <motion.button
              key={rating}
              onClick={() => {
                onChange(rating);
                if (onAutoAdvance) setTimeout(() => onAutoAdvance(rating), 500);
              }}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(0)}
              className="relative flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all duration-200 border"
              style={{
                borderColor: isActive
                  ? "currentColor"
                  : isHovered
                    ? "rgba(128,128,128,0.4)"
                    : "transparent",
                backgroundColor: isActive
                  ? "rgba(128,128,128,0.08)"
                  : "transparent",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.35 + i * 0.08,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              <span
                className="text-3xl transition-transform duration-200"
                style={{
                  transform:
                    isActive || isHovered ? "scale(1.15)" : "scale(1)",
                }}
              >
                {face.emoji}
              </span>
              {(isActive || isHovered) && (
                <motion.span
                  className="text-[10px] whitespace-nowrap font-medium opacity-60"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 0.6, y: 0 }}
                >
                  {face.label}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
