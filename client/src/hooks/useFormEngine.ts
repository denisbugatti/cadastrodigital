/**
 * FormFlow — Organic Flow Design
 * Core form engine hook: manages navigation, responses, and validation.
 */

import { useCallback, useMemo, useState } from "react";
import type { FormData, FormResponse, Question } from "@/lib/formTypes";

export type Direction = "forward" | "backward";

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
  canGoNext: boolean;
  goNext: () => void;
  goPrev: () => void;
  goToIndex: (index: number) => void;
  setResponse: (questionId: string, value: FormResponse["value"]) => void;
  getResponse: (questionId: string) => FormResponse["value"] | undefined;
  validateCurrent: () => { valid: boolean; message?: string };
}

export function useFormEngine(form: FormData): UseFormEngineReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Map<string, FormResponse>>(
    new Map()
  );
  const [direction, setDirection] = useState<Direction>("forward");

  const questions = form.questions;
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const isWelcome = currentQuestion.type === "welcome";
  const isThankYou = currentQuestion.type === "thank-you";

  // Count only actual questions (not welcome/thank-you)
  const actualQuestions = useMemo(
    () => questions.filter((q) => q.type !== "welcome" && q.type !== "thank-you"),
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
    // Welcome = 0%, Thank you = 100%
    if (isWelcome) return 0;
    if (isThankYou) return 100;
    const questionIndex = actualQuestions.findIndex(
      (q) => q.id === currentQuestion.id
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
    if (isWelcome || isThankYou) return { valid: true };

    const q = currentQuestion;
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
  }, [currentQuestion, responses, isWelcome, isThankYou]);

  const canGoNext = useMemo(() => {
    if (isWelcome) return true;
    if (isThankYou) return false;
    return validateCurrent().valid;
  }, [isWelcome, isThankYou, validateCurrent]);

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setDirection("forward");
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection("backward");
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setDirection(index > currentIndex ? "forward" : "backward");
        setCurrentIndex(index);
      }
    },
    [currentIndex, totalQuestions]
  );

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
    canGoNext,
    goNext,
    goPrev,
    goToIndex,
    setResponse,
    getResponse,
    validateCurrent,
  };
}
