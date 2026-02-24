/**
 * FormFlow — Dark Futuristic Design
 * Satisfaction scale with emoji faces and neon glow.
 */

import { motion } from "framer-motion";
import { useState } from "react";

interface SatisfactionInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  labels?: { low: string; high: string };
  onAutoAdvance?: () => void;
}

const FACES = [
  { emoji: "😡", label: "Muito insatisfeito", color: "oklch(0.6 0.22 25)" },
  { emoji: "😞", label: "Insatisfeito", color: "oklch(0.65 0.2 45)" },
  { emoji: "😐", label: "Neutro", color: "oklch(0.7 0.18 85)" },
  { emoji: "😊", label: "Satisfeito", color: "oklch(0.65 0.18 150)" },
  { emoji: "🤩", label: "Muito satisfeito", color: "oklch(0.65 0.2 250)" },
];

export function SatisfactionInput({ value, onChange, onAutoAdvance }: SatisfactionInputProps) {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="flex items-center justify-center gap-5">
        {FACES.map((face, i) => {
          const rating = i + 1;
          const isActive = value === rating;
          const isHovered = hovered === rating;

          return (
            <motion.button
              key={rating}
              onClick={() => {
                onChange(rating);
                if (onAutoAdvance) setTimeout(onAutoAdvance, 500);
              }}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(0)}
              className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200"
              style={{
                background: isActive ? `${face.color.replace(")", " / 0.1)")}` : "transparent",
                border: isActive ? `1.5px solid ${face.color.replace(")", " / 0.3)")}` : "1.5px solid transparent",
                boxShadow: isActive ? `0 0 20px ${face.color.replace(")", " / 0.2)")}` : "none",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              <span
                className="text-4xl transition-transform duration-200"
                style={{
                  filter: isActive || isHovered ? `drop-shadow(0 0 8px ${face.color.replace(")", " / 0.5)")})` : "none",
                  transform: isActive || isHovered ? "scale(1.15)" : "scale(1)",
                }}
              >
                {face.emoji}
              </span>
              {(isActive || isHovered) && (
                <motion.span
                  className="text-[10px] font-body whitespace-nowrap"
                  style={{ color: face.color }}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
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
