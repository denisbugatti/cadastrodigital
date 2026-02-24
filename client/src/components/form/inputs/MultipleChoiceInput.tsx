/**
 * FormFlow — Dark Futuristic Design
 * Multiple choice with glassmorphism cards, neon borders, and letter shortcuts.
 */

import { motion } from "framer-motion";
import type { Choice } from "@/lib/formTypes";
import { useEffect } from "react";

interface MultipleChoiceInputProps {
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: () => void;
}

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MultipleChoiceInput({
  choices,
  value,
  onChange,
  onAutoAdvance,
}: MultipleChoiceInputProps) {
  // Keyboard shortcuts for choices
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const index = letters.indexOf(e.key.toUpperCase());
      if (index >= 0 && index < choices.length) {
        e.preventDefault();
        onChange(choices[index].id);
        if (onAutoAdvance) {
          setTimeout(onAutoAdvance, 400);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [choices, onChange, onAutoAdvance]);

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      {choices.map((choice, i) => {
        const isSelected = value === choice.id;
        return (
          <motion.button
            key={choice.id}
            onClick={() => {
              onChange(choice.id);
              if (onAutoAdvance) {
                setTimeout(onAutoAdvance, 400);
              }
            }}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl
              text-left font-body transition-all duration-300
              ${
                isSelected
                  ? "glass-card glow-blue"
                  : "glass-card glass-card-hover"
              }
            `}
            style={
              isSelected
                ? { borderColor: "oklch(0.65 0.2 250 / 0.5)" }
                : {}
            }
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3 + i * 0.06,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Letter badge */}
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold shrink-0 transition-all duration-300"
              style={
                isSelected
                  ? {
                      background: "oklch(0.65 0.2 250)",
                      color: "white",
                      boxShadow: "0 0 12px oklch(0.65 0.2 250 / 0.4)",
                    }
                  : {
                      background: "oklch(0.2 0.02 260 / 0.6)",
                      color: "oklch(0.55 0.02 260)",
                      border: "1px solid oklch(0.3 0.02 260 / 0.5)",
                    }
              }
            >
              {letters[i]}
            </span>

            {/* Icon + Label */}
            <span className="flex items-center gap-2.5 text-base">
              {choice.icon && <span className="text-lg">{choice.icon}</span>}
              <span
                className={`transition-colors duration-200 ${
                  isSelected ? "text-foreground font-medium" : "text-foreground/70"
                }`}
              >
                {choice.label}
              </span>
            </span>

            {/* Check indicator */}
            {isSelected && (
              <motion.div
                className="ml-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{
                    background: "oklch(0.65 0.2 250)",
                    boxShadow: "0 0 10px oklch(0.65 0.2 250 / 0.4)",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
}
