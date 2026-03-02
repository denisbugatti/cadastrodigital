/**
 * FormFlow Responses Panel — Real Data Dashboard
 * Mobile-first responsive design with cards on small screens, table on desktop.
 * Validation drawer, field-by-field review, PDF generation.
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Download, Search, Calendar,
  ChevronDown, ChevronLeft, ChevronRight, Filter,
  Eye, X, FileSpreadsheet, ArrowUpDown, FileText,
  CheckCircle2, XCircle, Shield, ShieldCheck, ShieldAlert,
  Lock, Loader2, Check, AlertTriangle, MessageSquare,
  ExternalLink, Image as ImageIcon, File as FileIcon,
  MoreHorizontal, Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { BuilderQuestion } from "@/lib/builderTypes";

interface ResponsesPanelProps {
  formTitle: string;
  responseCount: number;
  questions?: BuilderQuestion[];
  formId?: number;
}

type DateFilter = "all" | "today" | "7days" | "30days";

/* ─── Validation Drawer (Mobile-optimized) ─── */
function ValidationDrawer({
  response,
  questions,
  onClose,
  formId,
}: {
  response: any;
  questions: BuilderQuestion[];
  onClose: () => void;
  formId: number;
}) {
  const answers = (response.answers ?? {}) as Record<string, any>;
  const actualQs = questions.filter(
    (q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"
  );

  const validationsQuery = trpc.validations.byResponse.useQuery(
    { responseId: response.id },
    { staleTime: 5000 }
  );

  const filesQuery = trpc.files.listByResponse.useQuery(
    { responseId: response.id },
    { staleTime: 10000 }
  );

  const utils = trpc.useUtils();

  const validateMutation = trpc.validations.validate.useMutation({
    onSuccess: () => {
      validationsQuery.refetch();
      utils.responses.listByForm.invalidate({ formId });
    },
    onError: (err) => toast.error(err.message || "Erro ao validar"),
  });

  const [rejectingField, setRejectingField] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const validations = validationsQuery.data ?? [];
  const files = filesQuery.data ?? [];

  const validationMap = useMemo(() => {
    const map: Record<string, { status: string; justification?: string }> = {};
    validations.forEach((v: any) => {
      map[v.questionId] = { status: v.status, justification: v.justification };
    });
    return map;
  }, [validations]);

  const fieldsWithAnswers = actualQs.filter((q) => answers[q.id] !== undefined && answers[q.id] !== "");
  const totalFields = fieldsWithAnswers.length;
  const approvedFields = fieldsWithAnswers.filter((q) => validationMap[q.id]?.status === "approved").length;
  const rejectedFields = fieldsWithAnswers.filter((q) => validationMap[q.id]?.status === "rejected").length;
  const validatedFields = approvedFields + rejectedFields;
  const pendingFields = totalFields - validatedFields;

  const handleApprove = (questionId: string) => {
    validateMutation.mutate({ responseId: response.id, questionId, status: "approved" });
  };

  const handleReject = (questionId: string) => {
    setRejectingField(questionId);
    setJustification("");
  };

  const confirmReject = () => {
    if (!rejectingField) return;
    if (!justification.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }
    validateMutation.mutate({
      responseId: response.id,
      questionId: rejectingField,
      status: "rejected",
      justification: justification.trim(),
    });
    setRejectingField(null);
    setJustification("");
  };

  const isFileField = (q: BuilderQuestion) => q.type === "file-upload";
  const getFileForQuestion = (questionId: string) => files.filter((f: any) => f.questionId === questionId);

  const parseFileAnswer = (answer: any): { url: string; filename: string; mimeType: string } | null => {
    if (!answer) return null;
    if (typeof answer === "object" && answer.url) return answer;
    if (typeof answer === "string") {
      try {
        const parsed = JSON.parse(answer);
        if (parsed && typeof parsed === "object" && parsed.url) return parsed;
      } catch {
        if (answer && !answer.startsWith("{") && !answer.startsWith("http")) {
          return { url: "", filename: answer, mimeType: "" };
        }
        if (answer.startsWith("http")) {
          const ext = answer.split(".").pop()?.toLowerCase() || "";
          const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", pdf: "application/pdf" };
          return { url: answer, filename: answer.split("/").pop() || "arquivo", mimeType: mimeMap[ext] || "application/octet-stream" };
        }
      }
    }
    return null;
  };

  const StatusDot = ({ status }: { status?: string }) => {
    if (status === "approved") return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />;
    if (status === "rejected") return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />;
    return <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 shrink-0" />;
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Drawer — full screen on mobile, side panel on desktop */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-[520px] bg-card z-50 flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,0.08)]"
      >
        {/* ── Header ── */}
        <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-5 shrink-0">
          <div className="flex items-start justify-between mb-4 sm:mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-display font-bold text-foreground tracking-tight">
                Validação
              </h3>
              <p className="text-xs sm:text-[13px] text-muted-foreground mt-1">
                {new Date(response.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats row — 2x2 on small mobile, 4 cols on wider */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <div className="bg-secondary rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-center">
              <p className="text-lg sm:text-2xl font-display font-bold text-foreground">{totalFields}</p>
              <p className="text-[9px] sm:text-[11px] text-muted-foreground">Total</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-center">
              <p className="text-lg sm:text-2xl font-display font-bold text-emerald-600">{approvedFields}</p>
              <p className="text-[9px] sm:text-[11px] text-emerald-500">OK</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/30 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-center">
              <p className="text-lg sm:text-2xl font-display font-bold text-red-600">{rejectedFields}</p>
              <p className="text-[9px] sm:text-[11px] text-red-400">Reprov.</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-center">
              <p className="text-lg sm:text-2xl font-display font-bold text-amber-600">{pendingFields}</p>
              <p className="text-[9px] sm:text-[11px] text-amber-500">Pend.</p>
            </div>
          </div>
        </div>

        <div className="h-px bg-border mx-4 sm:mx-6" />

        {/* ── Fields list ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4">
          {fieldsWithAnswers.map((q, i) => {
            const answer = answers[q.id];
            const validation = validationMap[q.id];
            const isFile = isFileField(q);
            const questionFiles = isFile ? getFileForQuestion(q.id) : [];
            const isPending = !validation;
            const isApproved = validation?.status === "approved";
            const isRejected = validation?.status === "rejected";

            return (
              <div key={q.id} className="group">
                {/* Field label */}
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <StatusDot status={validation?.status} />
                  <span className="text-xs sm:text-[13px] font-medium text-muted-foreground truncate">
                    {q.title}
                  </span>
                </div>

                {/* Answer card */}
                <div
                  className={`ml-4 sm:ml-5 rounded-xl border transition-all ${
                    isApproved
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20"
                      : isRejected
                      ? "border-red-200 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20"
                      : "border-border bg-secondary/50 hover:border-border"
                  }`}
                >
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                    {(() => {
                      const fileFromAnswer = isFile ? parseFileAnswer(answer) : null;
                      const dbFiles = isFile ? questionFiles : [];
                      const allFiles = fileFromAnswer ? [fileFromAnswer] : dbFiles;

                      if (isFile && allFiles.length > 0) {
                        return (
                          <div className="space-y-2 sm:space-y-3">
                            {allFiles.map((file: any, fIdx: number) => {
                              const isImage = file.mimeType?.startsWith("image/");
                              const isPdf = file.mimeType === "application/pdf";
                              const hasUrl = !!file.url;

                              return (
                                <div key={fIdx}>
                                  {isImage && hasUrl ? (
                                    <div className="space-y-2">
                                      <img
                                        src={file.url}
                                        alt={file.filename}
                                        className="w-full max-h-40 sm:max-h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setExpandedImage(file.url)}
                                      />
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => setExpandedImage(file.url)}
                                          className="flex items-center gap-1 text-[11px] text-brand hover:underline"
                                        >
                                          <ImageIcon size={11} /> Ampliar
                                        </button>
                                        <a
                                          href={file.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                                        >
                                          <ExternalLink size={11} /> Abrir
                                        </a>
                                      </div>
                                    </div>
                                  ) : hasUrl ? (
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border hover:border-brand/30 transition-all"
                                    >
                                      <FileIcon size={16} className="text-brand shrink-0" />
                                      <span className="text-xs sm:text-sm text-foreground truncate">{file.filename}</span>
                                      <ExternalLink size={12} className="text-muted-foreground shrink-0 ml-auto" />
                                    </a>
                                  ) : (
                                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border">
                                      <FileIcon size={16} className="text-muted-foreground shrink-0" />
                                      <span className="text-xs sm:text-sm text-muted-foreground truncate">{file.filename}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      }

                      // Text answer
                      const displayValue = typeof answer === "object" ? JSON.stringify(answer) : String(answer);
                      return (
                        <p className="text-xs sm:text-sm text-foreground font-body leading-relaxed break-words">
                          {displayValue}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Action buttons */}
                  <div className="px-3 sm:px-4 py-2 border-t border-border/50 flex items-center gap-2">
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleApprove(q.id)}
                          disabled={validateMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-body font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 transition-all"
                        >
                          <Check size={12} /> Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(q.id)}
                          disabled={validateMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-body font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800 transition-all"
                        >
                          <X size={12} /> Reprovar
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 size={13} /> Aprovado
                      </div>
                    ) : isRejected ? (
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-1">
                          <XCircle size={13} /> Reprovado
                        </div>
                        {validation?.justification && (
                          <p className="text-[11px] text-muted-foreground italic ml-5">
                            "{validation.justification}"
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Reject justification modal ── */}
      <AnimatePresence>
        {rejectingField && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setRejectingField(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-4 right-4 sm:left-auto sm:right-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 bottom-4 sm:bottom-auto sm:w-[400px] bg-card rounded-2xl border border-border shadow-2xl z-[61] p-5"
            >
              <h4 className="text-sm font-display font-bold text-foreground mb-1">
                Motivo da reprovação
              </h4>
              <p className="text-xs text-muted-foreground mb-3">
                Informe o motivo para o cliente corrigir.
              </p>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Documento ilegível, envie novamente..."
                className="w-full px-3 py-2.5 rounded-xl text-sm font-body bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand/30 resize-none h-24 transition-colors"
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setRejectingField(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-body font-medium text-muted-foreground border border-border hover:bg-secondary transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!justification.trim() || validateMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-body font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  Reprovar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Image lightbox ── */}
      <AnimatePresence>
        {expandedImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70]"
              onClick={() => setExpandedImage(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 sm:inset-8 z-[71] flex items-center justify-center"
              onClick={() => setExpandedImage(null)}
            >
              <img
                src={expandedImage}
                alt="Preview"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </motion.div>
            <button
              onClick={() => setExpandedImage(null)}
              className="fixed top-4 right-4 z-[72] p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-all"
            >
              <X size={20} />
            </button>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Response Card (Mobile) ─── */
function ResponseCard({
  response,
  questions,
  onValidate,
  onGeneratePdf,
  isGenerating,
  getStatusBadge,
}: {
  response: any;
  questions: BuilderQuestion[];
  onValidate: (id: number) => void;
  onGeneratePdf: (id: number) => void;
  isGenerating: boolean;
  getStatusBadge: (status: string | null | undefined) => React.ReactNode;
}) {
  const answers = (response.answers ?? {}) as Record<string, any>;
  const isValidated = response.validationStatus === "approved";

  // Show first 2-3 meaningful answers as preview
  const previewFields = questions
    .filter((q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement")
    .slice(0, 3)
    .map((q) => ({
      label: q.title,
      value: answers[q.id],
    }))
    .filter((f) => f.value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden hover:border-brand/20 transition-all"
    >
      {/* Card header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
            <Clock size={14} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              {new Date(response.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
              <span className="ml-1.5 text-xs text-muted-foreground font-normal">
                {new Date(response.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </div>
        </div>
        {getStatusBadge(response.validationStatus)}
      </div>

      {/* Preview fields */}
      {previewFields.length > 0 && (
        <div className="px-4 pb-2 space-y-1.5">
          {previewFields.map((field, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="text-[11px] text-muted-foreground shrink-0 w-[90px] truncate">
                {field.label}
              </span>
              <span className="text-xs text-foreground font-medium truncate">
                {typeof field.value === "object" ? JSON.stringify(field.value) : String(field.value)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-border/50 flex items-center gap-2">
        <button
          onClick={() => onValidate(response.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-medium text-brand bg-brand-lighter/50 hover:bg-brand-lighter border border-brand/20 transition-all"
        >
          <Shield size={13} />
          Validar
        </button>
        <button
          onClick={() => {
            if (!isValidated) {
              toast.info("Validação necessária", {
                description: "Valide todas as respostas antes de gerar o PDF.",
              });
              return;
            }
            onGeneratePdf(response.id);
          }}
          disabled={isGenerating}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-body font-medium transition-all ${
            isValidated
              ? "text-white bg-brand hover:bg-brand/90"
              : "text-muted-foreground bg-muted border border-border cursor-not-allowed"
          }`}
        >
          {isGenerating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : !isValidated ? (
            <Lock size={13} />
          ) : (
            <FileText size={13} />
          )}
          Gerar PDF
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Panel ─── */
export function ResponsesPanel({ formTitle, responseCount: _rc, questions = [], formId }: ResponsesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedResponseId, setSelectedResponseId] = useState<number | null>(null);
  const [validatingResponseId, setValidatingResponseId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const itemsPerPage = 10;

  const actualQuestions = useMemo(
    () => questions.filter((q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"),
    [questions]
  );

  const responsesQuery = trpc.responses.listByForm.useQuery(
    { formId: formId!, search: searchQuery || undefined },
    { enabled: !!formId, staleTime: 10000 }
  );

  const responses = responsesQuery.data ?? [];
  const utils = trpc.useUtils();

  // Columns for desktop table (max 4)
  const visibleColumns = useMemo(() => {
    return actualQuestions.slice(0, 4);
  }, [actualQuestions]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    let filtered = [...responses];
    const now = new Date();
    if (dateFilter === "today") {
      filtered = filtered.filter((r: any) => new Date(r.createdAt).toDateString() === now.toDateString());
    } else if (dateFilter === "7days") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r: any) => new Date(r.createdAt) >= weekAgo);
    } else if (dateFilter === "30days") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r: any) => new Date(r.createdAt) >= monthAgo);
    }

    filtered.sort((a: any, b: any) => {
      if (sortField === "createdAt") {
        const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortDir === "asc" ? diff : -diff;
      }
      const va = (a.answers as any)?.[sortField] || "";
      const vb = (b.answers as any)?.[sortField] || "";
      return sortDir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

    return filtered;
  }, [responses, dateFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredResponses.length / itemsPerPage);
  const paginatedResponses = filteredResponses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Generate PDF
  const handleGenerateFicha = useCallback(
    async (responseId: number) => {
      setGeneratingId(responseId);
      try {
        const result = await utils.responses.generateFicha.fetch({ responseId });
        const byteCharacters = atob(result.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || "ficha.pdf";
        link.click();
        URL.revokeObjectURL(url);
        toast.success("PDF gerado com sucesso!");
      } catch (err: any) {
        toast.error(err.message || "Erro ao gerar PDF");
      } finally {
        setGeneratingId(null);
      }
    },
    [utils]
  );

  // Export CSV
  const exportCSV = useCallback(() => {
    const headers = ["Data", ...actualQuestions.map((q) => q.title), "Status Validação"];
    const rows = filteredResponses.map((r: any) => {
      const answers = (r.answers ?? {}) as Record<string, any>;
      return [
        new Date(r.createdAt).toLocaleString("pt-BR"),
        ...actualQuestions.map((q) => answers[q.id] || ""),
        r.validationStatus || "pending",
      ];
    });

    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell: any) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formTitle.replace(/\s+/g, "_")}_respostas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredResponses, actualQuestions, formTitle]);

  // Loading state
  if (!formId) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 bg-card">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6 rounded-2xl bg-brand-lighter flex items-center justify-center">
            <ClipboardList size={36} className="text-brand/50 sm:hidden" />
            <ClipboardList size={44} className="text-brand/50 hidden sm:block" />
          </div>
          <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2 sm:mb-3">
            Salve o formulário primeiro
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Publique o formulário para começar a receber respostas.
          </p>
        </motion.div>
      </div>
    );
  }

  if (responsesQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-card">
        <Loader2 size={32} className="text-brand animate-spin" />
      </div>
    );
  }

  // Empty state
  if (responses.length === 0 && !searchQuery) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 bg-card">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6 rounded-2xl bg-brand-lighter flex items-center justify-center">
            <ClipboardList size={36} className="text-brand/50 sm:hidden" />
            <ClipboardList size={44} className="text-brand/50 hidden sm:block" />
          </div>
          <h3 className="text-lg sm:text-xl font-display font-bold text-foreground mb-2 sm:mb-3">
            Nenhuma resposta ainda
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compartilhe o formulário para começar a receber respostas.
          </p>
        </motion.div>
      </div>
    );
  }

  const validatingResponse = validatingResponseId
    ? responses.find((r: any) => r.id === validatingResponseId)
    : null;

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-800">
            <ShieldCheck size={11} /> Aprovado
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
            <ShieldAlert size={11} /> Reprovado
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800">
            <Shield size={11} /> Em revisão
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-secondary text-muted-foreground border border-border">
            <Shield size={11} /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-card">
      {/* ─── Header ─── */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 shrink-0">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-display font-bold text-foreground">Respostas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {filteredResponses.length} resposta{filteredResponses.length !== 1 ? "s" : ""} encontrada{filteredResponses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => responsesQuery.refetch()}
              className="p-2 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-muted-foreground border border-border hover:bg-secondary transition-all"
              title="Atualizar"
            >
              <Loader2
                size={14}
                className={responsesQuery.isFetching ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-body font-medium text-foreground border border-border hover:bg-secondary hover:border-brand/20 transition-all"
            >
              <FileSpreadsheet size={14} />
              <span className="hidden sm:inline">Exportar CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          </div>
        </div>

        {/* Stats cards — 2x2 on mobile, 5 cols on desktop */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-4">
          {[
            { label: "Total", value: responses.length, color: "text-brand" },
            {
              label: "Aprovados",
              value: responses.filter((r: any) => r.validationStatus === "approved").length,
              color: "text-emerald-600",
            },
            {
              label: "Reprovados",
              value: responses.filter((r: any) => r.validationStatus === "rejected").length,
              color: "text-red-600",
            },
            {
              label: "Em revisão",
              value: responses.filter((r: any) => r.validationStatus === "in_review").length,
              color: "text-blue-600",
            },
            {
              label: "Pendentes",
              value: responses.filter(
                (r: any) => !r.validationStatus || r.validationStatus === "pending"
              ).length,
              color: "text-amber-600",
            },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`bg-secondary/50 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-2 sm:py-2.5 border border-border/50 ${
                i >= 3 ? "hidden sm:block" : ""
              }`}
            >
              <p className="text-[9px] sm:text-[10px] font-body text-muted-foreground truncate">{stat.label}</p>
              <p className={`text-lg sm:text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters — stacked on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar nas respostas..."
              className="w-full pl-9 pr-4 py-2 rounded-lg sm:rounded-xl text-sm font-body bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand/30 transition-colors"
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm font-body font-medium border transition-all ${
                dateFilter !== "all"
                  ? "bg-brand-lighter text-brand border-brand/20"
                  : "text-muted-foreground border-border hover:bg-secondary"
              }`}
            >
              <Calendar size={14} />
              {dateFilter === "all"
                ? "Período"
                : dateFilter === "today"
                ? "Hoje"
                : dateFilter === "7days"
                ? "7 dias"
                : "30 dias"}
              <ChevronDown size={12} />
            </button>

            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full right-0 mt-1 bg-card rounded-xl border border-border shadow-xl z-50 py-1 min-w-[160px]"
                >
                  {(
                    [
                      ["all", "Todos os períodos"],
                      ["today", "Hoje"],
                      ["7days", "Últimos 7 dias"],
                      ["30days", "Últimos 30 dias"],
                    ] as [DateFilter, string][]
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setDateFilter(key);
                        setShowDatePicker(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm font-body transition-colors ${
                        dateFilter === key
                          ? "bg-brand-lighter text-brand font-medium"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Content: Cards on mobile, Table on desktop ─── */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        {/* Mobile: Card list */}
        <div className="sm:hidden p-3 space-y-2.5">
          {paginatedResponses.map((resp: any) => (
            <ResponseCard
              key={resp.id}
              response={resp}
              questions={questions}
              onValidate={setValidatingResponseId}
              onGeneratePdf={handleGenerateFicha}
              isGenerating={generatingId === resp.id}
              getStatusBadge={getStatusBadge}
            />
          ))}

          {filteredResponses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Filter size={28} className="text-muted-foreground/20 mb-3" />
              <p className="text-sm font-body text-muted-foreground">
                Nenhuma resposta encontrada.
              </p>
            </div>
          )}
        </div>

        {/* Desktop: Table */}
        <table className="w-full hidden sm:table">
          <thead className="sticky top-0 bg-secondary/80 backdrop-blur-sm z-10">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[140px]">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Data
                  <ArrowUpDown size={11} className={sortField === "createdAt" ? "text-brand" : ""} />
                </button>
              </th>
              {visibleColumns.map((q) => (
                <th
                  key={q.id}
                  className="text-left px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border"
                >
                  <button
                    onClick={() => handleSort(q.id)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors max-w-[160px] truncate"
                  >
                    {q.title}
                    <ArrowUpDown
                      size={11}
                      className={`shrink-0 ${sortField === q.id ? "text-brand" : ""}`}
                    />
                  </button>
                </th>
              ))}
              <th className="text-left px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[110px]">
                Validação
              </th>
              <th className="text-right px-4 py-3 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider border-b border-border w-[180px]">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedResponses.map((resp: any, idx: number) => {
              const answers = (resp.answers ?? {}) as Record<string, any>;
              const isValidated = resp.validationStatus === "approved";
              const isGenerating = generatingId === resp.id;

              return (
                <motion.tr
                  key={resp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors group"
                >
                  <td className="px-4 py-3 text-sm font-body text-muted-foreground whitespace-nowrap">
                    {new Date(resp.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                    <span className="ml-1 text-xs text-muted-foreground/50">
                      {new Date(resp.createdAt).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </td>
                  {visibleColumns.map((q) => (
                    <td
                      key={q.id}
                      className="px-4 py-3 text-sm font-body text-foreground max-w-[180px] truncate"
                    >
                      {answers[q.id] || "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3">{getStatusBadge(resp.validationStatus)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setValidatingResponseId(resp.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium text-brand bg-brand-lighter/50 hover:bg-brand-lighter border border-brand/20 transition-all"
                        title="Validar respostas"
                      >
                        <Shield size={12} />
                        Validar
                      </button>
                      <button
                        onClick={() => {
                          if (!isValidated) {
                            toast.info("Validação necessária", {
                              description: "Valide todas as respostas antes de gerar o PDF.",
                            });
                            return;
                          }
                          handleGenerateFicha(resp.id);
                        }}
                        disabled={isGenerating}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium transition-all ${
                          isValidated
                            ? "text-white bg-brand hover:bg-brand/90"
                            : "text-muted-foreground bg-muted cursor-not-allowed"
                        }`}
                        title={isValidated ? "Gerar ficha PDF" : "Valide a resposta antes"}
                      >
                        {isGenerating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : !isValidated ? (
                          <Lock size={12} />
                        ) : (
                          <FileText size={12} />
                        )}
                        {isGenerating ? "..." : "PDF"}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {/* Desktop empty state */}
        {filteredResponses.length === 0 && (
          <div className="hidden sm:flex flex-col items-center justify-center py-20 text-center">
            <Filter size={32} className="text-muted-foreground/20 mb-4" />
            <p className="text-sm font-body text-muted-foreground">
              Nenhuma resposta encontrada com os filtros atuais.
            </p>
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="border-t border-border px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0 bg-card">
          <p className="text-[10px] sm:text-xs font-body text-muted-foreground">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredResponses.length)} de {filteredResponses.length}
          </p>
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Smart page numbers: show pages around current
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[11px] sm:text-xs font-body font-medium transition-all ${
                    page === currentPage
                      ? "bg-brand text-white"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Validation Drawer ─── */}
      <AnimatePresence>
        {validatingResponse && (
          <ValidationDrawer
            response={validatingResponse}
            questions={questions}
            onClose={() => setValidatingResponseId(null)}
            formId={formId!}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
