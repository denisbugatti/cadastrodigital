/**
 * FormFlow CPF Input — Adapts to form design colors
 * Real CPF validation with digit verification.
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
    if (cleaned.length === 11) setIsValid(validateCPF(cleaned));
    else setIsValid(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="000.000.000-00"
          maxLength={14}
          className="w-full bg-transparent border-0 border-b-2 py-3 sm:py-4 text-lg sm:text-xl font-medium focus:outline-none transition-colors duration-300"
          style={{
            color: "inherit",
            borderColor: error || isValid === false
              ? "#f87171"
              : isValid === true
                ? "#34d399"
                : value
                  ? "currentColor"
                  : "rgba(128,128,128,0.3)",
          }}
          autoComplete="off"
        />
        {/* Placeholder styling */}
        <style>{`
          input::placeholder { color: currentColor; opacity: 0.35; }
        `}</style>
        {isValid !== null && (
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {isValid ? (
              <CheckCircle2 size={22} className="text-emerald-400" />
            ) : (
              <XCircle size={22} className="text-red-400" />
            )}
          </motion.div>
        )}
      </div>
      {isValid === false && (
        <motion.p
          className="mt-3 text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          CPF inválido. Verifique os números digitados.
        </motion.p>
      )}
      {error && isValid !== false && (
        <motion.p
          className="mt-3 text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
      <p className="mt-4 text-xs sm:text-sm opacity-40">
        Pressione{" "}
        <kbd className="px-2 py-0.5 rounded-md text-xs font-mono border" style={{ borderColor: "rgba(128,128,128,0.3)" }}>
          Enter ↵
        </kbd>{" "}
        para continuar
      </p>
    </motion.div>
  );
}
