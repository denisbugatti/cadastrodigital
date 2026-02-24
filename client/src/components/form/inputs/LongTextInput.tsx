/**
 * FormFlow Long Text Input (Light Theme)
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
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
    }
  }, [value]);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`w-full rounded-xl border bg-white p-5 text-base font-body text-foreground leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-300 resize-none ${
          error ? "border-red-300" : value ? "border-brand/30" : "border-border"
        }`}
      />
      {error && (
        <motion.p className="mt-3 text-sm font-body text-red-500" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {error}
        </motion.p>
      )}
      <p className="mt-3 text-sm text-muted-foreground font-body">
        <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Ctrl</kbd>
        {" + "}
        <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd>
        {" para enviar"}
      </p>
    </motion.div>
  );
}
