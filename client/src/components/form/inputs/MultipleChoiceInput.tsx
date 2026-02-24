/**
 * FormFlow Multiple Choice — Typeform-style
 * Letter prefix (A, B, C), hover highlight, selection bounce with checkmark.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import type { Choice } from "@/lib/formTypes";
import { Check } from "lucide-react";

interface MultipleChoiceInputProps {
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: () => void;
}

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MultipleChoiceInput({ choices, value, onChange, onAutoAdvance }: MultipleChoiceInputProps) {
  const [justSelected, setJustSelected] = useState<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const index = letters.indexOf(e.key.toUpperCase());
      if (index >= 0 && index < choices.length) {
        e.preventDefault();
        handleSelect(choices[index].id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [choices, onChange, onAutoAdvance]);

  const handleSelect = (choiceId: string) => {
    setJustSelected(choiceId);
    onChange(choiceId);
    // Brief delay for animation, then auto-advance
    if (onAutoAdvance) {
      setTimeout(onAutoAdvance, 600);
    }
    // Clear "just selected" after animation
    setTimeout(() => setJustSelected(null), 700);
  };

  return (
    <motion.div
      className="space-y-2.5 sm:space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {choices.map((choice, i) => {
        const isSelected = value === choice.id;
        const isJust = justSelected === choice.id;

        return (
          <motion.button
            key={choice.id}
            onClick={() => handleSelect(choice.id)}
            className={`
              w-full flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-3.5 rounded-lg text-left
              font-body transition-colors duration-200 border
              ${isSelected
                ? "bg-blue-50 border-blue-400 dark:bg-blue-900/20 dark:border-blue-500"
                : "bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:hover:border-gray-500"
              }
            `}
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: isJust ? [1, 1.02, 1] : 1,
            }}
            transition={{
              opacity: { delay: 0.25 + i * 0.05, duration: 0.3 },
              y: { delay: 0.25 + i * 0.05, type: "spring", stiffness: 300, damping: 25 },
              scale: { duration: 0.3 },
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Letter badge */}
            <span
              className={`
                inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md
                text-xs font-bold shrink-0 transition-all duration-300
                ${isSelected
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
                }
              `}
            >
              {letters[i]}
            </span>

            {/* Label */}
            <span className={`flex-1 text-sm sm:text-base transition-colors duration-200 ${
              isSelected ? "text-gray-900 font-medium" : "text-gray-600"
            }`}>
              {choice.icon && <span className="mr-2">{choice.icon}</span>}
              {choice.label}
            </span>

            {/* Checkmark */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="shrink-0"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-blue-500">
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
