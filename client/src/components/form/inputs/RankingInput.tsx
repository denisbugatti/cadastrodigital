/**
 * FormFlow — Dark Futuristic Design
 * Ranking input - drag to reorder items (simplified with click-to-swap).
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
  // Initialize order from value or default
  const orderedIds = value.length > 0 ? value : choices.map((c) => c.id);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedIds];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === orderedIds.length - 1) return;
    const newOrder = [...orderedIds];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange(newOrder);
  };

  const getLabel = (id: string) => choices.find((c) => c.id === id)?.label || id;

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.25 }}
    >
      {orderedIds.map((id, i) => (
        <motion.div
          key={id}
          className="glass-card rounded-2xl p-4 flex items-center gap-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 25 }}
          layout
        >
          {/* Rank number */}
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              background: i === 0 ? "oklch(0.65 0.2 250)" : "oklch(0.2 0.02 260 / 0.6)",
              color: i === 0 ? "white" : "oklch(0.55 0.02 260)",
              boxShadow: i === 0 ? "0 0 10px oklch(0.65 0.2 250 / 0.3)" : "none",
            }}
          >
            {i + 1}
          </span>

          <GripVertical size={16} className="text-muted-foreground/30 shrink-0" />

          <span className="flex-1 text-base font-body text-foreground/80">
            {getLabel(id)}
          </span>

          {/* Move buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => moveUp(i)}
              disabled={i === 0}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-20"
            >
              <ArrowUp size={14} className="text-muted-foreground/60" />
            </button>
            <button
              onClick={() => moveDown(i)}
              disabled={i === orderedIds.length - 1}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-20"
            >
              <ArrowDown size={14} className="text-muted-foreground/60" />
            </button>
          </div>
        </motion.div>
      ))}
      <p className="mt-2 text-xs text-muted-foreground/40 font-body">
        Use as setas para reordenar os itens
      </p>
    </motion.div>
  );
}
