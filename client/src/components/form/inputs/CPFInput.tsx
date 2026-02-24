/**
 * FormFlow — Dark Futuristic Design
 * CPF input with real-time mask and validation algorithm.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { maskCPF, validateCPF } from "@/lib/validators";
import { CheckCircle2, XCircle } from "lucide-react";

interface CPFInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CPFInput({ value, onChange, error }: CPFInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (raw: string) => {
    const masked = maskCPF(raw);
    onChange(masked);
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length === 11) {
      setIsValid(validateCPF(cleaned));
    } else {
      setIsValid(null);
    }
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
          placeholder="000.000.000-00"
          maxLength={14}
          className="w-full bg-transparent border-0 border-b-2 py-4 text-xl font-body text-foreground placeholder:text-muted-foreground/30 focus:outline-none transition-colors duration-300"
          style={{
            borderBottomColor:
              error || isValid === false
                ? "oklch(0.6 0.22 25)"
                : isValid === true
                ? "oklch(0.65 0.18 150)"
                : value
                ? "oklch(0.65 0.2 250)"
                : "oklch(0.3 0.02 260 / 0.5)",
            caretColor: "oklch(0.75 0.15 195)",
          }}
          autoComplete="off"
        />
        {/* Validation indicator */}
        {isValid !== null && (
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {isValid ? (
              <CheckCircle2
                size={22}
                style={{ color: "oklch(0.65 0.18 150)", filter: "drop-shadow(0 0 6px oklch(0.65 0.18 150 / 0.4))" }}
              />
            ) : (
              <XCircle
                size={22}
                style={{ color: "oklch(0.6 0.22 25)", filter: "drop-shadow(0 0 6px oklch(0.6 0.22 25 / 0.4))" }}
              />
            )}
          </motion.div>
        )}
      </div>
      {isValid === false && (
        <motion.p
          className="mt-3 text-sm font-body"
          style={{ color: "oklch(0.6 0.22 25)" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          CPF inválido. Verifique os números digitados.
        </motion.p>
      )}
      {error && isValid !== false && (
        <motion.p
          className="mt-3 text-sm font-body"
          style={{ color: "oklch(0.6 0.22 25)" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <p className="mt-4 text-xs text-muted-foreground/40 font-body">
        Pressione <kbd className="kbd-dark">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
