/**
 * FormFlow Ranking Input (Light Theme)
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
    <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
      {orderedIds.map((id, i) => (
        <motion.div
          key={id}
          className="rounded-xl border border-border bg-white p-4 flex items-center gap-3 hover:shadow-sm transition-shadow"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
          layout
        >
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 ${
            i === 0 ? "bg-brand text-white" : "bg-secondary text-muted-foreground"
          }`}>{i + 1}</span>
          <GripVertical size={16} className="text-muted-foreground/30 shrink-0" />
          <span className="flex-1 text-base font-body text-foreground">{getLabel(id)}</span>
          <div className="flex gap-1">
            <button onClick={() => moveUp(i)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-20">
              <ArrowUp size={14} className="text-muted-foreground" />
            </button>
            <button onClick={() => moveDown(i)} disabled={i === orderedIds.length - 1} className="p-1.5 rounded-lg hover:bg-secondary transition-colors disabled:opacity-20">
              <ArrowDown size={14} className="text-muted-foreground" />
            </button>
          </div>
        </motion.div>
      ))}
      <p className="mt-2 text-sm text-muted-foreground font-body">Use as setas para reordenar os itens</p>
    </motion.div>
  );
}
