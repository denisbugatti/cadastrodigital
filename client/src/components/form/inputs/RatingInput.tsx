/**
 * FormFlow Rating Input (Light Theme)
 */

import { motion } from "framer-motion";
import { useState } from "react";
import { Star } from "lucide-react";

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  labels?: { low: string; high: string };
  onAutoAdvance?: () => void;
}

export function RatingInput({ value, onChange, maxRating = 5, labels, onAutoAdvance }: RatingInputProps) {
  const [hovered, setHovered] = useState<number>(0);
  const displayValue = hovered || value;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <div className="flex items-center gap-3">
        {Array.from({ length: maxRating }, (_, i) => {
          const rating = i + 1;
          const isActive = rating <= displayValue;
          return (
            <motion.button
              key={rating}
              onClick={() => { onChange(rating); if (onAutoAdvance) setTimeout(onAutoAdvance, 500); }}
              onMouseEnter={() => setHovered(rating)}
              onMouseLeave={() => setHovered(0)}
              className="relative p-1 focus:outline-none"
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06, type: "spring", stiffness: 300, damping: 20 }}
            >
              <Star
                size={38}
                className="relative z-10 transition-all duration-300"
                style={isActive ? { fill: "#f59e0b", color: "#f59e0b" } : { fill: "transparent", color: "#d1d5db" }}
                strokeWidth={1.5}
              />
            </motion.button>
          );
        })}
        {value > 0 && (
          <motion.span className="ml-3 text-3xl font-display font-bold text-brand" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            {value}
          </motion.span>
        )}
      </div>
      {labels && (
        <div className="flex justify-between mt-5 px-1">
          <span className="text-sm text-muted-foreground font-body">{labels.low}</span>
          <span className="text-sm text-muted-foreground font-body">{labels.high}</span>
        </div>
      )}
    </motion.div>
  );
}
