/**
 * FormFlow — Dark Futuristic Design
 * Date input with native date picker and neon styling.
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

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  // Format display date
  const displayDate = value
    ? new Date(value + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="relative">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-neon-blue shrink-0" />
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent border-0 border-b-2 py-4 text-xl font-body text-foreground focus:outline-none transition-colors duration-300 [color-scheme:dark]"
            style={{
              borderBottomColor: error ? "oklch(0.6 0.22 25)" : value ? "oklch(0.65 0.2 250)" : "oklch(0.3 0.02 260 / 0.5)",
              caretColor: "oklch(0.75 0.15 195)",
            }}
          />
        </div>
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
      {displayDate && (
        <motion.p
          className="mt-2 text-sm font-body text-neon-cyan"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {displayDate}
        </motion.p>
      )}
      {error && (
        <motion.p className="mt-3 text-sm font-body" style={{ color: "oklch(0.6 0.22 25)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.p>
      )}
      <p className="mt-4 text-xs text-muted-foreground/40 font-body">
        Pressione <kbd className="kbd-dark">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
