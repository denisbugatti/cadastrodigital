/**
 * FormFlow Builder — State Management Hook
 * Manages the builder form state: questions, selection, reordering, conditional logic.
 * Supports both localStorage (for new/template forms) and database persistence (for existing forms).
 * New forms are auto-created in the database on first save.
 */

import { useState, useCallback, useEffect, useRef } from "react";
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
import { saveForm, saveFormWithVersion, loadForm, getVersionHistory, restoreVersion, deleteVersion, exportFormAsJSON, type FormVersion } from "@/lib/formStorage";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface UseBuilderOptions {
  dbFormId?: number;
}

export function useBuilder(initialForm?: BuilderForm, options?: UseBuilderOptions) {
  const initialDbFormId = options?.dbFormId;
  const [dbFormId, setDbFormId] = useState<number | undefined>(initialDbFormId);
  const [, navigate] = useLocation();

  // Try to load from localStorage first, then use initialForm, then create empty
  const [form, setForm] = useState<BuilderForm>(() => {
    if (initialForm) {
      // If we have a dbFormId, use the initialForm directly (loaded from DB)
      if (initialDbFormId) {
        return initialForm;
      }
      // Check if there's a saved version in localStorage
      const saved = loadForm(initialForm.id);
      if (saved) {
        return saved;
      }
      return initialForm;
    }
    return createEmptyForm();
  });

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    form.questions[0]?.id || null
  );

  // Track save status
  const [isSaved, setIsSaved] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const isCreatingRef = useRef(false);

  // tRPC mutations for database persistence
  const updateFormMutation = trpc.forms.update.useMutation();
  const createFormMutation = trpc.forms.create.useMutation();
  const createVersionMutation = trpc.versions.create.useMutation();

  // Save form to database (update existing or create new)
  const saveToDb = useCallback((formData: BuilderForm) => {
    if (dbFormId) {
      // Update existing form
      updateFormMutation.mutate({
        id: dbFormId,
        title: formData.title,
        description: formData.description,
        questions: formData.questions,
        design: formData.design,
        webhook: formData.webhook,
        sharing: formData.sharing,
        workspaceId: formData.workspaceId,
      }, {
        onSuccess: () => {
          setIsSaved(true);
          setLastSavedAt(new Date().toISOString());
        },
        onError: (err) => {
          console.error("Failed to save form to database:", err);
          // Fall back to localStorage
          saveForm(formData);
          setIsSaved(true);
          setLastSavedAt(new Date().toISOString());
        },
      });
    } else if (!isCreatingRef.current) {
      // Create new form in database
      isCreatingRef.current = true;
      createFormMutation.mutate({
        title: formData.title || "Novo Formulário",
        description: formData.description || "",
        questions: formData.questions,
        design: formData.design,
        webhook: formData.webhook,
        sharing: formData.sharing,
        workspaceId: formData.workspaceId,
        status: "draft",
      }, {
        onSuccess: (result) => {
          const newId = result.id;
          setDbFormId(newId);
          setIsSaved(true);
          setLastSavedAt(new Date().toISOString());
          isCreatingRef.current = false;
          // Navigate to the new form's editor URL
          navigate(`/editor/${newId}`, { replace: true });
        },
        onError: (err) => {
          console.error("Failed to create form in database:", err);
          isCreatingRef.current = false;
          // Fall back to localStorage
          saveForm(formData);
          setIsSaved(true);
          setLastSavedAt(new Date().toISOString());
        },
      });
    }
  }, [dbFormId, updateFormMutation, createFormMutation, navigate]);

  // Auto-save with debounce (800ms after last change)
  useEffect(() => {
    // Skip the initial mount to avoid marking as unsaved on load
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setIsSaved(false);

    saveTimeoutRef.current = setTimeout(() => {
      saveToDb(form);
    }, 800);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [form]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault();
        e.returnValue = "Você tem alterações não salvas. Deseja sair?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSaved]);

  // Manual save function
  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveToDb(form);
  }, [form, saveToDb]);

  // Save with version snapshot (manual checkpoint)
  const saveVersion = useCallback((label?: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (dbFormId) {
      // Save current form to DB first
      updateFormMutation.mutate({
        id: dbFormId,
        title: form.title,
        description: form.description,
        questions: form.questions,
        design: form.design,
        webhook: form.webhook,
        sharing: form.sharing,
        workspaceId: form.workspaceId,
      });

      // Create version in DB
      createVersionMutation.mutate({
        formId: dbFormId,
        label: label || `Versão — ${new Date().toLocaleString("pt-BR")}`,
        snapshot: {
          title: form.title,
          description: form.description,
          questions: form.questions,
          design: form.design,
          webhook: form.webhook,
          sharing: form.sharing,
        },
      });
    } else {
      saveFormWithVersion(form, label);
    }

    setIsSaved(true);
    setLastSavedAt(new Date().toISOString());
  }, [form, dbFormId, updateFormMutation, createVersionMutation]);

  // Get version history
  const getHistory = useCallback((): FormVersion[] => {
    if (!dbFormId) {
      return getVersionHistory(form.id);
    }
    return getVersionHistory(form.id);
  }, [form.id, dbFormId]);

  // Restore a version
  const restoreFromVersion = useCallback((versionId: string) => {
    const restored = restoreVersion(form.id, versionId);
    if (restored) {
      setForm(restored);
      setIsSaved(true);
      setLastSavedAt(new Date().toISOString());
    }
    return restored;
  }, [form.id]);

  // Delete a version
  const removeVersion = useCallback((versionId: string) => {
    deleteVersion(form.id, versionId);
  }, [form.id]);

  // Export form as JSON
  const exportForm = useCallback(() => {
    exportFormAsJSON(form);
  }, [form]);

  const selectedQuestion = form.questions.find((q) => q.id === selectedQuestionId) || null;

  // Add a new question at a specific position (before thank-you by default)
  const addQuestion = useCallback(
    (type: BuilderQuestionType) => {
      const newQ = createDefaultQuestion(type);
      setForm((prev) => {
        const questions = [...prev.questions];
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
        const defaultCL = { enabled: false, branches: [], defaultGoTo: "next" };
        const cleaned = questions.map((q) => ({
          ...q,
          conditionalLogic: {
            ...(q.conditionalLogic ?? defaultCL),
            branches: ((q.conditionalLogic ?? defaultCL).branches ?? []).filter(
              (b) => b.goToQuestionId !== questionId
            ),
            defaultGoTo:
              (q.conditionalLogic ?? defaultCL).defaultGoTo === questionId
                ? "next"
                : (q.conditionalLogic ?? defaultCL).defaultGoTo,
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
              ...(q.conditionalLogic ?? { enabled: false, branches: [], defaultGoTo: "next" }),
              branches: ((q.conditionalLogic?.branches) ?? []).filter(
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
        if (questions[oldIndex].type === "welcome" || questions[oldIndex].type === "thank-you") return prev;
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
    // Save state
    isSaved,
    lastSavedAt,
    saveNow,
    // Version history
    saveVersion,
    getHistory,
    restoreFromVersion,
    removeVersion,
    // Export
    exportForm,
    // Database info
    dbFormId,
  };
}
