/**
 * Response Validation Page — Corretor validates each answer/document.
 * Approve with a check or reject with justification.
 * Improved UX: progress bar, approve all, better file previews, clear status per field.
 */

import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, FileText,
  Image as ImageIcon, Download, Loader2, AlertTriangle, MessageSquare,
  Shield, User, Mail, Phone, Calendar, CheckCheck, Eye,
  File, Paperclip, ExternalLink, RotateCcw,
} from "lucide-react";

/* ─── Status Badge ─── */
function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovado
        </span>
      );
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
          <XCircle className="w-3.5 h-3.5" /> Reprovado
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Pendente
        </span>
      );
  }
}

/* ─── File/Image Preview ─── */
function FilePreview({ url, questionType }: { url: string; questionType?: string }) {
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i) || questionType === "image";
  const isPdf = url.match(/\.pdf(\?|$)/i);
  const fileName = url.split("/").pop()?.split("?")[0] || "arquivo";

  if (isImage) {
    return (
      <div className="space-y-2">
        <a href={url} target="_blank" rel="noopener noreferrer" className="block group relative">
          <img
            src={url}
            alt="Documento"
            className="max-w-sm max-h-64 rounded-lg border border-gray-200 object-contain bg-gray-50 transition-all group-hover:shadow-lg"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-all flex items-center justify-center">
            <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </a>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Abrir em nova aba
        </a>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="flex items-center gap-3 p-3 bg-red-50/50 border border-red-100 rounded-lg">
        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
          <p className="text-xs text-gray-500">Documento PDF</p>
        </div>
        <div className="flex gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Visualizar
          </a>
          <a
            href={url}
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Baixar
          </a>
        </div>
      </div>
    );
  }

  // Generic file
  return (
    <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
        <Paperclip className="w-5 h-5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{fileName}</p>
        <p className="text-xs text-gray-500">Arquivo anexado</p>
      </div>
      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> Abrir
        </a>
        <a
          href={url}
          download
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Baixar
        </a>
      </div>
    </div>
  );
}

