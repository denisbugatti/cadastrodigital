/**
 * FormFlow Responses Panel — Real Data Dashboard
 * Tabela de respostas reais do backend com validação campo a campo,
 * justificativa para reprovação, e geração de PDF apenas quando aprovado.
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

/* ─── Validation Drawer (Clean Redesign) ─── */
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

  // Status indicator dot
  const StatusDot = ({ status }: { status?: string }) => {
    if (status === "approved") return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />;
    if (status === "rejected") return <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />;
    return <div className="w-2.5 h-2.5 rounded-full bg-gray-300 shrink-0" />;
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-[520px] bg-white z-50 flex flex-col shadow-[-8px_0_30px_rgba(0,0,0,0.08)]"
      >
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="text-lg font-display font-bold text-gray-900 tracking-tight">
                Validação
              </h3>
              <p className="text-[13px] text-gray-400 mt-1">
                Resposta de {new Date(response.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-display font-bold text-gray-900">{totalFields}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Total</p>
            </div>
            <div className="flex-1 bg-emerald-50 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-display font-bold text-emerald-600">{approvedFields}</p>
              <p className="text-[11px] text-emerald-500 mt-0.5">Aprovados</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-display font-bold text-red-600">{rejectedFields}</p>
              <p className="text-[11px] text-red-400 mt-0.5">Reprovados</p>
            </div>
            <div className="flex-1 bg-amber-50 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-display font-bold text-amber-600">{pendingFields}</p>
              <p className="text-[11px] text-amber-500 mt-0.5">Pendentes</p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-6" />

        {/* ── Fields list ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
                {/* Field label row */}
                <div className="flex items-center gap-2.5 mb-2">
                  <StatusDot status={validation?.status} />
                  <span className="text-[13px] font-medium text-gray-500">
                    {q.title}
                  </span>
                </div>

                {/* Answer card */}
                <div
                  className={`ml-5 rounded-xl border transition-all ${
                    isApproved
                      ? "border-emerald-200 bg-emerald-50/40"
                      : isRejected
                      ? "border-red-200 bg-red-50/40"
                      : "border-gray-150 bg-gray-50/50 hover:border-gray-200"
                  }`}
                >
                  {/* Content */}
                  <div className="px-4 py-3">
                    {isFile && questionFiles.length > 0 ? (
                      <div className="space-y-3">
                        {questionFiles.map((file: any) => {
                          const isImage = file.mimeType?.startsWith("image/");
                          const isPdf = file.mimeType === "application/pdf";
                          return (
                            <div key={file.id} className="space-y-2">
                              {/* File info row */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 min-w-0">
                                  {isImage ? (
                                    <ImageIcon size={14} className="text-blue-500 shrink-0" />
                                  ) : isPdf ? (
                                    <FileText size={14} className="text-red-500 shrink-0" />
                                  ) : (
                                    <FileIcon size={14} className="text-gray-400 shrink-0" />
                                  )}
                                  <span className="text-[12px] font-medium text-gray-600 truncate">{file.filename || "Arquivo"}</span>
                                </div>
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-brand transition-colors shrink-0"
                                >
                                  <ExternalLink size={12} /> Abrir
                                </a>
                              </div>

                              {/* Inline expanded preview */}
                              {isImage ? (
                                <button
                                  onClick={() => setExpandedImage(file.url)}
                                  className="block w-full rounded-lg overflow-hidden bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all cursor-zoom-in"
                                >
                                  <img
                                    src={file.url}
                                    alt={file.filename}
                                    className="w-full max-h-[280px] object-contain"
                                    loading="lazy"
                                  />
                                </button>
                              ) : isPdf ? (
                                <div className="w-full rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                                  <iframe
                                    src={`${file.url}#toolbar=0&navpanes=0`}
                                    className="w-full h-[320px]"
                                    title={file.filename || "PDF Preview"}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                  <FileIcon size={28} className="text-gray-300 shrink-0" />
                                  <div className="min-w-0">
                                    <p className="text-sm text-gray-600 truncate">{file.filename || "Arquivo"}</p>
                                    <p className="text-[11px] text-gray-400">{file.mimeType} • Clique em "Abrir" para visualizar</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-[14px] text-gray-800 leading-relaxed">
                        {(() => {
                          // Format answer nicely based on type
                          if (typeof answer === "string") return <p>{answer}</p>;
                          if (Array.isArray(answer)) {
                            return (
                              <div className="flex flex-wrap gap-1.5">
                                {answer.map((item: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-[13px] rounded-lg"
                                  >
                                    {typeof item === "object" ? (item?.label || item?.value || item?.text || Object.values(item).join(", ")) : String(item)}
                                  </span>
                                ))}
                              </div>
                            );
                          }
                          if (typeof answer === "object" && answer !== null) {
                            const entries = Object.entries(answer).filter(([_, v]) => v !== null && v !== undefined && v !== "");
                            if (entries.length === 0) return <p className="text-gray-400 italic">Sem resposta</p>;
                            return (
                              <div className="space-y-1">
                                {entries.map(([key, val]) => (
                                  <div key={key} className="flex items-baseline gap-2">
                                    <span className="text-[12px] text-gray-400 font-medium capitalize shrink-0">{key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}:</span>
                                    <span className="text-[13px] text-gray-700">{String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          if (typeof answer === "boolean") return <p>{answer ? "Sim" : "N\u00e3o"}</p>;
                          if (typeof answer === "number") return <p>{answer}</p>;
                          return <p>{String(answer)}</p>;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Rejection reason */}
                  {isRejected && validation.justification && (
                    <div className="mx-4 mb-3 px-3 py-2 bg-red-50 rounded-lg">
                      <p className="text-[12px] text-red-600 leading-relaxed">
                        <span className="font-semibold">Motivo:</span> {validation.justification}
                      </p>
                    </div>
                  )}

                  {/* Action bar */}
                  <div className="flex items-center border-t border-gray-100 divide-x divide-gray-100">
                    <button
                      onClick={() => handleApprove(q.id)}
                      disabled={validateMutation.isPending}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium transition-all rounded-bl-xl ${
                        isApproved
                          ? "text-emerald-700 bg-emerald-50"
                          : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/50"
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      {isApproved ? "Aprovado" : "Aprovar"}
                    </button>
                    <button
                      onClick={() => handleReject(q.id)}
                      disabled={validateMutation.isPending}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium transition-all rounded-br-xl ${
                        isRejected
                          ? "text-red-700 bg-red-50"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50/50"
                      }`}
                    >
                      <XCircle size={15} />
                      {isRejected ? "Reprovado" : "Reprovar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-gray-100 shrink-0">
          {response.validationStatus === "approved" ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Cadastro Aprovado</p>
                <p className="text-[12px] text-emerald-600">PDF disponível para download</p>
              </div>
            </div>
          ) : response.validationStatus === "rejected" ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <XCircle size={18} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-red-800">Campos Reprovados</p>
                <p className="text-[12px] text-red-600">O cliente precisa corrigir os itens reprovados</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 bg-amber-50/70 rounded-xl">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Shield size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">Validação em andamento</p>
                <p className="text-[12px] text-amber-600">{pendingFields} campo{pendingFields !== 1 ? "s" : ""} pendente{pendingFields !== 1 ? "s" : ""} de revisão</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Rejection justification modal ── */}
      <AnimatePresence>
        {rejectingField && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[60]"
              onClick={() => setRejectingField(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px] bg-white sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-200 shadow-2xl z-[61] p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <XCircle size={20} className="text-red-500" />
                </div>
                <div>
                  <h4 className="text-base font-display font-bold text-gray-900">
                    Reprovar campo
                  </h4>
                  <p className="text-[13px] text-gray-400">
                    Informe o motivo ao cliente
                  </p>
                </div>
              </div>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Documento ilegível, informação incorreta..."
                className="w-full px-4 py-3 rounded-xl text-sm bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 resize-none transition-all"
                rows={3}
                autoFocus
              />
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setRejectingField(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-150 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmReject}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all"
                >
                  Confirmar
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
              className="fixed inset-8 z-[71] flex items-center justify-center"
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

  // Fetch real responses from backend
  const responsesQuery = trpc.responses.listByForm.useQuery(
    { formId: formId!, search: searchQuery || undefined },
    { enabled: !!formId, staleTime: 10000 }
  );

  const responses = responsesQuery.data ?? [];
  const utils = trpc.useUtils();

  // Columns to show in table (max 4 for readability + date + status)
  const visibleColumns = useMemo(() => {
    return actualQuestions.slice(0, 4);
  }, [actualQuestions]);

  // Filter responses
  const filteredResponses = useMemo(() => {
    let filtered = [...responses];

    // Date filter
    const now = new Date();
    if (dateFilter === "today") {
      filtered = filtered.filter((r: any) => {
        const d = new Date(r.createdAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (dateFilter === "7days") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r: any) => new Date(r.createdAt) >= weekAgo);
    } else if (dateFilter === "30days") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter((r: any) => new Date(r.createdAt) >= monthAgo);
    }

    // Sort
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
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-brand-lighter flex items-center justify-center">
            <ClipboardList size={44} className="text-brand/50" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-3">
            Salve o formulário primeiro
          </h3>
          <p className="text-base text-muted-foreground mb-8">
            Publique o formulário para começar a receber respostas.
          </p>
        </motion.div>
      </div>
    );
  }

  if (responsesQuery.isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <Loader2 size={32} className="text-brand animate-spin" />
      </div>
    );
  }

  // Empty state
  if (responses.length === 0 && !searchQuery) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-brand-lighter flex items-center justify-center">
            <ClipboardList size={44} className="text-brand/50" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground mb-3">
            Nenhuma resposta ainda
          </h3>
          <p className="text-base text-muted-foreground mb-8">
            Compartilhe o formulário para começar a receber respostas.
          </p>
        </motion.div>
      </div>
    );
  }

  const validatingResponse = validatingResponseId
    ? responses.find((r: any) => r.id === validatingResponseId)
    : null;

  // Get validation status label and style
  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-green-50 text-green-700 border border-green-100">
            <ShieldCheck size={11} /> Aprovado
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-red-50 text-red-700 border border-red-100">
            <ShieldAlert size={11} /> Reprovado
          </span>
        );
      case "in_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-blue-50 text-blue-700 border border-blue-100">
            <Shield size={11} /> Em revisão
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-body font-medium bg-gray-50 text-gray-600 border border-gray-100">
            <Shield size={11} /> Pendente
          </span>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ─── Header with stats ─── */}
      <div className="border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Respostas</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredResponses.length} resposta{filteredResponses.length !== 1 ? "s" : ""} encontrada
              {filteredResponses.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => responsesQuery.refetch()}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-body font-medium text-muted-foreground border border-border hover:bg-secondary transition-all"
              title="Atualizar"
            >
              <Loader2
                size={14}
                className={responsesQuery.isFetching ? "animate-spin" : ""}
              />
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium text-foreground border border-border hover:bg-secondary hover:border-brand/20 transition-all"
            >
              <FileSpreadsheet size={15} />
              Exportar CSV
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-5 gap-3 mb-4">
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
          ].map((stat) => (
            <div key={stat.label} className="bg-secondary/50 rounded-xl px-3 py-2.5 border border-border/50">
              <p className="text-[10px] font-body text-muted-foreground">{stat.label}</p>
              <p className={`text-xl font-display font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3">
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
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm font-body bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-brand/30 transition-colors"
            />
          </div>

          {/* Date filter */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium border transition-all ${
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
                  className="absolute top-full right-0 mt-1 bg-white rounded-xl border border-border shadow-xl z-50 py-1 min-w-[160px]"
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

      {/* ─── Table ─── */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full">
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
                      {/* Validate button */}
                      <button
                        onClick={() => setValidatingResponseId(resp.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-body font-medium text-brand bg-brand-lighter/50 hover:bg-brand-lighter border border-brand/20 transition-all"
                        title="Validar respostas"
                      >
                        <Shield size={12} />
                        Validar
                      </button>

                      {/* Generate PDF button */}
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
                        {isGenerating ? "..." : !isValidated ? "PDF" : "PDF"}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {filteredResponses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Filter size={32} className="text-muted-foreground/20 mb-4" />
            <p className="text-sm font-body text-muted-foreground">
              Nenhuma resposta encontrada com os filtros atuais.
            </p>
          </div>
        )}
      </div>

      {/* ─── Pagination ─── */}
      {totalPages > 1 && (
        <div className="border-t border-border px-6 py-3 flex items-center justify-between shrink-0 bg-white">
          <p className="text-xs font-body text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1}–
            {Math.min(currentPage * itemsPerPage, filteredResponses.length)} de{" "}
            {filteredResponses.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-body font-medium transition-all ${
                  page === currentPage
                    ? "bg-brand text-white"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {page}
              </button>
            ))}
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
