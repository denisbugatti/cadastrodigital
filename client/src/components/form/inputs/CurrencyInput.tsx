/**
 * FormFlow Currency Input — Adaptive colors for any background
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

function formatCurrency(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function CurrencyInput({ value, onChange, error }: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = setTimeout(() => inputRef.current?.focus(), 400); return () => clearTimeout(timer); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(formatCurrency(e.target.value))}
        placeholder="R$ 0,00"
        className="w-full bg-transparent border-0 border-b-2 py-4 text-xl font-medium focus:outline-none transition-colors duration-300"
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
        input::placeholder { color: inherit; opacity: 0.4; }
      `}</style>
      {error && (
        <motion.p className="text-sm font-medium" style={{ color: "#fca5a5" }} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {error}
        </motion.p>
      )}
      <motion.p
        className="text-xs opacity-30 pt-1"
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
