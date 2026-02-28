/**
 * Responses Page — View all responses for a form with "Gerar Ficha" button
 * Allows downloading individual response PDFs (Cadastro de Interesse)
 */

import { useState, useCallback } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  User,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function Responses() {
  const params = useParams<{ formId: string }>();
  const formId = Number(params.formId);

  const { data: form, isLoading: formLoading } = trpc.forms.getById.useQuery({ id: formId }, { enabled: !!formId });
  const { data: responses, isLoading: responsesLoading } = trpc.responses.listByForm.useQuery({ formId }, { enabled: !!formId });

  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const utils = trpc.useUtils();

  const handleGenerateFicha = useCallback(async (responseId: number) => {
    setGeneratingId(responseId);
    try {
      const result = await utils.responses.generateFicha.fetch({ responseId });

      // Convert base64 to blob and download
      const byteCharacters = atob(result.base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Ficha gerada!", {
        description: `PDF ${result.tipo.toUpperCase()} baixado com sucesso.`,
      });
    } catch (err) {
      console.error("Error generating ficha:", err);
      toast.error("Erro ao gerar ficha", {
        description: "Não foi possível gerar o PDF. Tente novamente.",
      });
    } finally {
      setGeneratingId(null);
    }
  }, [utils]);

  const isLoading = formLoading || responsesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-brand" size={32} />
          <p className="text-muted-foreground font-body">Carregando respostas...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground font-body mb-4">Formulário não encontrado</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft size={16} className="mr-2" /> Voltar ao Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const questions: any[] = (form as any).questions ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="container max-w-5xl py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 shrink-0 px-2 sm:px-3">
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-display font-bold text-foreground truncate">{form.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-body">
                {responses?.length ?? 0} respostas coletadas
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-5xl py-4 sm:py-8">
        {!responses || responses.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg text-muted-foreground font-body">
              Nenhuma resposta ainda
            </p>
            <p className="text-sm text-muted-foreground/70 font-body mt-2">
              Compartilhe o formulário para começar a receber respostas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {responses.map((response: any, index: number) => {
              const answers = (response.answers ?? {}) as Record<string, any>;
              const isExpanded = expandedId === response.id;
              const isGenerating = generatingId === response.id;

              return (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-card rounded-xl border border-border shadow-sm overflow-hidden"
                >
                  {/* Response header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-5 cursor-pointer hover:bg-accent/30 transition-colors gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-display font-bold text-xs sm:text-sm shrink-0">
                        #{index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                          {response.respondentName && (
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-body font-semibold text-foreground">
                              <User size={13} className="text-muted-foreground shrink-0" />
                              <span className="truncate">{response.respondentName}</span>
                            </span>
                          )}
                          {response.respondentEmail && (
                            <span className="flex items-center gap-1 text-xs sm:text-sm font-body text-muted-foreground">
                              <Mail size={13} className="shrink-0" />
                              <span className="truncate">{response.respondentEmail}</span>
                            </span>
                          )}
                          {!response.respondentName && !response.respondentEmail && (
                            <span className="text-xs sm:text-sm font-body text-muted-foreground">Anônimo</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground font-body">
                            <Clock size={11} />
                            {new Date(response.createdAt).toLocaleString("pt-BR")}
                          </span>
                          {response.isComplete ? (
                            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-green-600 font-body">
                              <CheckCircle2 size={11} /> Completa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-amber-600 font-body">
                              <XCircle size={11} /> Parcial
                            </span>
                          )}
                          {response.timeSpentSeconds && (
                            <span className="text-[11px] sm:text-xs text-muted-foreground font-body">
                              {Math.floor(response.timeSpentSeconds / 60)}min {response.timeSpentSeconds % 60}s
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                      {/* Gerar Ficha button */}
                      <Button
                        variant="default"
                        size="sm"
                        className="gap-1.5 sm:gap-2 bg-brand hover:bg-brand/90 text-xs sm:text-sm px-2.5 sm:px-3"
                        disabled={isGenerating}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateFicha(response.id);
                        }}
                      >
                        {isGenerating ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <FileText size={14} />
                        )}
                        <span className="hidden sm:inline">{isGenerating ? "Gerando..." : "Gerar Ficha"}</span>
                        <span className="sm:hidden">{isGenerating ? "..." : "PDF"}</span>
                      </Button>

                      {isExpanded ? (
                        <ChevronUp size={18} className="text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Expanded response details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-border/50">
                          <div className="grid gap-3 mt-4">
                            {questions
                              .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
                              .map((q: any) => {
                                const answer = answers[q.id];
                                if (answer === undefined || answer === null || answer === "") return null;

                                let displayValue: string;
                                if (Array.isArray(answer)) {
                                  displayValue = answer.join(", ");
                                } else if (typeof answer === "object") {
                                  if (answer.url) {
                                    displayValue = `📎 ${answer.filename || "Arquivo"}`;
                                  } else {
                                    displayValue = Object.entries(answer)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(" | ");
                                  }
                                } else {
                                  displayValue = String(answer);
                                }

                                return (
                                  <div key={q.id} className="flex flex-col gap-1 py-2 border-b border-border/30 last:border-0">
                                    <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
                                      {q.title}
                                    </span>
                                    <span className="text-sm font-body text-foreground">
                                      {displayValue}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
