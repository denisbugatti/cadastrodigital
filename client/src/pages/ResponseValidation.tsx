/**
 * Response Validation Page — Corretor validates each answer/document.
 * Approve with a check or reject with justification.
 */

import { useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Image, Download, Loader2, AlertTriangle, MessageSquare,
  Shield, User, Mail, Phone, Calendar,
} from "lucide-react";

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

export default function ResponseValidation() {
  const [, navigate] = useLocation();
  const params = useParams<{ responseId: string }>();
  const responseId = parseInt(params.responseId || "0");

  const [rejectingQuestion, setRejectingQuestion] = useState<string | null>(null);
  const [justification, setJustification] = useState("");

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

  const isLoading = responseQuery.isLoading || formQuery.isLoading;

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
  const totalQuestions = Object.keys(answers).length;
  const approvedCount = validations.filter((v: any) => v.status === "approved").length;
  const rejectedCount = validations.filter((v: any) => v.status === "rejected").length;
  const pendingCount = totalQuestions - approvedCount - rejectedCount;

  return (
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            <button
              onClick={() => navigate(-1 as any)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
            {response.respondentPhone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {response.respondentPhone}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {new Date(response.createdAt).toLocaleDateString("pt-BR")}
            </span>
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
        {Object.entries(answers).map(([questionId, answer]) => {
          const question = questionMap[questionId];
          const validation = validationMap[questionId];
          const status = validation?.status || "pending";
          const isFile = question?.type === "file" || question?.type === "image";
          const answerStr = typeof answer === "object" ? JSON.stringify(answer) : String(answer ?? "");

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
                    {question?.type === "file" ? "📎 Arquivo" : question?.type === "image" ? "🖼️ Imagem" : "📝 Resposta"}
                  </p>
                  <h3 className="text-sm font-semibold text-gray-800">
                    {question?.title || question?.label || `Pergunta ${questionId}`}
                  </h3>
                </div>
                <StatusBadge status={status} />
              </div>

              {/* Answer content */}
              <div className="mb-4">
                {isFile && typeof answer === "string" && answer.startsWith("http") ? (
                  <div className="flex items-center gap-3">
                    {answer.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <a href={answer} target="_blank" rel="noopener noreferrer" className="block">
                        <img src={answer} alt="Documento" className="max-w-xs rounded-lg border border-gray-200" />
                      </a>
                    ) : (
                      <a
                        href={answer}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-blue-600 hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Ver arquivo
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    {answerStr || <span className="text-gray-400 italic">Sem resposta</span>}
                  </p>
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
            </div>
          );
        })}

        {Object.keys(answers).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Nenhuma resposta para validar</p>
          </div>
        )}
      </div>

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
