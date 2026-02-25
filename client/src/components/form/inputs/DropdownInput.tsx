/**
 * FormFlow Dropdown Input (Light Theme)
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Choice } from "@/lib/formTypes";

interface DropdownInputProps {
  choices: Choice[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onAutoAdvance?: (value?: unknown) => void;
}

export function DropdownInput({ choices, value, onChange, placeholder, onAutoAdvance }: DropdownInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const timer = setTimeout(() => inputRef.current?.focus(), 400); return () => clearTimeout(timer); }, []);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = choices.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));
  const selectedLabel = choices.find((c) => c.id === value)?.label || "";

  return (
    <motion.div ref={containerRef} className="relative" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}>
      <div
        className={`rounded-xl border p-4 flex items-center gap-3 cursor-pointer bg-white transition-all duration-200 ${open ? "border-brand shadow-sm" : "border-border hover:border-brand/30"}`}
        onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedLabel}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Selecione uma opção..."}
          className="flex-1 bg-transparent text-base font-body text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
        <ChevronDown size={18} className="text-muted-foreground transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </div>
      {open && (
        <motion.div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-xl overflow-hidden z-50 max-h-60 overflow-y-auto shadow-lg" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground font-body text-center">Nenhuma opção encontrada</div>
          ) : (
            filtered.map((choice) => {
              const isSelected = value === choice.id;
              return (
                <button
                  key={choice.id}
                  onClick={() => { onChange(choice.id); setOpen(false); setSearch(""); if (onAutoAdvance) setTimeout(() => onAutoAdvance(choice.id), 400); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left font-body text-base transition-colors duration-150 hover:bg-secondary ${isSelected ? "bg-brand/5" : ""}`}
                >
                  <span className={isSelected ? "text-foreground font-medium" : "text-foreground/70"}>{choice.label}</span>
                  {isSelected && <Check size={14} className="ml-auto text-brand" />}
                </button>
              );
            })
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
