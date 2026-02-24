/**
 * FormFlow Text Input — Typeform-style
 * Underline input with animated focus state, mobile-friendly.
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Digite sua resposta aqui..."}
          className={`
            w-full bg-transparent border-0 border-b-2 py-3 sm:py-4
            text-lg sm:text-xl md:text-2xl font-body text-inherit
            placeholder:text-current/25
            focus:outline-none transition-colors duration-300
            ${error ? "border-red-400" : value ? "border-blue-500" : "border-current/20 focus:border-current/40"}
          `}
          autoComplete="off"
        />
        {/* Animated underline */}
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-blue-500"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: value ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "left" }}
        />
      </div>
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
        className="mt-4 text-xs sm:text-sm opacity-30 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Pressione <kbd className="px-1.5 py-0.5 rounded border border-current/20 text-[10px] font-mono">Enter ↵</kbd> para continuar
      </motion.p>
    </motion.div>
  );
}
