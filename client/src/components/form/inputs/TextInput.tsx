/**
 * FormFlow Text Input — Typeform/Respondi-style
 * Underline input that inherits text color from parent.
 * Real-time validation with visual feedback for email type.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { validateEmail } from "@/lib/validators";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "number";
  error?: string;
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
}: TextInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  // Real-time validation state
  const validationState = useMemo(() => {
    if (!touched || !value) return null;

    if (type === "email") {
      return validateEmail(value) ? "valid" : "invalid";
    }

    return null;
  }, [value, type, touched]);

  const borderColor = useMemo(() => {
    if (error) return "#EF4444";
    if (validationState === "valid") return "#34d399";
    if (validationState === "invalid") return "#f87171";
    if (value) return "currentColor";
    return "rgba(128,128,128,0.3)";
  }, [error, validationState, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!touched && e.target.value.length > 2) setTouched(true);
          }}
          onBlur={() => { if (value) setTouched(true); }}
          placeholder={placeholder || "Digite sua resposta aqui..."}
          className="w-full bg-transparent border-0 border-b-2 py-3 font-medium focus:outline-none transition-colors duration-300 pr-10"
          style={{
            fontSize: "18px",
            color: "inherit",
            borderColor,
          }}
          autoComplete="off"
        />
        {/* Placeholder styling via inline style since we need to inherit color */}
        <style>{`
          input::placeholder {
            color: inherit;
            opacity: 0.4;
          }
        `}</style>

        {/* Real-time validation icon */}
        {validationState && (
          <motion.div
            className="absolute right-0 top-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {validationState === "valid" ? (
              <CheckCircle2 size={22} className="text-emerald-400" />
            ) : (
              <XCircle size={22} className="text-red-400" />
            )}
          </motion.div>
        )}
      </div>

      {/* Real-time validation message */}
      {validationState === "invalid" && !error && (
        <motion.p
          className="mt-3 text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {type === "email" ? "E-mail inválido. Verifique o formato." : "Formato inválido."}
        </motion.p>
      )}

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
        <kbd className="px-1.5 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "rgba(128,128,128,0.3)" }}>
          Enter ↵
        </kbd>{" "}
        para continuar
      </motion.p>
    </motion.div>
  );
}
