/**
 * Response Validation Page — Corretor validates each answer/document.
 * After validating all fields, must enter "Projeto de Interesse" to complete.
 * Only after completion can they generate/download/share PDF and manage extra pages.
 */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText,
  Download, Loader2, AlertTriangle, MessageSquare,
  User, Mail, Phone, Calendar, Building2, FileDown,
  Share2, Pencil, Eye, Info, Plus, Trash2, Link2, Copy,
  ExternalLink, Upload, FileImage, X, FilePlus,
} from "lucide-react";

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-medium border border-green-200">
          <CheckCircle2 className="w-3 h-3" /> Aprovado
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-medium border border-red-200">
          <XCircle className="w-3 h-3" /> Reprovado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-medium border border-amber-200">
          <Clock className="w-3 h-3" /> Pendente
        </span>
      );
  }
}

/* ─── Project Name Autocomplete ─── */
function ProjectNameInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const projectNamesQuery = trpc.validations.projectNames.useQuery();
  const names = (projectNamesQuery.data ?? []) as string[];

  const filtered = useMemo(() => {
    if (!filter) return names;
    const q = filter.toLowerCase();
    return names.filter((n) => n.toLowerCase().includes(q));
  }, [names, filter]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
        <Input
          ref={inputRef}
          placeholder="Nome do projeto de interesse..."
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setFilter(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          disabled={disabled}
          className="flex-1"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-6 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((name) => (
            <button
              key={name}
              type="button"
              className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-gray-700 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(name);
                setFilter(name);
                setOpen(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function ResponseValidation() {
  const [, navigate] = useLocation();
  const params = useParams<{ responseId: string }>();
  const responseId = parseInt(params.responseId || "0");

  const [rejectingQuestion, setRejectingQuestion] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [projectName, setProjectName] = useState("");
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfAction, setPdfAction] = useState<"view" | "download" | "share" | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [uploadingExtraPage, setUploadingExtraPage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();

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

  const completeValidationMutation = trpc.validations.completeValidation.useMutation({
    onSuccess: () => {
      toast.success("Validação concluída! Agora você pode gerar o PDF.");
      utils.responses.getById.invalidate({ id: responseId });
      setShowCompleteDialog(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const generateAndUploadMutation = trpc.responses.generateAndUploadPdf.useMutation({
    onSuccess: (data) => {
      setShareUrl(data.pdfUrl);
      utils.responses.getById.invalidate({ id: responseId });
    },
  });

  const addExtraPagesMutation = trpc.responses.addExtraPages.useMutation({
    onSuccess: () => {
      toast.success("Página adicionada ao PDF!");
      utils.responses.getById.invalidate({ id: responseId });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeExtraPageMutation = trpc.responses.removeExtraPage.useMutation({
    onSuccess: () => {
      toast.success("Página removida!");
      utils.responses.getById.invalidate({ id: responseId });
    },
    onError: (err) => toast.error(err.message),
  });

  const fileUploadMutation = trpc.files.upload.useMutation();

  const response = responseQuery.data as any;
  const form = formQuery.data as any;
  const validations = (validationsQuery.data ?? []) as any[];
  const answers = response?.answers as Record<string, any> || {};
  const questions = (form?.questions ?? []) as any[];
  const extraPages = (response?.extraPages ?? []) as Array<{url: string; filename: string; mimeType: string}>;

  // Initialize projectName from response if already set
  useEffect(() => {
    if (response?.projectName) {
      setProjectName(response.projectName);
    }
  }, [response?.projectName]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

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

  // Filter out welcome/thank-you/statement questions for validation
  const answerEntries = useMemo(() => {
    return Object.entries(answers).filter(([qId]) => {
      const q = questionMap[qId];
      if (!q) return true;
      return q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement";
    });
  }, [answers, questionMap]);

  const handleApprove = (questionId: string) => {
    validateMutation.mutate({ responseId, questionId, status: "approved" });
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

  const handleCompleteValidation = () => {
    if (!projectName.trim()) {
      toast.error("Informe o nome do projeto de interesse");
      return;
    }
    completeValidationMutation.mutate({
      responseId,
      projectName: projectName.trim(),
      reviewNotes: reviewNotes.trim() || undefined,
    });
  };

  // Helper: generate PDF bytes from base64
  const fetchPdfBytes = useCallback(async () => {
    const result = await utils.responses.generateFicha.fetch({ responseId });
    if (!result?.base64) throw new Error("PDF vazio");
    const byteCharacters = atob(result.base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return {
      bytes: new Uint8Array(byteNumbers),
      filename: result.filename || "ficha.pdf",
    };
  }, [responseId, utils]);

  const handleViewPdf = async () => {
    setPdfLoading(true);
    setPdfAction("view");
    try {
      const { bytes } = await fetchPdfBytes();
      const blob = new Blob([bytes], { type: "application/pdf" });
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setShowPdfPreview(true);
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + (err.message || "Tente novamente"));
    } finally {
      setPdfLoading(false);
      setPdfAction(null);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    setPdfAction("download");
    try {
      const { bytes, filename } = await fetchPdfBytes();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF baixado com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao gerar PDF: " + (err.message || "Tente novamente"));
    } finally {
      setPdfLoading(false);
      setPdfAction(null);
    }
  };

  const handleSharePdf = async () => {
    setPdfLoading(true);
    setPdfAction("share");
    try {
      // If we already have a share URL and response hasn't changed, use it
      if (response?.pdfUrl) {
        await navigator.clipboard.writeText(response.pdfUrl);
        setShareUrl(response.pdfUrl);
        toast.success("Link copiado para a área de transferência!");
      } else {
        // Generate, upload to S3, and get shareable URL
        const result = await generateAndUploadMutation.mutateAsync({ responseId });
        await navigator.clipboard.writeText(result.pdfUrl);
        setShareUrl(result.pdfUrl);
        toast.success("PDF gerado e link copiado!");
      }
    } catch (err: any) {
      toast.error("Erro ao compartilhar: " + (err.message || "Tente novamente"));
    } finally {
      setPdfLoading(false);
      setPdfAction(null);
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfBlobUrl) {
      window.open(pdfBlobUrl, "_blank");
    }
  };

  // Extra pages upload handler
  const handleExtraPageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingExtraPage(true);
    try {
      const pages: Array<{url: string; filename: string; mimeType: string}> = [];

      for (const file of Array.from(files)) {
        // Validate file type
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowed.includes(file.type)) {
          toast.error(`Tipo não suportado: ${file.name}. Use PDF, JPG ou PNG.`);
          continue;
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Arquivo muito grande: ${file.name}. Máximo 10MB.`);
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]); // Remove data:xxx;base64, prefix
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Upload to S3 via files.upload
        const uploadResult = await fileUploadMutation.mutateAsync({
          responseId,
          context: "extra-page",
          filename: file.name,
          contentBase64: base64,
          mimeType: file.type,
        });

        pages.push({
          url: uploadResult.url,
          filename: file.name,
          mimeType: file.type,
        });
      }

      if (pages.length > 0) {
        await addExtraPagesMutation.mutateAsync({ responseId, pages });
      }
    } catch (err: any) {
      toast.error("Erro ao enviar arquivo: " + (err.message || "Tente novamente"));
    } finally {
      setUploadingExtraPage(false);
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveExtraPage = async (index: number) => {
    removeExtraPageMutation.mutate({ responseId, pageIndex: index });
  };

  const isLoading = responseQuery.isLoading || formQuery.isLoading;
  const isValidated = response?.validationStatus === "approved";

  // Check if all answers have been individually validated
  const allAnswersValidated = useMemo(() => {
    if (answerEntries.length === 0) return false;
    return answerEntries.every(([qId]) => {
      const v = validationMap[qId];
      return v && v.status !== "pending";
    });
  }, [answerEntries, validationMap]);

  const hasRejections = validations.some((v: any) => v.status === "rejected");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Resposta não encontrada</p>
          <Button variant="outline" onClick={() => navigate(-1 as any)} className="mt-4">
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Count stats
  const totalQuestions = answerEntries.length;
  const approvedCount = validations.filter((v: any) => v.status === "approved").length;
  const rejectedCount = validations.filter((v: any) => v.status === "rejected").length;
  const pendingCount = totalQuestions - approvedCount - rejectedCount;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1 as any)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Validar Resposta</h1>
                <p className="text-sm text-gray-500">
                  Protocolo: <span className="font-mono text-gray-700">{response.protocolCode || `#${response.id}`}</span>
                </p>
              </div>
            </div>
            {/* Validated badge */}
            {isValidated && (
              <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Validado
              </Badge>
            )}
          </div>

          {/* Respondent info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            {response.respondentName && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> {response.respondentName}
              </span>
            )}
            {response.respondentEmail && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {response.respondentEmail}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {new Date(response.createdAt).toLocaleDateString("pt-BR")}
            </span>
            {response.projectName && (
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-blue-600 font-medium">{response.projectName}</span>
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">{approvedCount} aprovados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">{rejectedCount} reprovados</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-gray-600">{pendingCount} pendentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Answers list */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {answerEntries.map(([questionId, answer]) => {
          const question = questionMap[questionId];
          const validation = validationMap[questionId];
          const status = validation?.status || "pending";
          const isFile = question?.type === "file-upload" || question?.type === "file" || question?.type === "image";

          // Format answer for display
          let displayAnswer: React.ReactNode;

          const renderFileLink = (url: string, filename: string) => {
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              return (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={url} alt={filename} className="max-w-xs rounded-lg border border-gray-200" />
                </a>
              );
            } else if (url.match(/\.(pdf)$/i)) {
              return (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-blue-600 hover:bg-gray-200 transition-colors"
                >
                  <FileText className="w-4 h-4" /> {filename}
                </a>
              );
            } else {
              return (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-blue-600 hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" /> {filename}
                </a>
              );
            }
          };

          if (typeof answer === "object" && answer !== null) {
            if (answer.url) {
              displayAnswer = renderFileLink(answer.url as string, answer.filename || answer.name || "Arquivo");
            } else if (Array.isArray(answer)) {
              const hasFiles = answer.some((item: any) => typeof item === "object" && item?.url);
              if (hasFiles) {
                displayAnswer = (
                  <div className="space-y-2">
                    {answer.map((item: any, idx: number) => (
                      <div key={idx}>
                        {typeof item === "object" && item?.url
                          ? renderFileLink(item.url, item.filename || item.name || `Arquivo ${idx + 1}`)
                          : <span className="text-sm text-gray-600">{String(item)}</span>
                        }
                      </div>
                    ))}
                  </div>
                );
              } else {
                displayAnswer = answer.join(", ");
              }
            } else {
              displayAnswer = Object.entries(answer)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ");
            }
          } else if (typeof answer === "string" && answer.startsWith("http")) {
            if (answer.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
              displayAnswer = (
                <a href={answer} target="_blank" rel="noopener noreferrer" className="block">
                  <img src={answer} alt="Documento" className="max-w-xs rounded-lg border border-gray-200" />
                </a>
              );
            } else {
              displayAnswer = (
                <a href={answer} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-blue-600 hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" /> Ver arquivo
                </a>
              );
            }
          } else {
            displayAnswer = String(answer ?? "");
          }

          return (
            <div
              key={questionId}
              className={`bg-white rounded-xl border p-5 transition-all ${
                status === "approved"
                  ? "border-green-200 bg-green-50/30"
                  : status === "rejected"
                    ? "border-red-200 bg-red-50/30"
                    : "border-gray-200"
              }`}
            >
              {/* Question label */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs text-gray-400 mb-1">
                    {isFile ? "📎 Arquivo" : "📝 Resposta"}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {question?.title || question?.label || `Pergunta ${questionId}`}
                  </h3>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Validation guidance */}
              {question?.validationGuidance && (
                <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Orientação para validação:
                  </p>
                  <p className="text-sm text-blue-700">{question.validationGuidance}</p>
                </div>
              )}

              {/* Answer content */}
              <div className="mb-4">
                {typeof displayAnswer === "string" ? (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {displayAnswer || <span className="text-gray-400 italic">Sem resposta</span>}
                  </p>
                ) : (
                  displayAnswer
                )}
              </div>

              {/* Rejection justification */}
              {status === "rejected" && validation?.justification && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Justificativa:
                  </p>
                  <p className="text-sm text-red-700">{validation.justification}</p>
                </div>
              )}

              {/* Action buttons */}
              {!isValidated && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={status === "approved" ? "default" : "outline"}
                    className={status === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => handleApprove(questionId)}
                    disabled={validateMutation.isPending}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {status === "approved" ? "Aprovado" : "Aprovar"}
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "rejected" ? "destructive" : "outline"}
                    onClick={() => {
                      setRejectingQuestion(questionId);
                      setJustification(validation?.justification || "");
                    }}
                    disabled={validateMutation.isPending}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    {status === "rejected" ? "Reprovado" : "Reprovar"}
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {answerEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhuma resposta para validar</p>
          </div>
        )}

        {/* ─── Complete Validation Section ─── */}
        {!isValidated && allAnswersValidated && !hasRejections && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Todas as respostas foram validadas
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Para concluir a validação, informe o projeto de interesse do cliente. Após a conclusão, você poderá gerar o PDF.
            </p>
            <div className="space-y-3">
              <ProjectNameInput
                value={projectName}
                onChange={setProjectName}
              />
              <Textarea
                placeholder="Observações adicionais (opcional)..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                className="bg-white"
              />
              <Button
                onClick={handleCompleteValidation}
                disabled={completeValidationMutation.isPending || !projectName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {completeValidationMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Concluir Validação
              </Button>
            </div>
          </div>
        )}

        {/* ─── PDF Actions (only after validation is complete) ─── */}
        {isValidated && (
          <div className="mt-8 space-y-6">
            {/* Validated status card */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Cadastro Validado
              </h3>
              <p className="text-sm text-green-700 mb-1">
                Projeto: <span className="font-semibold">{response.projectName || "N/A"}</span>
              </p>
              {response.reviewNotes && (
                <p className="text-sm text-green-600 mb-4">
                  Obs: {response.reviewNotes}
                </p>
              )}

              {/* PDF action buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  onClick={handleViewPdf}
                  disabled={pdfLoading}
                  variant="outline"
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-100"
                >
                  {pdfLoading && pdfAction === "view" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Visualizar PDF
                </Button>
                <Button
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading}
                  className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {pdfLoading && pdfAction === "download" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  Baixar PDF
                </Button>
                <Button
                  onClick={handleSharePdf}
                  disabled={pdfLoading}
                  variant="outline"
                  className="gap-2 border-green-300 text-green-700 hover:bg-green-100"
                >
                  {pdfLoading && pdfAction === "share" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                  Copiar Link
                </Button>
              </div>

              {/* Share URL display */}
              {(shareUrl || response.pdfUrl) && (
                <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                    <Link2 className="w-3 h-3" /> Link público do PDF:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      value={shareUrl || response.pdfUrl}
                      className="flex-1 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1.5 border border-gray-200 font-mono truncate"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 w-7 p-0"
                      onClick={async () => {
                        await navigator.clipboard.writeText(shareUrl || response.pdfUrl);
                        toast.success("Link copiado!");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 w-7 p-0"
                      onClick={() => window.open(shareUrl || response.pdfUrl, "_blank")}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ─── Extra Pages Section ─── */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <FilePlus className="w-5 h-5 text-blue-500" />
                Páginas Extras do PDF
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Adicione documentos ou imagens que serão anexados ao final do PDF gerado. Formatos aceitos: PDF, JPG, PNG (máx. 10MB).
              </p>

              {/* Existing extra pages */}
              {extraPages.length > 0 && (
                <div className="space-y-2 mb-4">
                  {extraPages.map((page, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        {page.mimeType === "application/pdf" ? (
                          <FileText className="w-4 h-4 text-blue-500" />
                        ) : (
                          <FileImage className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{page.filename}</p>
                        <p className="text-xs text-gray-400">{page.mimeType}</p>
                      </div>
                      <a
                        href={page.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={() => handleRemoveExtraPage(index)}
                        disabled={removeExtraPageMutation.isPending}
                      >
                        {removeExtraPageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={handleExtraPageUpload}
              />
              <Button
                variant="outline"
                className="gap-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingExtraPage}
              >
                {uploadingExtraPage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {uploadingExtraPage ? "Enviando..." : "Adicionar Página"}
              </Button>

              {extraPages.length > 0 && (
                <p className="text-xs text-gray-400 mt-3">
                  {extraPages.length} página{extraPages.length !== 1 ? "s" : ""} extra{extraPages.length !== 1 ? "s" : ""} adicionada{extraPages.length !== 1 ? "s" : ""}. 
                  Ao gerar o PDF novamente, estas páginas serão incluídas automaticamente.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── PDF Preview Dialog ─── */}
      <Dialog open={showPdfPreview} onOpenChange={setShowPdfPreview}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Pré-visualização do PDF</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="w-3 h-3" />
                Abrir em nova aba
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7"
                onClick={handleDownloadPdf}
                disabled={pdfLoading}
              >
                <FileDown className="w-3 h-3" />
                Baixar
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            {pdfBlobUrl && (
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border-0"
                title="PDF Preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Dialog ─── */}
      <Dialog open={!!rejectingQuestion} onOpenChange={() => setRejectingQuestion(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovar Resposta</DialogTitle>
            <DialogDescription>
              Informe o motivo da reprovação. O cliente receberá esta justificativa por email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Ex: Documento ilegível, favor reenviar com melhor qualidade..."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingQuestion(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={validateMutation.isPending}
            >
              {validateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" /> Reprovar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
