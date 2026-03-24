/**
 * Response Validation Page — Pixel-perfect redesign.
 * Corretor validates each answer/document individually.
 * "Aprovar Cadastro" button only unlocks after ALL fields are individually validated.
 * Cadence starts automatically after validation (no manual button).
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText,
  Download, Loader2, AlertTriangle, MessageSquare, Mail, Phone, Calendar, ShieldCheck,
  Lock, ExternalLink, Eye, Share2,
  X, ZoomIn, ZoomOut, RotateCw, Maximize2, Send, RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: any; label: string; bg: string; text: string; border: string }> = {
    approved: {
      icon: CheckCircle2,
      label: "Aprovado",
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/20",
    },
    rejected: {
      icon: XCircle,
      label: "Reprovado",
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/20",
    },
  };

  const config = configs[status] || {
    icon: Clock,
    label: "Pendente",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ─── Progress Ring (SVG) ───
function ProgressRing({ percent, size = 40, strokeWidth = 3 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-border"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={percent === 100 ? "text-green-500" : "text-brand"}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        strokeDasharray={circumference}
      />
    </svg>
  );
}

// ─── Lightbox Overlay with Pinch-to-Zoom & Download ───
function LightboxOverlay({
  image,
  zoom,
  rotation,
  onZoomChange,
  onRotationChange,
  onClose,
}: {
  image: { url: string; alt: string };
  zoom: number;
  rotation: number;
  onZoomChange: (z: number | ((prev: number) => number)) => void;
  onRotationChange: (r: number | ((prev: number) => number)) => void;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDistRef = useRef<number | null>(null);
  const baseZoomRef = useRef(zoom);
  const [isDownloading, setIsDownloading] = useState(false);

  // Pinch-to-zoom handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDistRef.current = Math.hypot(dx, dy);
      baseZoomRef.current = zoom;
    }
  }, [zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastDistRef.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / lastDistRef.current;
      const newZoom = Math.min(4, Math.max(0.5, baseZoomRef.current * scale));
      onZoomChange(newZoom);
    }
  }, [onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    lastDistRef.current = null;
  }, []);

  // Download handler
  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      // Extract filename from URL or use alt
      const urlParts = image.url.split("/");
      const rawName = urlParts[urlParts.length - 1] || "documento";
      // Remove random prefix (e.g., "XAo1guJf-IMG_1570.jpeg" -> "IMG_1570.jpeg")
      const cleanName = rawName.includes("-") ? rawName.substring(rawName.indexOf("-") + 1) : rawName;
      link.download = cleanName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(image.url, "_blank");
    } finally {
      setIsDownloading(false);
    }
  }, [image.url]);

  // Keyboard: Escape to close, +/- for zoom
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") onZoomChange((z: number) => Math.min(4, z + 0.25));
      if (e.key === "-") onZoomChange((z: number) => Math.max(0.5, z - 0.25));
      if (e.key === "r" || e.key === "R") onRotationChange((r: number) => r + 90);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, onZoomChange, onRotationChange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs sm:text-sm text-white/80 font-medium truncate max-w-[40%]">
          {image.alt}
        </p>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            onClick={() => onZoomChange((z: number) => Math.max(0.5, z - 0.25))}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[10px] sm:text-xs text-white/60 font-mono min-w-[36px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange((z: number) => Math.min(4, z + 0.25))}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRotationChange((r: number) => r + 90)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Girar"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            title="Baixar imagem"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          </button>
          <a
            href={image.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
            title="Abrir original"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all ml-1 sm:ml-2"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image area with pinch-to-zoom */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-auto p-4 touch-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <motion.img
          key={image.url}
          src={image.url}
          alt={image.alt}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{
            scale: zoom,
            opacity: 1,
            rotate: rotation,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default select-none"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
        />
      </div>
    </motion.div>
  );
}

