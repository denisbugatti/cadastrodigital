/**
 * FormFlow Long Text Input — Typeform/Respondi-style
 * Auto-growing textarea that inherits text color from parent.
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface LongTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function LongTextInput({
  value,
  onChange,
  placeholder,
  error,
}: LongTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.max(el.scrollHeight, 80)}px`;
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Escreva sua resposta aqui..."}
          rows={3}
          className="w-full bg-transparent border-0 border-b-2 py-3 sm:py-5 text-lg sm:text-xl font-medium focus:outline-none transition-colors duration-300 resize-none"
          style={{
            color: "inherit",
            borderColor: error
              ? "#EF4444"
              : value
                ? "currentColor"
                : "rgba(128,128,128,0.3)",
          }}
        />
        <style>{`
          textarea::placeholder {
            color: inherit;
            opacity: 0.4;
          }
        `}</style>
      </div>
      {error && (
        <motion.p
          className="text-sm text-red-400 font-medium"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <motion.p
        className="text-xs opacity-30 pt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "rgba(128,128,128,0.3)" }}>
          Shift + Enter
        </kbd>{" "}
        para nova linha
      </motion.p>
    </motion.div>
  );
}
