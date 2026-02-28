/**
 * FormFlow Legal Input — Adaptive colors for any background
 */

import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";

interface LegalInputProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  legalText?: string;
  onAutoAdvance?: (value?: unknown) => void;
}

export function LegalInput({ value, onChange, legalText, onAutoAdvance }: LegalInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-6"
    >
      {legalText && (
        <div
          className="rounded-xl border p-5 max-h-48 overflow-y-auto"
          style={{
            borderColor: "rgba(128,128,128,0.2)",
            backgroundColor: "rgba(128,128,128,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="opacity-60" />
            <span className="text-xs uppercase tracking-wider font-semibold opacity-60">Termos</span>
          </div>
          <p className="text-sm leading-relaxed opacity-70 whitespace-pre-wrap">{legalText}</p>
        </div>
      )}
      <motion.button
        onClick={() => { onChange(!value); if (!value && onAutoAdvance) setTimeout(() => onAutoAdvance(true), 400); }}
        className="w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300"
        style={{
          borderColor: value ? "#34d399" : "rgba(128,128,128,0.25)",
          backgroundColor: value ? "rgba(52,211,153,0.08)" : "transparent",
        }}
        whileTap={{ scale: 0.98 }}
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 transition-all duration-300 border-2"
          style={{
            borderColor: value ? "#34d399" : "rgba(128,128,128,0.3)",
            backgroundColor: value ? "#34d399" : "transparent",
          }}
        >
          {value && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
              <Check size={14} className="text-white" strokeWidth={2.5} />
            </motion.div>
          )}
        </span>
        <span className={`text-base font-medium ${value ? "opacity-100" : "opacity-70"}`}>
          Eu li e aceito os termos acima
        </span>
      </motion.button>
      <motion.p
        className="text-xs opacity-30"
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
