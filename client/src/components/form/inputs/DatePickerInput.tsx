/**
 * FormFlow Date Input — Typed text field with DD/MM/AAAA mask
 * Replaces the calendar picker with a simple, fast text input.
 * Adaptive colors: inherits text color from parent FormContainer.
 */

import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { Calendar as CalendarIcon } from "lucide-react";

interface DatePickerInputProps {
  value: string; // stored as YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
}

/** Convert YYYY-MM-DD → DD/MM/AAAA for display */
function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
}

/** Convert DD/MM/AAAA → YYYY-MM-DD for storage */
function displayToIso(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length < 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${m}-${d}`;
}

/** Apply DD/MM/AAAA mask to raw digit string */
function applyMask(digits: string): string {
  const d = digits.slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Validate a DD/MM/AAAA string */
function isValidDate(display: string): boolean {
  const digits = display.replace(/\D/g, "");
  if (digits.length !== 8) return false;
  const day = parseInt(digits.slice(0, 2), 10);
  const month = parseInt(digits.slice(2, 4), 10);
  const year = parseInt(digits.slice(4, 8), 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function DatePickerInput({ value, onChange, error }: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [displayValue, setDisplayValue] = useState(() => isoToDisplay(value));
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Extract only digits from the input
      const digits = raw.replace(/\D/g, "").slice(0, 8);
      const masked = applyMask(digits);
      setDisplayValue(masked);

      // Only emit ISO value when date is complete and valid
      if (digits.length === 8 && isValidDate(masked)) {
        onChange(displayToIso(masked));
      } else {
        // Clear the stored value if incomplete/invalid
        onChange("");
      }
    },
    [onChange]
  );

  // If value changes externally (e.g. form reset), sync display
  const prevValue = useRef(value);
  if (value !== prevValue.current) {
    prevValue.current = value;
    const newDisplay = isoToDisplay(value);
    if (newDisplay !== displayValue) {
      setDisplayValue(newDisplay);
    }
  }

  const digits = displayValue.replace(/\D/g, "");
  const isComplete = digits.length === 8 && isValidDate(displayValue);
  const hasError = error || (digits.length === 8 && !isValidDate(displayValue));

  const borderColor = hasError
    ? "#EF4444"
    : isComplete
    ? "currentColor"
    : isFocused
    ? "currentColor"
    : "rgba(128,128,128,0.3)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-3 w-full">
        <CalendarIcon size={20} className="opacity-60 shrink-0" style={{ color: "inherit" }} />
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={10}
          autoComplete="bday"
          className="w-full border-0 border-b-2 py-3 sm:py-4 text-lg sm:text-xl font-medium bg-transparent outline-none transition-colors duration-300 placeholder:opacity-30"
          style={{
            color: "inherit",
            borderColor,
            caretColor: "currentColor",
          }}
        />
      </div>

      {/* Validation hint */}
      {digits.length === 8 && !isValidDate(displayValue) && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs ml-8"
          style={{ color: "#EF4444" }}
        >
          Data inválida. Verifique o dia, mês e ano.
        </motion.p>
      )}
    </motion.div>
  );
}
