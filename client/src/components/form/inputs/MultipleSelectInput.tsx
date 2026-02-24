/**
 * FormFlow — Dark Futuristic Design
 * Multiple select with glassmorphism checkboxes and neon accents.
 */

import { motion } from "framer-motion";
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
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl
              text-left font-body transition-all duration-300
              ${
                isSelected
                  ? "glass-card"
                  : "glass-card glass-card-hover"
              }
            `}
            style={
              isSelected
                ? {
                    borderColor: "oklch(0.75 0.15 195 / 0.4)",
                    boxShadow: "0 0 15px oklch(0.75 0.15 195 / 0.15)",
                  }
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
            {/* Checkbox */}
            <span
              className="inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0 transition-all duration-300"
              style={
                isSelected
                  ? {
                      background: "oklch(0.75 0.15 195)",
                      border: "2px solid oklch(0.75 0.15 195)",
                      boxShadow: "0 0 10px oklch(0.75 0.15 195 / 0.4)",
                    }
                  : {
                      background: "transparent",
                      border: "2px solid oklch(0.35 0.02 260 / 0.6)",
                    }
              }
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Check size={14} className="text-white" strokeWidth={2.5} />
                </motion.div>
              )}
            </span>

            {/* Label */}
            <span
              className={`text-base transition-colors duration-200 ${
                isSelected ? "text-foreground font-medium" : "text-foreground/70"
              }`}
            >
              {choice.label}
            </span>

            {/* Selected count indicator */}
            {isSelected && (
              <motion.div
                className="ml-auto"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: "oklch(0.75 0.15 195)",
                    boxShadow: "0 0 6px oklch(0.75 0.15 195 / 0.5)",
                  }}
                />
              </motion.div>
            )}
          </motion.button>
        );
      })}
      <motion.p
        className="mt-2 text-xs text-muted-foreground/40 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Selecione quantas opções quiser
      </motion.p>
    </motion.div>
  );
}
