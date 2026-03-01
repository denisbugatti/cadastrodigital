/**
 * Responses Page — View all responses for a form with "Gerar Ficha" button
 * Allows downloading individual response PDFs (Cadastro de Interesse)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  User,
  Users,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Hash,
  Copy,
  Check,
  Search,
  X,
  Bell,
  BellOff,
  Plus,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function Responses() {
  const params = useParams<{ formId: string }>();
  const formId = Number(params.formId);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);

  const searchParam = useMemo(() => debouncedSearch.trim() || undefined, [debouncedSearch]);

  const { data: form, isLoading: formLoading } = trpc.forms.getById.useQuery({ id: formId }, { enabled: !!formId });
  const { data: responses, isLoading: responsesLoading } = trpc.responses.listByForm.useQuery(
    { formId, search: searchParam },
    { enabled: !!formId }
  );

  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [copiedProtocol, setCopiedProtocol] = useState<number | null>(null);
  const [showCorretores, setShowCorretores] = useState(false);

  // Corretor queries
  const { data: allCorretores } = trpc.corretores.list.useQuery();
  const { data: formCorretores, isLoading: formCorretoresLoading } = trpc.corretores.byForm.useQuery(
    { formId },
    { enabled: !!formId }
  );
  const setFormCorretoresMutation = trpc.corretores.setFormCorretores.useMutation({
    onSuccess: () => {
      trpc.useUtils().corretores.byForm.invalidate({ formId });
      toast.success("Corretores atualizados!");
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar corretores"),
  });

  const assignedCorretorIds = useMemo(
    () => new Set<number>((formCorretores ?? []).map((c: any) => c.id as number)),
    [formCorretores]
  );

  function toggleCorretorAssignment(corretorId: number) {
    const currentIds = Array.from(assignedCorretorIds) as number[];
    const newIds = assignedCorretorIds.has(corretorId)
      ? currentIds.filter((id) => id !== corretorId)
      : [...currentIds, corretorId];
    setFormCorretoresMutation.mutate({ formId, corretorIds: newIds });
  }

  const handleCopyProtocol = useCallback((responseId: number, code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedProtocol(responseId);
      setTimeout(() => setCopiedProtocol(null), 2000);
    }).catch(() => {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopiedProtocol(responseId);
        setTimeout(() => setCopiedProtocol(null), 2000);
      } catch {
        // Silently fail
      }
      document.body.removeChild(textArea);
    });
  }, []);

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
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => setShowCorretores(!showCorretores)}
          >
            <Users size={14} />
            <span className="hidden sm:inline">Corretores</span>
            {(formCorretores?.length ?? 0) > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand">
                {formCorretores?.length}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Corretor assignment panel */}
      <AnimatePresence>
        {showCorretores && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border bg-card"
          >
            <div className="container max-w-5xl py-4 sm:py-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bell size={14} className="text-brand" />
                  <h3 className="text-sm font-semibold text-foreground">Corretores notificados</h3>
                </div>
                <Link href="/corretores">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                    <Plus size={12} /> Gerenciar
                  </Button>
                </Link>
              </div>
              {!allCorretores || allCorretores.length === 0 ? (
                <div className="text-center py-6">
                  <Users size={24} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum corretor cadastrado.</p>
                  <Link href="/corretores">
                    <Button variant="outline" size="sm" className="mt-3 gap-1">
                      <Plus size={14} /> Adicionar corretor
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {allCorretores.map((corretor: any) => {
                    const isAssigned = assignedCorretorIds.has(corretor.id);
                    return (
                      <div
                        key={corretor.id}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isAssigned
                            ? "border-brand/20 bg-brand/5"
                            : "border-border bg-background"
                        } ${!corretor.active ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isAssigned ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                          }`}>
                            {corretor.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{corretor.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{corretor.email}</p>
                          </div>
                        </div>
                        <Switch
                          checked={isAssigned}
                          onCheckedChange={() => toggleCorretorAssignment(corretor.id)}
                          disabled={!corretor.active || setFormCorretoresMutation.isPending}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {(formCorretores?.length ?? 0) > 0 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Bell size={10} />
                  {formCorretores?.length} corretor(es) serão notificados por email a cada novo cadastro.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <main className="container max-w-5xl py-4 sm:py-8">
        {/* Search bar */}
        <div className="mb-5">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              type="text"
              placeholder="Buscar por protocolo, nome ou e-mail..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-9 h-10 font-body text-sm bg-card border-border"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); searchRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchParam && (
            <p className="text-xs text-muted-foreground mt-2 font-body">
              {responsesLoading ? "Buscando..." : `${responses?.length ?? 0} resultado(s) para "${searchParam}"`}
            </p>
          )}
        </div>

        {!responses || responses.length === 0 ? (
          <div className="text-center py-20">
            {searchParam ? (
              <>
                <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg text-muted-foreground font-body">
                  Nenhum resultado encontrado
                </p>
                <p className="text-sm text-muted-foreground/70 font-body mt-2">
                  Tente buscar por outro protocolo, nome ou e-mail.
                </p>
              </>
            ) : (
              <>
                <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg text-muted-foreground font-body">
                  Nenhuma resposta ainda
                </p>
                <p className="text-sm text-muted-foreground/70 font-body mt-2">
                  Compartilhe o formulário para começar a receber respostas.
                </p>
              </>
            )}
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
                          {response.protocolCode && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-mono font-semibold text-brand cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyProtocol(response.id, response.protocolCode);
                              }}
                              title="Clique para copiar"
                            >
                              <Hash size={11} />
                              {response.protocolCode}
                              {copiedProtocol === response.id ? (
                                <Check size={11} className="text-green-500" />
                              ) : (
                                <Copy size={11} className="opacity-50" />
                              )}
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
                        <div className="px-3 sm:px-5 pb-4 sm:pb-5 border-t border-border/50">
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
