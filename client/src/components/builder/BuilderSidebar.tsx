/**
 * FormFlow Builder — Sidebar (Typeform-style)
 * Lists form questions for navigation. "Add content" button opens type picker popover.
 * Separate "Endings" section for thank-you screens.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
  Minus, AlignLeft, MessageSquare, Hash, DollarSign, Link,
  CircleDot, ChevronDown, Image, ToggleLeft, CheckSquare,
  Smile, Star, Gauge, ArrowUpDown, Grid3X3,
  Calendar, Upload, Hand, Heart, ShieldCheck,
  ChevronRight, Search, Plus, GripVertical, X,
} from "lucide-react";
import {
  questionCategories,
  questionTypes,
  type BuilderQuestionType,
  type BuilderQuestion,
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
  questions: BuilderQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onAddQuestion: (type: BuilderQuestionType) => void;
}

export function BuilderSidebar({ questions, selectedQuestionId, onSelectQuestion, onAddQuestion }: BuilderSidebarProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<QuestionCategory | null>("contact");
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on click outside
  useEffect(() => {
    if (!showTypePicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowTypePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTypePicker]);

  // Separate questions into regular and endings
  const regularQuestions = questions.filter(q => q.type !== "thank-you");
  const endings = questions.filter(q => q.type === "thank-you");

  // Question number (excluding welcome and thank-you)
  let questionNumber = 0;

  const filteredTypes = searchQuery.trim()
    ? questionTypes.filter(
        (t) =>
          t.category !== "special" &&
          (t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : questionTypes.filter(t => t.category !== "special");

  const groupedByCategory = questionCategories
    .filter(c => c.id !== "special")
    .map((cat) => ({
      ...cat,
      types: filteredTypes.filter((t) => t.category === cat.id),
    }));

  return (
    <div className="w-64 h-full flex flex-col border-r border-border bg-white relative">
      {/* Add Content Button */}
      <div className="p-3 border-b border-border">
        <button
          onClick={() => setShowTypePicker(!showTypePicker)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-semibold text-white bg-brand brand-shadow hover:bg-brand-dark active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Adicionar conteúdo
        </button>
      </div>

      {/* Question List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-0.5">
          {regularQuestions.map((question) => {
            const typeInfo = questionTypes.find(t => t.type === question.type);
            const Icon = typeInfo ? iconMap[typeInfo.icon] || Minus : Minus;
            const isSelected = selectedQuestionId === question.id;
            const isWelcome = question.type === "welcome";
            const isSpecial = isWelcome || question.type === "statement" || question.type === "legal";

            if (!isWelcome && question.type !== "statement" && question.type !== "legal") {
              questionNumber++;
            }

            return (
              <button
                key={question.id}
                onClick={() => onSelectQuestion(question.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isSelected
                    ? "bg-brand/8 border border-brand/20"
                    : "hover:bg-secondary border border-transparent"
                }`}
              >
                {/* Icon with type color */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-brand text-white" : "bg-secondary text-muted-foreground"
                }`}>
                  {isWelcome ? (
                    <Hand size={14} />
                  ) : (
                    <Icon size={14} />
                  )}
                </div>

                {/* Number */}
                {!isSpecial && !isWelcome && (
                  <span className={`text-xs font-body font-bold shrink-0 ${
                    isSelected ? "text-brand" : "text-muted-foreground/60"
                  }`}>
                    {questionNumber}
                  </span>
                )}
                {isWelcome && (
                  <span className={`text-xs font-body font-bold shrink-0 ${
                    isSelected ? "text-brand" : "text-muted-foreground/60"
                  }`}>
                    
                  </span>
                )}

                {/* Title */}
                <span className={`text-sm font-body truncate flex-1 ${
                  isSelected ? "text-foreground font-medium" : "text-foreground/70"
                }`}>
                  {question.title || typeInfo?.label || "Sem título"}
                </span>

                {/* Motion icon indicator */}
                {question.motionIconUrl && (
                  <img src={question.motionIconUrl} alt="" className="w-4 h-4 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Endings Section */}
        {endings.length > 0 && (
          <div className="border-t border-border mt-2">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
                Endings
              </span>
              <button
                onClick={() => onAddQuestion("thank-you")}
                className="p-1 rounded-md text-muted-foreground hover:text-brand hover:bg-brand-lighter/50 transition-colors"
                title="Adicionar ending"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              {endings.map((ending, idx) => {
                const isSelected = selectedQuestionId === ending.id;
                return (
                  <button
                    key={ending.id}
                    onClick={() => onSelectQuestion(ending.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? "bg-brand/8 border border-brand/20"
                        : "hover:bg-secondary border border-transparent"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? "bg-brand text-white" : "bg-secondary text-muted-foreground"
                    }`}>
                      <Heart size={14} />
                    </div>
                    <span className={`text-xs font-body font-bold shrink-0 ${
                      isSelected ? "text-brand" : "text-muted-foreground/60"
                    }`}>
                      A
                    </span>
                    <span className={`text-sm font-body truncate flex-1 ${
                      isSelected ? "text-foreground font-medium" : "text-foreground/70"
                    }`}>
                      {ending.title || "Agradecimento"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Type Picker Popover ─── */}
      <AnimatePresence>
        {showTypePicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 left-3 right-3 z-50 bg-white rounded-2xl border border-border shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
          >
            {/* Picker header */}
            <div className="p-3 border-b border-border flex items-center gap-2">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar tipo de pergunta..."
                className="flex-1 text-sm font-body text-foreground placeholder:text-muted-foreground/50 bg-transparent focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => { setShowTypePicker(false); setSearchQuery(""); }}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Picker content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {groupedByCategory.map((category) => {
                if (category.types.length === 0) return null;
                const CatIcon = categoryIconMap[category.icon] || Minus;
                const isExpanded = searchQuery.trim() ? true : expandedCategory === category.id;

                return (
                  <div key={category.id} className="mb-1">
                    <button
                      onClick={() =>
                        setExpandedCategory((prev) =>
                          prev === category.id ? null : category.id
                        )
                      }
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-body font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all uppercase tracking-wider"
                    >
                      <ChevronRight
                        size={12}
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      />
                      <CatIcon size={13} />
                      <span>{category.label}</span>
                      <span className="ml-auto text-xs text-muted-foreground/40 font-normal normal-case">
                        {category.types.length}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-1 pb-1">
                            {category.types.map((typeInfo) => {
                              const Icon = iconMap[typeInfo.icon] || Minus;
                              return (
                                <button
                                  key={typeInfo.type}
                                  onClick={() => {
                                    onAddQuestion(typeInfo.type);
                                    setShowTypePicker(false);
                                    setSearchQuery("");
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body text-foreground/70 hover:text-foreground hover:bg-brand-lighter/40 transition-all group"
                                >
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-110 bg-brand-lighter border border-brand/10">
                                    <Icon size={13} className="text-brand" />
                                  </div>
                                  <div className="text-left min-w-0">
                                    <div className="font-medium text-sm truncate">{typeInfo.label}</div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
