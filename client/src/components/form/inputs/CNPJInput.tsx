/**
 * FormFlow CNPJ Input — Adapts to form design colors
 * Real CNPJ validation with digit verification.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { maskCNPJ, validateCNPJ } from "@/lib/validators";
import { CheckCircle2, XCircle } from "lucide-react";

interface CNPJInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CNPJInput({ value, onChange, error }: CNPJInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (raw: string) => {
    const masked = maskCNPJ(raw);
    onChange(masked);
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length === 14) setIsValid(validateCNPJ(cleaned));
    else setIsValid(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="00.000.000/0000-00"
          maxLength={18}
          className="w-full bg-transparent border-0 border-b-2 py-4 text-lg font-medium focus:outline-none transition-colors duration-300"
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
        <style>{`
          input::placeholder { color: currentColor; opacity: 0.45; }
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
          className="text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          CNPJ inválido. Verifique os números digitados.
        </motion.p>
      )}
      {error && isValid !== false && (
        <motion.p
          className="text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
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
