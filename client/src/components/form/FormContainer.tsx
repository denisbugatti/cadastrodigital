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
import { trpc } from "@/lib/trpc";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { QuestionRenderer } from "./QuestionRenderer";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BackgroundShaders } from "@/components/ui/background-shaders";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { BeamsBackground } from "@/components/ui/beams-background";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { GradientDots } from "@/components/ui/gradient-dots";
import { SpotlightBackground } from "@/components/ui/spotlight-background";
import { ShaderPlasma } from "@/components/ui/shader-plasma";
import { StarsBackground } from "@/components/ui/stars-background";
import { AuroraBeams } from "@/components/ui/aurora-beams";
import { FlowField } from "@/components/ui/flow-field";
import { ChevronUp, ChevronDown } from "lucide-react";
import { TrackingScripts, fireTrackingConversion } from "./TrackingScripts";
import { getButtonStyleClasses } from "@/hooks/useInputStyle";
import type { InputStyleType } from "@/hooks/useInputStyle";

interface FormContainerProps {
  form: FormData;
  initialAnswers?: Record<string, unknown>;
  continueResponseId?: number;
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

export function FormContainer({ form, initialAnswers, continueResponseId }: FormContainerProps) {
  const engine = useFormEngine(form);
  const [validationError, setValidationError] = useState<string | undefined>();
  const [shakeKey, setShakeKey] = useState(0);
  // Show splash only when opened as PWA (standalone mode on mobile)
  const isPWA = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );
  const [showLoading, setShowLoading] = useState(isPWA);
  const [hasRestoredFromSave, setHasRestoredFromSave] = useState(false);

