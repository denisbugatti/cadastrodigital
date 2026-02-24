/**
 * FormFlow Satisfaction Input (Light Theme)
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
  { emoji: "😡", label: "Muito insatisfeito", color: "#ef4444", bg: "#fef2f2" },
  { emoji: "😞", label: "Insatisfeito", color: "#f97316", bg: "#fff7ed" },
  { emoji: "😐", label: "Neutro", color: "#f59e0b", bg: "#fffbeb" },
  { emoji: "😊", label: "Satisfeito", color: "#22c55e", bg: "#f0fdf4" },
  { emoji: "🤩", label: "Muito satisfeito", color: "#3b82f6", bg: "#eff6ff" },
];

export function SatisfactionInput({ value, onChange, onAutoAdvance }: SatisfactionInputProps) {
  const [hovered, setHovered] = useState<number>(0);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <div className="flex items-center justify-center gap-4">
        {FACES.map((face, i) => {
          const rating = i + 1;
          const isActive = value === rating;
          const isHovered = hovered === rating;
          return (
            <motion.button
              key={rating}
              onClick={() => { onChange(rating); if (onAutoAdvance) setTimeout(onAutoAdvance, 500); }}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(0)}
              className="relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200 border"
              style={{
                background: isActive ? face.bg : "white",
                borderColor: isActive ? face.color : isHovered ? face.color + "60" : "transparent",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, type: "spring", stiffness: 300, damping: 20 }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              <span className="text-4xl transition-transform duration-200" style={{ transform: isActive || isHovered ? "scale(1.15)" : "scale(1)" }}>
                {face.emoji}
              </span>
              {(isActive || isHovered) && (
                <motion.span className="text-xs font-body whitespace-nowrap font-medium" style={{ color: face.color }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
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
