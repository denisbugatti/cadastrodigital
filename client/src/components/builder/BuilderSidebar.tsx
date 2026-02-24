/**
 * FormFlow Builder — Sidebar
 * Lists all 28 question types organized by category.
 * Click to add a question to the form.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
  Minus, AlignLeft, MessageSquare, Hash, DollarSign, Link,
  CircleDot, ChevronDown, Image, ToggleLeft, CheckSquare,
  Smile, Star, Gauge, ArrowUpDown, Grid3X3,
  Calendar, Upload, Hand, Heart, ShieldCheck,
  ChevronRight, Search,
} from "lucide-react";
import {
  questionCategories,
  questionTypes,
  type BuilderQuestionType,
  type QuestionCategory,
} from "@/lib/builderTypes";

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
  type: Minus, list: CircleDot, paperclip: Upload, layout: Hand,
};

const categoryIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  user: User, type: Minus, list: CircleDot, star: Star,
  calendar: Calendar, paperclip: Upload, layout: Hand,
};

interface BuilderSidebarProps {
  onAddQuestion: (type: BuilderQuestionType) => void;
}

export function BuilderSidebar({ onAddQuestion }: BuilderSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<QuestionCategory | null>("contact");

  const filteredTypes = searchQuery.trim()
    ? questionTypes.filter(
        (t) =>
          t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : questionTypes;

  const groupedByCategory = questionCategories.map((cat) => ({
    ...cat,
    types: filteredTypes.filter((t) => t.category === cat.id),
  }));

  return (
    <div className="w-72 h-full flex flex-col border-r border-glass-border" style={{ background: "oklch(0.11 0.015 260)" }}>
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">
          Tipos de Pergunta
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tipo..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-xs font-body text-foreground placeholder:text-muted-foreground/40 border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors"
            style={{ background: "oklch(0.14 0.015 260)" }}
          />
        </div>
      </div>

      {/* Categories */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {groupedByCategory.map((category) => {
          if (category.types.length === 0) return null;
          const CatIcon = categoryIconMap[category.icon] || Minus;
          const isExpanded = searchQuery.trim() ? true : expandedCategory === category.id;

          return (
            <div key={category.id} className="mb-1">
              {/* Category header */}
              <button
                onClick={() =>
                  setExpandedCategory((prev) =>
                    prev === category.id ? null : category.id
                  )
                }
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-body font-medium text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all"
              >
                <ChevronRight
                  size={12}
                  className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                />
                <CatIcon size={13} />
                <span>{category.label}</span>
                <span className="ml-auto text-[10px] text-muted-foreground/50">
                  {category.types.length}
                </span>
              </button>

              {/* Question types */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-2 pb-1">
                      {category.types.map((typeInfo) => {
                        const Icon = iconMap[typeInfo.icon] || Minus;
                        return (
                          <button
                            key={typeInfo.type}
                            onClick={() => onAddQuestion(typeInfo.type)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-body text-foreground/70 hover:text-foreground hover:bg-neon-blue/10 transition-all group"
                          >
                            <div
                              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                              style={{
                                background: "oklch(0.65 0.2 250 / 0.08)",
                                border: "1px solid oklch(0.65 0.2 250 / 0.12)",
                              }}
                            >
                              <Icon size={13} className="text-neon-blue" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">{typeInfo.label}</div>
                              <div className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">
                                {typeInfo.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
