/**
 * FormFlow — Dark Futuristic Design
 * Yes/No toggle with glassmorphism pills and neon accents.
 */

import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useEffect } from "react";

interface YesNoInputProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  onAutoAdvance?: () => void;
}

export function YesNoInput({
  value,
  onChange,
  onAutoAdvance,
}: YesNoInputProps) {
  // Keyboard shortcuts: S for sim, N for não
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        onChange(true);
        if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        onChange(false);
        if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onChange, onAutoAdvance]);

  const options = [
    {
      label: "Sim",
      val: true,
      icon: ThumbsUp,
      letter: "S",
      color: "oklch(0.65 0.2 250)",
      glowColor: "oklch(0.65 0.2 250 / 0.3)",
    },
    {
      label: "Não",
      val: false,
      icon: ThumbsDown,
      letter: "N",
      color: "oklch(0.55 0.2 290)",
      glowColor: "oklch(0.55 0.2 290 / 0.3)",
    },
  ];

  return (
    <motion.div
      className="flex gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {options.map((opt, i) => {
        const isSelected = value === opt.val;
        const Icon = opt.icon;

        return (
          <motion.button
            key={opt.label}
            onClick={() => {
              onChange(opt.val);
              if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
            }}
            className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl font-body text-lg font-medium transition-all duration-300 glass-card"
            style={
              isSelected
                ? {
                    borderColor: opt.color.replace(")", " / 0.5)"),
                    boxShadow: `0 0 20px ${opt.glowColor}, 0 0 60px ${opt.glowColor.replace("0.3", "0.1")}`,
                  }
                : {}
            }
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.35 + i * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            <Icon
              size={22}
              strokeWidth={1.5}
              style={isSelected ? { color: opt.color } : { color: "oklch(0.5 0.02 260)" }}
            />
            <span style={isSelected ? { color: opt.color } : { color: "oklch(0.6 0.02 260)" }}>
              {opt.label}
            </span>
            <span className="kbd-dark ml-1">
              {opt.letter}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