export default function ResponseValidation() {
  const [, _navigate] = useLocation();
  const params = useParams<{ responseId: string }>();
  const responseId = parseInt(params.responseId || "0");

  // Force dark theme for validation page
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      const stored = localStorage.getItem("theme-mode") || "dark";
      if (stored !== "dark") {
        document.documentElement.classList.remove("dark");
      }
    };
  }, []);

  const [rejectingQuestion, setRejectingQuestion] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [showConfirmFinalize, setShowConfirmFinalize] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState("ficha.pdf");
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; alt: string } | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);
  const [reopenedValidation, setReopenedValidation] = useState(false);
  const pdfCacheRef = useRef<Map<number, { url: string; filename: string }>>(new Map());
  const bottomBarRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  // Handle PDF preview (with cache)
  const handlePreviewPdf = async () => {
    if (!responseId || isGeneratingPdf) return;

    // Check cache first
    const cached = pdfCacheRef.current.get(responseId);
    if (cached) {
      setPdfPreviewUrl(cached.url);
      setPdfFilename(cached.filename);
      setShowPdfPreview(true);
      return;
    }

    setIsGeneratingPdf(true);
    try {
      const result = await utils.responses.generateFicha.fetch({ responseId });
      const byteArray = Uint8Array.from(atob(result.base64), (c) => c.charCodeAt(0));
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const filename = result.filename || "ficha.pdf";

      // Store in cache
      pdfCacheRef.current.set(responseId, { url, filename });

      setPdfPreviewUrl(url);
      setPdfFilename(filename);
      setShowPdfPreview(true);
      toast.success("PDF gerado com sucesso!");
    } catch (err: any) {
      console.error("Error generating ficha:", err);
      toast.error("Erro ao gerar ficha", {
        description: err?.message || "Tente novamente",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle PDF download from preview
  const handleDownloadFromPreview = () => {
    if (!pdfPreviewUrl) return;
    const link = document.createElement("a");
    link.href = pdfPreviewUrl;
    link.download = pdfFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download iniciado!");
  };

  // Handle WhatsApp share
  const shareFichaMutation = trpc.responses.shareFicha.useMutation();
  const handleShareWhatsApp = async () => {
    if (!responseId || isSharingWhatsApp) return;
    setIsSharingWhatsApp(true);
    try {
      const result = await shareFichaMutation.mutateAsync({ responseId });
      const text = encodeURIComponent(
        `Ficha de Cadastro - ${result.filename}\n\n${result.url}`
      );
      window.open(`https://wa.me/?text=${text}`, "_blank");
      toast.success("Link copiado para compartilhar!");
    } catch (err: any) {
      console.error("Error sharing ficha:", err);
      toast.error("Erro ao compartilhar ficha", {
        description: err?.message || "Tente novamente",
      });
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      pdfCacheRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
      pdfCacheRef.current.clear();
    };
  }, []);

  // Get response data
  const responseQuery = trpc.responses.getById.useQuery(
    { id: responseId },
    { enabled: responseId > 0 }
  );

  // Get form data for question labels
  const formId = (responseQuery.data as any)?.formId;
  const formQuery = trpc.forms.getById.useQuery(
    { id: formId },
    { enabled: !!formId }
  );

  // Get validations for this response
  const validationsQuery = trpc.validations.byResponse.useQuery(
    { responseId },
    { enabled: responseId > 0 }
  );

  const validateMutation = trpc.validations.validate.useMutation({
    onSuccess: () => {
      toast.success("Validação salva!");
      utils.validations.byResponse.invalidate({ responseId });
      utils.responses.getById.invalidate({ id: responseId });
      setRejectingQuestion(null);
      setJustification("");
    },
    onError: (err) => toast.error(err.message),
  });

  const finalizeMutation = trpc.validations.finalizeValidation.useMutation({
    onSuccess: (data) => {
      utils.validations.byResponse.invalidate({ responseId });
      utils.responses.getById.invalidate({ id: responseId });
      setIsApproving(false);
      const statusMsg = data.status === "approved" ? "aprovado" : "com pendências";
      toast.success(`Validação finalizada! Cadastro ${statusMsg}.`, {
        description: "Email consolidado enviado ao cliente.",
      });
    },
    onError: (err) => {
      setIsApproving(false);
      toast.error(err.message || "Erro ao finalizar validação");
    },
  });

  const response = responseQuery.data as any;
  const form = formQuery.data as any;
  const validations = (validationsQuery.data ?? []) as any[];
  const answers = response?.answers as Record<string, any> || {};
  const questions = (form?.questions ?? []) as any[];

  // Build question map
  const questionMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const q of questions) {
      map[q.id] = q;
    }
    return map;
  }, [questions]);

  // Build validation map
  const validationMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const v of validations) {
      map[v.questionId] = v;
    }
    return map;
  }, [validations]);

  // Compute validation progress
  const validationProgress = useMemo(() => {
    const answerKeys = Object.keys(answers);
    const totalFields = answerKeys.length;
    const validatedFields = answerKeys.filter(
      (qId) => validationMap[qId] && validationMap[qId].status !== "pending"
    ).length;
    const approvedFields = answerKeys.filter(
      (qId) => validationMap[qId]?.status === "approved"
    ).length;
    const rejectedFields = answerKeys.filter(
      (qId) => validationMap[qId]?.status === "rejected"
    ).length;
    const pendingFields = totalFields - validatedFields;
    const allValidated = totalFields > 0 && validatedFields === totalFields;
    const allApproved = totalFields > 0 && approvedFields === totalFields;
    const hasRejections = rejectedFields > 0;
    const progressPercent = totalFields > 0 ? Math.round((validatedFields / totalFields) * 100) : 0;

    return {
      totalFields,
      validatedFields,
      approvedFields,
      rejectedFields,
      pendingFields,
      allValidated,
      allApproved,
      hasRejections,
      progressPercent,
    };
  }, [answers, validationMap]);

  const handleApprove = (questionId: string) => {
    validateMutation.mutate({
      responseId,
      questionId,
      status: "approved",
    });
  };

  const handleReject = () => {
    if (!rejectingQuestion) return;
    if (!justification.trim()) {
      toast.error("Informe a justificativa da reprovação");
      return;
    }
    validateMutation.mutate({
      responseId,
      questionId: rejectingQuestion,
      status: "rejected",
      justification: justification.trim(),
    });
  };

  // Handle "Aprovar Cadastro"
  const handleAproveCadastro = async () => {
    if (!validationProgress.allValidated) {
      toast.error("Valide todas as respostas antes de aprovar o cadastro");
      return;
    }
    setShowConfirmFinalize(true);
  };

  const confirmFinalize = () => {
    setShowConfirmFinalize(false);
    setIsApproving(true);
    finalizeMutation.mutate({ responseId });
  };

  // Auto-scroll to next pending field after validation
  useEffect(() => {
    if (validateMutation.isSuccess) {
      const pendingKeys = Object.keys(answers).filter(
        (qId) => !validationMap[qId] || validationMap[qId].status === "pending"
      );
      if (pendingKeys.length > 0) {
        const el = document.getElementById(`field-${pendingKeys[0]}`);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }, 300);
        }
      }
    }
  }, [validateMutation.isSuccess]);

  const isLoading = responseQuery.isLoading || formQuery.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-brand/20 animate-pulse" />
            <Loader2 className="w-6 h-6 animate-spin text-brand absolute top-3 left-3" />
          </div>
          <p className="text-sm text-muted-foreground font-body">Carregando validação...</p>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <h2 className="text-base font-display font-bold text-foreground mb-1">Resposta não encontrada</h2>
          <p className="text-xs text-muted-foreground font-body mb-4">
            Esta resposta pode ter sido removida ou o link é inválido.
          </p>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </div>
      </div>
    );
  }

  const isAlreadyFinalized = response.validationStatus === "approved" || response.validationStatus === "rejected";
  const isAlreadyApproved = isAlreadyFinalized && !reopenedValidation;

  const handleReopenValidation = () => {
    setReopenedValidation(true);
    toast.info("Validação reaberta. Modifique as validações e finalize novamente.");
  };
  const answerEntries = Object.entries(answers);

  return (
    <div className="min-h-screen bg-background pb-28 sm:pb-24">
      {/* ─── Sticky Header ─── */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="flex items-center gap-3 py-3">
            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0 active:scale-95"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-foreground font-display truncate leading-tight">
                Validar Cadastro
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight mt-0.5">
                {form?.title && (
                  <span className="font-semibold text-brand/80">{form.title}</span>
                )}
                {form?.title && <span className="mx-1">·</span>}
                <span className="font-mono text-foreground/70 font-semibold">{response.protocolCode || `#${response.id}`}</span>
                {response.respondentName && (
                  <span className="ml-1.5">— {response.respondentName}</span>
                )}
              </p>
            </div>

            {/* Progress ring in header */}
            <div className="relative shrink-0">
              <ProgressRing percent={validationProgress.progressPercent} size={36} strokeWidth={2.5} />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold font-mono text-foreground">
                {validationProgress.progressPercent}%
              </span>
            </div>
          </div>

          {/* Inline progress bar (mobile-friendly) */}
          <div className="flex items-center gap-2 pb-2.5 -mt-0.5">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  validationProgress.allApproved
                    ? "bg-green-500"
                    : validationProgress.hasRejections
                    ? "bg-gradient-to-r from-green-500 via-amber-500 to-amber-500"
                    : "bg-brand"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${validationProgress.progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] font-body text-muted-foreground shrink-0">
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                {validationProgress.approvedFields}
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                {validationProgress.rejectedFields}
              </span>
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                {validationProgress.pendingFields}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Client Info Card ─── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-3 sm:mt-5">
        <div className="bg-card rounded-xl border border-border p-3.5 sm:p-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ${
              isAlreadyApproved
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-brand/10 text-brand"
            }`}>
              {response.respondentName ? response.respondentName.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-display font-bold text-foreground truncate">
                  {response.respondentName || "Anônimo"}
                </h2>
                {isAlreadyApproved && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-[9px] font-bold border border-green-500/20 shrink-0">
                    <ShieldCheck className="w-2.5 h-2.5" /> Aprovado
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">
                {form?.title || "Formulário"}
              </p>
            </div>
          </div>

          {/* PDF Download Button */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs font-semibold h-9 border-brand/30 text-brand hover:bg-brand/10 hover:text-brand transition-all"
              disabled={isGeneratingPdf}
              onClick={handlePreviewPdf}
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              {isGeneratingPdf ? "Gerando PDF..." : "Visualizar Ficha PDF"}
            </Button>
          </div>

          {/* Contact info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-border/50">
            {response.respondentEmail && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
                <Mail className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                <span className="truncate">{response.respondentEmail}</span>
              </div>
            )}
            {response.respondentPhone && (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
                <Phone className="w-3 h-3 shrink-0 text-muted-foreground/50" />
                <span>{response.respondentPhone}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-body">
              <Calendar className="w-3 h-3 shrink-0 text-muted-foreground/50" />
              <span>{new Date(response.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Answers List ─── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 mt-3 sm:mt-4 space-y-2.5 sm:space-y-3">
        <AnimatePresence mode="popLayout">
          {answerEntries.map(([questionId, answer], idx) => {
            const question = questionMap[questionId];
            const validation = validationMap[questionId];
            const status = validation?.status || "pending";
            const isFileType = question?.type === "file" || question?.type === "image" || question?.type === "file-upload";
            // Also detect file-like JSON answers in non-file fields
            const isFileAnswer = !isFileType && typeof answer === "string" && answer.startsWith("{") && answer.includes('"url"') && answer.includes('"filename"');
            const isFile = isFileType || isFileAnswer;
            const isPending = status === "pending";

            // Parse JSON string answers (files, addresses, etc.)
            let parsedAnswer = answer;
            if (typeof answer === "string" && answer.startsWith("{")) {
              try {
                const parsed = JSON.parse(answer);
                if (parsed && typeof parsed === "object") {
                  parsedAnswer = parsed;
                }
              } catch {}
            }

            // Determine answer display
            let displayContent: React.ReactNode;

            if (isFile && typeof parsedAnswer === "string" && parsedAnswer.startsWith("http")) {
              const isImage = parsedAnswer.match(/\.(jpg|jpeg|png|gif|webp)$/i);
              displayContent = isImage ? (
                <button
                  onClick={() => { setLightboxImage({ url: parsedAnswer, alt: question?.title || "Documento" }); setLightboxZoom(1); setLightboxRotation(0); }}
                  className="block group cursor-zoom-in text-left"
                >
                  <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-[280px]">
                    <img src={parsedAnswer} alt="Documento" className="w-full h-auto" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </button>
              ) : (
                <a
                  href={parsedAnswer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary/80 rounded-lg text-xs text-brand hover:bg-secondary transition-colors font-body group"
                >
                  <Download className="w-3.5 h-3.5" />
                  Ver arquivo
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            } else if (isFile && typeof parsedAnswer === "object" && (parsedAnswer as any)?.url) {
              const url = (parsedAnswer as any).url;
              const filename = (parsedAnswer as any).filename || "Arquivo";
              const mimeType = (parsedAnswer as any).mimeType || "";
              const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || mimeType.startsWith("image/");
              displayContent = isImage ? (
                <button
                  onClick={() => { setLightboxImage({ url, alt: filename }); setLightboxZoom(1); setLightboxRotation(0); }}
                  className="block group cursor-zoom-in text-left"
                >
                  <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-[280px]">
                    <img src={url} alt={filename} className="w-full h-auto" loading="lazy" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Maximize2 className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </button>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-secondary/80 rounded-lg text-xs text-brand hover:bg-secondary transition-colors font-body group"
                >
                  <FileText className="w-3.5 h-3.5" />
                  {filename}
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              );
            } else {
              // Format structured objects (address, etc.) nicely
              let formattedContent: React.ReactNode;

              if (typeof parsedAnswer === "object" && !Array.isArray(parsedAnswer) && parsedAnswer !== null) {
                const obj = parsedAnswer as Record<string, any>;

                // Detect address-like objects
                const isAddress = obj.cep || obj.street || obj.city || obj.state || obj.neighborhood;
                if (isAddress) {
                  const parts: string[] = [];
                  if (obj.street) {
                    let line = obj.street;
                    if (obj.number) line += `, ${obj.number}`;
                    if (obj.complement) line += ` — ${obj.complement}`;
                    parts.push(line);
                  }
                  if (obj.neighborhood) parts.push(obj.neighborhood);
                  const cityState = [obj.city, obj.state].filter(Boolean).join("/");
                  if (cityState) parts.push(cityState);
                  if (obj.cep) parts.push(`CEP ${obj.cep}`);

                  formattedContent = (
                    <div className="space-y-1">
                      {parts.map((part, i) => (
                        <p key={i} className="text-[13px] text-foreground/90 font-body leading-relaxed">
                          {i === 0 ? <span className="font-semibold">{part}</span> : part}
                        </p>
                      ))}
                    </div>
                  );
                } else {
                  // Generic object: render as label/value pairs
                  const labelMap: Record<string, string> = {
                    name: "Nome", email: "E-mail", phone: "Telefone", cpf: "CPF", cnpj: "CNPJ",
                    street: "Rua", number: "Número", complement: "Complemento",
                    neighborhood: "Bairro", city: "Cidade", state: "Estado", cep: "CEP",
                    country: "País", zip: "CEP", zipCode: "CEP",
                  };
                  formattedContent = (
                    <div className="space-y-1">
                      {Object.entries(obj).filter(([, v]) => v !== null && v !== undefined && v !== "").map(([k, v]) => (
                        <div key={k} className="flex items-baseline gap-2">
                          <span className="text-[11px] text-muted-foreground shrink-0 min-w-[70px]">
                            {labelMap[k] || k}
                          </span>
                          <span className="text-[13px] text-foreground/90 font-body font-medium">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
              } else {
                const answerStr = Array.isArray(parsedAnswer)
                  ? parsedAnswer.join(", ")
                  : String(parsedAnswer ?? "");
                formattedContent = (
                  <p className="text-[13px] text-foreground/90 font-body leading-relaxed break-words">
                    {answerStr || <span className="text-muted-foreground italic text-xs">Sem resposta</span>}
                  </p>
                );
              }

              displayContent = (
                <div className="rounded-lg bg-secondary/40 border border-border/30 px-3 py-2.5">
                  {formattedContent}
                </div>
              );
            }

            return (
              <motion.div
                id={`field-${questionId}`}
                key={questionId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                className={`bg-card rounded-xl border overflow-hidden transition-all duration-200 ${
                  status === "approved"
                    ? "border-green-500/25 shadow-sm shadow-green-500/5"
                    : status === "rejected"
                    ? "border-red-500/25 shadow-sm shadow-red-500/5"
                    : isPending
                    ? "border-border hover:border-brand/20"
                    : "border-border"
                }`}
              >
                <div className="p-3.5 sm:p-4">
                  {/* Question header row */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                          status === "approved"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : status === "rejected"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {idx + 1}/{validationProgress.totalFields}
                        </span>
                        {question?.type && (
                          <span className="text-[9px] text-muted-foreground/50 font-body uppercase">
                            {question.type === "file" ? "Arquivo" :
                             question.type === "image" ? "Imagem" :
                             question.type === "phone" ? "Telefone" :
                             question.type === "email" ? "Email" :
                             question.type === "select" ? "Seleção" :
                             question.type === "multi-select" ? "Múltipla escolha" :
                             question.type === "date" ? "Data" : "Texto"}
                          </span>
                        )}
                      </div>
                      <h3 className="text-[13px] sm:text-sm font-semibold text-foreground font-body leading-snug">
                        {question?.title || question?.label || `Pergunta ${questionId}`}
                      </h3>
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {/* Answer content */}
                  <div className="mb-3">
                    {displayContent}
                  </div>

                  {/* Rejection justification */}
                  {status === "rejected" && validation?.justification && (
                    <div className="mb-3 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
                      <p className="text-[10px] font-semibold text-red-600 dark:text-red-400 mb-0.5 flex items-center gap-1 font-body">
                        <MessageSquare className="w-3 h-3" /> Justificativa
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 font-body leading-relaxed">{validation.justification}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                        status === "approved"
                          ? "bg-green-600 text-white shadow-sm shadow-green-500/20"
                          : "bg-transparent border border-border text-muted-foreground hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                      }`}
                      onClick={() => handleApprove(questionId)}
                      disabled={validateMutation.isPending}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {status === "approved" ? "Aprovado" : "Aprovar"}
                    </button>
                    <button
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 h-8 sm:h-9 rounded-lg text-xs font-semibold transition-all active:scale-[0.97] ${
                        status === "rejected"
                          ? "bg-red-600 text-white shadow-sm shadow-red-500/20"
                          : "bg-transparent border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                      }`}
                      onClick={() => {
                        setRejectingQuestion(questionId);
                        setJustification(validation?.justification || "");
                      }}
                      disabled={validateMutation.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {status === "rejected" ? "Reprovado" : "Reprovar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {answerEntries.length === 0 && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-display font-bold text-foreground mb-1">Nenhuma resposta</p>
            <p className="text-xs text-muted-foreground font-body">Este cadastro não possui respostas para validar.</p>
          </div>
        )}
      </div>

      {/* ─── Fixed Bottom Bar: Aprovar Cadastro ─── */}
      {answerEntries.length > 0 && (
        <div ref={bottomBarRef} className="fixed bottom-0 left-0 right-0 z-30">
          {/* Gradient fade */}
          <div className="h-6 bg-gradient-to-t from-card/95 to-transparent pointer-events-none" />
          <div className="bg-card/95 backdrop-blur-md border-t border-border">
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
              <div className="flex items-center gap-3">
                {/* Progress summary */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <ProgressRing percent={validationProgress.progressPercent} size={32} strokeWidth={2} />
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold font-mono text-foreground">
                      {validationProgress.validatedFields}/{validationProgress.totalFields}
                    </span>
                  </div>
                  <div className="hidden sm:block min-w-0">
                    <p className="text-[11px] font-body text-foreground font-medium leading-tight">
                      {validationProgress.allValidated
                        ? validationProgress.allApproved
                          ? "Tudo aprovado"
                          : `${validationProgress.rejectedFields} pendência(s)`
                        : `${validationProgress.pendingFields} campo(s) restante(s)`
                      }
                    </p>
                    <p className="text-[9px] text-muted-foreground font-body">
                      {validationProgress.approvedFields} aprovados, {validationProgress.rejectedFields} reprovados
                    </p>
                  </div>
                </div>

                {/* Reabrir Validação button (when already finalized) */}
                {isAlreadyApproved && (
                  <Button
                    size="default"
                    variant="outline"
                    className="gap-1.5 text-xs sm:text-sm font-semibold px-4 sm:px-6 h-10 sm:h-11 transition-all duration-300 shrink-0 active:scale-[0.97] border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-500"
                    onClick={handleReopenValidation}
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span className="hidden sm:inline">Reabrir Validação</span>
                    <span className="sm:hidden">Reabrir</span>
                  </Button>
                )}

                {/* Aprovar Cadastro / Finalizar button */}
                {!isAlreadyApproved && (
                  <Button
                    size="default"
                    className={`gap-1.5 text-xs sm:text-sm font-semibold px-4 sm:px-6 h-10 sm:h-11 transition-all duration-300 shrink-0 active:scale-[0.97] ${
                      validationProgress.allValidated
                        ? validationProgress.allApproved
                          ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/25"
                          : "bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/25"
                        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                    }`}
                    disabled={!validationProgress.allValidated || isApproving}
                    onClick={handleAproveCadastro}
                  >
                    {isApproving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : !validationProgress.allValidated ? (
                      <Lock className="w-3.5 h-3.5" />
                    ) : validationProgress.allApproved ? (
                      <Send className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {!validationProgress.allValidated
                        ? "Validar Todas"
                        : "Finalizar e Enviar Email"
                      }
                    </span>
                    <span className="sm:hidden">
                      {!validationProgress.allValidated
                        ? "Validar"
                        : "Finalizar"
                      }
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Finalize Dialog ─── */}
      <AlertDialog open={showConfirmFinalize} onOpenChange={setShowConfirmFinalize}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-base flex items-center gap-2">
              {validationProgress.allApproved ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              Finalizar validação?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-sm space-y-2">
              <span className="block">
                {validationProgress.allApproved
                  ? "Todos os campos foram aprovados. O cliente receberá um email de aprovação."
                  : `${validationProgress.approvedFields} campo(s) aprovado(s) e ${validationProgress.rejectedFields} reprovado(s). O cliente receberá um email com os itens a corrigir.`
                }
              </span>
              <span className="block text-xs text-muted-foreground">
                Você poderá reabrir a validação posteriormente, se necessário.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-body text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmFinalize}
              className={`font-body text-xs gap-1.5 ${
                validationProgress.allApproved
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-amber-600 hover:bg-amber-700 text-white"
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Confirmar e Enviar Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Reject Dialog ─── */}
      <Dialog open={!!rejectingQuestion} onOpenChange={() => setRejectingQuestion(null)}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="font-display text-base">Reprovar Resposta</DialogTitle>
            <DialogDescription className="font-body text-xs">
              Informe o motivo da reprovação. O cliente receberá esta justificativa por email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="Ex: Documento ilegível, favor reenviar com melhor qualidade..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="font-body text-sm resize-none"
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground font-body">
              O cliente poderá reenviar a resposta após receber a notificação.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setRejectingQuestion(null)} className="font-body text-xs">
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleReject}
              disabled={validateMutation.isPending || !justification.trim()}
              className="font-body text-xs gap-1.5"
            >
              {validateMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              Reprovar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* PDF Preview Dialog */}
      <Dialog open={showPdfPreview} onOpenChange={(open) => {
        setShowPdfPreview(open);
        if (!open && pdfPreviewUrl) {
          // Keep URL alive for potential re-open, cleanup on unmount
        }
      }}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 bg-background border-border">
          <DialogHeader className="px-4 py-3 border-b border-border/50 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-sm font-semibold font-heading">
                  Preview da Ficha
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {pdfFilename}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs font-semibold h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                  onClick={handleShareWhatsApp}
                  disabled={isSharingWhatsApp}
                >
                  {isSharingWhatsApp ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{isSharingWhatsApp ? "Enviando..." : "WhatsApp"}</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 text-xs font-semibold h-8"
                  onClick={handleDownloadFromPreview}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Baixar PDF</span>
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 bg-muted/30">
            {pdfPreviewUrl ? (
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0"
                title="Preview da Ficha PDF"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="px-4 py-3 border-t border-border/50 shrink-0 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground">
              Verifique os dados antes de baixar
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setShowPdfPreview(false)}
              >
                Fechar
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs h-8 border-green-500/30 text-green-500 hover:bg-green-500/10 hover:text-green-400"
                onClick={handleShareWhatsApp}
                disabled={isSharingWhatsApp}
              >
                {isSharingWhatsApp ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                WhatsApp
              </Button>
              <Button
                variant="default"
                size="sm"
                className="gap-2 text-xs h-8"
                onClick={handleDownloadFromPreview}
              >
                <Download className="w-3.5 h-3.5" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Image Lightbox ─── */}
      <AnimatePresence>
        {lightboxImage && (
          <LightboxOverlay
            image={lightboxImage}
            zoom={lightboxZoom}
            rotation={lightboxRotation}
            onZoomChange={setLightboxZoom}
            onRotationChange={setLightboxRotation}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
