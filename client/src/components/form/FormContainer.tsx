/**
 * FormFlow — Typeform/Respondi-style Form Container
 * Full-screen immersive experience with:
 * - Logo loading animation on start
 * - Logo fixed top-left
 * - Thin progress bar
 * - Vertical slide transitions with spring physics
 * - Navigation arrows (↑ back / ↓ next) on the RIGHT side
 * - Questions centered vertically on screen
 * - Auto-save partial responses to localStorage
 * - Resume from where user left off
 */

import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData } from "@/lib/formTypes";
import { useFormEngine } from "@/hooks/useFormEngine";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { QuestionRenderer } from "./QuestionRenderer";
import { ChevronUp, ChevronDown } from "lucide-react";

interface FormContainerProps {
  form: FormData;
}

/* Typeform-style vertical slide variants */
const slideVariants = {
  enter: (dir: "forward" | "backward") => ({
    y: dir === "forward" ? "60%" : "-60%",
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (dir: "forward" | "backward") => ({
    y: dir === "forward" ? "-60%" : "60%",
    opacity: 0,
  }),
};

/* ─── LocalStorage helpers ─── */
const STORAGE_PREFIX = "formflow_partial_";

function getSavedResponses(formId: string): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${formId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.responses) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function saveResponses(formId: string, responses: Map<string, { questionId: string; value: unknown }>, currentIndex: number) {
  try {
    const obj: Record<string, unknown> = {};
    responses.forEach((v, k) => { obj[k] = v.value; });
    localStorage.setItem(`${STORAGE_PREFIX}${formId}`, JSON.stringify({
      responses: obj,
      currentIndex,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Storage full or unavailable
  }
}

function clearSavedResponses(formId: string) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${formId}`);
  } catch {
    // Ignore
  }
}

export function FormContainer({ form }: FormContainerProps) {
  const engine = useFormEngine(form);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [shakeKey, setShakeKey] = useState(0);
  const [showLoading, setShowLoading] = useState(true);
  const [hasRestoredFromSave, setHasRestoredFromSave] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const d = form.design;
  const bgColor = d?.backgroundColor || "#FFFFFF";
  const questionColor = d?.questionColor || "#1E293B";
  const buttonColor = d?.buttonColor || "#3B82F6";
  const buttonTextColor = d?.buttonTextColor || "#FFFFFF";
  const fontFamily = d?.fontFamily || "Plus Jakarta Sans, sans-serif";
  const logoUrl = d?.logoUrl;

  // Determine if background is light or dark for adaptive text colors
  const isLightBg = useMemo(() => {
    const c = bgColor.replace("#", "");
    if (c.length < 6) return true;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
  }, [bgColor]);

  // Adaptive colors
  const textColor = isLightBg ? questionColor : "#FFFFFF";
  const subtextColor = isLightBg ? `${questionColor}99` : "rgba(255,255,255,0.6)";
  const progressBg = isLightBg ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)";
  const arrowBg = isLightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)";
  const arrowHoverBg = isLightBg ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)";
  const arrowColor = isLightBg ? questionColor : "#FFFFFF";

  // ─── Restore saved responses on mount ───
  useEffect(() => {
    if (hasRestoredFromSave) return;
    const saved = getSavedResponses(form.id);
    if (saved && typeof saved === "object") {
      const { responses: savedResps, currentIndex: savedIdx } = saved as {
        responses: Record<string, unknown>;
        currentIndex: number;
      };
      if (savedResps && typeof savedResps === "object") {
        Object.entries(savedResps).forEach(([qId, value]) => {
          if (value !== null && value !== undefined && value !== "") {
            engine.setResponse(qId, value as string | number | boolean | string[] | Record<string, string> | null);
          }
        });
      }
      if (typeof savedIdx === "number" && savedIdx > 0 && savedIdx < form.questions.length) {
        engine.goToIndex(savedIdx);
      }
    }
    setHasRestoredFromSave(true);
  }, [form.id, form.questions.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-save responses on every change ───
  useEffect(() => {
    if (!hasRestoredFromSave) return;
    if (engine.isThankYou) {
      clearSavedResponses(form.id);
      return;
    }
    saveResponses(form.id, engine.responses, engine.currentIndex);
  }, [engine.responses, engine.currentIndex, engine.isThankYou, form.id, hasRestoredFromSave]);

  // Scroll to top when question changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [engine.currentQuestion.id]);

  // Loading animation — show logo for 1.5s then fade out
  useEffect(() => {
    if (!logoUrl) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(false), 1800);
    return () => clearTimeout(timer);
  }, [logoUrl]);

  const questionNumber = useMemo(() => {
    const actual = form.questions.filter(
      (q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"
    );
    const idx = actual.findIndex((q) => q.id === engine.currentQuestion.id);
    return idx + 1;
  }, [form.questions, engine.currentQuestion]);

  const totalActualQuestions = useMemo(
    () =>
      form.questions.filter(
        (q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"
      ).length,
    [form.questions]
  );

  const handleNext = useCallback(() => {
    const validation = engine.validateCurrent();
    if (!validation.valid) {
      setValidationError(validation.message);
      setShakeKey((k) => k + 1);
      return;
    }
    setValidationError(undefined);
    engine.goNext();
  }, [engine]);

  const handleAutoAdvance = useCallback((value?: unknown) => {
    setValidationError(undefined);
    if (value !== undefined) {
      engine.goNextWithValue(value as any);
    } else {
      engine.goNext();
    }
  }, [engine]);

  const handlePrev = useCallback(() => {
    setValidationError(undefined);
    engine.goPrev();
  }, [engine]);

  useKeyboardNavigation({
    onNext: handleNext,
    onPrev: handlePrev,
    canGoNext: engine.canGoNext,
    isFirst: engine.isFirst,
    isThankYou: engine.isThankYou,
  });

  const isSpecialScreen = engine.isWelcome || engine.isThankYou;
  const showNav = !engine.isWelcome && !engine.isThankYou;
  const showBackButton = showNav && !engine.isFirst;
  const progress = engine.progress;

  // ─── Loading Screen with Logo + Progress Bar ───
  if (showLoading && logoUrl) {
    return (
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: bgColor, fontFamily }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-8"
        >
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-32 object-contain"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.div
            className="w-56 h-1 rounded-full overflow-hidden"
            style={{ backgroundColor: isLightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: isLightBg ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden flex flex-col"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        color: textColor,
        height: "100%",
      }}
    >
      {/* Background image if set */}
      {d?.backgroundImage && (
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `url(${d.backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* ─── Fixed Logo (top-left) ─── */}
      {logoUrl && !isSpecialScreen && (
        <motion.div
          className="absolute top-4 left-4 sm:top-6 sm:left-8 z-30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 lg:h-28 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      )}

      {/* ─── Thin Progress Bar (very top) ─── */}
      {showNav && (
        <div
          className="absolute top-0 left-0 right-0 z-40 h-[3px]"
          style={{ backgroundColor: progressBg }}
        >
          <motion.div
            className="h-full origin-left"
            style={{
              backgroundColor: isLightBg ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      {/* ─── Navigation Arrows (RIGHT SIDE, vertically centered) ─── */}
      {showNav && (
        <motion.div
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Up arrow = go back (previous question) */}
          <motion.button
            onClick={handlePrev}
            disabled={engine.isFirst}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              backgroundColor: arrowBg,
              color: arrowColor,
            }}
            whileHover={!engine.isFirst ? { backgroundColor: arrowHoverBg, scale: 1.1 } : {}}
            whileTap={!engine.isFirst ? { scale: 0.9 } : {}}
          >
            <ChevronUp size={22} />
          </motion.button>

          {/* Down arrow = go next (next question) */}
          <motion.button
            onClick={handleNext}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
            style={{
              backgroundColor: arrowBg,
              color: arrowColor,
            }}
            whileHover={{ backgroundColor: arrowHoverBg, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronDown size={22} />
          </motion.button>
        </motion.div>
      )}

      {/* ─── Question Area — CENTERED VERTICALLY ─── */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        <AnimatePresence mode="wait" custom={engine.direction}>
          <motion.div
            key={engine.currentQuestion.id}
            custom={engine.direction}
            variants={isSpecialScreen ? undefined : slideVariants}
            initial={isSpecialScreen ? { opacity: 0 } : "enter"}
            animate={isSpecialScreen ? { opacity: 1 } : "center"}
            exit={isSpecialScreen ? { opacity: 0 } : "exit"}
            transition={
              isSpecialScreen
                ? { duration: 0.3 }
                : {
                    y: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }
            }
            className="absolute inset-0"
          >
            {isSpecialScreen ? (
              /* Welcome / Thank You — full screen, no scroll needed */
              <div className="w-full h-full">
                <QuestionRenderer
                  question={engine.currentQuestion}
                  questionNumber={questionNumber}
                  value={engine.getResponse(engine.currentQuestion.id)}
                  onChange={(value) =>
                    engine.setResponse(engine.currentQuestion.id, value)
                  }
                  onNext={handleNext}
                  onAutoAdvance={handleAutoAdvance}
                  validationError={validationError}
                  design={form.design}
                />
              </div>
            ) : (
              /* Regular questions — scrollable, vertically centered */
              <div
                ref={scrollRef}
                className="w-full h-full overflow-y-auto"
                style={{
                  paddingTop: "2rem",
                  paddingBottom: "4rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="flex-1" />
                <motion.div
                  key={`shake-${shakeKey}`}
                  className="max-w-2xl mx-auto px-5 pr-16 w-full"
                  animate={
                    shakeKey > 0
                      ? {
                          x: [0, -8, 8, -6, 6, -3, 3, 0],
                        }
                      : {}
                  }
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                >
                  <div className="w-full">
                    <QuestionRenderer
                      question={engine.currentQuestion}
                      questionNumber={questionNumber}
                      value={engine.getResponse(engine.currentQuestion.id)}
                      onChange={(value) =>
                        engine.setResponse(engine.currentQuestion.id, value)
                      }
                      onNext={handleNext}
                      onAutoAdvance={handleAutoAdvance}
                      validationError={validationError}
                      design={form.design}
                    />
                    {/* Validation error banner */}
                    <AnimatePresence>
                      {validationError && (
                        <motion.div
                          className="mt-4 px-4 py-3 rounded-lg flex items-center gap-2 text-sm font-medium"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.15)",
                            color: "#fca5a5",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 4.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="8" cy="11.5" r="0.75" fill="currentColor"/>
                          </svg>
                          {validationError}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
                <div className="flex-1" />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── Bottom Bar: OK button + question counter ─── */}
      {showNav && (
        <div
          className="shrink-0 z-30"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
          }}
        >
          <motion.div
            className="px-4 pb-3 pt-2"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="max-w-2xl mx-auto flex items-center gap-2">
              {/* Back button — appears with split animation after first question */}
              <AnimatePresence>
                {showBackButton && (
                  <motion.button
                    onClick={handlePrev}
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 48, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="shrink-0 h-11 rounded-xl flex items-center justify-center overflow-hidden"
                    style={{
                      backgroundColor: buttonColor,
                      color: buttonTextColor,
                    }}
                  >
                    <ChevronUp size={20} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* OK / Continue button — full width */}
              <motion.button
                onClick={handleNext}
                disabled={!engine.canGoNext}
                layout
                className="flex-1 h-11 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: buttonColor,
                  color: buttonTextColor,
                }}
                whileHover={{ filter: "brightness(1.1)" }}
                whileTap={{ scale: 0.98 }}
              >
                OK
              </motion.button>
            </div>

            {/* Question counter below buttons */}
            <div className="max-w-2xl mx-auto mt-2 flex items-center justify-center gap-1.5 text-xs" style={{ color: subtextColor }}>
              <span className="font-bold" style={{ color: buttonColor }}>{questionNumber}</span>
              <span className="opacity-60">/</span>
              <span className="opacity-60">{totalActualQuestions}</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
