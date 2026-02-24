/**
 * FormFlow Multiple Select Input (Light Theme)
 */

import { motion } from "framer-motion";
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
    <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
      {choices.map((choice, i) => {
        const isSelected = value.includes(choice.id);
        return (
          <motion.button
            key={choice.id}
            onClick={() => toggleChoice(choice.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-left font-body transition-all duration-300 border ${
              isSelected ? "bg-brand/5 border-brand shadow-sm" : "bg-white border-border hover:border-brand/30 hover:shadow-sm"
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 transition-all duration-300 border-2 ${
              isSelected ? "bg-brand border-brand" : "bg-white border-border"
            }`}>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={14} className="text-white" strokeWidth={2.5} />
                </motion.div>
              )}
            </span>
            <span className={`text-base transition-colors duration-200 ${isSelected ? "text-foreground font-medium" : "text-foreground/70"}`}>
              {choice.label}
            </span>
          </motion.button>
        );
      })}
      <motion.p className="mt-2 text-sm text-muted-foreground font-body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
        Selecione quantas opções quiser
      </motion.p>
    </motion.div>
  );
}