/* ─── Answer Display ─── */
function AnswerDisplay({ answer, question }: { answer: any; question: any }) {
  const isFile = question?.type === "file" || question?.type === "image" || question?.type === "document";

  // File/image answer
  if (isFile && typeof answer === "string" && answer.startsWith("http")) {
    return <FilePreview url={answer} questionType={question?.type} />;
  }

  // Array of files
  if (isFile && Array.isArray(answer)) {
    return (
      <div className="space-y-2">
        {answer.map((file: any, i: number) => {
          const url = typeof file === "string" ? file : file?.url || file?.path;
          if (!url) return null;
          return <FilePreview key={i} url={url} questionType={question?.type} />;
        })}
      </div>
    );
  }

  // Multiple choice / array answer
  if (Array.isArray(answer)) {
    return (
      <div className="flex flex-wrap gap-2">
        {answer.map((item: any, i: number) => (
          <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // Object answer (e.g., address, compound fields)
  if (typeof answer === "object" && answer !== null) {
    return (
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-1">
        {Object.entries(answer).map(([key, val]) => (
          <div key={key} className="flex gap-2 text-sm">
            <span className="text-gray-500 font-medium min-w-[100px]">{key}:</span>
            <span className="text-gray-700">{String(val ?? "—")}</span>
          </div>
        ))}
      </div>
    );
  }

  // Text answer
  const text = String(answer ?? "");
  if (!text) {
    return (
      <p className="text-sm text-gray-400 italic bg-gray-50 rounded-lg p-3 border border-gray-100">
        Sem resposta
      </p>
    );
  }

  return (
    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 border border-gray-100 whitespace-pre-wrap">
      {text}
    </p>
  );
}

/* ─── Progress Bar ─── */
function ValidationProgress({
  total,
  approved,
  rejected,
  pending,
}: {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
}) {
  const approvedPct = total > 0 ? (approved / total) * 100 : 0;
  const rejectedPct = total > 0 ? (rejected / total) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Progress bar */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
        {approvedPct > 0 && (
          <div
            className="bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${approvedPct}%` }}
          />
        )}
        {rejectedPct > 0 && (
          <div
            className="bg-red-400 transition-all duration-500 ease-out"
            style={{ width: `${rejectedPct}%` }}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="text-gray-600 font-medium">{approved} aprovados</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-gray-600 font-medium">{rejected} reprovados</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span className="text-gray-600 font-medium">{pending} pendentes</span>
        </span>
        <span className="ml-auto text-gray-500">
          {approved + rejected}/{total} validados
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function ResponseValidation() {
  const [, navigate] = useLocation();
  const params = useParams<{ responseId: string }>();
  const responseId = parseInt(params.responseId || "0");

  const [rejectingQuestion, setRejectingQuestion] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [approvingAll, setApprovingAll] = useState(false);

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
      utils.validations.byResponse.invalidate({ responseId });
      utils.responses.getById.invalidate({ id: responseId });
      setRejectingQuestion(null);
      setJustification("");
    },
    onError: (err) => toast.error(err.message),
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

  // Get ordered question IDs (follow form question order, then any extras from answers)
  const orderedQuestionIds = useMemo(() => {
    const fromForm = questions.map((q: any) => q.id).filter((id: string) => id in answers);
    const extras = Object.keys(answers).filter((id) => !fromForm.includes(id));
    return [...fromForm, ...extras];
  }, [questions, answers]);

  const handleApprove = (questionId: string) => {
    validateMutation.mutate({
      responseId,
      questionId,
      status: "approved",
    }, {
      onSuccess: () => toast.success("Campo aprovado!"),
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
    }, {
      onSuccess: () => toast.success("Campo reprovado com justificativa"),
    });
  };

  const handleApproveAll = async () => {
    const pendingIds = orderedQuestionIds.filter(
      (qId) => !validationMap[qId] || validationMap[qId].status === "pending"
    );
    if (pendingIds.length === 0) {
      toast.info("Todos os campos já foram validados");
      return;
    }
    setApprovingAll(true);
    try {
      for (const qId of pendingIds) {
        await validateMutation.mutateAsync({
          responseId,
          questionId: qId,
          status: "approved",
        });
      }
      toast.success(`${pendingIds.length} campos aprovados!`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao aprovar campos");
    } finally {
      setApprovingAll(false);
    }
  };

  const handleResetValidation = (questionId: string) => {
    // Reset to pending by re-approving (we'll handle this as a re-validation)
    validateMutation.mutate({
      responseId,
      questionId,
      status: "approved",
    });
  };

  const isLoading = responseQuery.isLoading || formQuery.isLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fafbfc] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Carregando dados da resposta...</p>
        </div>
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
  const totalQuestions = orderedQuestionIds.length;
  const approvedCount = validations.filter((v: any) => v.status === "approved").length;
  const rejectedCount = validations.filter((v: any) => v.status === "rejected").length;
  const pendingCount = totalQuestions - approvedCount - rejectedCount;
  const allValidated = pendingCount === 0;

  // Question type icon
  const getQuestionIcon = (type?: string) => {
    switch (type) {
      case "file":
      case "document":
        return <Paperclip className="w-3.5 h-3.5" />;
      case "image":
        return <ImageIcon className="w-3.5 h-3.5" />;
      default:
        return <FileText className="w-3.5 h-3.5" />;
    }
  };

  const getQuestionTypeLabel = (type?: string) => {
    switch (type) {
      case "file":
      case "document":
        return "Arquivo";
      case "image":
        return "Imagem";
      case "multiple_choice":
      case "checkbox":
        return "Múltipla escolha";
      case "dropdown":
      case "select":
        return "Seleção";
      default:
        return "Resposta";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* ─── Header ─── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1 as any)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 font-display">Validar Resposta</h1>
                <p className="text-sm text-gray-500">
                  Protocolo: <span className="font-mono text-gray-700">{response.protocolCode || `#${response.id}`}</span>
                </p>
              </div>
            </div>

            {/* Approve All button */}
            {pendingCount > 0 && (
              <Button
                onClick={handleApproveAll}
                disabled={approvingAll || validateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                {approvingAll ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Aprovando...</>
                ) : (
                  <><CheckCheck className="w-4 h-4 mr-1.5" /> Aprovar Todos ({pendingCount})</>
                )}
              </Button>
            )}
          </div>

          {/* Respondent info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
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
            {response.respondentPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {response.respondentPhone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {new Date(response.createdAt).toLocaleDateString("pt-BR")}
            </span>
          </div>

          {/* Progress bar */}
          <ValidationProgress
            total={totalQuestions}
            approved={approvedCount}
            rejected={rejectedCount}
            pending={pendingCount}
          />

          {/* All validated banner */}
          {allValidated && (
            <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
              rejectedCount > 0
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-green-50 text-green-700 border border-green-200"
            }`}>
              {rejectedCount > 0 ? (
                <><XCircle className="w-4 h-4" /> Validação concluída com {rejectedCount} campo(s) reprovado(s). O cliente foi notificado.</>
              ) : (
                <><CheckCircle2 className="w-4 h-4" /> Todos os campos foram aprovados! O cliente foi notificado.</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Answers list ─── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {orderedQuestionIds.map((questionId, index) => {
          const answer = answers[questionId];
          const question = questionMap[questionId];
          const validation = validationMap[questionId];
          const status = validation?.status || "pending";
          const isFile = question?.type === "file" || question?.type === "image" || question?.type === "document";

          return (
            <div
              key={questionId}
              className={`bg-white rounded-xl border transition-all shadow-sm hover:shadow-md ${
                status === "approved"
                  ? "border-green-200"
                  : status === "rejected"
                    ? "border-red-200"
                    : "border-gray-200"
              }`}
            >
              {/* Status indicator strip */}
              <div className={`h-1 rounded-t-xl ${
                status === "approved"
                  ? "bg-green-500"
                  : status === "rejected"
                    ? "bg-red-500"
                    : "bg-gray-200"
              }`} />

              <div className="p-5">
                {/* Question header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 font-medium">
                        <span className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                          {index + 1}
                        </span>
                        {getQuestionIcon(question?.type)}
                        {getQuestionTypeLabel(question?.type)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">
                      {question?.title || question?.label || `Pergunta ${questionId}`}
                    </h3>
                    {question?.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{question.description}</p>
                    )}
                  </div>
                  <StatusBadge status={status} />
                </div>

                {/* Answer content */}
                <div className="mb-4">
                  <AnswerDisplay answer={answer} question={question} />
                </div>

                {/* Rejection justification */}
                {status === "rejected" && validation?.justification && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs font-semibold text-red-600 mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" /> Justificativa da reprovação:
                    </p>
                    <p className="text-sm text-red-700">{validation.justification}</p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant={status === "approved" ? "default" : "outline"}
                    className={`transition-all ${
                      status === "approved"
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                    }`}
                    onClick={() => handleApprove(questionId)}
                    disabled={validateMutation.isPending || approvingAll}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    {status === "approved" ? "Aprovado" : "Aprovar"}
                  </Button>
                  <Button
                    size="sm"
                    variant={status === "rejected" ? "destructive" : "outline"}
                    className={`transition-all ${
                      status !== "rejected"
                        ? "hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                        : ""
                    }`}
                    onClick={() => {
                      setRejectingQuestion(questionId);
                      setJustification(validation?.justification || "");
                    }}
                    disabled={validateMutation.isPending || approvingAll}
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5" />
                    {status === "rejected" ? "Reprovado" : "Reprovar"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {orderedQuestionIds.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium">Nenhuma resposta para validar</p>
            <p className="text-xs text-gray-400 mt-1">Esta resposta não contém campos preenchidos</p>
          </div>
        )}
      </div>

      {/* ─── Reject Dialog ─── */}
      <Dialog open={!!rejectingQuestion} onOpenChange={() => setRejectingQuestion(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Reprovar Campo
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da reprovação. Esta justificativa será enviada ao cliente por email para que ele possa corrigir.
            </DialogDescription>
          </DialogHeader>

          {/* Show which question is being rejected */}
          {rejectingQuestion && questionMap[rejectingQuestion] && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-500 mb-0.5">Campo:</p>
              <p className="text-sm font-medium text-gray-800">
                {questionMap[rejectingQuestion]?.title || questionMap[rejectingQuestion]?.label || rejectingQuestion}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Justificativa <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Ex: Documento ilegível, favor reenviar com melhor qualidade. / CPF não confere com o nome informado. / Comprovante de renda desatualizado."
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              rows={4}
              className="resize-none"
            />
            {justification.trim().length === 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> A justificativa é obrigatória para reprovar
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingQuestion(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={validateMutation.isPending || !justification.trim()}
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
