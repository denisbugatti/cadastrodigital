/**
 * FormFlow Builder — Config Panel
 * Right panel for editing the selected question's properties.
 * Includes conditional logic editor for multiple-choice, dropdown, yes-no.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Type, AlignLeft, ToggleLeft, Plus, Trash2, X,
  GitBranch, ArrowRight, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import type { BuilderQuestion, BuilderChoice, ConditionalBranch } from "@/lib/builderTypes";
import { questionTypes } from "@/lib/builderTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BuilderConfigPanelProps {
  question: BuilderQuestion | null;
  onUpdate: (id: string, updates: Partial<BuilderQuestion>) => void;
  onAddChoice: (id: string) => void;
  onUpdateChoice: (questionId: string, choiceId: string, updates: Partial<BuilderChoice>) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  conditionalTargets: { id: string; label: string; type: string }[];
}

export function BuilderConfigPanel({
  question,
  onUpdate,
  onAddChoice,
  onUpdateChoice,
  onRemoveChoice,
  conditionalTargets,
}: BuilderConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<"general" | "logic">("general");

  if (!question) {
    return (
      <div className="w-80 h-full border-l border-glass-border flex items-center justify-center" style={{ background: "oklch(0.11 0.015 260)" }}>
        <div className="text-center px-8">
          <Settings size={32} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground/50 font-body">
            Selecione uma pergunta para editar suas configurações
          </p>
        </div>
      </div>
    );
  }

  const typeInfo = questionTypes.find((t) => t.type === question.type);
  const hasChoices = typeInfo?.hasChoices || false;
  const hasConditionalLogic = typeInfo?.hasConditionalLogic || false;
  const isSpecial = question.type === "welcome" || question.type === "thank-you" || question.type === "statement";

  return (
    <div className="w-80 h-full border-l border-glass-border flex flex-col" style={{ background: "oklch(0.11 0.015 260)" }}>
      {/* Header */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-neon-cyan" />
          <h3 className="font-display text-sm font-semibold text-foreground">
            Configurações
          </h3>
        </div>
        <p className="text-[11px] text-muted-foreground/50 font-body">
          {typeInfo?.label || question.type}
        </p>

        {/* Tabs for questions with conditional logic */}
        {hasConditionalLogic && (
          <div className="flex gap-1 mt-3 p-1 rounded-lg" style={{ background: "oklch(0.14 0.015 260)" }}>
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-body font-medium transition-all ${
                activeTab === "general"
                  ? "bg-neon-blue/15 text-neon-blue"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings size={11} />
              Geral
            </button>
            <button
              onClick={() => setActiveTab("logic")}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-body font-medium transition-all ${
                activeTab === "logic"
                  ? "bg-neon-cyan/15 text-neon-cyan"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitBranch size={11} />
              Lógica
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        <AnimatePresence mode="wait">
          {activeTab === "general" ? (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-5"
            >
              {/* Title */}
              <FieldGroup label="Título da pergunta" icon={<Type size={12} />}>
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => onUpdate(question.id, { title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors"
                  style={{ background: "oklch(0.14 0.015 260)" }}
                  placeholder="Digite o título..."
                />
              </FieldGroup>

              {/* Subtitle */}
              <FieldGroup label="Subtítulo (opcional)" icon={<AlignLeft size={12} />}>
                <input
                  type="text"
                  value={question.subtitle}
                  onChange={(e) => onUpdate(question.id, { subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors"
                  style={{ background: "oklch(0.14 0.015 260)" }}
                  placeholder="Texto auxiliar..."
                />
              </FieldGroup>

              {/* Placeholder (for text inputs) */}
              {!isSpecial && question.type !== "yes-no" && question.type !== "rating" && question.type !== "satisfaction" && question.type !== "nps" && question.type !== "ranking" && question.type !== "matrix" && question.type !== "file-upload" && question.type !== "legal" && !hasChoices && (
                <FieldGroup label="Placeholder" icon={<Type size={12} />}>
                  <input
                    type="text"
                    value={question.placeholder}
                    onChange={(e) => onUpdate(question.id, { placeholder: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors"
                    style={{ background: "oklch(0.14 0.015 260)" }}
                    placeholder="Texto do placeholder..."
                  />
                </FieldGroup>
              )}

              {/* Required toggle */}
              {!isSpecial && question.type !== "welcome" && question.type !== "thank-you" && (
                <div className="flex items-center justify-between py-2">
                  <Label className="text-xs font-body text-foreground/80 flex items-center gap-2">
                    <ToggleLeft size={12} className="text-muted-foreground" />
                    Obrigatório
                  </Label>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) => onUpdate(question.id, { required: checked })}
                  />
                </div>
              )}

              {/* Choices editor */}
              {hasChoices && (
                <FieldGroup label="Opções" icon={<Plus size={12} />}>
                  <div className="space-y-2">
                    {question.choices.map((choice, idx) => (
                      <div key={choice.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/40 font-body w-4 text-center shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={choice.label}
                          onChange={(e) =>
                            onUpdateChoice(question.id, choice.id, { label: e.target.value })
                          }
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors"
                          style={{ background: "oklch(0.14 0.015 260)" }}
                          placeholder={`Opção ${idx + 1}`}
                        />
                        {question.choices.length > 2 && (
                          <button
                            onClick={() => onRemoveChoice(question.id, choice.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onAddChoice(question.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-glass-border text-[11px] font-body text-muted-foreground hover:text-neon-blue hover:border-neon-blue/30 transition-all"
                    >
                      <Plus size={11} />
                      Adicionar opção
                    </button>
                  </div>
                </FieldGroup>
              )}

              {/* Rating config */}
              {(question.type === "rating" || question.type === "satisfaction") && (
                <FieldGroup label="Escala máxima" icon={<Type size={12} />}>
                  <div className="flex items-center gap-3">
                    {[3, 4, 5, 7, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => onUpdate(question.id, { maxRating: n })}
                        className={`w-9 h-9 rounded-lg text-xs font-body font-medium transition-all ${
                          question.maxRating === n
                            ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                            : "border border-glass-border text-muted-foreground hover:text-foreground"
                        }`}
                        style={question.maxRating !== n ? { background: "oklch(0.14 0.015 260)" } : {}}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              )}

              {/* Ranking items */}
              {question.type === "ranking" && (
                <FieldGroup label="Itens para ordenar" icon={<Plus size={12} />}>
                  <div className="space-y-2">
                    {question.rankItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/40 font-body w-4 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...question.rankItems];
                            newItems[idx] = e.target.value;
                            onUpdate(question.id, { rankItems: newItems });
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors"
                          style={{ background: "oklch(0.14 0.015 260)" }}
                        />
                        {question.rankItems.length > 2 && (
                          <button
                            onClick={() => {
                              const newItems = question.rankItems.filter((_, i) => i !== idx);
                              onUpdate(question.id, { rankItems: newItems });
                            }}
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onUpdate(question.id, { rankItems: [...question.rankItems, `Item ${question.rankItems.length + 1}`] })}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-glass-border text-[11px] font-body text-muted-foreground hover:text-neon-blue hover:border-neon-blue/30 transition-all"
                    >
                      <Plus size={11} />
                      Adicionar item
                    </button>
                  </div>
                </FieldGroup>
              )}

              {/* Legal text */}
              {question.type === "legal" && (
                <FieldGroup label="Texto dos termos" icon={<AlignLeft size={12} />}>
                  <textarea
                    value={question.legalText}
                    onChange={(e) => onUpdate(question.id, { legalText: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors resize-none h-24"
                    style={{ background: "oklch(0.14 0.015 260)" }}
                    placeholder="Texto dos termos de uso..."
                  />
                </FieldGroup>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="logic"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              <ConditionalLogicEditor
                question={question}
                onUpdate={onUpdate}
                targets={conditionalTargets}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Conditional Logic Editor ───

function ConditionalLogicEditor({
  question,
  onUpdate,
  targets,
}: {
  question: BuilderQuestion;
  onUpdate: (id: string, updates: Partial<BuilderQuestion>) => void;
  targets: { id: string; label: string; type: string }[];
}) {
  const logic = question.conditionalLogic;
  const isYesNo = question.type === "yes-no";

  // For yes-no, we create virtual choices
  const choices = isYesNo
    ? [
        { id: "yes", label: "Sim" },
        { id: "no", label: "Não" },
      ]
    : question.choices;

  const toggleLogic = (enabled: boolean) => {
    onUpdate(question.id, {
      conditionalLogic: {
        ...logic,
        enabled,
        branches: enabled
          ? choices.map((c) => ({
              choiceId: c.id,
              goToQuestionId: "next",
            }))
          : [],
      },
    });
  };

  const updateBranch = (choiceId: string, goToQuestionId: string) => {
    const newBranches = logic.branches.map((b) =>
      b.choiceId === choiceId ? { ...b, goToQuestionId } : b
    );
    // If branch doesn't exist, add it
    if (!newBranches.find((b) => b.choiceId === choiceId)) {
      newBranches.push({ choiceId, goToQuestionId });
    }
    onUpdate(question.id, {
      conditionalLogic: { ...logic, branches: newBranches },
    });
  };

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs font-body text-foreground/80 flex items-center gap-2">
          <GitBranch size={12} className="text-neon-cyan" />
          Lógica condicional
        </Label>
        <Switch
          checked={logic.enabled}
          onCheckedChange={toggleLogic}
        />
      </div>

      {logic.enabled && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground/50 font-body mb-3">
            Defina para onde o formulário vai após cada resposta:
          </p>

          {/* Branch for each choice */}
          {choices.map((choice) => {
            const branch = logic.branches.find((b) => b.choiceId === choice.id);
            const currentTarget = branch?.goToQuestionId || "next";

            return (
              <div
                key={choice.id}
                className="rounded-lg border border-glass-border p-3 space-y-2"
                style={{ background: "oklch(0.13 0.015 260)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-body font-bold"
                    style={{
                      background: "oklch(0.65 0.2 250 / 0.12)",
                      color: "oklch(0.75 0.15 195)",
                    }}
                  >
                    {isYesNo ? (choice.id === "yes" ? "S" : "N") : String.fromCharCode(65 + choices.indexOf(choice))}
                  </div>
                  <span className="text-xs font-body text-foreground/80 flex-1 truncate">
                    {choice.label}
                  </span>
                  <ArrowRight size={11} className="text-muted-foreground/40 shrink-0" />
                </div>

                <select
                  value={currentTarget}
                  onChange={(e) => updateBranch(choice.id, e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-md text-[11px] font-body text-foreground border border-glass-border focus:outline-none focus:border-neon-cyan/40 transition-colors appearance-none"
                  style={{ background: "oklch(0.15 0.015 260)" }}
                >
                  <option value="next">Próxima pergunta (padrão)</option>
                  <option value="end">Ir para agradecimento</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          {/* Info box */}
          <div
            className="mt-3 p-3 rounded-lg border border-neon-cyan/10 text-[10px] font-body text-neon-cyan/60 leading-relaxed"
            style={{ background: "oklch(0.75 0.15 195 / 0.03)" }}
          >
            <GitBranch size={11} className="inline mr-1.5" />
            Quando ativada, cada opção pode direcionar o respondente para uma pergunta diferente, criando fluxos personalizados.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Field Group ───

function FieldGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-body font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
