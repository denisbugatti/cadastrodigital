/**
 * FormFlow Multiple Choice — Typeform/Respondi-style
 * Letter prefix (A, B, C), animated selection with checkmark,
 * auto-advance after selection, adapts to form design colors.
 * Sizes standardized across mobile and desktop.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Choice } from "@/lib/formTypes";
import { Check } from "lucide-react";

interface MultipleChoiceInputProps {
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  onAutoAdvance?: (value?: unknown) => void;
  validationError?: string;
  design?: {
    backgroundColor?: string;
    questionColor?: string;
    answerColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    fontFamily?: string;
    logoUrl?: string;
    backgroundImage?: string;
  };
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function MultipleChoiceInput({
  choices,
  value,
  onChange,
  onAutoAdvance,
  validationError,
  design,
}: MultipleChoiceInputProps) {
  const [justSelected, setJustSelected] = useState<string | null>(null);

  // Determine if background is light or dark
  const isLightBg = useMemo(() => {
    const bg = design?.backgroundColor || "#FFFFFF";
    const c = bg.replace("#", "");
    if (c.length < 6) return true;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }, [design?.backgroundColor]);

  // Adaptive colors based on background
  const borderDefault = isLightBg ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.45)";
  const borderSelected = isLightBg ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,1)";
  const borderHover = isLightBg ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.65)";
  const bgSelected = isLightBg ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.12)";
  const bgHover = isLightBg ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.06)";
  const textColor = isLightBg ? "#1E293B" : "#FFFFFF";
  const badgeBorder = isLightBg ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)";
  const badgeSelectedBg = isLightBg ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";
  const badgeSelectedText = isLightBg ? "#FFFFFF" : "#1a1a2e";
  const checkCircleBg = isLightBg ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";
  const checkCircleColor = isLightBg ? "#FFFFFF" : "#1a1a2e";
  const errorBorder = "rgba(239,68,68,0.8)";

  const handleSelect = useCallback(
    (choiceId: string) => {
      setJustSelected(choiceId);
      onChange(choiceId);
      if (onAutoAdvance) {
        setTimeout(() => onAutoAdvance(choiceId), 600);
      }
      setTimeout(() => setJustSelected(null), 700);
    },
    [onChange, onAutoAdvance]
  );

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
            className="group w-full flex items-center gap-3 sm:gap-3.5 px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg text-left transition-all duration-200 border"
            style={{
              borderColor: validationError && !value ? errorBorder : (isSelected ? borderSelected : borderDefault),
              backgroundColor: isSelected ? bgSelected : "transparent",
              color: textColor,
            }}
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: 1,
              y: 0,
              x: validationError && !value ? [0, -4, 4, -4, 4, 0] : 0,
            }}
            transition={{
              delay: 0.25 + i * 0.04,
              duration: 0.3,
              x: validationError && !value
                ? { duration: 0.4, ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 25 },
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
            whileHover={{
              backgroundColor: isSelected ? bgSelected : bgHover,
              borderColor: isSelected ? borderSelected : borderHover,
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Letter badge */}
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs font-bold shrink-0 transition-all duration-300 border"
              style={{
                borderColor: isSelected ? borderSelected : badgeBorder,
                backgroundColor: isSelected ? badgeSelectedBg : "transparent",
                color: isSelected ? badgeSelectedText : textColor,
              }}
            >
              {isSelected ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                >
                  <Check size={14} strokeWidth={3} />
                </motion.span>
              ) : (
                <span className="opacity-80">{letter}</span>
              )}
            </span>

            {/* Label */}
            <span className="flex-1 font-medium text-sm sm:text-base" style={{ color: textColor }}>
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
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: checkCircleBg }}
                  >
                    <Check size={12} style={{ color: checkCircleColor }} strokeWidth={3} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Keyboard hint on hover (desktop only) */}
            {!isSelected && (
              <span
                className="hidden sm:flex items-center justify-center w-6 h-6 rounded border text-[10px] font-mono opacity-0 group-hover:opacity-40 transition-opacity"
                style={{ borderColor: borderDefault, color: textColor }}
              >
                {letter}
              </span>
            )}
          </motion.button>
        );
      })}

      {/* Validation error message */}
      <AnimatePresence>
        {validationError && !value && (
          <motion.p
            className="mt-1 text-xs font-medium text-red-400"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {validationError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Hint */}
      <motion.p
        className="mt-2 text-xs opacity-40"
        style={{ color: textColor }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
      >
        Pressione a letra ou clique para selecionar
      </motion.p>
    </motion.div>
  );
}
