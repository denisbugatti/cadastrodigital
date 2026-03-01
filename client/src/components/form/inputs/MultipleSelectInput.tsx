/**
 * FormFlow Multiple Select — Typeform/Respondi-style
 * Checkbox-style selection that inherits text color from parent.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Choice } from "@/lib/formTypes";
import { Check } from "lucide-react";

interface MultipleSelectInputProps {
  choices: Choice[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function MultipleSelectInput({
  choices,
  value,
  onChange,
}: MultipleSelectInputProps) {
  const toggleChoice = (choiceId: string) => {
    if (value.includes(choiceId)) {
      onChange(value.filter((id) => id !== choiceId));
    } else {
      onChange([...value, choiceId]);
    }
  };

  return (
    <motion.div
      className="space-y-3"
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
            className="w-full flex items-center gap-3 sm:gap-3.5 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-left transition-colors duration-200 border"
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
              delay: 0.3 + i * 0.05,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            whileTap={{ scale: 0.98 }}
            whileHover={{
              backgroundColor: isSelected
                ? "rgba(128,128,128,0.12)"
                : "rgba(128,128,128,0.05)",
            }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-md shrink-0 transition-all duration-200 border-2"
              style={{
                borderColor: isSelected
                  ? "currentColor"
                  : "rgba(128,128,128,0.3)",
                backgroundColor: isSelected ? "currentColor" : "transparent",
              }}
            >
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Check
                      size={12}
                      className="text-white mix-blend-difference"
                      strokeWidth={3}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
            <span className="flex-1 text-sm font-medium">
              {choice.label}
            </span>
          </motion.button>
        );
      })}
      <motion.p
        className="mt-3 text-xs opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Selecione quantas opções quiser
      </motion.p>
    </motion.div>
  );
}
