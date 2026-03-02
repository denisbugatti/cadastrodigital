/**
 * Responses Page — Redesigned with clean, modern layout
 * Stats overview, improved response cards, better expanded details
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
  ShieldCheck,
  ShieldAlert,
  Lock,
  BarChart3,
  Timer,
  TrendingUp,
  Eye,
  Filter,
  Phone,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseCharts } from "@/components/ResponseCharts";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Stats Card ───
function StatCard({ icon: Icon, label, value, sublabel, color = "brand" }: {
  icon: any;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    brand: "bg-brand/10 text-brand",
    green: "bg-green-500/10 text-green-600 dark:text-green-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.brand}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-display font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground font-body truncate">{label}</p>
        {sublabel && <p className="text-[10px] text-muted-foreground/70 font-body">{sublabel}</p>}
      </div>
    </div>
  );
}

// ─── Validation Badge ───
function ValidationBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: any; label: string; className: string }> = {
    approved: {
      icon: ShieldCheck,
      label: "Validado",
      className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    rejected: {
      icon: ShieldAlert,
      label: "Rejeitado",
      className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    },
    in_review: {
      icon: Eye,
      label: "Em revisão",
      className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    },
  };

  const config = configs[status] || {
    icon: Clock,
    label: "Pendente",
    className: "bg-muted text-muted-foreground border-border",
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.className}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}

export default function Responses() {
  const params = useParams<{ formId: string }>();
  const formId = Number(params.formId);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

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

  // ─── Computed Stats ───
  const stats = useMemo(() => {
    if (!responses) return { total: 0, complete: 0, avgTime: 0, validated: 0 };
    const complete = responses.filter((r: any) => r.isComplete).length;
    const validated = responses.filter((r: any) => r.validationStatus === "approved").length;
    const timesArr = responses
      .filter((r: any) => r.timeSpentSeconds && r.timeSpentSeconds > 0)
      .map((r: any) => r.timeSpentSeconds as number);
    const avgTime = timesArr.length > 0 ? Math.round(timesArr.reduce((a: number, b: number) => a + b, 0) / timesArr.length) : 0;
    return { total: responses.length, complete, avgTime, validated };
  }, [responses]);

  // ─── Filtered Responses ───
  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    if (activeFilter === "all") return responses;
    if (activeFilter === "complete") return responses.filter((r: any) => r.isComplete);
    if (activeFilter === "partial") return responses.filter((r: any) => !r.isComplete);
    if (activeFilter === "validated") return responses.filter((r: any) => r.validationStatus === "approved");
    if (activeFilter === "pending") return responses.filter((r: any) => r.validationStatus === "pending" || !r.validationStatus);
    return responses;
  }, [responses, activeFilter]);

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

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container max-w-6xl py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 shrink-0 px-2 sm:px-3">
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-display font-bold text-foreground truncate">{form.title}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-body">
                Respostas e análise
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
            <div className="container max-w-6xl py-4 sm:py-5">
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
      <main className="container max-w-6xl py-4 sm:py-8 space-y-6">
        {/* ─── Stats Overview ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={BarChart3}
            label="Total de respostas"
            value={stats.total}
            color="brand"
          />
          <StatCard
            icon={CheckCircle2}
            label="Completas"
            value={stats.complete}
            sublabel={stats.total > 0 ? `${Math.round((stats.complete / stats.total) * 100)}% do total` : undefined}
            color="green"
          />
          <StatCard
            icon={Timer}
            label="Tempo médio"
            value={stats.avgTime > 0 ? formatTime(stats.avgTime) : "—"}
            color="blue"
          />
          <StatCard
            icon={ShieldCheck}
            label="Validadas"
            value={stats.validated}
            sublabel={stats.total > 0 ? `${Math.round((stats.validated / stats.total) * 100)}% do total` : undefined}
            color="amber"
          />
        </div>

        {/* ─── Search & Filters ─── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
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

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "Todos", count: responses?.length ?? 0 },
              { id: "complete", label: "Completas", count: stats.complete },
              { id: "partial", label: "Parciais", count: (responses?.length ?? 0) - stats.complete },
              { id: "validated", label: "Validadas", count: stats.validated },
              { id: "pending", label: "Pendentes", count: (responses?.length ?? 0) - stats.validated },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                  activeFilter === filter.id
                    ? "bg-brand/10 text-brand border-brand/20"
                    : "bg-card text-muted-foreground border-border hover:border-brand/20 hover:text-foreground"
                }`}
              >
                {filter.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeFilter === filter.id ? "bg-brand/20" : "bg-muted"
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {searchParam && (
          <p className="text-xs text-muted-foreground font-body -mt-3">
            {responsesLoading ? "Buscando..." : `${filteredResponses.length} resultado(s) para "${searchParam}"`}
          </p>
        )}

        {/* Charts */}
        {responses && responses.length > 0 && (
          <ResponseCharts responses={responses} questions={questions} />
        )}

        {/* ─── Response List ─── */}
        {filteredResponses.length === 0 ? (
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
            ) : activeFilter !== "all" ? (
              <>
                <Filter size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-lg text-muted-foreground font-body">
                  Nenhuma resposta neste filtro
                </p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="text-sm text-brand hover:underline mt-2 font-body"
                >
                  Ver todas as respostas
                </button>
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
          <div className="space-y-3">
            {filteredResponses.map((response: any, index: number) => {
              const answers = (response.answers ?? {}) as Record<string, any>;
              const isExpanded = expandedId === response.id;
              const isGenerating = generatingId === response.id;

              return (
                <motion.div
                  key={response.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.3 }}
                  className={`bg-card rounded-xl border overflow-hidden transition-all duration-200 ${
                    isExpanded
                      ? "border-brand/30 shadow-md shadow-brand/5"
                      : "border-border shadow-sm hover:shadow-md hover:border-border/80"
                  }`}
                >
                  {/* Response header */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 cursor-pointer transition-colors gap-3"
                    onClick={() => setExpandedId(isExpanded ? null : response.id)}
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      {/* Avatar / Number */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                        response.isComplete
                          ? "bg-brand/10 text-brand"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      }`}>
                        {response.respondentName
                          ? response.respondentName.charAt(0).toUpperCase()
                          : `#${index + 1}`}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Name & email row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-sm font-body font-semibold text-foreground truncate">
                            {response.respondentName || "Anônimo"}
                          </span>
                          {response.respondentEmail && (
                            <span className="flex items-center gap-1 text-xs font-body text-muted-foreground">
                              <Mail size={11} className="shrink-0" />
                              <span className="truncate">{response.respondentEmail}</span>
                            </span>
                          )}
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                            <Clock size={11} />
                            {new Date(response.createdAt).toLocaleString("pt-BR")}
                          </span>

                          {response.isComplete ? (
                            <span className="flex items-center gap-1 text-[11px] text-green-600 dark:text-green-400 font-body font-medium">
                              <CheckCircle2 size={11} /> Completa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-body font-medium">
                              <XCircle size={11} /> Parcial
                            </span>
                          )}

                          {response.timeSpentSeconds && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-body">
                              <Timer size={11} />
                              {formatTime(response.timeSpentSeconds)}
                            </span>
                          )}

                          {response.protocolCode && (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-brand cursor-pointer hover:opacity-80 transition-opacity"
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
                                <Copy size={11} className="opacity-40" />
                              )}
                            </span>
                          )}

                          <ValidationBadge status={response.validationStatus || "pending"} />
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Link href={`/validar/${response.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs h-8 px-2.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          <CheckCircle2 size={13} />
                          <span className="hidden sm:inline">Validar</span>
                        </Button>
                      </Link>

                      {(() => {
                        const isValidated = response.validationStatus === 'approved';
                        return (
                          <Button
                            variant="default"
                            size="sm"
                            className={`gap-1.5 text-xs h-8 px-2.5 ${
                              isValidated
                                ? 'bg-brand hover:bg-brand/90'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                            disabled={isGenerating || !isValidated}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isValidated) {
                                toast.info('Validação necessária', {
                                  description: 'É preciso validar a resposta antes de gerar o PDF.',
                                });
                                return;
                              }
                              handleGenerateFicha(response.id);
                            }}
                            title={isValidated ? 'Gerar ficha PDF' : 'Valide a resposta antes de gerar o PDF'}
                          >
                            {isGenerating ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : !isValidated ? (
                              <Lock size={13} />
                            ) : (
                              <FileText size={13} />
                            )}
                            <span className="hidden sm:inline">
                              {isGenerating ? 'Gerando...' : !isValidated ? 'Validar antes' : 'Gerar Ficha'}
                            </span>
                          </Button>
                        );
                      })()}

                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={18} className="text-muted-foreground" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Expanded response details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5 border-t border-border/50">
                          <div className="grid gap-0 mt-4">
                            {questions
                              .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
                              .map((q: any, qIndex: number) => {
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
                                  <motion.div
                                    key={q.id}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: qIndex * 0.03 }}
                                    className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-border/30 last:border-0"
                                  >
                                    <span className="text-xs font-body font-semibold text-muted-foreground sm:w-1/3 sm:text-right sm:pt-0.5 shrink-0 uppercase tracking-wide">
                                      {q.title}
                                    </span>
                                    <span className="text-sm font-body text-foreground sm:flex-1 break-words">
                                      {displayValue}
                                    </span>
                                  </motion.div>
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
