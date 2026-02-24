/**
 * FormFlow — Typeform-style Form Container
 * Full-screen immersive experience with logo top-left, thin progress bar,
 * vertical slide transitions, and design customization from builder.
 * Mobile-responsive.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FormData } from "@/lib/formTypes";
import { useFormEngine } from "@/hooks/useFormEngine";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { QuestionRenderer } from "./QuestionRenderer";
import { ArrowUp, ArrowDown, Check } from "lucide-react";

interface FormContainerProps {
  form: FormData;
}

/* Typeform-style vertical slide variants */
const slideVariants = {
  enter: (dir: "forward" | "backward") => ({
    y: dir === "forward" ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    y: 0,
    opacity: 1,
  },
  exit: (dir: "forward" | "backward") => ({
    y: dir === "forward" ? "-100%" : "100%",
    opacity: 0,
  }),
};

export function FormContainer({ form }: FormContainerProps) {
  const engine = useFormEngine(form);
  const [validationError, setValidationError] = useState<string | undefined>();

  const d = form.design;
  const bgColor = d?.backgroundColor || "#FFFFFF";
  const questionColor = d?.questionColor || "#1E293B";
  const answerColor = d?.answerColor || "#3B82F6";
  const buttonColor = d?.buttonColor || "#3B82F6";
  const fontFamily = d?.fontFamily || "Plus Jakarta Sans, sans-serif";
  const logoUrl = d?.logoUrl;

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

  const isSpecialScreen = engine.isWelcome || engine.isThankYou;
  const showNav = !engine.isWelcome && !engine.isThankYou;
  const progress = engine.progress;

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        color: questionColor,
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

      {/* ─── Fixed Logo (top-left, always visible like Typeform) ─── */}
      {logoUrl && (
        <motion.div
          className="fixed top-4 left-4 sm:top-6 sm:left-6 z-30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-7 sm:h-9 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      )}

      {/* ─── Thin Progress Bar (very top, Typeform-style) ─── */}
      {showNav && (
        <div className="fixed top-0 left-0 right-0 z-40 h-[3px] bg-black/5">
          <motion.div
            className="h-full origin-left"
            style={{ backgroundColor: buttonColor }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      {/* ─── Question Area with Typeform vertical slide ─── */}
      <AnimatePresence mode="wait" custom={engine.direction}>
        <motion.div
          key={engine.currentQuestion.id}
          custom={engine.direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            y: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className={`w-full ${isSpecialScreen ? "" : "max-w-2xl mx-auto px-5 sm:px-8"}`}>
            <QuestionRenderer
              question={engine.currentQuestion}
              questionNumber={questionNumber}
              value={engine.getResponse(engine.currentQuestion.id)}
              onChange={(value) =>
                engine.setResponse(engine.currentQuestion.id, value)
              }
              onNext={handleNext}
              validationError={validationError}
              design={form.design}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ─── Navigation Controls (bottom-right, Typeform-style) ─── */}
      {showNav && (
        <motion.div
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-30 flex flex-col gap-1.5"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Next / Submit */}
          <motion.button
            onClick={handleNext}
            disabled={!engine.canGoNext}
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: engine.canGoNext ? buttonColor : "#94A3B8",
              fontFamily,
            }}
            whileHover={engine.canGoNext ? { scale: 1.05 } : {}}
            whileTap={engine.canGoNext ? { scale: 0.95 } : {}}
          >
            {isBeforeThankYou ? (
              <>
                Enviar <Check size={15} />
              </>
            ) : (
              <>
                OK <ArrowDown size={14} />
              </>
            )}
          </motion.button>

          {/* Prev */}
          <AnimatePresence>
            {!engine.isFirst && (
              <motion.button
                onClick={handlePrev}
                className="flex items-center justify-center rounded-lg p-2.5 bg-white/80 backdrop-blur border border-black/10 text-gray-600 shadow-sm hover:bg-white transition-all"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileTap={{ scale: 0.9 }}
                title="Voltar"
              >
                <ArrowUp size={15} />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ─── Question counter (bottom-left) ─── */}
      {showNav && (
        <motion.div
          className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-30 flex items-center gap-1.5 text-xs sm:text-sm opacity-50"
          style={{ color: questionColor, fontFamily }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.5 }}
        >
          <span className="font-bold">{questionNumber}</span>
          <span>/</span>
          <span>{totalActualQuestions}</span>
        </motion.div>
      )}

      {/* ─── "Pressione Enter" hint (bottom-center, desktop only) ─── */}
      {showNav && (
        <motion.div
          className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 hidden sm:flex items-center gap-2 text-xs opacity-30"
          style={{ color: questionColor, fontFamily }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1 }}
        >
          Pressione <kbd className="px-1.5 py-0.5 rounded border border-current/20 text-[10px] font-mono">Enter ↵</kbd> para continuar
        </motion.div>
      )}
    </div>
  );
}
