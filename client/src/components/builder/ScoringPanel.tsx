/**
 * ScoringPanel — Centralized scoring configuration modal (Respondi-style)
 * Shows all choice-based questions with per-option score inputs.
 * Global toggle to enable/disable scoring for the entire form.
 * Expandable question rows with point range badges.
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Hash, ChevronDown, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  type BuilderQuestion,
  type BuilderChoice,
  questionTypes,
} from "@/lib/builderTypes";

interface ScoringPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: BuilderQuestion[];
  onUpdateQuestion: (id: string, updates: Partial<BuilderQuestion>) => void;
  onUpdateChoice: (questionId: string, choiceId: string, updates: Partial<BuilderChoice>) => void;
}

/** Get the choice-based question types that support per-option scoring */
const CHOICE_TYPES = new Set([
  "multiple-choice",
  "dropdown",
  "image-choice",
  "yes-no",
  "checkbox",
]);

/** Calculate the point range for a question */
function getPointRange(question: BuilderQuestion): { min: number; max: number } {
  if (!question.scoringEnabled) return { min: 0, max: 0 };

  const choices = question.type === "yes-no"
    ? [{ score: 0 }, { score: 0 }] // yes-no doesn't have stored choices with scores in the same way
    : (question.choices ?? []);

  if (choices.length === 0) return { min: 0, max: 0 };

  const scores = choices.map((c: any) => c.score ?? 0);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return { min, max };
}

/** Get display choices for a question (handles yes-no specially) */
function getDisplayChoices(question: BuilderQuestion): { id: string; label: string; score: number }[] {
  if (question.type === "yes-no") {
    // Yes-no questions don't have stored choices, we use the first two choices or create defaults
    const choices = question.choices ?? [];
    return [
      { id: choices[0]?.id ?? "yes", label: choices[0]?.label ?? "Sim", score: choices[0]?.score ?? 0 },
      { id: choices[1]?.id ?? "no", label: choices[1]?.label ?? "Não", score: choices[1]?.score ?? 0 },
    ];
  }
  return (question.choices ?? []).map((c) => ({
    id: c.id,
    label: c.label || "Opção sem título",
    score: c.score ?? 0,
  }));
}

export function ScoringPanel({
  open,
  onOpenChange,
  questions,
  onUpdateQuestion,
  onUpdateChoice,
}: ScoringPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter to only choice-based questions (excluding welcome, thank-you, statement)
  const choiceQuestions = useMemo(
    () =>
      questions.filter(
        (q) =>
          CHOICE_TYPES.has(q.type) &&
          q.type !== "welcome" &&
          q.type !== "thank-you" &&
          q.type !== "statement"
      ),
    [questions]
  );

  // Check if ANY question has scoring enabled (for the global toggle)
  const anyScoring = useMemo(
    () => choiceQuestions.some((q) => q.scoringEnabled),
    [choiceQuestions]
  );

  // Toggle scoring for ALL choice questions at once
  const toggleGlobalScoring = useCallback(
    (enabled: boolean) => {
      choiceQuestions.forEach((q) => {
        onUpdateQuestion(q.id, { scoringEnabled: enabled });
      });
    },
    [choiceQuestions, onUpdateQuestion]
  );

  // Toggle expand/collapse for a question
  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  // Update a choice's score
  const handleScoreChange = useCallback(
    (questionId: string, choiceId: string, score: number) => {
      onUpdateChoice(questionId, choiceId, { score });
    },
    [onUpdateChoice]
  );

  // Build question numbers (same logic as sidebar)
  const questionNumbers = useMemo(() => {
    const nums = new Map<string, number>();
    let num = 0;
    questions.forEach((q) => {
      if (
        q.type !== "welcome" &&
        q.type !== "thank-you" &&
        q.type !== "statement" &&
        q.type !== "legal"
      ) {
        num++;
        nums.set(q.id, num);
      }
    });
    return nums;
  }, [questions]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Hash size={20} className="text-amber-600" />
            Pontuação
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Global toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-amber-50/60 border border-amber-200/50">
            <div>
              <p className="text-sm font-medium text-foreground">
                Habilitar pontuação
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Atribua uma pontuação para cada resposta enviada.
              </p>
            </div>
            <Switch
              checked={anyScoring}
              onCheckedChange={toggleGlobalScoring}
            />
          </div>

          {/* No choice questions message */}
          {choiceQuestions.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhuma pergunta de múltipla escolha encontrada.
              <br />
              Adicione perguntas com opções para configurar pontuação.
            </div>
          )}

          {/* Question list */}
          <div className="space-y-1">
            {choiceQuestions.map((question) => {
              const isExpanded = expandedId === question.id;
              const displayChoices = getDisplayChoices(question);
              const range = getPointRange(question);
              const qNum = questionNumbers.get(question.id);
              const typeInfo = questionTypes.find(
                (t) => t.type === question.type
              );

              return (
                <div
                  key={question.id}
                  className="rounded-xl border border-border overflow-hidden transition-all"
                >
                  {/* Question header row */}
                  <button
                    onClick={() => toggleExpand(question.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
                  >
                    {/* Expand icon */}
                    <div className="shrink-0 text-muted-foreground/50">
                      {isExpanded ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>

                    {/* Question title */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">
                        {qNum != null && (
                          <span className="text-muted-foreground mr-1.5">
                            {qNum}.
                          </span>
                        )}
                        {question.title || "Sem título"}
                      </span>
                      {typeInfo && (
                        <span className="text-[11px] text-muted-foreground/60">
                          {typeInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Point range badge */}
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-md whitespace-nowrap">
                      {question.scoringEnabled
                        ? `${range.min} → ${range.max} PONTOS`
                        : "0 → 0 PONTOS"}
                    </span>
                  </button>

                  {/* Expanded choices */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-1 border-t border-border/50">
                          {/* Per-question scoring toggle */}
                          <div className="flex items-center justify-between py-2 mb-2">
                            <span className="text-xs text-muted-foreground">
                              Pontuação ativa
                            </span>
                            <Switch
                              checked={question.scoringEnabled}
                              onCheckedChange={(checked) =>
                                onUpdateQuestion(question.id, {
                                  scoringEnabled: checked,
                                })
                              }
                            />
                          </div>

                          {/* Choice scores */}
                          <div className="space-y-2">
                            {displayChoices.map((choice) => (
                              <div
                                key={choice.id}
                                className="flex items-center gap-3"
                              >
                                <span className="flex-1 text-sm text-foreground/80 truncate">
                                  {choice.label}
                                </span>
                                <input
                                  type="number"
                                  value={choice.score}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      question.id,
                                      choice.id,
                                      Number(e.target.value) || 0
                                    )
                                  }
                                  disabled={!question.scoringEnabled}
                                  className="w-16 px-2 py-1.5 rounded-lg text-sm text-center font-medium bg-white border border-border focus:outline-none focus:ring-2 focus:ring-amber-300/30 focus:border-amber-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                  placeholder="0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full bg-brand hover:bg-brand-dark text-white"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
