/**
 * FormFlow Date Picker Input — Adaptive colors for any background
 */

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Calendar } from "lucide-react";

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function DatePickerInput({ value, onChange, error }: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const timer = setTimeout(() => inputRef.current?.focus(), 400); return () => clearTimeout(timer); }, []);

  const displayDate = value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <Calendar size={20} className="opacity-60 shrink-0" />
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent border-0 border-b-2 py-4 text-xl font-medium focus:outline-none transition-colors duration-300"
          style={{
            color: "inherit",
            borderColor: error
              ? "#EF4444"
              : value
                ? "currentColor"
                : "rgba(128,128,128,0.3)",
          }}
        />
      </div>
      {displayDate && (
        <motion.p className="text-sm opacity-70" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }}>
          {displayDate}
        </motion.p>
      )}
      {error && (
        <motion.p className="text-sm font-medium" style={{ color: "#fca5a5" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
