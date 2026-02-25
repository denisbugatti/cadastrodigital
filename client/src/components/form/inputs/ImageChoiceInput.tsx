/**
 * FormFlow Image Choice Input (Light Theme)
 */

import { motion } from "framer-motion";
import type { Choice } from "@/lib/formTypes";
import { Check, ImageIcon } from "lucide-react";

interface ImageChoiceInputProps {
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: (value?: unknown) => void;
}

export function ImageChoiceInput({ choices, value, onChange, onAutoAdvance }: ImageChoiceInputProps) {
  return (
    <motion.div className="grid grid-cols-2 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
      {choices.map((choice, i) => {
        const isSelected = value === choice.id;
        return (
          <motion.button
            key={choice.id}
            onClick={() => { onChange(choice.id); if (onAutoAdvance) setTimeout(() => onAutoAdvance(choice.id), 400); }}
            className={`relative rounded-xl overflow-hidden text-left transition-all duration-300 border ${
              isSelected ? "border-brand shadow-md" : "border-border hover:border-brand/30 hover:shadow-sm"
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="aspect-video flex items-center justify-center bg-secondary">
              {choice.icon ? <span className="text-5xl">{choice.icon}</span> : <ImageIcon size={32} className="text-muted-foreground/30" />}
            </div>
            <div className="p-3 flex items-center gap-2 bg-white">
              <span className={`text-sm font-body ${isSelected ? "text-foreground font-medium" : "text-foreground/70"}`}>{choice.label}</span>
              {isSelected && (
                <motion.div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center bg-brand" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <Check size={12} className="text-white" strokeWidth={2.5} />
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
