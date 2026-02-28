/**
 * FormFlow Ranking Input — Adaptive colors for any background
 */

import { motion } from "framer-motion";
import type { Choice } from "@/lib/formTypes";
import { GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface RankingInputProps {
  choices: Choice[];
  value: string[];
  onChange: (value: string[]) => void;
}

export function RankingInput({ choices, value, onChange }: RankingInputProps) {
  const orderedIds = value.length > 0 ? value : choices.map((c) => c.id);
  const moveUp = (index: number) => { if (index === 0) return; const n = [...orderedIds]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; onChange(n); };
  const moveDown = (index: number) => { if (index === orderedIds.length - 1) return; const n = [...orderedIds]; [n[index], n[index + 1]] = [n[index + 1], n[index]]; onChange(n); };
  const getLabel = (id: string) => choices.find((c) => c.id === id)?.label || id;

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      {orderedIds.map((id, i) => (
        <motion.div
          key={id}
          className="rounded-xl border p-4 flex items-center gap-3.5 transition-all"
          style={{
            borderColor: "rgba(128,128,128,0.2)",
            backgroundColor: "rgba(128,128,128,0.04)",
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
          layout
        >
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              backgroundColor: i === 0 ? "currentColor" : "rgba(128,128,128,0.12)",
              color: i === 0 ? "white" : "inherit",
            }}
          >
            {i === 0 ? (
              <span className="mix-blend-difference">{i + 1}</span>
            ) : (
              <span className="opacity-60">{i + 1}</span>
            )}
          </span>
          <GripVertical size={16} className="opacity-20 shrink-0" />
          <span className="flex-1 text-base font-medium">{getLabel(id)}</span>
          <div className="flex gap-1">
            <button
              onClick={() => moveUp(i)}
              disabled={i === 0}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-15 hover:bg-white/10"
            >
              <ArrowUp size={14} className="opacity-60" />
            </button>
            <button
              onClick={() => moveDown(i)}
              disabled={i === orderedIds.length - 1}
              className="p-1.5 rounded-lg transition-colors disabled:opacity-15 hover:bg-white/10"
            >
              <ArrowDown size={14} className="opacity-60" />
            </button>
          </div>
        </motion.div>
      ))}
      <motion.p
        className="mt-3 text-xs opacity-30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 0.6 }}
      >
        Use as setas para reordenar os itens
      </motion.p>
    </motion.div>
  );
}
