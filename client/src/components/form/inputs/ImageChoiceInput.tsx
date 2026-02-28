/**
 * FormFlow Image Choice Input — Adaptive colors for any background
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
    <motion.div
      className="grid grid-cols-2 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      {choices.map((choice, i) => {
        const isSelected = value === choice.id;
        return (
          <motion.button
            key={choice.id}
            onClick={() => { onChange(choice.id); if (onAutoAdvance) setTimeout(() => onAutoAdvance(choice.id), 400); }}
            className="relative rounded-xl overflow-hidden text-left transition-all duration-300 border"
            style={{
              borderColor: isSelected ? "currentColor" : "rgba(128,128,128,0.2)",
              boxShadow: isSelected ? "0 4px 20px rgba(0,0,0,0.15)" : "none",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.97 }}
          >
            <div
              className="aspect-video flex items-center justify-center"
              style={{ backgroundColor: "rgba(128,128,128,0.08)" }}
            >
              {choice.icon ? (
                <span className="text-5xl">{choice.icon}</span>
              ) : (
                <ImageIcon size={32} className="opacity-20" />
              )}
            </div>
            <div
              className="p-3.5 flex items-center gap-2"
              style={{ backgroundColor: "rgba(128,128,128,0.04)" }}
            >
              <span className={`text-sm font-medium ${isSelected ? "opacity-100" : "opacity-70"}`}>
                {choice.label}
              </span>
              {isSelected && (
                <motion.div
                  className="ml-auto w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "currentColor" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Check size={12} className="text-white mix-blend-difference" strokeWidth={2.5} />
                </motion.div>
              )}
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
