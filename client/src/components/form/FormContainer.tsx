/**
 * FormFlow — Typeform/Respondi-style Form Container
 * Full-screen immersive experience with:
 * - Logo loading animation on start
 * - Logo fixed top-left
 * - Thin progress bar
 * - Vertical slide transitions
 * - Design customization from builder (colors, font, logo)
 * - Navigation arrows bottom-right (Respondi-style)
 * - Mobile-responsive
 */

import { useMemo, useState, useEffect, useCallback } from "react";
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

export function FormContainer({ form }: FormContainerProps) {
  const engine = useFormEngine(form);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [showLoading, setShowLoading] = useState(true);

  const d = form.design;
  const bgColor = d?.backgroundColor || "#FFFFFF";
  const questionColor = d?.questionColor || "#1E293B";
  const answerColor = d?.answerColor || "#3B82F6";
  const buttonColor = d?.buttonColor || "#3B82F6";
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
  const navBtnBg = isLightBg ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.15)";
  const navBtnHoverBg = isLightBg ? "rgba(0,0,0,0.15)" : "rgba(255,255,255,0.25)";
  const navBtnColor = isLightBg ? questionColor : "#FFFFFF";
  const progressBg = isLightBg ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)";

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
      return;
    }
    setValidationError(undefined);
    engine.goNext();
  }, [engine]);

  // Auto-advance bypasses validation and uses the freshly-selected value
  // for conditional logic (React state hasn't updated yet)
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
  const progress = engine.progress;

  // ─── Loading Screen with Logo ───
  if (showLoading && logoUrl) {
    return (
      <div
        className="w-full h-screen flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: bgColor, fontFamily }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-6"
        >
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-16 sm:h-20 md:h-24 object-contain"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          {/* Subtle loading dots */}
          <motion.div
            className="flex gap-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: isLightBg ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)" }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        backgroundColor: bgColor,
        fontFamily,
        color: textColor,
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

      {/* ─── Fixed Logo (top-left, always visible like Typeform/Respondi) ─── */}
      {logoUrl && (
        <motion.div
          className="fixed top-4 left-5 sm:top-6 sm:left-8 z-30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 sm:h-10 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      )}

      {/* ─── Thin Progress Bar (very top, Typeform-style) ─── */}
      {showNav && (
        <div
          className="fixed top-0 left-0 right-0 z-40 h-[3px]"
          style={{ backgroundColor: progressBg }}
        >
          <motion.div
            className="h-full origin-left"
            style={{ backgroundColor: buttonColor }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress / 100 }}
            transition={{ type: "spring", stiffness: 200, damping: 30 }}
          />
        </div>
      )}

      {/* ─── Question Area with vertical slide ─── */}
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
              onAutoAdvance={handleAutoAdvance}
              validationError={validationError}
              design={form.design}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ─── Navigation Arrows (bottom-right, Respondi-style) ─── */}
      {showNav && (
        <motion.div
          className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-30 flex flex-col gap-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Up arrow (prev) */}
          <motion.button
            onClick={handlePrev}
            disabled={engine.isFirst}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-md transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              backgroundColor: navBtnBg,
              color: navBtnColor,
            }}
            whileHover={!engine.isFirst ? { backgroundColor: navBtnHoverBg } : {}}
            whileTap={!engine.isFirst ? { scale: 0.9 } : {}}
          >
            <ChevronUp size={18} />
          </motion.button>

          {/* Down arrow (next) */}
          <motion.button
            onClick={handleNext}
            disabled={!engine.canGoNext}
            className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-md transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              backgroundColor: navBtnBg,
              color: navBtnColor,
            }}
            whileHover={engine.canGoNext ? { backgroundColor: navBtnHoverBg } : {}}
            whileTap={engine.canGoNext ? { scale: 0.9 } : {}}
          >
            <ChevronDown size={18} />
          </motion.button>
        </motion.div>
      )}

      {/* ─── Question counter (bottom-left, subtle) ─── */}
      {showNav && (
        <motion.div
          className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-30 flex items-center gap-1.5 text-xs sm:text-sm"
          style={{ color: subtextColor, fontFamily }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="font-bold">{questionNumber}</span>
          <span>/</span>
          <span>{totalActualQuestions}</span>
        </motion.div>
      )}
    </div>
  );
}
