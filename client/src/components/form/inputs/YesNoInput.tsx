/**
 * FormFlow Yes/No Input (Light Theme)
 */

import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useEffect } from "react";

interface YesNoInputProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  onAutoAdvance?: () => void;
}

export function YesNoInput({ value, onChange, onAutoAdvance }: YesNoInputProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "y" || e.key.toLowerCase() === "s") {
        e.preventDefault(); onChange(true); if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
      }
      if (e.key.toLowerCase() === "n") {
        e.preventDefault(); onChange(false); if (onAutoAdvance) setTimeout(onAutoAdvance, 400);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onChange, onAutoAdvance]);

  const options = [
    { label: "Sim", val: true, icon: ThumbsUp, letter: "S", selectedClass: "bg-emerald-50 border-emerald-400 text-emerald-600" },
    { label: "Não", val: false, icon: ThumbsDown, letter: "N", selectedClass: "bg-red-50 border-red-400 text-red-500" },
  ];

  return (
    <motion.div className="flex gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      {options.map((opt, i) => {
        const isSelected = value === opt.val;
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.label}
            onClick={() => { onChange(opt.val); if (onAutoAdvance) setTimeout(onAutoAdvance, 400); }}
            className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl font-body text-lg font-medium transition-all duration-300 border ${
              isSelected ? opt.selectedClass : "bg-white border-border text-muted-foreground hover:border-brand/30 hover:shadow-sm"
            }`}
            initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.1, type: "spring", stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            <Icon size={22} strokeWidth={1.5} />
            <span>{opt.label}</span>
            <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono ml-1">{opt.letter}</kbd>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
