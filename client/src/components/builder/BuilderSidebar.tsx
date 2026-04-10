/**
 * FormFlow Builder — Sidebar (Typeform-style)
 * Drag-and-drop reordering with dnd-kit. 3-dot menu per question.
 * "Add content" button opens type picker popover.
 * Branching indicators show conditional logic targets.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
  Minus, AlignLeft, MessageSquare, Hash, DollarSign, Link,
  CircleDot, ChevronDown, Image, ToggleLeft, CheckSquare,
  Smile, Star, Gauge, ArrowUpDown, Grid3X3,
  Calendar, Upload, Hand, Heart, ShieldCheck,
  ChevronRight, Search, Plus, GripVertical, X,
  MoreVertical, Copy, Trash2, GitBranch, ArrowRight,
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

// Color map for question type icons — gives each type a distinct identity
const typeColorMap: Record<string, { bg: string; text: string }> = {
  welcome: { bg: "bg-violet-100", text: "text-violet-600" },
  "thank-you": { bg: "bg-pink-100", text: "text-pink-600" },
  statement: { bg: "bg-indigo-100", text: "text-indigo-600" },
  legal: { bg: "bg-slate-100", text: "text-slate-600" },
  name: { bg: "bg-blue-100", text: "text-blue-600" },
  email: { bg: "bg-cyan-100", text: "text-cyan-600" },
  phone: { bg: "bg-green-100", text: "text-green-600" },
  cpf: { bg: "bg-amber-100", text: "text-amber-600" },
  cnpj: { bg: "bg-orange-100", text: "text-orange-600" },
  "identity-doc": { bg: "bg-yellow-100", text: "text-yellow-600" },
  "short-text": { bg: "bg-sky-100", text: "text-sky-600" },
  "long-text": { bg: "bg-teal-100", text: "text-teal-600" },
  number: { bg: "bg-purple-100", text: "text-purple-600" },
  currency: { bg: "bg-emerald-100", text: "text-emerald-600" },
  "multiple-choice": { bg: "bg-rose-100", text: "text-rose-600" },
  checkbox: { bg: "bg-fuchsia-100", text: "text-fuchsia-600" },
  dropdown: { bg: "bg-violet-100", text: "text-violet-600" },
  "yes-no": { bg: "bg-lime-100", text: "text-lime-600" },
  rating: { bg: "bg-amber-100", text: "text-amber-600" },
  satisfaction: { bg: "bg-yellow-100", text: "text-yellow-600" },
  nps: { bg: "bg-orange-100", text: "text-orange-600" },
  date: { bg: "bg-blue-100", text: "text-blue-600" },
  "file-upload": { bg: "bg-slate-100", text: "text-slate-600" },
  address: { bg: "bg-red-100", text: "text-red-600" },
  ranking: { bg: "bg-indigo-100", text: "text-indigo-600" },
  matrix: { bg: "bg-purple-100", text: "text-purple-600" },
  link: { bg: "bg-cyan-100", text: "text-cyan-600" },
};

const categoryIconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  user: User, type: Minus, list: CircleDot, star: Star,
  calendar: Calendar, paperclip: Upload, layout: Hand,
};

/* ─── Sortable Question Item ─── */
interface SortableItemProps {
  question: BuilderQuestion;
  isSelected: boolean;
  questionNumber: number | null;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  isDraggable: boolean;
  allQuestions: BuilderQuestion[];
}

