/**
 * FormFlow Phone Input — Typeform/Respondi-style
 * Inherits text color from parent. Works on any background.
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { maskPhone } from "@/lib/validators";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
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
      <input
        ref={inputRef}
        type="tel"
        value={value}
        onChange={(e) => onChange(maskPhone(e.target.value))}
        placeholder="(00) 00000-0000"
        maxLength={15}
        className="w-full bg-transparent border-0 border-b-2 py-3 text-lg font-medium focus:outline-none transition-colors duration-300"
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
      <style>{`
        input[type="tel"]::placeholder {
          color: inherit;
          opacity: 0.25;
        }
      `}</style>
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
        className="mt-4 text-xs opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Pressione{" "}
        <kbd
          className="px-1.5 py-0.5 rounded border text-[10px] font-mono"
          style={{ borderColor: "rgba(128,128,128,0.3)" }}
        >
          Enter ↵
        </kbd>{" "}
        para continuar
      </motion.p>
    </motion.div>
  );
}
