/**
 * FormFlow Builder — Config Panel (Light Theme)
 * Right panel for editing the selected question's properties.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Type, AlignLeft, ToggleLeft, Plus, Trash2, X,
  GitBranch, ArrowRight, Sparkles,
} from "lucide-react";
import type { BuilderQuestion, BuilderChoice } from "@/lib/builderTypes";
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
      <div className="w-80 h-full border-l border-border flex items-center justify-center bg-white">
        <div className="text-center px-8">
          <Settings size={36} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-base text-muted-foreground/60 font-body">
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
    <div className="w-80 h-full border-l border-border flex flex-col bg-white">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand" />
          <h3 className="font-display text-base font-bold text-foreground">
            Configurações
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          {typeInfo?.label || question.type}
        </p>

        {hasConditionalLogic && (
          <div className="flex gap-1 mt-4 p-1 rounded-xl bg-secondary">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                activeTab === "general"
                  ? "bg-white text-brand shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings size={14} />
              Geral
            </button>
            <button
              onClick={() => setActiveTab("logic")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                activeTab === "logic"
                  ? "bg-white text-brand shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <GitBranch size={14} />
              Lógica
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        <AnimatePresence mode="wait">
          {activeTab === "general" ? (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {/* Title */}
              <FieldGroup label="Título da pergunta" icon={<Type size={14} />}>
                <input
                  type="text"
                  value={question.title}
                  onChange={(e) => onUpdate(question.id, { title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  placeholder="Digite o título..."
                />
              </FieldGroup>

              {/* Subtitle */}
              <FieldGroup label="Subtítulo (opcional)" icon={<AlignLeft size={14} />}>
                <input
                  type="text"
                  value={question.subtitle}
                  onChange={(e) => onUpdate(question.id, { subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  placeholder="Texto auxiliar..."
                />
              </FieldGroup>

              {/* Placeholder */}
              {!isSpecial && question.type !== "yes-no" && question.type !== "rating" && question.type !== "satisfaction" && question.type !== "nps" && question.type !== "ranking" && question.type !== "matrix" && question.type !== "file-upload" && question.type !== "legal" && !hasChoices && (
                <FieldGroup label="Placeholder" icon={<Type size={14} />}>
                  <input
                    type="text"
                    value={question.placeholder}
                    onChange={(e) => onUpdate(question.id, { placeholder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                    placeholder="Texto do placeholder..."
                  />
                </FieldGroup>
              )}

              {/* Required toggle */}
              {!isSpecial && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary">
                  <Label className="text-sm font-body text-foreground flex items-center gap-2">
                    <ToggleLeft size={16} className="text-muted-foreground" />
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
                <FieldGroup label="Opções" icon={<Plus size={14} />}>
                  <div className="space-y-2">
                    {question.choices.map((choice, idx) => (
                      <div key={choice.id} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-5 text-center shrink-0 font-semibold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={choice.label}
                          onChange={(e) =>
                            onUpdateChoice(question.id, choice.id, { label: e.target.value })
                          }
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                          placeholder={`Opção ${idx + 1}`}
                        />
                        {question.choices.length > 2 && (
                          <button
                            onClick={() => onRemoveChoice(question.id, choice.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onAddChoice(question.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-body text-muted-foreground hover:text-brand hover:border-brand/30 hover:bg-brand-lighter/20 transition-all"
                    >
                      <Plus size={14} />
                      Adicionar opção
                    </button>
                  </div>
                </FieldGroup>
              )}

              {/* Rating config */}
              {(question.type === "rating" || question.type === "satisfaction") && (
                <FieldGroup label="Escala máxima" icon={<Type size={14} />}>
                  <div className="flex items-center gap-3">
                    {[3, 4, 5, 7, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => onUpdate(question.id, { maxRating: n })}
                        className={`w-10 h-10 rounded-xl text-sm font-body font-medium transition-all ${
                          question.maxRating === n
                            ? "bg-brand text-white shadow-sm"
                            : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-brand/30"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              )}

              {/* Ranking items */}
              {question.type === "ranking" && (
                <FieldGroup label="Itens para ordenar" icon={<Plus size={14} />}>
                  <div className="space-y-2">
                    {question.rankItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-5 text-center shrink-0 font-semibold">
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
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                        />
                        {question.rankItems.length > 2 && (
                          <button
                            onClick={() => {
                              const newItems = question.rankItems.filter((_, i) => i !== idx);
                              onUpdate(question.id, { rankItems: newItems });
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onUpdate(question.id, { rankItems: [...question.rankItems, `Item ${question.rankItems.length + 1}`] })}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-body text-muted-foreground hover:text-brand hover:border-brand/30 hover:bg-brand-lighter/20 transition-all"
                    >
                      <Plus size={14} />
                      Adicionar item
                    </button>
                  </div>
                </FieldGroup>
              )}

              {/* Legal text */}
              {question.type === "legal" && (
                <FieldGroup label="Texto dos termos" icon={<AlignLeft size={14} />}>
                  <textarea
                    value={question.legalText}
                    onChange={(e) => onUpdate(question.id, { legalText: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all resize-none h-28"
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
    if (!newBranches.find((b) => b.choiceId === choiceId)) {
      newBranches.push({ choiceId, goToQuestionId });
    }
    onUpdate(question.id, {
      conditionalLogic: { ...logic, branches: newBranches },
    });
  };

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary">
        <Label className="text-sm font-body text-foreground flex items-center gap-2">
          <GitBranch size={16} className="text-brand" />
          Lógica condicional
        </Label>
        <Switch
          checked={logic.enabled}
          onCheckedChange={toggleLogic}
        />
      </div>

      {logic.enabled && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-body">
            Defina para onde o formulário vai após cada resposta:
          </p>

          {choices.map((choice) => {
            const branch = logic.branches.find((b) => b.choiceId === choice.id);
            const currentTarget = branch?.goToQuestionId || "next";

            return (
              <div
                key={choice.id}
                className="rounded-xl border border-border p-4 space-y-3 bg-secondary/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-body font-bold bg-brand-lighter text-brand">
                    {isYesNo ? (choice.id === "yes" ? "S" : "N") : String.fromCharCode(65 + choices.indexOf(choice))}
                  </div>
                  <span className="text-sm font-body text-foreground flex-1 truncate font-medium">
                    {choice.label}
                  </span>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                </div>

                <select
                  value={currentTarget}
                  onChange={(e) => updateBranch(choice.id, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-white border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all appearance-none"
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
          <div className="mt-3 p-4 rounded-xl border border-brand/10 bg-brand-lighter/30 text-sm font-body text-brand-dark leading-relaxed">
            <GitBranch size={14} className="inline mr-2" />
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
    <div className="space-y-2.5">
      <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
