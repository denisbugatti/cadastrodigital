/**
 * FormFlow Builder — Canvas (Light Theme)
 * Central area showing the list of questions added to the form.
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
    <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-secondary/30">
      <div className="max-w-2xl mx-auto py-8 px-6">
        {/* Form title area */}
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground font-body uppercase tracking-widest mb-2">
            Fluxo do formulário
          </p>
          <p className="text-sm text-muted-foreground/60 font-body">
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
                    group relative rounded-2xl border cursor-pointer transition-all duration-200
                    ${
                      isSelected
                        ? "border-brand bg-white shadow-md ring-2 ring-brand/10"
                        : "border-border bg-white hover:border-brand/30 hover:shadow-sm"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 px-5 py-4">
                    {/* Drag handle */}
                    {!isSpecial && (
                      <div className="opacity-0 group-hover:opacity-50 transition-opacity shrink-0">
                        <GripVertical size={16} className="text-muted-foreground" />
                      </div>
                    )}

                    {/* Question number */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-body font-bold ${
                        isSelected
                          ? "bg-brand text-white"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {isSpecial ? (
                        <Icon size={15} />
                      ) : (
                        index
                      )}
                    </div>

                    {/* Type icon */}
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-brand-lighter border border-brand/10">
                      <Icon size={16} className="text-brand" />
                    </div>

                    {/* Question info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-base font-body font-medium text-foreground truncate">
                          {question.title || "Sem título"}
                        </p>
                        {hasConditional && (
                          <GitBranch size={14} className="text-brand shrink-0" />
                        )}
                        {question.required && (
                          <span className="text-xs text-brand font-body font-medium shrink-0 bg-brand-lighter px-2 py-0.5 rounded-full">
                            Obrigatório
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-body mt-0.5">
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
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Mover para cima"
                        >
                          <ChevronUp size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMove(question.id, "down");
                          }}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Mover para baixo"
                        >
                          <ChevronDownIcon size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(question.id);
                          }}
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                          title="Duplicar"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemove(question.id);
                          }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Connector line */}
                  {index < questions.length - 1 && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-px h-3 bg-border" />
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
