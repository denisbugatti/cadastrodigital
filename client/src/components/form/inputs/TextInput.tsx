/**
 * FormFlow Text Input — Typeform/Respondi-style
 * Underline input that inherits text color from parent.
 * Works on any background (light or dark).
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

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: TextInputProps) {
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
          className="w-full bg-transparent border-0 border-b-2 py-3 sm:py-4 text-lg sm:text-xl md:text-2xl font-medium focus:outline-none transition-colors duration-300"
          style={{
            color: "inherit",
            borderColor: error
              ? "#EF4444"
              : value
                ? "currentColor"
                : "rgba(128,128,128,0.3)",
          }}
          autoComplete="off"
        />
        {/* Placeholder styling via inline style since we need to inherit color */}
        <style>{`
          input::placeholder {
            color: inherit;
            opacity: 0.25;
          }
        `}</style>
      </div>
      {error && (
        <motion.p
          className="mt-3 text-sm text-red-400 font-medium"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <motion.p
        className="mt-4 text-xs sm:text-sm opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Pressione{" "}
        <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "rgba(128,128,128,0.3)" }}>
          Enter ↵
        </kbd>{" "}
        para continuar
      </motion.p>
    </motion.div>
  );
}
