/**
 * FormFlow Legal Input (Light Theme)
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }} className="space-y-6">
      {legalText && (
        <div className="rounded-xl border border-border bg-secondary/50 p-5 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-brand" />
            <span className="text-xs font-body text-muted-foreground uppercase tracking-wider font-medium">Termos</span>
          </div>
          <p className="text-sm font-body text-foreground/70 leading-relaxed whitespace-pre-wrap">{legalText}</p>
        </div>
      )}
      <motion.button
        onClick={() => { onChange(!value); if (!value && onAutoAdvance) setTimeout(() => onAutoAdvance(true), 400); }}
        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 ${
          value ? "bg-emerald-50 border-emerald-400" : "bg-white border-border hover:border-brand/30"
        }`}
        whileTap={{ scale: 0.98 }}
      >
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0 transition-all duration-300 border-2 ${
          value ? "bg-emerald-500 border-emerald-500" : "bg-white border-border"
        }`}>
          {value && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
              <Check size={14} className="text-white" strokeWidth={2.5} />
            </motion.div>
          )}
        </span>
        <span className={`text-base font-body ${value ? "text-foreground font-medium" : "text-foreground/70"}`}>Eu li e aceito os termos acima</span>
      </motion.button>
      <p className="text-sm text-muted-foreground font-body">
        Pressione <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd> para continuar
      </p>
    </motion.div>
  );
}
