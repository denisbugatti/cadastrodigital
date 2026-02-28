/**
 * FormFlow Dropdown Input — Adaptive colors for any background
 * Searchable dropdown with animated options.
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
    <motion.div
      ref={containerRef}
      className="relative space-y-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <div
        className="rounded-xl border px-4 py-4 flex items-center gap-3 cursor-pointer transition-all duration-200"
        style={{
          borderColor: open ? "currentColor" : "rgba(128,128,128,0.25)",
          backgroundColor: "rgba(128,128,128,0.04)",
        }}
        onClick={() => { setOpen(!open); inputRef.current?.focus(); }}
      >
        <input
          ref={inputRef}
          type="text"
          value={open ? search : selectedLabel}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder || "Selecione uma opção..."}
          className="flex-1 bg-transparent text-base font-medium focus:outline-none"
          style={{ color: "inherit" }}
        />
        <style>{`
          input::placeholder { color: inherit; opacity: 0.4; }
        `}</style>
        <ChevronDown
          size={18}
          className="opacity-50 transition-transform duration-200 shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0)" }}
        />
      </div>

      {open && (
        <motion.div
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 max-h-64 overflow-y-auto shadow-xl border"
          style={{
            borderColor: "rgba(128,128,128,0.2)",
            backgroundColor: "rgba(30,30,50,0.95)",
            backdropFilter: "blur(12px)",
          }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-white/50 text-center">Nenhuma opção encontrada</div>
          ) : (
            filtered.map((choice, i) => {
              const isSelected = value === choice.id;
              return (
                <motion.button
                  key={choice.id}
                  onClick={() => { onChange(choice.id); setOpen(false); setSearch(""); if (onAutoAdvance) setTimeout(() => onAutoAdvance(choice.id), 400); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 text-white/90 hover:bg-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                >
                  <span className={`flex-1 text-sm font-medium ${isSelected ? "text-white" : "text-white/80"}`}>{choice.label}</span>
                  {isSelected && <Check size={16} className="text-emerald-400 shrink-0" />}
                </motion.button>
              );
            })
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
