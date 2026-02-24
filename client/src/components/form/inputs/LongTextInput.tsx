/**
 * FormFlow — Dark Futuristic Design
 * Long text (textarea) input with glassmorphism styling.
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
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.max(120, textarea.scrollHeight)}px`;
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
        placeholder={placeholder}
        rows={4}
        className="
          w-full glass-card rounded-2xl
          p-5 text-base font-body text-foreground leading-relaxed
          placeholder:text-muted-foreground/30
          focus:outline-none
          transition-all duration-300 resize-none
        "
        style={{
          caretColor: "oklch(0.75 0.15 195)",
          borderColor: value ? "oklch(0.65 0.2 250 / 0.3)" : undefined,
        }}
      />
      {error && (
        <motion.p
          className="mt-3 text-sm font-body"
          style={{ color: "oklch(0.6 0.22 25)" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <p className="mt-3 text-xs text-muted-foreground/40 font-body">
        <kbd className="kbd-dark">Ctrl</kbd>
        {" + "}
        <kbd className="kbd-dark">Enter ↵</kbd>
        {" para enviar"}
      </p>
    </motion.div>
  );
}
