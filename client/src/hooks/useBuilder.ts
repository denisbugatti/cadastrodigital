/**
 * FormFlow Builder — State Management Hook
 * Manages the builder form state: questions, selection, reordering, conditional logic.
 */

import { useState, useCallback } from "react";
import {
  type BuilderForm,
  type BuilderQuestion,
  type BuilderQuestionType,
  type BuilderChoice,
  type FormDesignSettings,
  type WebhookSettings,
  type SharingSettings,
  createDefaultQuestion,
  createEmptyForm,
} from "@/lib/builderTypes";

export function useBuilder(initialForm?: BuilderForm) {
  const [form, setForm] = useState<BuilderForm>(initialForm || createEmptyForm());
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    form.questions[0]?.id || null
  );

  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId) || null;

  // Add a new question at a specific position (before thank-you by default)
  const addQuestion = useCallback(
    (type: BuilderQuestionType) => {
      const newQ = createDefaultQuestion(type);
      setForm((prev) => {
        const questions = [...prev.questions];
        // Insert before the last question if it's thank-you
        const lastQ = questions[questions.length - 1];
        const insertIndex =
          lastQ?.type === "thank-you" ? questions.length - 1 : questions.length;
        questions.splice(insertIndex, 0, newQ);
        return { ...prev, questions, updatedAt: new Date().toISOString() };
      });
      setSelectedQuestionId(newQ.id);
    },
    []
  );

  // Remove a question
  const removeQuestion = useCallback(
    (questionId: string) => {
      setForm((prev) => {
        const questions = prev.questions.filter((q) => q.id !== questionId);
        // Also clean up conditional logic references
        const cleaned = questions.map((q) => ({
          ...q,
          conditionalLogic: {
            ...q.conditionalLogic,
            branches: q.conditionalLogic.branches.filter(
              (b) => b.goToQuestionId !== questionId
            ),
            defaultGoTo:
              q.conditionalLogic.defaultGoTo === questionId
                ? "next"
                : q.conditionalLogic.defaultGoTo,
          },
        }));
        return { ...prev, questions: cleaned, updatedAt: new Date().toISOString() };
      });
      setSelectedQuestionId((prev) => {
        if (prev === questionId) {
          const idx = form.questions.findIndex((q) => q.id === questionId);
          const next = form.questions[idx + 1] || form.questions[idx - 1];
          return next?.id || null;
        }
        return prev;
      });
    },
    [form.questions]
  );

  // Duplicate a question
  const duplicateQuestion = useCallback(
    (questionId: string) => {
      setForm((prev) => {
        const idx = prev.questions.findIndex((q) => q.id === questionId);
        if (idx === -1) return prev;
        const original = prev.questions[idx];
        const duplicate: BuilderQuestion = {
          ...JSON.parse(JSON.stringify(original)),
          id: `q_${Date.now()}_dup`,
          title: `${original.title} (cópia)`,
          conditionalLogic: { enabled: false, branches: [], defaultGoTo: "next" },
        };
        const questions = [...prev.questions];
        questions.splice(idx + 1, 0, duplicate);
        return { ...prev, questions, updatedAt: new Date().toISOString() };
      });
    },
    []
  );

  // Move question up/down
  const moveQuestion = useCallback(
    (questionId: string, direction: "up" | "down") => {
      setForm((prev) => {
        const questions = [...prev.questions];
        const idx = questions.findIndex((q) => q.id === questionId);
        if (idx === -1) return prev;

        const targetIdx = direction === "up" ? idx - 1 : idx + 1;
        // Don't move welcome (first) or thank-you (last) out of position
        if (targetIdx < 0 || targetIdx >= questions.length) return prev;
        if (questions[idx].type === "welcome" || questions[idx].type === "thank-you")
          return prev;
        if (questions[targetIdx].type === "welcome" || questions[targetIdx].type === "thank-you")
          return prev;

        [questions[idx], questions[targetIdx]] = [questions[targetIdx], questions[idx]];
        return { ...prev, questions, updatedAt: new Date().toISOString() };
      });
    },
    []
  );

  // Update a question's properties
  const updateQuestion = useCallback(
    (questionId: string, updates: Partial<BuilderQuestion>) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Update form metadata
  const updateFormMeta = useCallback(
    (updates: Partial<Pick<BuilderForm, "title" | "description" | "workspaceId">>) => {
      setForm((prev) => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    },
    []
  );

  // Update design settings
  const updateDesign = useCallback(
    (updates: Partial<FormDesignSettings>) => {
      setForm((prev) => ({
        ...prev,
        design: { ...prev.design, ...updates },
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Update webhook settings
  const updateWebhook = useCallback(
    (updates: Partial<WebhookSettings>) => {
      setForm((prev) => ({
        ...prev,
        webhook: { ...prev.webhook, ...updates },
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Update sharing settings
  const updateSharing = useCallback(
    (updates: Partial<SharingSettings>) => {
      setForm((prev) => ({
        ...prev,
        sharing: { ...prev.sharing, ...updates },
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Choice management
  const addChoice = useCallback(
    (questionId: string) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id !== questionId) return q;
          const newChoice: BuilderChoice = {
            id: `c_${Date.now()}_${q.choices.length + 1}`,
            label: `Opção ${q.choices.length + 1}`,
          };
          return { ...q, choices: [...q.choices, newChoice] };
        }),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  const updateChoice = useCallback(
    (questionId: string, choiceId: string, updates: Partial<BuilderChoice>) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            choices: q.choices.map((c) =>
              c.id === choiceId ? { ...c, ...updates } : c
            ),
          };
        }),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  const removeChoice = useCallback(
    (questionId: string, choiceId: string) => {
      setForm((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id !== questionId) return q;
          return {
            ...q,
            choices: q.choices.filter((c) => c.id !== choiceId),
            conditionalLogic: {
              ...q.conditionalLogic,
              branches: q.conditionalLogic.branches.filter(
                (b) => b.choiceId !== choiceId
              ),
            },
          };
        }),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  // Reorder questions (for drag and drop)
  const reorderQuestions = useCallback(
    (activeId: string, overId: string) => {
      setForm((prev) => {
        const questions = [...prev.questions];
        const oldIndex = questions.findIndex((q) => q.id === activeId);
        const newIndex = questions.findIndex((q) => q.id === overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        // Don't allow moving welcome or thank-you
        if (questions[oldIndex].type === "welcome" || questions[oldIndex].type === "thank-you") return prev;
        // Don't allow placing before welcome or after thank-you
        if (questions[newIndex].type === "welcome" && newIndex === 0) return prev;
        const [removed] = questions.splice(oldIndex, 1);
        questions.splice(newIndex, 0, removed);
        return { ...prev, questions, updatedAt: new Date().toISOString() };
      });
    },
    []
  );

  // Get non-special questions for conditional logic targets
  const getConditionalTargets = useCallback(
    (currentQuestionId: string) => {
      return form.questions
        .filter(
          (q) =>
            q.id !== currentQuestionId &&
            q.type !== "welcome"
        )
        .map((q) => ({
          id: q.id,
          label: q.title || `Pergunta sem título`,
          type: q.type,
        }));
    },
    [form.questions]
  );

  return {
    form,
    selectedQuestion,
    selectedQuestionId,
    setSelectedQuestionId,
    addQuestion,
    removeQuestion,
    duplicateQuestion,
    reorderQuestions,
    moveQuestion,
    updateQuestion,
    updateFormMeta,
    updateDesign,
    updateWebhook,
    updateSharing,
    addChoice,
    updateChoice,
    removeChoice,
    getConditionalTargets,
  };
}
