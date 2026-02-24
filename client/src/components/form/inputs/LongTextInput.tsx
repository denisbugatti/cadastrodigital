/**
 * FormFlow Long Text Input — Typeform-style
 * Auto-growing textarea with clean border, mobile-friendly.
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface LongTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
}

export function LongTextInput({ value, onChange, placeholder, error }: LongTextInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Digite sua resposta aqui..."}
        rows={3}
        className={`
          w-full rounded-lg border bg-transparent p-4 sm:p-5
          text-base sm:text-lg font-body text-inherit leading-relaxed
          placeholder:text-current/25
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40
          transition-all duration-200 resize-none
          ${error ? "border-red-300" : value ? "border-blue-500/30" : "border-current/15"}
        `}
      />
      {error && (
        <motion.p
          className="mt-3 text-sm font-body text-red-500"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <motion.p
        className="mt-3 text-xs sm:text-sm opacity-30 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        <kbd className="px-1.5 py-0.5 rounded border border-current/20 text-[10px] font-mono">Ctrl</kbd>
        {" + "}
        <kbd className="px-1.5 py-0.5 rounded border border-current/20 text-[10px] font-mono">Enter ↵</kbd>
        {" para enviar"}
      </motion.p>
    </motion.div>
  );
}
