/**
 * FormFlow Multiple Choice — Typeform/Respondi-style
 * Letter prefix (A, B, C), animated selection with checkmark,
 * auto-advance after selection, adapts to form design colors.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import type { Choice } from "@/lib/formTypes";
import { Check } from "lucide-react";

interface MultipleChoiceInputProps {
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: () => void;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MultipleChoiceInput({
  choices,
  value,
  onChange,
  onAutoAdvance,
}: MultipleChoiceInputProps) {
  const [justSelected, setJustSelected] = useState<string | null>(null);

  const handleSelect = useCallback(
    (choiceId: string) => {
      setJustSelected(choiceId);
      onChange(choiceId);
      // Auto-advance after brief animation delay
      if (onAutoAdvance) {
        setTimeout(() => onAutoAdvance(), 600);
      }
      setTimeout(() => setJustSelected(null), 700);
    },
    [onChange, onAutoAdvance]
  );

  // Keyboard shortcuts (A, B, C...)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const index = LETTERS.indexOf(e.key.toUpperCase());
      if (index >= 0 && index < choices.length) {
        e.preventDefault();
        handleSelect(choices[index].id);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [choices, handleSelect]);

  return (
    <motion.div
      className="flex flex-col gap-2.5 sm:gap-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      {choices.map((choice, i) => {
        const isSelected = value === choice.id;
        const letter = LETTERS[i] || String(i + 1);

        return (
          <motion.button
            key={choice.id}
            onClick={() => handleSelect(choice.id)}
            className="group w-full flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-3.5 rounded-lg text-left transition-all duration-200 border"
            style={{
              borderColor: isSelected
                ? "currentColor"
                : "rgba(128,128,128,0.25)",
              backgroundColor: isSelected
                ? "rgba(128,128,128,0.08)"
                : "transparent",
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.25 + i * 0.05,
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            whileHover={{
              backgroundColor: isSelected
                ? "rgba(128,128,128,0.12)"
                : "rgba(128,128,128,0.05)",
              borderColor: isSelected
                ? "currentColor"
                : "rgba(128,128,128,0.4)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Letter badge */}
            <span
              className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-xs font-bold shrink-0 transition-all duration-300 border"
              style={{
                borderColor: isSelected
                  ? "currentColor"
                  : "rgba(128,128,128,0.3)",
                backgroundColor: isSelected
                  ? "currentColor"
                  : "transparent",
              }}
            >
              {isSelected ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Check size={14} className="text-white mix-blend-difference" strokeWidth={3} />
                </motion.span>
              ) : (
                <span className="opacity-60">{letter}</span>
              )}
            </span>

            {/* Label */}
            <span className="flex-1 text-sm sm:text-base md:text-lg font-medium">
              {choice.icon && <span className="mr-2">{choice.icon}</span>}
              {choice.label}
            </span>

            {/* Checkmark circle */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  className="shrink-0"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <div
                    className="w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "currentColor" }}
                  >
                    <Check size={12} className="text-white mix-blend-difference" strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard hint on hover */}
            {!isSelected && (
              <span
                className="hidden sm:flex items-center justify-center w-6 h-6 rounded border text-[10px] font-mono opacity-0 group-hover:opacity-30 transition-opacity"
                style={{ borderColor: "rgba(128,128,128,0.3)" }}
              >
                {letter}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Hint */}
      <motion.p
        className="mt-2 text-xs sm:text-sm opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.5 }}
      >
        Pressione a letra ou clique para selecionar
      </motion.p>
    </motion.div>
  );
}
