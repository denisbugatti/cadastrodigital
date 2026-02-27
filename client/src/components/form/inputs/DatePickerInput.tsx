/**
 * FormFlow Date Picker Input (Light Theme)
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <div className="flex items-center gap-3">
        <Calendar size={20} className="text-white shrink-0" />
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full bg-transparent border-0 border-b-2 py-4 text-xl font-body text-white focus:outline-none transition-colors duration-300 ${
            error ? "border-red-400" : value ? "border-brand" : "border-border"
          }`}
        />
      </div>
      {displayDate && (
        <motion.p className="mt-2 text-sm font-body text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{displayDate}</motion.p>
      )}
      {error && <motion.p className="mt-3 text-sm font-body text-red-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.p>}
      <p className="mt-4 text-sm text-muted-foreground font-body">
        Pressione <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
