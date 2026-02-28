/**
 * FormFlow Rating Input — Typeform/Respondi-style
 * Stars with hover scale, selection pulse.
 * Inherits text color from parent for labels.
 */

import { motion } from "framer-motion";
import { useState } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  labels?: { low: string; high: string };
  onAutoAdvance?: (value?: unknown) => void;
}

export function RatingInput({
  value,
  onChange,
  maxRating = 5,
  labels,
  onAutoAdvance,
}: RatingInputProps) {
  const [hovered, setHovered] = useState<number>(0);
  const displayValue = hovered || value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-5"
    >
      <div className="flex items-center gap-3 flex-wrap">
        {Array.from({ length: maxRating }, (_, i) => {
          const rating = i + 1;
          const isActive = rating <= displayValue;
          return (
            <motion.button
              key={rating}
              onClick={() => {
                onChange(rating);
                if (onAutoAdvance) setTimeout(() => onAutoAdvance(rating), 500);
              }}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(0)}
              className="relative p-1 focus:outline-none touch-manipulation"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.85 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.35 + i * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
            >
              <Star
                size={32}
                className="transition-all duration-200"
                style={
                  isActive
                    ? { fill: "#f59e0b", color: "#f59e0b" }
                    : { fill: "transparent", color: "rgba(128,128,128,0.35)" }
                }
                strokeWidth={1.5}
              />
            </motion.button>
          );
        })}
        {value > 0 && (
          <motion.span
            className="ml-3 text-2xl font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {value}
          </motion.span>
        )}
      </div>
      {labels && (
        <div className="flex justify-between px-1">
          <span className="text-xs opacity-40">{labels.low}</span>
          <span className="text-xs opacity-40">{labels.high}</span>
        </div>
      )}
    </motion.div>
  );
}
