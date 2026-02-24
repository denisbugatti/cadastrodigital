/**
 * FormFlow Multiple Select — Typeform-style
 * Checkbox-style selection with animations, mobile-friendly.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Choice } from "@/lib/formTypes";
import { Check } from "lucide-react";

interface MultipleSelectInputProps {
  choices: Choice[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultipleSelectInput({ choices, value, onChange }: MultipleSelectInputProps) {
  const toggleChoice = (choiceId: string) => {
    if (value.includes(choiceId)) {
      onChange(value.filter((id) => id !== choiceId));
    } else {
      onChange([...value, choiceId]);
    }
  };

  return (
    <motion.div
      className="space-y-2.5 sm:space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      {choices.map((choice, i) => {
        const isSelected = value.includes(choice.id);
        return (
          <motion.button
            key={choice.id}
            onClick={() => toggleChoice(choice.id)}
            className={`
              w-full flex items-center gap-3 sm:gap-4 px-4 py-3 sm:py-3.5 rounded-lg text-left
              font-body transition-colors duration-200 border
              ${isSelected
                ? "bg-blue-50 border-blue-400"
                : "bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50"
              }
            `}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={`
              inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-md shrink-0
              transition-all duration-200 border-2
              ${isSelected ? "bg-blue-500 border-blue-500" : "bg-transparent border-gray-300"}
            `}>
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Check size={12} className="text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
            <span className={`flex-1 text-sm sm:text-base transition-colors duration-200 ${
              isSelected ? "text-gray-900 font-medium" : "text-gray-600"
            }`}>
              {choice.label}
            </span>
          </motion.button>
        );
      })}
      <motion.p
        className="mt-2 text-xs sm:text-sm opacity-30 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Selecione quantas opções quiser
      </motion.p>
    </motion.div>
  );
}
