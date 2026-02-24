/**
 * FormFlow Text Input (Light Theme)
 * Clean text input with brand underline.
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number";
  error?: string;
}

export function TextInput({ value, onChange, placeholder, type = "text", error }: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent border-0 border-b-2 py-4 text-xl font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none transition-colors duration-300 ${
            error ? "border-red-400" : value ? "border-brand" : "border-border"
          }`}
          autoComplete="off"
        />
      </div>
      {error && (
        <motion.p className="mt-3 text-sm font-body text-red-500" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {error}
        </motion.p>
      )}
      <p className="mt-4 text-sm text-muted-foreground font-body">
        Pressione <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
