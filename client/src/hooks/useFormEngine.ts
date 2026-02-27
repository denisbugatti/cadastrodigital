/**
 * FormFlow — Dark Futuristic Design
 * Core form engine hook: manages navigation, responses, validation,
 * and conditional branching logic.
 */

import { useCallback, useMemo, useState } from "react";
import type { FormData, FormResponse, Question } from "@/lib/formTypes";
import { validateCPF, validateCNPJ } from "@/lib/validators";

export type Direction = "forward" | "backward";

// Non-question types that don't count toward progress
const SCREEN_TYPES = new Set(["welcome", "thank-you", "statement"]);

interface UseFormEngineReturn {
  currentIndex: number;
  currentQuestion: Question;
  totalQuestions: number;
  answeredCount: number;
  progress: number;
  responses: Map<string, FormResponse>;
  direction: Direction;
  isFirst: boolean;
  isLast: boolean;
  isWelcome: boolean;
  isThankYou: boolean;
  isStatement: boolean;
  canGoNext: boolean;
  goNext: () => void;
  goNextWithValue: (value: FormResponse["value"]) => void;
  goPrev: () => void;
  goToIndex: (index: number) => void;
  setResponse: (questionId: string, value: FormResponse["value"]) => void;
  getResponse: (questionId: string) => FormResponse["value"] | undefined;
  validateCurrent: () => { valid: boolean; message?: string };
  visitedQuestionNumber: number;
}

