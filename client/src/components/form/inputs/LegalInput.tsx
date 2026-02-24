/**
 * FormFlow — Dark Futuristic Design
 * Legal/Terms acceptance with checkbox and text display.
 */

import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";

interface LegalInputProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  legalText?: string;
  onAutoAdvance?: () => void;
}

export function LegalInput({ value, onChange, legalText, onAutoAdvance }: LegalInputProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-6"
    >
      {/* Legal text display */}
      {legalText && (
        <div className="glass-card rounded-2xl p-5 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-neon-blue" />
            <span className="text-xs font-body text-muted-foreground/60 uppercase tracking-wider">Termos</span>
          </div>
          <p className="text-sm font-body text-foreground/70 leading-relaxed whitespace-pre-wrap">
            {legalText}
          </p>
        </div>
      )}

      {/* Accept checkbox */}
      <motion.button
        onClick={() => {
          onChange(!value);
          if (!value && onAutoAdvance) setTimeout(onAutoAdvance, 400);
        }}
        className="w-full flex items-center gap-4 p-4 rounded-2xl glass-card transition-all duration-300"
        style={value ? {
          borderColor: "oklch(0.65 0.18 150 / 0.4)",
          boxShadow: "0 0 15px oklch(0.65 0.18 150 / 0.15)",
        } : {}}
        whileTap={{ scale: 0.98 }}
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-lg shrink-0 transition-all duration-300"
          style={value ? {
            background: "oklch(0.65 0.18 150)",
            border: "2px solid oklch(0.65 0.18 150)",
            boxShadow: "0 0 10px oklch(0.65 0.18 150 / 0.4)",
          } : {
            background: "transparent",
            border: "2px solid oklch(0.35 0.02 260 / 0.6)",
          }}
        >
          {value && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
              <Check size={14} className="text-white" strokeWidth={2.5} />
            </motion.div>
          )}
        </span>
        <span className={`text-base font-body ${value ? "text-foreground font-medium" : "text-foreground/70"}`}>
          Eu li e aceito os termos acima
        </span>
      </motion.button>

      <p className="text-xs text-muted-foreground/40 font-body">
        Pressione <kbd className="kbd-dark">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