function SortableQuestionItem({
  question, isSelected, questionNumber, onSelect, onDuplicate, onRemove, isDraggable, allQuestions,
}: SortableItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: question.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const typeInfo = questionTypes.find(t => t.type === question.type);
  const Icon = typeInfo ? iconMap[typeInfo.icon] || Minus : Minus;
  const isWelcome = question.type === "welcome";
  const isThankYou = question.type === "thank-you";
  const isSpecial = isWelcome || question.type === "statement" || question.type === "legal";
  const colors = typeColorMap[question.type] || { bg: "bg-secondary", text: "text-muted-foreground" };

  // Check if this question has active conditional logic
  const hasBranches = question.conditionalLogic?.enabled &&
    (question.conditionalLogic?.branches?.length ?? 0) > 0;
  const hasDefaultGoTo = question.conditionalLogic?.enabled &&
    question.conditionalLogic?.defaultGoTo &&
    question.conditionalLogic?.defaultGoTo !== "next";
  const hasConditional = hasBranches || hasDefaultGoTo;

  // Build branch info for tooltip
  const branchInfo = hasBranches
    ? (question.conditionalLogic?.branches ?? [])
        .filter(b => b.goToQuestionId && b.goToQuestionId !== "next")
        .map(branch => {
          const choice = question.choices?.find(c => c.id === branch.choiceId);
          const targetQ = allQuestions.find(q => q.id === branch.goToQuestionId);
          return {
            choiceLabel: choice?.label || "Opção",
            targetLabel: targetQ?.title || "Pergunta",
            targetType: targetQ?.type,
          };
        })
    : [];

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <button
        onClick={() => onSelect(question.id)}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-xl text-left transition-all ${
          isSelected
            ? "bg-brand/8 border border-brand/20"
            : "hover:bg-secondary border border-transparent"
        }`}
      >
        {/* Drag handle */}
        {isDraggable && (
          <div
            {...attributes}
            {...listeners}
            className="p-0.5 rounded cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <GripVertical size={12} />
          </div>
        )}
        {!isDraggable && <div className="w-4 shrink-0" />}

        {/* Colored type icon */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${
          isSelected
            ? `${colors.bg} ${colors.text} ring-2 ring-brand/20`
            : `${colors.bg} ${colors.text}`
        }`}>
          {isWelcome ? <Hand size={13} /> : isThankYou ? <Heart size={13} /> : <Icon size={13} />}
        </div>

        {/* Title + type label */}
        <div className="flex-1 min-w-0">
          <span className={`text-[13px] font-body truncate block ${
            isSelected ? "text-foreground font-medium" : "text-foreground/80"
          }`}>
            {question.title || typeInfo?.label || "Sem título"}
          </span>
          {/* Question number or type label */}
          <span className="text-[10px] font-body text-muted-foreground/40 truncate block">
            {!isSpecial && !isWelcome && !isThankYou && questionNumber !== null
              ? `${questionNumber} · ${typeInfo?.label || ""}`
              : typeInfo?.label || ""}
          </span>
        </div>

        {/* Branching indicator badge */}
        {hasConditional && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowBranches(!showBranches);
            }}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-body font-semibold shrink-0 cursor-pointer transition-all ${
              showBranches
                ? "bg-violet-100 text-violet-700 border border-violet-200"
                : "bg-violet-50 text-violet-500 border border-violet-100 hover:bg-violet-100 hover:text-violet-700"
            }`}
            title={`${branchInfo.length + (hasDefaultGoTo ? 1 : 0)} ramificaç${(branchInfo.length + (hasDefaultGoTo ? 1 : 0)) > 1 ? "ões" : "ão"}`}
          >
            <GitBranch size={10} />
            <span>{branchInfo.length + (hasDefaultGoTo ? 1 : 0)}</span>
          </div>
        )}

        {/* 3-dot menu trigger */}
        {!isWelcome && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded-lg transition-all shrink-0 ${
              showMenu
                ? "text-foreground bg-secondary"
                : "text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreVertical size={13} />
          </div>
        )}
      </button>

      {/* Branch details tooltip */}
      <AnimatePresence>
        {showBranches && hasConditional && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden ml-8 mr-2"
          >
            <div className="py-1.5 space-y-1">
              {branchInfo.map((branch, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-violet-50/80 border border-violet-100/60"
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-[10px] font-body font-medium text-violet-600 truncate max-w-[60px]">
                      {branch.choiceLabel}
                    </span>
                    <ArrowRight size={9} className="text-violet-400 shrink-0" />
                    <span className="text-[10px] font-body font-medium text-violet-700 truncate">
                      {branch.targetLabel}
                    </span>
                  </div>
                </div>
              ))}
              {question.conditionalLogic?.defaultGoTo && question.conditionalLogic?.defaultGoTo !== "next" && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-secondary border border-border">
                  <span className="text-[10px] font-body text-muted-foreground italic">Padrão</span>
                  <ArrowRight size={9} className="text-muted-foreground/50 shrink-0" />
                  <span className="text-[10px] font-body text-muted-foreground truncate">
                    {allQuestions.find(q => q.id === question.conditionalLogic?.defaultGoTo)?.title || "Próxima"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dropdown menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-2 top-full mt-1 z-50 bg-card rounded-xl border border-border shadow-xl py-1 min-w-[140px]"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(question.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-body text-foreground/80 hover:bg-secondary transition-colors"
            >
              <Copy size={13} />
              Duplicar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(question.id);
                setShowMenu(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-body text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={13} />
              Excluir
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Sidebar ─── */
interface BuilderSidebarProps {
  questions: BuilderQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestion: (id: string) => void;
  onAddQuestion: (type: BuilderQuestionType) => void;
  onDuplicateQuestion: (id: string) => void;
  onRemoveQuestion: (id: string) => void;
  onReorderQuestions: (activeId: string, overId: string) => void;
}

export function BuilderSidebar({
  questions, selectedQuestionId, onSelectQuestion, onAddQuestion,
  onDuplicateQuestion, onRemoveQuestion, onReorderQuestions,
}: BuilderSidebarProps) {
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<QuestionCategory | null>("contact");
  const pickerRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

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

  const regularQuestions = questions.filter(q => q.type !== "thank-you");
  const endings = questions.filter(q => q.type === "thank-you");

  // Build question numbers
  let qNum = 0;
  const questionNumbers = new Map<string, number | null>();
  regularQuestions.forEach((q) => {
    if (q.type === "welcome" || q.type === "statement" || q.type === "legal") {
      questionNumbers.set(q.id, null);
    } else {
      qNum++;
      questionNumbers.set(q.id, qNum);
    }
  });

  const sortableIds = regularQuestions.map(q => q.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorderQuestions(active.id as string, over.id as string);
    }
  };

  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const filteredTypes = searchQuery.trim()
    ? questionTypes.filter(
        (t) =>
          t.category !== "special" &&
          (normalize(t.label).includes(normalize(searchQuery)) ||
          normalize(t.description).includes(normalize(searchQuery)))
      )
    : questionTypes.filter(t => t.category !== "special");

  const groupedByCategory = questionCategories
    .filter(c => c.id !== "special")
    .map((cat) => ({
      ...cat,
      types: filteredTypes.filter((t) => t.category === cat.id),
    }));

  return (
    <div className="w-64 h-full flex flex-col border-r border-border bg-card relative">
      {/* Sidebar Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
          Perguntas
        </span>
        <span className="text-[10px] font-body text-muted-foreground/40">
          {regularQuestions.filter(q => q.type !== "welcome" && q.type !== "statement" && q.type !== "legal").length + endings.length} perguntas
        </span>
      </div>

      {/* Question List with DnD */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2 space-y-0.5">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {regularQuestions.map((question) => {
                const isDraggable = question.type !== "welcome";
                return (
                  <SortableQuestionItem
                    key={question.id}
                    question={question}
                    isSelected={selectedQuestionId === question.id}
                    questionNumber={questionNumbers.get(question.id) ?? null}
                    onSelect={onSelectQuestion}
                    onDuplicate={onDuplicateQuestion}
                    onRemove={onRemoveQuestion}
                    isDraggable={isDraggable}
                    allQuestions={questions}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        </div>

        {/* Endings Section */}
        {endings.length > 0 && (
          <div className="border-t border-border mt-2">
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-body font-semibold text-muted-foreground/50 uppercase tracking-wider">
                Encerramentos
              </span>
              <button
                onClick={() => onAddQuestion("thank-you")}
                className="p-1 rounded-md text-muted-foreground hover:text-brand hover:bg-brand-lighter/50 transition-colors"
                title="Adicionar encerramento"
              >
                <Plus size={13} />
              </button>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              {endings.map((ending) => (
                <SortableQuestionItem
                  key={ending.id}
                  question={ending}
                  isSelected={selectedQuestionId === ending.id}
                  questionNumber={null}
                  onSelect={onSelectQuestion}
                  onDuplicate={onDuplicateQuestion}
                  onRemove={onRemoveQuestion}
                  isDraggable={false}
                  allQuestions={questions}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Add Button (fixed at bottom) ─── */}
      <div className="p-3 border-t border-border bg-card">
        <button
          onClick={() => setShowTypePicker(!showTypePicker)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-semibold text-white bg-brand brand-shadow hover:bg-brand-dark active:scale-[0.98] transition-all"
        >
          <Plus size={16} />
          Adicionar pergunta
        </button>
      </div>

      {/* ─── Type Picker Popover ─── */}
      <AnimatePresence>
        {showTypePicker && (
          <motion.div
            ref={pickerRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 left-3 right-3 z-50 bg-card rounded-2xl border border-border shadow-2xl max-h-[65vh] flex flex-col overflow-hidden"
          >
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
                              const TypeIcon = iconMap[typeInfo.icon] || Minus;
                              return (
                                <button
                                  key={typeInfo.type}
                                  onClick={() => {
                                    onAddQuestion(typeInfo.type);
                                    setShowTypePicker(false);
                                    setSearchQuery("");
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body text-foreground/70 hover:text-foreground hover:bg-secondary transition-all group"
                                >
                                  {(() => {
                                    const c = typeColorMap[typeInfo.type] || { bg: "bg-secondary", text: "text-muted-foreground" };
                                    return (
                                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all group-hover:scale-105 ${c.bg} ${c.text}`}>
                                        <TypeIcon size={13} />
                                      </div>
                                    );
                                  })()}
                                  <div className="text-left min-w-0">
                                    <div className="font-medium text-sm truncate">{typeInfo.label}</div>
                                    <div className="text-[11px] text-muted-foreground/60 truncate">{typeInfo.description}</div>
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
