/**
 * FormFlow Yes/No Input — Typeform/Respondi-style
 * Two elegant buttons that inherit text color from parent.
 * Works on any background (light or dark).
 */

import { motion, AnimatePresence } from "framer-motion";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { useEffect } from "react";

interface YesNoInputProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  onAutoAdvance?: (value?: unknown) => void;
}

export function YesNoInput({ value, onChange, onAutoAdvance }: YesNoInputProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "s") {
        e.preventDefault();
        onChange(true);
        if (onAutoAdvance) setTimeout(() => onAutoAdvance(true), 500);
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        onChange(false);
        if (onAutoAdvance) setTimeout(() => onAutoAdvance(false), 500);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onChange, onAutoAdvance]);

  const options = [
    { label: "Sim", val: true, icon: ThumbsUp, letter: "S" },
    { label: "Não", val: false, icon: ThumbsDown, letter: "N" },
  ];

  return (
    <motion.div
      className="flex flex-col sm:flex-row gap-3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {options.map((opt, i) => {
        const isSelected = value === opt.val;
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.label}
            onClick={() => {
              onChange(opt.val);
              if (onAutoAdvance) setTimeout(() => onAutoAdvance(opt.val), 500);
            }}
            className="flex-1 flex items-center justify-center gap-3 py-4 sm:py-5 rounded-lg text-base sm:text-lg font-medium transition-all duration-200 border"
            style={{
              borderColor: isSelected
                ? "currentColor"
                : "rgba(128,128,128,0.25)",
              backgroundColor: isSelected
                ? "rgba(128,128,128,0.08)"
                : "transparent",
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.35 + i * 0.08,
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            whileTap={{ scale: 0.96 }}
            whileHover={{
              backgroundColor: isSelected
                ? "rgba(128,128,128,0.12)"
                : "rgba(128,128,128,0.05)",
            }}
          >
            <Icon size={20} strokeWidth={1.5} />
            <span>{opt.label}</span>
            <kbd
              className="px-1.5 py-0.5 rounded border text-[10px] font-mono ml-1 opacity-40"
              style={{ borderColor: "rgba(128,128,128,0.3)" }}
            >
              {opt.letter}
            </kbd>
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Check size={16} strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
