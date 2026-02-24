/**
 * FormFlow — Dark Futuristic Design
 * Main form container with immersive dark background, glassmorphism, and neon accents.
 */

import { useMemo, useState } from "react";
import { Link } from "wouter";
import type { FormData } from "@/lib/formTypes";
import { useFormEngine } from "@/hooks/useFormEngine";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { ProgressBar } from "./ProgressBar";
import { NavigationControls } from "./NavigationControls";
import { QuestionWrapper } from "./QuestionWrapper";
import { QuestionRenderer } from "./QuestionRenderer";

const GRADIENT_MESH_BG =
  "https://private-us-east-1.manuscdn.com/sessionFile/9gKZyi1fSHW6VtpfkkY9Qq/sandbox/SlwprPg2iIoikVq55GWO65-img-4_1771958373000_na1fn_ZGFyay1ncmFkaWVudC1tZXNo.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOWdLWnlpMWZTSFc2VnRwZmtrWTlRcS9zYW5kYm94L1Nsd3ByUGcyaUlvaWtWcTU1R1dPNjUtaW1nLTRfMTc3MTk1ODM3MzAwMF9uYTFmbl9aR0Z5YXkxbmNtRmthV1Z1ZEMxdFpYTm8ucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=hsY2gPp4BIWVB~I7dIfBehOkayYJaTanEPDZhyUjZ1cVTSc9l0jwn8bM4deeLlHESMhO1uR2bz4yR8OflvNJxsQo3dPhaPCYkvCzQYhpU6IF8ZSaXdJAdaX7wrz6glVMyeM9d403TDNQF~m5sQf-YlkKgkymdC1u0eueltRkLIfXwXEuJjvvUvPHPW7XfbFKUKxkCeSL9-MrSfI9DdfEiNQxTHC3mzF77qbXYXyPITZgc-j31EM4ojlhIWBPoXD~q7PiA-ePeaBEwbpiuYLCgrV8vdPmCJF~J6mw~YNNwl6WUMW~08aliLkXZgcDsUrGMK8McLKQG4OrquZPat9JPQ__";

interface FormContainerProps {
  form: FormData;
}

export function FormContainer({ form }: FormContainerProps) {
  const engine = useFormEngine(form);
  const [validationError, setValidationError] = useState<string | undefined>();

  const questionNumber = useMemo(() => {
    const actualQuestions = form.questions.filter(
      (q) => q.type !== "welcome" && q.type !== "thank-you"
    );
    const index = actualQuestions.findIndex(
      (q) => q.id === engine.currentQuestion.id
    );
    return index + 1;
  }, [form.questions, engine.currentQuestion]);

  const totalActualQuestions = useMemo(
    () =>
      form.questions.filter(
        (q) => q.type !== "welcome" && q.type !== "thank-you"
      ).length,
    [form.questions]
  );

  const isBeforeThankYou = useMemo(() => {
    const nextIndex = engine.currentIndex + 1;
    if (nextIndex < form.questions.length) {
      return form.questions[nextIndex].type === "thank-you";
    }
    return false;
  }, [engine.currentIndex, form.questions]);

  const handleNext = () => {
    const validation = engine.validateCurrent();
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }
    setValidationError(undefined);
    engine.goNext();
  };

  const handlePrev = () => {
    setValidationError(undefined);
    engine.goPrev();
  };

  useKeyboardNavigation({
    onNext: handleNext,
    onPrev: handlePrev,
    canGoNext: engine.canGoNext,
    isFirst: engine.isFirst,
    isThankYou: engine.isThankYou,
  });

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background image layer */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${GRADIENT_MESH_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.7,
        }}
      />

      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[600px] h-[600px] rounded-full animate-float"
          style={{
            top: "-10%",
            right: "-10%",
            background: "radial-gradient(circle, oklch(0.65 0.2 250 / 0.08), transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            bottom: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, oklch(0.55 0.2 290 / 0.06), transparent 70%)",
            filter: "blur(80px)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            top: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "radial-gradient(circle, oklch(0.75 0.15 195 / 0.05), transparent 70%)",
            filter: "blur(60px)",
            animation: "float 10s ease-in-out infinite",
          }}
        />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay fixed inset-0 pointer-events-none" />

      {/* Form header - Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 sm:px-8 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Neon logo icon */}
            <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center glow-blue animate-border-glow">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z"
                  stroke="oklch(0.65 0.2 250)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 7.5H12M6 10.5H9.5"
                  stroke="oklch(0.75 0.15 195)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <Link href="/" className="font-display text-lg font-semibold text-foreground/90 tracking-tight hover:text-foreground transition-colors">
              FormFlow
            </Link>
          </div>

          {/* Question counter */}
          {!engine.isWelcome && !engine.isThankYou && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-body text-neon-blue font-medium tracking-widest uppercase">
                {String(questionNumber).padStart(2, "0")}
              </span>
              <span className="text-xs text-muted-foreground">/</span>
              <span className="text-xs font-body text-muted-foreground tracking-widest">
                {String(totalActualQuestions).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Question area */}
      <QuestionWrapper
        questionId={engine.currentQuestion.id}
        direction={engine.direction}
      >
        <QuestionRenderer
          question={engine.currentQuestion}
          questionNumber={questionNumber}
          value={engine.getResponse(engine.currentQuestion.id)}
          onChange={(value) =>
            engine.setResponse(engine.currentQuestion.id, value)
          }
          onNext={handleNext}
          validationError={validationError}
        />
      </QuestionWrapper>

      {/* Navigation controls */}
      <NavigationControls
        onNext={handleNext}
        onPrev={handlePrev}
        canGoNext={engine.canGoNext}
        isFirst={engine.isFirst}
        isLast={engine.isLast}
        isWelcome={engine.isWelcome}
        isThankYou={engine.isThankYou}
        isBeforeThankYou={isBeforeThankYou}
      />

      {/* Progress bar */}
      <ProgressBar
        progress={engine.progress}
        answeredCount={engine.answeredCount}
        totalQuestions={totalActualQuestions}
      />
    </div>
  );
}