  // Auto-dismiss splash after 1.8s (only runs when isPWA)
  useEffect(() => {
    if (!showLoading) return;
    const timer = setTimeout(() => setShowLoading(false), 1800);
    return () => clearTimeout(timer);
  }, [showLoading]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const d = form.design;
  const bgColor = d?.backgroundColor || "#FFFFFF";
  const questionColor = d?.questionColor || "#1E293B";
  const buttonColor = d?.buttonColor || "#3B82F6";
  const buttonTextColor = d?.buttonTextColor || "#FFFFFF";
  const inputStyleType = (d?.inputStyle || "default") as InputStyleType;
  const btnStyle = getButtonStyleClasses(inputStyleType, buttonColor, buttonTextColor);
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
  // Priority: initialAnswers (from DB via ?continue=) > localStorage
  useEffect(() => {
    if (hasRestoredFromSave) return;

    // If we have initialAnswers from the database (continue flow), use those
    if (initialAnswers && typeof initialAnswers === "object" && Object.keys(initialAnswers).length > 0) {
      Object.entries(initialAnswers).forEach(([qId, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          engine.setResponse(qId, value as string | number | boolean | string[] | Record<string, string> | null);
        }
      });
      // Resume by RE-WALKING the conditional-logic path with the restored
      // answers (never "last answered + 1" positionally — that dropped PF
      // respondents into the PJ block that sits right after in the array).
      const resumeIdx = engine.deriveResumeIndex(initialAnswers as Record<string, unknown>);
      if (resumeIdx > 0) {
        engine.goToIndex(resumeIdx);
      }
      setHasRestoredFromSave(true);
      return;
    }

    // Fallback: restore from localStorage
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
        // Validate the saved index against the logical path re-derived from the
        // saved answers. If the form structure changed since the save (or the
        // saved index landed inside a branch the user never chose), fall back
        // to the derived index instead of trusting the stale position.
        const derivedIdx = engine.deriveResumeIndex(savedResps as Record<string, unknown>);
        const savedIdxValid = typeof savedIdx === "number" && savedIdx > 0 && savedIdx < form.questions.length;
        const resumeIdx = savedIdxValid && savedIdx === derivedIdx ? savedIdx : derivedIdx;
        if (resumeIdx > 0) {
          engine.goToIndex(resumeIdx);
        }
      } else if (typeof savedIdx === "number" && savedIdx > 0 && savedIdx < form.questions.length) {
        engine.goToIndex(savedIdx);
      }
    }
    setHasRestoredFromSave(true);
  }, [form.id, form.questions.length, initialAnswers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-save responses on every change ───
  // Submit responses to database when form is completed
  const submitResponseMutation = trpc.responses.submit.useMutation();
  const updateResponseMutation = trpc.responses.update.useMutation();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [protocolCode, setProtocolCode] = useState<string | null>(null);
  const [totalScore, setTotalScore] = useState<number | null>(null);

  // ─── Auto-save partial responses to DB ───
  // Tracks the DB response ID created for this session (partial save)
  const partialResponseIdRef = useRef<number | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Resume detection: check DB for existing partial response by CPF/email ───
  // When the client fills in their CPF or email, we check if there's an existing partial response.
  const [resumeCheckIdentifier, setResumeCheckIdentifier] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [resumeData, setResumeData] = useState<{ id: number; answers: Record<string, unknown>; respondentName: string | null } | null>(null);

  const { data: partialByIdentifier } = trpc.responses.findPartialByIdentifier.useQuery(
    { formId: form._dbFormId!, identifier: resumeCheckIdentifier! },
    {
      enabled: !!form._dbFormId && !!resumeCheckIdentifier && !continueResponseId && !partialResponseIdRef.current,
      retry: false,
      staleTime: 10_000,
    }
  );

  // When we get a result from the identifier check, show the resume prompt
  useEffect(() => {
    if (partialByIdentifier && !showResumePrompt && !continueResponseId) {
      setResumeData({
        id: partialByIdentifier.id,
        answers: partialByIdentifier.answers as Record<string, unknown>,
        respondentName: partialByIdentifier.respondentName,
      });
      setShowResumePrompt(true);
    }
  }, [partialByIdentifier]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle resume: restore answers from DB and continue from last answered question
  const handleResume = useCallback(() => {
    if (!resumeData) return;
    setShowResumePrompt(false);
    // Restore all answers
    Object.entries(resumeData.answers).forEach(([qId, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        engine.setResponse(qId, value as any);
      }
    });
    // Find the last answered question and go to the next one
    const answeredIds = new Set(Object.keys(resumeData.answers).filter(k => {
      const v = resumeData.answers[k];
      return v !== null && v !== undefined && v !== "";
    }));
    let lastAnsweredIdx = 0;
    form.questions.forEach((q, idx) => {
      if (answeredIds.has(q.id)) lastAnsweredIdx = idx;
    });
    const resumeIdx = Math.min(lastAnsweredIdx + 1, form.questions.length - 1);
    if (resumeIdx > 0) engine.goToIndex(resumeIdx);
    // Link this session to the existing DB record
    partialResponseIdRef.current = resumeData.id;
    if (form._dbFormId) {
      sessionStorage.setItem(`formflow_partial_db_${form._dbFormId}`, String(resumeData.id));
    }
  }, [resumeData, engine, form.questions, form._dbFormId]);

  const handleStartFresh = useCallback(() => {
    setShowResumePrompt(false);
    setResumeData(null);
  }, []);

  // On mount: restore partialResponseId from sessionStorage (if user refreshed)
  useEffect(() => {
    if (!form._dbFormId) return;
    const key = `formflow_partial_db_${form._dbFormId}`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
      const id = parseInt(stored, 10);
      if (!isNaN(id)) partialResponseIdRef.current = id;
    }
  }, [form._dbFormId]);

  // Auto-save to DB whenever the user advances (currentIndex changes) and has answered at least 1 question
  useEffect(() => {
    if (!hasRestoredFromSave) return;
    if (!form._dbFormId) return;
    if (engine.isThankYou) return; // handled by the completion effect below
    if (continueResponseId) return; // already has a DB record
    if (engine.responses.size === 0) return; // nothing answered yet

    // Debounce: wait 1.5s after last change before saving
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      const answersObj: Record<string, unknown> = {};
      engine.responses.forEach((v, k) => { answersObj[k] = v.value; });

      // Extract name and email
      let respondentName: string | undefined;
      let respondentEmail: string | undefined;
      engine.responses.forEach((v) => {
        const q = form.questions.find((q) => q.id === v.questionId);
        if ((q?.type === "name" || q?.type === "short-text") && !respondentName && typeof v.value === "string") respondentName = v.value;
        if (q?.type === "email" && typeof v.value === "string") respondentEmail = v.value;
      });

      if (partialResponseIdRef.current) {
        // Update existing partial response (include name/email so it's visible in the dashboard)
        updateResponseMutation.mutate({
          id: partialResponseIdRef.current,
          answers: answersObj,
          isComplete: false,
          respondentName: respondentName ?? undefined,
          respondentEmail: respondentEmail ?? undefined,
        });
      } else {
        // Create new partial response
        submitResponseMutation.mutate({
          formId: form._dbFormId!,
          answers: answersObj,
          respondentName,
          respondentEmail,
          isComplete: false,
        }, {
          onSuccess: (data) => {
            if (data?.id) {
              partialResponseIdRef.current = data.id;
              sessionStorage.setItem(`formflow_partial_db_${form._dbFormId}`, String(data.id));
            }
          },
        });
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [engine.currentIndex, engine.responses.size, hasRestoredFromSave, form._dbFormId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hasRestoredFromSave) return;
    if (engine.isThankYou) {
      clearSavedResponses(form.id);

      // Calculate total score if any question has scoring enabled
      const hasScoringQuestions = form.questions.some(q => q.scoringEnabled);
      if (hasScoringQuestions) {
        let score = 0;
        engine.responses.forEach((v) => {
          const q = form.questions.find(q => q.id === v.questionId);
          if (!q?.scoringEnabled) return;

          // Choice-based questions: score per selected option
          if (q.choices && q.choices.length > 0) {
            if (typeof v.value === "string") {
              const choice = q.choices.find(c => c.id === v.value || c.label === v.value);
              if (choice?.score) score += choice.score;
            }
            if (Array.isArray(v.value)) {
              v.value.forEach(val => {
                const choice = q.choices!.find(c => c.id === val || c.label === val);
                if (choice?.score) score += choice.score;
              });
            }
          } else {
            // Non-choice questions: fixed questionScore awarded when answered
            const hasValue = v.value !== null && v.value !== undefined && v.value !== "";
            if (hasValue && q.questionScore) {
              score += q.questionScore;
            }
          }
        });
        setTotalScore(score);
      }

      // Submit to database if we have a dbFormId and haven't submitted yet
      if (form._dbFormId && !hasSubmitted) {
        // Cancel any pending auto-save timer
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        const answersObj: Record<string, unknown> = {};
        engine.responses.forEach((v, k) => {
          answersObj[k] = v.value;
        });

        // Extract name and email from responses
        let respondentName: string | undefined;
        let respondentEmail: string | undefined;
        engine.responses.forEach((v) => {
          const q = form.questions.find((q) => q.id === v.questionId);
          if (q?.type === "name" || q?.type === "short-text") {
            if (!respondentName && typeof v.value === "string") respondentName = v.value;
          }
          if (q?.type === "email" && typeof v.value === "string") respondentEmail = v.value;
        });

        // Clean up sessionStorage for this form
        sessionStorage.removeItem(`formflow_partial_db_${form._dbFormId}`);

        // If continuing an existing response, update it instead of creating a new one
        const existingId = continueResponseId ?? partialResponseIdRef.current;
        if (existingId) {
          updateResponseMutation.mutate({
            id: existingId,
            answers: answersObj,
            isComplete: true,
            respondentName: respondentName ?? undefined,
            respondentEmail: respondentEmail ?? undefined,
          }, {
            onSuccess: (data) => {
              if ((data as any)?.protocolCode) setProtocolCode((data as any).protocolCode);
              fireTrackingConversion(form.tracking, form.title);
            },
          });
        } else {
          submitResponseMutation.mutate({
            formId: form._dbFormId,
            answers: answersObj,
            respondentName,
            respondentEmail,
            isComplete: true,
          }, {
            onSuccess: (data) => {
              // Capture the protocol code from the server response
              if (data?.protocolCode) {
                setProtocolCode(data.protocolCode);
              }
              fireTrackingConversion(form.tracking, form.title);
            },
          });
        }
        setHasSubmitted(true);
      }
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

  // Loading animation disabled per user request
  // Logo is still shown fixed top-left during the form

  const questionNumber = engine.visitedQuestionNumber;

  const totalActualQuestions = useMemo(
    () =>
      form.questions.filter(
        (q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"
      ).length,
    [form.questions]
  );

  // Check if the current question is an identifier (CPF or email) and trigger resume detection
  const checkIdentifierForResume = useCallback((questionType: string, value: unknown) => {
    if (continueResponseId || partialResponseIdRef.current) return; // already in a session
    if (!form._dbFormId) return;
    if (questionType === 'cpf' || questionType === 'cnpj') {
      const raw = String(value ?? '').replace(/\D/g, '');
      if (raw.length >= 11) setResumeCheckIdentifier(raw);
    } else if (questionType === 'email') {
      const email = String(value ?? '').trim().toLowerCase();
      if (email.includes('@') && email.includes('.')) setResumeCheckIdentifier(email);
    }
  }, [continueResponseId, form._dbFormId]);

  const handleNext = useCallback(() => {
    const validation = engine.validateCurrent();
    if (!validation.valid) {
      setValidationError(validation.message);
      setShakeKey((k) => k + 1);
      return;
    }
    setValidationError(undefined);
    // Check if current question is an identifier for resume detection
    const currentQ = engine.currentQuestion;
    const currentVal = engine.getResponse(currentQ.id);
    checkIdentifierForResume(currentQ.type, currentVal);
    engine.goNext();
  }, [engine, checkIdentifierForResume]);

  const handleAutoAdvance = useCallback((value?: unknown) => {
    setValidationError(undefined);
    // Check if current question is an identifier for resume detection
    const currentQ = engine.currentQuestion;
    const checkVal = value !== undefined ? value : engine.getResponse(currentQ.id);
    checkIdentifierForResume(currentQ.type, checkVal);
    if (value !== undefined) {
      engine.goNextWithValue(value as any);
    } else {
      engine.goNext();
    }
  }, [engine, checkIdentifierForResume]);

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
  const _showBackButton = showNav && !engine.isFirst;
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
            className="h-32 sm:h-32 object-contain"
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
      {/* Tracking/Analytics Scripts */}
      <TrackingScripts tracking={form.tracking} />

      {/* Animated backgrounds */}
      {(() => {
        const bgColors = d?.backgroundColors || [];
        const c = (i: number, fallback: string) => bgColors[i] || fallback;
        const backgroundType = d?.backgroundType || "paths";
        return (
          <div className="absolute inset-0 pointer-events-none">
            {(backgroundType === "paths") && (
              <div className="absolute inset-0" style={{ color: c(0, "rgba(112, 190, 250, 0.55)") }}>
                <BackgroundPaths />
              </div>
            )}
            {backgroundType === "aurora" && (
              <AuroraBackground className="!h-full !min-h-0 dark" showRadialGradient={true} />
            )}
            {backgroundType === "shaders" && <BackgroundShaders colors={bgColors.length > 0 ? bgColors : undefined} />}
            {backgroundType === "gradient" && <BackgroundGradientAnimation interactive={false} />}
            {backgroundType === "beams" && <BeamsBackground />}
            {backgroundType === "etheral" && <EtheralShadow color={c(0, "rgba(100, 100, 200, 1)")} />}
            {backgroundType === "falling" && <FallingPattern color={c(0, "#6366f1")} />}
            {backgroundType === "dots" && <GradientDots backgroundColor={c(0, "#030303")} />}
            {backgroundType === "spotlight" && <SpotlightBackground colors={bgColors.length > 0 ? bgColors : undefined} />}
            {backgroundType === "plasma" && <ShaderPlasma />}
            {backgroundType === "stars" && <StarsBackground colors={bgColors.length > 0 ? bgColors : undefined} />}
            {backgroundType === "aurora-beams" && <AuroraBeams color={c(0, "#00ffcc")} />}
            {backgroundType === "flow-field" && <FlowField color={c(0, "#6366f1")} />}
          </div>
        );
      })()}

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
            className="h-12 sm:h-16 lg:h-28 object-contain"
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

      {/* ─── Question Counter (bottom-left) ─── */}
      {showNav && (
        <motion.div
          className="absolute bottom-3 sm:bottom-5 left-4 sm:left-8 z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span
            className="text-[11px] sm:text-xs font-medium tracking-wide"
            style={{ color: subtextColor }}
          >
            {questionNumber} / {totalActualQuestions}
          </span>
        </motion.div>
      )}

      {/* ─── Navigation Arrows (RIGHT SIDE, vertically centered — same as preview) ─── */}
      {showNav && (
        <motion.div
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Up arrow = go back (previous question) */}
          <motion.button
            onClick={handlePrev}
            disabled={engine.isFirst}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
            style={{
              backgroundColor: arrowBg,
              color: arrowColor,
            }}
            whileHover={!engine.isFirst ? { backgroundColor: arrowHoverBg, scale: 1.1 } : {}}
            whileTap={!engine.isFirst ? { scale: 0.9 } : {}}
          >
            <ChevronUp size={22} />
          </motion.button>
          {/* Down arrow = go next (next question) — styled to match inputStyle */}
          {btnStyle.needsGradientWrapper ? (
            <motion.div
              className={btnStyle.gradientWrapperClasses + " rounded-full p-[1.5px] cursor-pointer"}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleNext}
            >
              <div className={btnStyle.gradientInnerClasses + " w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"}>
                <ChevronDown size={22} className="text-white" />
              </div>
            </motion.div>
          ) : (
            <motion.button
              onClick={handleNext}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                inputStyleType !== "default" ? btnStyle.buttonClasses.replace(/px-\d+(\.\d+)?/g, "").replace(/py-\d+(\.\d+)?/g, "").replace(/rounded-xl/g, "rounded-full").replace(/rounded-2xl/g, "rounded-full") : ""
              }`}
              style={inputStyleType !== "default" ? btnStyle.buttonStyles : { backgroundColor: arrowBg, color: arrowColor }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronDown size={22} />
            </motion.button>
          )}
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
                  protocolCode={protocolCode}
                  totalScore={totalScore}
                  design={form.design}
                  smsVerification={form.settings?.smsVerification}
                  formId={form._dbFormId}
                />
              </div>
            ) : (
              /* Regular questions — scrollable, vertically centered */
              <div
                ref={scrollRef}
                className="w-full h-full overflow-y-auto"
                style={{
                  paddingTop: "4rem",
                  paddingBottom: "6rem",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="flex-1" />
                <motion.div
                  key={`shake-${shakeKey}`}
                  className="max-w-[720px] mx-auto px-6 sm:px-12 pr-16 sm:pr-24 w-full"
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
                      smsVerification={form.settings?.smsVerification}
                      formId={form._dbFormId}
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

      {/* ─── Resume Prompt Overlay ─── */}
      <AnimatePresence>
        {showResumePrompt && resumeData && (
          <motion.div
            className="absolute inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <motion.div
              className="rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              style={{
                backgroundColor: isLightBg ? "#ffffff" : "#1e1e2e",
                color: isLightBg ? "#1a1a2e" : "#f8f8f8",
                border: isLightBg ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.1)",
              }}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              {/* Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-full mb-4 mx-auto"
                style={{ backgroundColor: buttonColor + "22" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={buttonColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2">
                Cadastro encontrado
              </h3>
              <p className="text-sm text-center mb-6" style={{ opacity: 0.7 }}>
                {resumeData.respondentName
                  ? `${resumeData.respondentName}, encontramos um cadastro incompleto. Deseja continuar de onde parou?`
                  : "Encontramos um cadastro incompleto. Deseja continuar de onde parou?"}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleResume}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90 active:scale-95"
                  style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                >
                  Continuar de onde parei
                </button>
                <button
                  onClick={handleStartFresh}
                  className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 hover:opacity-70 active:scale-95"
                  style={{
                    backgroundColor: isLightBg ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.1)",
                    color: isLightBg ? "#1a1a2e" : "#f8f8f8",
                  }}
                >
                  Iniciar novo cadastro
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
