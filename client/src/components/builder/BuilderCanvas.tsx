/**
 * FormFlow Builder — Canvas
 * Central area showing the list of questions added to the form.
 * Supports selection, reordering, and visual feedback.
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
  Minus, AlignLeft, MessageSquare, Hash, DollarSign, Link,
  CircleDot, ChevronDown, Image, ToggleLeft, CheckSquare,
  Smile, Star, Gauge, ArrowUpDown, Grid3X3,
  Calendar, Upload, Hand, Heart, ShieldCheck,
  GripVertical, Trash2, Copy, ChevronUp, ChevronDownIcon,
  GitBranch,
} from "lucide-react";
import type { BuilderQuestion } from "@/lib/builderTypes";
import { questionTypes } from "@/lib/builderTypes";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  user: User, mail: Mail, phone: Phone, fingerprint: Fingerprint,
  "building-2": Building2, "id-card": IdCard, "map-pin": MapPin,
  minus: Minus, "align-left": AlignLeft, "message-square": MessageSquare,
  hash: Hash, "dollar-sign": DollarSign, link: Link,
  "circle-dot": CircleDot, "chevron-down": ChevronDown, image: Image,
  "toggle-left": ToggleLeft, "check-square": CheckSquare,
  smile: Smile, star: Star, gauge: Gauge, "arrow-up-down": ArrowUpDown,
  "grid-3x3": Grid3X3, calendar: Calendar, upload: Upload,
  hand: Hand, heart: Heart, "shield-check": ShieldCheck,
};

interface BuilderCanvasProps {
  questions: BuilderQuestion[];
  selectedQuestionId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}

export function BuilderCanvas({
  questions,
  selectedQuestionId,
  onSelect,
  onRemove,
  onDuplicate,
  onMove,
}: BuilderCanvasProps) {
  return (
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar" style={{ background: "oklch(0.09 0.01 260)" }}>
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Form title area */}
        <div className="text-center mb-8">
          <p className="text-xs text-muted-foreground/50 font-body uppercase tracking-widest mb-2">
            Fluxo do formulário
          </p>
          <p className="text-xs text-muted-foreground/40 font-body">
            {questions.length} pergunta{questions.length !== 1 ? "s" : ""} adicionada{questions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {questions.map((question, index) => {
              const typeInfo = questionTypes.find((t) => t.type === question.type);
              const Icon = typeInfo ? iconMap[typeInfo.icon] || Minus : Minus;
              const isSelected = selectedQuestionId === question.id;
              const isSpecial = question.type === "welcome" || question.type === "thank-you";
              const hasConditional = question.conditionalLogic?.enabled;

              return (
                <motion.div
                  key={question.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  onClick={() => onSelect(question.id)}
                  className={`
                    group relative rounded-xl border cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "border-neon-blue/50 bg-neon-blue/5"
                        : "border-glass-border hover:border-glass-hover bg-card/40 hover:bg-card/60"
                    }
                  `}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 20px oklch(0.65 0.2 250 / 0.1)" }
                      : {}
                  }
                >
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Drag handle */}
                    {!isSpecial && (
                      <div className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0">
                        <GripVertical size={14} className="text-muted-foreground" />
                      </div>
                    )}

                    {/* Question number */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-body font-bold"
                      style={{
                        background: isSelected
                          ? "oklch(0.65 0.2 250 / 0.15)"
                          : "oklch(0.2 0.015 260)",
                        color: isSelected
                          ? "oklch(0.75 0.15 195)"
                          : "oklch(0.5 0.02 260)",
                      }}
                    >
                      {isSpecial ? (
                        <Icon size={13} />
                      ) : (
                        index
                      )}
                    </div>

                    {/* Type icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "oklch(0.65 0.2 250 / 0.08)",
                        border: "1px solid oklch(0.65 0.2 250 / 0.12)",
                      }}
                    >
                      <Icon size={14} className="text-neon-blue" />
                    </div>

                    {/* Question info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-body font-medium text-foreground/90 truncate">
                          {question.title || "Sem título"}
                        </p>
                        {hasConditional && (
                          <GitBranch size={12} className="text-neon-cyan shrink-0" />
                        )}
                        {question.required && (
                          <span className="text-[9px] text-neon-blue/70 font-body font-medium shrink-0">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground/50 font-body mt-0.5">
                        {typeInfo?.label || question.type}
                      </p>
                    </div>

                    {/* Actions */}
                    {!isSpecial && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMove(question.id, "up");
                          }}
                          className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                          title="Mover para cima"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMove(question.id, "down");
                          }}
                          className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                          title="Mover para baixo"
                        >
                          <ChevronDownIcon size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(question.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(question.id);
                          }}
                          className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Connector line */}
                  {index < questions.length - 1 && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3 bg-glass-border" />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