export function useFormEngine(form: FormData): UseFormEngineReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, FormResponse>>(
    new Map()
  );
  const [direction, setDirection] = useState<Direction>("forward");
  // Track navigation history for back navigation with branching
  const [navHistory, setNavHistory] = useState<number[]>([0]);

  const questions = form.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const isWelcome = currentQuestion?.type === "welcome";
  const isThankYou = currentQuestion?.type === "thank-you";
  const isStatement = currentQuestion?.type === "statement";

  // Count only actual questions (not welcome/thank-you/statement)
  const actualQuestions = useMemo(
    () => questions.filter((q) => !SCREEN_TYPES.has(q.type)),
    [questions]
  );

  const answeredCount = useMemo(() => {
    let count = 0;
    for (const q of actualQuestions) {
      const r = responses.get(q.id);
      if (r && r.value !== null && r.value !== "" && r.value !== undefined) {
        count++;
      }
    }
    return count;
  }, [actualQuestions, responses]);

  const progress = useMemo(() => {
    if (actualQuestions.length === 0) return 0;
    if (isWelcome) return 0;
    if (isThankYou) return 100;
    const questionIndex = actualQuestions.findIndex(
      (q) => q.id === currentQuestion?.id
    );
    if (questionIndex === -1) return 0;
    return Math.round(((questionIndex + 1) / actualQuestions.length) * 100);
  }, [actualQuestions, currentQuestion, isWelcome, isThankYou]);

  const setResponse = useCallback(
    (questionId: string, value: FormResponse["value"]) => {
      setResponses((prev) => {
        const next = new Map(prev);
        next.set(questionId, { questionId, value });
        return next;
      });
    },
    []
  );

  const getResponse = useCallback(
    (questionId: string): FormResponse["value"] | undefined => {
      return responses.get(questionId)?.value;
    },
    [responses]
  );

  const validateCurrent = useCallback((): {
    valid: boolean;
    message?: string;
  } => {
    if (isWelcome || isThankYou || isStatement) return { valid: true };

    const q = currentQuestion;
    if (!q) return { valid: true };
    const r = responses.get(q.id);
    const value = r?.value;

    // Required check
    if (q.required) {
      if (value === null || value === undefined || value === "") {
        return { valid: false, message: "Este campo é obrigatório" };
      }
      if (Array.isArray(value) && value.length === 0) {
        return { valid: false, message: "Selecione pelo menos uma opção" };
      }
    }

    // CPF validation
    if (q.type === "cpf" && typeof value === "string" && value) {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length === 11 && !validateCPF(cleaned)) {
        return { valid: false, message: "CPF inválido. Verifique os números digitados." };
      }
      if (cleaned.length > 0 && cleaned.length < 11) {
        return { valid: false, message: "CPF incompleto. Digite todos os 11 dígitos." };
      }
    }

    // CNPJ validation
    if (q.type === "cnpj" && typeof value === "string" && value) {
      const cleaned = value.replace(/\D/g, "");
      if (cleaned.length === 14 && !validateCNPJ(cleaned)) {
        return { valid: false, message: "CNPJ inválido. Verifique os números digitados." };
      }
      if (cleaned.length > 0 && cleaned.length < 14) {
        return { valid: false, message: "CNPJ incompleto. Digite todos os 14 dígitos." };
      }
    }

    // Pattern validation (email, etc.)
    if (q.validation?.pattern && typeof value === "string" && value) {
      const regex = new RegExp(q.validation.pattern);
      if (!regex.test(value)) {
        return {
          valid: false,
          message: q.validation.message || "Formato inválido",
        };
      }
    }

    return { valid: true };
  }, [currentQuestion, responses, isWelcome, isThankYou, isStatement]);

  const canGoNext = useMemo(() => {
    if (isWelcome || isStatement) return true;
    if (isThankYou) return false;
    return validateCurrent().valid;
  }, [isWelcome, isThankYou, isStatement, validateCurrent]);

  /**
   * Determine the next question index based on conditional logic.
   * If the current question has conditional rules and the user's answer
   * matches a rule, jump to that question. Otherwise, go to next.
   */
  const getNextIndex = useCallback((): number => {
    const q = currentQuestion;
    if (!q || !q.conditionalLogic?.enabled) {
      return currentIndex + 1;
    }

    const response = responses.get(q.id);
    const value = response?.value;

    // Check branch rules first
    if (q.conditionalLogic?.rules && q.conditionalLogic.rules.length > 0 && value !== null && value !== undefined) {
      let matchedRule;

      if (typeof value === "string") {
        matchedRule = q.conditionalLogic.rules.find(
          (r) => r.choiceId === value
        );
      } else if (typeof value === "boolean") {
        const boolId = value ? "yes" : "no";
        matchedRule = q.conditionalLogic.rules.find(
          (r) => r.choiceId === boolId
        );
      }

      if (matchedRule && matchedRule.goToQuestionId !== "next") {
        const targetIdx = questions.findIndex(
          (q2) => q2.id === matchedRule.goToQuestionId
        );
        if (targetIdx !== -1) {
          return targetIdx;
        }
      }
    }

    // Check defaultGoTo (for non-choice questions like currency/text with skip logic)
    if (q.conditionalLogic?.defaultGoTo && q.conditionalLogic.defaultGoTo !== "next") {
      const targetIdx = questions.findIndex(
        (q2) => q2.id === q.conditionalLogic?.defaultGoTo
      );
      if (targetIdx !== -1) {
        return targetIdx;
      }
    }

    return currentIndex + 1;
  }, [currentQuestion, currentIndex, responses, questions]);

  const goNext = useCallback(() => {
    const nextIdx = getNextIndex();
    if (nextIdx < totalQuestions) {
      setDirection("forward");
      setCurrentIndex(nextIdx);
      setNavHistory((prev) => [...prev, nextIdx]);
    }
  }, [getNextIndex, totalQuestions]);

  /**
   * Go to next question using a freshly-selected value for conditional logic.
   * This is needed for auto-advance because React state hasn't updated yet
   * when the auto-advance timer fires.
   */
  const goNextWithValue = useCallback(
    (value: FormResponse["value"]) => {
      const q = currentQuestion;
      let nextIdx = currentIndex + 1;

      if (q?.conditionalLogic?.enabled) {
        // Check branch rules first
        if (q.conditionalLogic?.rules && q.conditionalLogic.rules.length > 0 && value !== null && value !== undefined) {
          let matchedRule;
          if (typeof value === "string") {
            matchedRule = q.conditionalLogic.rules.find((r) => r.choiceId === value);
          } else if (typeof value === "boolean") {
            const boolId = value ? "yes" : "no";
            matchedRule = q.conditionalLogic.rules.find((r) => r.choiceId === boolId);
          }
          if (matchedRule && matchedRule.goToQuestionId !== "next") {
            const targetIdx = questions.findIndex((q2) => q2.id === matchedRule.goToQuestionId);
            if (targetIdx !== -1) {
              nextIdx = targetIdx;
            }
          }
        }

        // Check defaultGoTo (for non-choice questions like currency/text with skip logic)
        if (nextIdx === currentIndex + 1 && q.conditionalLogic?.defaultGoTo && q.conditionalLogic.defaultGoTo !== "next") {
          const targetIdx = questions.findIndex((q2) => q2.id === q.conditionalLogic?.defaultGoTo);
          if (targetIdx !== -1) {
            nextIdx = targetIdx;
          }
        }
      }

      if (nextIdx < totalQuestions) {
        setDirection("forward");
        setCurrentIndex(nextIdx);
        setNavHistory((prev) => [...prev, nextIdx]);
      }
    },
    [currentQuestion, currentIndex, questions, totalQuestions]
  );

  const goPrev = useCallback(() => {
    // Use navigation history to go back correctly even with branching
    setNavHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = prev.slice(0, -1);
      const prevIndex = newHistory[newHistory.length - 1];
      setDirection("backward");
      setCurrentIndex(prevIndex);
      return newHistory;
    });
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setDirection(index > currentIndex ? "forward" : "backward");
        setCurrentIndex(index);
        setNavHistory((prev) => [...prev, index]);
      }
    },
    [currentIndex, totalQuestions]
  );

  // Compute a sequential question number based on navigation history
  // This counts only actual questions (not screens) visited so far
  const visitedQuestionNumber = useMemo(() => {
    // Count how many actual questions (non-screen types) are in the navHistory up to current
    let count = 0;
    for (const idx of navHistory) {
      const q = questions[idx];
      if (q && !SCREEN_TYPES.has(q.type)) {
        count++;
      }
      if (idx === currentIndex) break;
    }
    return count;
  }, [navHistory, currentIndex, questions]);

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    answeredCount,
    progress,
    responses,
    direction,
    isFirst,
    isLast,
    isWelcome,
    isThankYou,
    isStatement,
    canGoNext,
    goNext,
    goNextWithValue,
    goPrev,
    goToIndex,
    setResponse,
    getResponse,
    validateCurrent,
    visitedQuestionNumber,
  };
}
