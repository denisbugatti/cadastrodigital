/**
 * FormFlow Multiple Choice Input (Light Theme)
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

export function MultipleChoiceInput({ choices, value, onChange, onAutoAdvance }: MultipleChoiceInputProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const index = letters.indexOf(e.key.toUpperCase());
      if (index >= 0 && index < choices.length) {
        e.preventDefault();
        onChange(choices[index].id);
        if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [choices, onChange, onAutoAdvance]);

  return (
    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
      {choices.map((choice, i) => {
        const isSelected = value === choice.id;
        return (
          <motion.button
            key={choice.id}
            onClick={() => {
              onChange(choice.id);
              if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
            }}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left font-body transition-all duration-300 border ${
              isSelected
                ? "bg-brand/5 border-brand shadow-sm"
                : "bg-white border-border hover:border-brand/30 hover:shadow-sm"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-semibold shrink-0 transition-all duration-300 ${
              isSelected ? "bg-brand text-white" : "bg-secondary text-muted-foreground border border-border"
            }`}>
              {letters[i]}
            </span>
            <span className="flex items-center gap-2.5 text-base">
              {choice.icon && <span className="text-lg">{choice.icon}</span>}
              <span className={`transition-colors duration-200 ${isSelected ? "text-foreground font-medium" : "text-foreground/70"}`}>
                {choice.label}
              </span>
            </span>
            {isSelected && (
              <motion.div className="ml-auto" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-brand">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
