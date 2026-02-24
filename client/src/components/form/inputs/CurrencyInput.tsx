/**
 * FormFlow — Dark Futuristic Design
 * Currency input with R$ mask and formatting.
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

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (raw: string) => {
    onChange(formatCurrency(raw));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="R$ 0,00"
          className="w-full bg-transparent border-0 border-b-2 py-4 text-xl font-body text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors duration-300"
          style={{
            borderBottomColor: error ? "oklch(0.6 0.22 25)" : value ? "oklch(0.65 0.2 250)" : "oklch(0.3 0.02 260 / 0.5)",
            caretColor: "oklch(0.75 0.15 195)",
          }}
          autoComplete="off"
        />
        {value && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, oklch(0.65 0.2 250), oklch(0.75 0.15 195))", filter: "blur(3px)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </div>
      {error && (
        <motion.p className="mt-3 text-sm font-body" style={{ color: "oklch(0.6 0.22 25)" }} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          {error}
        </motion.p>
      )}
      <p className="mt-4 text-xs text-muted-foreground/40 font-body">
        Pressione <kbd className="kbd-dark">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
