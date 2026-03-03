/**
 * Dashboard de Respostas — Redesign Completo v2
 * Cards verticais com protocolo visível, paginação,
 * timeline de atividades, respostas visíveis após validação,
 * busca por protocolo, filtros avançados.
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
  Calendar,
  MailCheck,
  MailX,
  Pause,
  Play,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  History,
  Send,
  UserCheck,
  FileCheck,
  AlertTriangle,
  MailPlus,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ResponseCharts } from "@/components/ResponseCharts";

const ITEMS_PER_PAGE = 12;

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
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="bg-card rounded-xl border border-border p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color] || colorClasses.brand}`}>
        <Icon size={16} className="sm:hidden" />
        <Icon size={18} className="hidden sm:block" />
      </div>
      <div className="min-w-0">
        <p className="text-lg sm:text-xl font-display font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[10px] sm:text-xs text-muted-foreground font-body truncate">{label}</p>
        {sublabel && <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-body">{sublabel}</p>}
      </div>
    </div>
  );
}

// ─── Validation Badge ───
function ValidationBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: any; label: string; className: string }> = {
    approved: {
      icon: ShieldCheck,
      label: "Aprovado",
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
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  };

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${config.className}`}>
      <Icon size={11} />
      {config.label}
    </span>
  );
}

// ─── Activity Timeline Component ───
function ActivityTimeline({ responseId }: { responseId: number }) {
  const { data: timeline, isLoading } = trpc.activity.getTimeline.useQuery(
    { responseId },
    { staleTime: 30_000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
        <Loader2 size={12} className="animate-spin" /> Carregando timeline...
      </div>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60 py-3">
        <History size={12} />
        <span>Nenhuma atividade registrada ainda</span>
      </div>
    );
  }

  const activityConfig: Record<string, { icon: any; color: string }> = {
    response_created: { icon: FileText, color: "text-brand" },
    response_completed: { icon: CheckCircle2, color: "text-green-500" },
    protocol_email_sent: { icon: Send, color: "text-blue-500" },
    field_approved: { icon: CheckCircle2, color: "text-green-500" },
    field_rejected: { icon: XCircle, color: "text-red-500" },
    overall_approved: { icon: ShieldCheck, color: "text-green-600 dark:text-green-400" },
    overall_rejected: { icon: ShieldAlert, color: "text-red-600 dark:text-red-400" },
    approval_email_sent: { icon: MailCheck, color: "text-green-500" },
    rejection_email_sent: { icon: MailX, color: "text-red-500" },
    cadence_started: { icon: MailPlus, color: "text-amber-500" },
    cadence_email_sent: { icon: Send, color: "text-amber-500" },
    cadence_stopped: { icon: Pause, color: "text-muted-foreground" },
  };

  // Show max 10 items initially, expand to show all
  const [showAll, setShowAll] = useState(false);
  const visibleItems = showAll ? timeline : timeline.slice(0, 8);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-0">
        {visibleItems.map((item: any, i: number) => {
          const config = activityConfig[item.activityType] || { icon: History, color: "text-muted-foreground" };
          const Icon = config.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex gap-3 py-1.5 relative"
            >
              {/* Dot */}
              <div className={`w-[23px] h-[23px] rounded-full flex items-center justify-center shrink-0 bg-card border border-border z-10 ${config.color}`}>
                <Icon size={11} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-[11px] sm:text-xs text-foreground font-body leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-body">
                    {new Date(item.createdAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {item.performedByName && (
                    <span className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-body flex items-center gap-0.5">
                      <UserCheck size={8} /> {item.performedByName}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {timeline.length > 8 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-[11px] text-brand hover:underline font-body mt-1 ml-8"
        >
          Ver mais {timeline.length - 8} atividades...
        </button>
      )}
      {showAll && timeline.length > 8 && (
        <button
          onClick={() => setShowAll(false)}
          className="text-[11px] text-brand hover:underline font-body mt-1 ml-8"
        >
          Mostrar menos
        </button>
      )}
    </div>
  );
}

// ─── Cadence Panel inside Response Card ───
function CadencePanel({ responseId }: { responseId: number }) {
  const utils = trpc.useUtils();
  const { data: cadences, isLoading } = trpc.cadence.getByResponse.useQuery({ responseId });
  const stopMutation = trpc.cadence.stop.useMutation({
    onSuccess: () => {
      utils.cadence.getByResponse.invalidate({ responseId });
      toast.success("Cadência pausada!");
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 size={12} className="animate-spin" /> Carregando cadência...
      </div>
    );
  }

  if (!cadences || cadences.length === 0) return null;

  return (
    <div className="space-y-2">
      {cadences.map((c: any) => {
        const isActive = c.active && !c.stoppedReason;
        const progress = c.maxSequence > 0 ? Math.round((c.sequenceNumber / c.maxSequence) * 100) : 0;
        const typeLabel = c.cadenceType === "abandono" ? "Abandono" : "Reprovação";

        return (
          <div
            key={c.id}
            className={`rounded-lg border p-2.5 ${
              isActive
                ? c.cadenceType === "abandono"
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-red-500/20 bg-red-500/5"
                : "border-border bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                {isActive ? (
                  <MailCheck size={13} className={c.cadenceType === "abandono" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"} />
                ) : (
                  <Pause size={13} className="text-muted-foreground" />
                )}
                <span className={`text-[11px] font-semibold ${
                  isActive
                    ? c.cadenceType === "abandono" ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                }`}>
                  Cadência: {typeLabel}
                </span>
              </div>
              {isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    stopMutation.mutate({ cadenceId: c.id });
                  }}
                  disabled={stopMutation.isPending}
                  className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <Pause size={10} /> Pausar
                </button>
              )}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isActive
                      ? c.cadenceType === "abandono" ? "bg-amber-500" : "bg-red-500"
                      : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                {c.sequenceNumber}/{c.maxSequence}
              </span>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-muted-foreground">
              {c.lastSentAt && (
                <span className="flex items-center gap-1">
                  <Clock size={9} />
                  Último: {new Date(c.lastSentAt).toLocaleDateString("pt-BR")}
                </span>
              )}
              {isActive && c.nextSendAt && (
                <span className="flex items-center gap-1">
                  <Calendar size={9} />
                  Próximo: {new Date(c.nextSendAt).toLocaleDateString("pt-BR")}
                </span>
              )}
              {c.stoppedReason && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 size={9} />
                  {c.stoppedReason === "form_completed" ? "Cadastro completado" :
                   c.stoppedReason === "form_approved" ? "Cadastro aprovado" :
                   c.stoppedReason === "manual" ? "Pausado manualmente" :
                   c.stoppedReason === "max_reached" ? "Ciclo completo" : c.stoppedReason}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Extract phone from answers ───
function extractPhone(answers: Record<string, any>, questions: any[]): string | null {
  const phoneQ = questions.find((q: any) =>
    q.type === "phone" ||
    (q.title && /telefone|celular|whatsapp|phone/i.test(q.title))
  );
  if (phoneQ && answers[phoneQ.id]) return String(answers[phoneQ.id]);

  for (const val of Object.values(answers)) {
    if (typeof val === "string" && /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(val.trim())) {
      return val;
    }
  }
  return null;
}

// ─── Response Card (Vertical Layout) ───
function ResponseCard({
  response,
  index,
  questions,
  isExpanded,
  onToggle,
  onGenerateFicha,
  isGenerating,
  copiedProtocol,
  onCopyProtocol,
}: {
  response: any;
  index: number;
  questions: any[];
  isExpanded: boolean;
  onToggle: () => void;
  onGenerateFicha: (id: number) => void;
  isGenerating: boolean;
  copiedProtocol: number | null;
  onCopyProtocol: (id: number, code: string) => void;
}) {
  const answers = (response.answers ?? {}) as Record<string, any>;
  const phone = extractPhone(answers, questions);
  const isValidated = response.validationStatus === "approved";
  const isRejected = response.validationStatus === "rejected";

  // Status color for left border
  const statusBorderColor = isValidated
    ? "border-l-green-500"
    : isRejected
    ? "border-l-red-500"
    : response.isComplete
    ? "border-l-brand"
    : "border-l-amber-500";

  // Tab state for expanded view
  const [activeTab, setActiveTab] = useState<"respostas" | "timeline">("respostas");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
      className={`bg-card rounded-xl border border-l-4 overflow-hidden transition-all duration-200 ${statusBorderColor} ${
        isExpanded
          ? "shadow-lg shadow-brand/5 border-brand/20"
          : "shadow-sm hover:shadow-md"
      }`}
    >
      {/* ─── Card Header (Always Visible) ─── */}
      <div className="p-4 sm:p-5 cursor-pointer" onClick={onToggle}>
        {/* Top row: Avatar + Name + Protocol Badge + Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0 ${
              isValidated
                ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-2 ring-green-500/20"
                : isRejected
                ? "bg-red-500/10 text-red-600 dark:text-red-400 ring-2 ring-red-500/20"
                : response.isComplete
                ? "bg-brand/10 text-brand ring-2 ring-brand/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20"
            }`}>
              {response.respondentName
                ? response.respondentName.charAt(0).toUpperCase()
                : `#${index + 1}`}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-display font-bold text-foreground truncate">
                {response.respondentName || "Anônimo"}
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <ValidationBadge status={response.validationStatus || "pending"} />
                {response.isComplete ? (
                  <span className="text-[10px] text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Completa
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                    <XCircle size={10} /> Parcial
                  </span>
                )}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 mt-1"
          >
            <ChevronDown size={18} className="text-muted-foreground" />
          </motion.div>
        </div>

        {/* ─── Protocol Badge (Prominent on closed card) ─── */}
        {response.protocolCode && (
          <div
            className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-brand/5 border border-brand/15 cursor-pointer hover:bg-brand/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onCopyProtocol(response.id, response.protocolCode);
            }}
            title="Clique para copiar o protocolo"
          >
            <Hash size={14} className="shrink-0 text-brand" />
            <span className="font-mono font-bold text-sm text-brand tracking-wider">
              {response.protocolCode}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">Protocolo</span>
            {copiedProtocol === response.id ? (
              <Check size={14} className="text-green-500 shrink-0" />
            ) : (
              <Copy size={14} className="text-muted-foreground/40 shrink-0" />
            )}
          </div>
        )}

        {/* ─── Info Grid ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {response.respondentEmail && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
              <Mail size={13} className="shrink-0 text-muted-foreground/60" />
              <span className="truncate">{response.respondentEmail}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
              <Phone size={13} className="shrink-0 text-muted-foreground/60" />
              <span>{phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
            <Calendar size={13} className="shrink-0 text-muted-foreground/60" />
            <span>{new Date(response.createdAt).toLocaleString("pt-BR")}</span>
          </div>
          {response.timeSpentSeconds && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
              <Timer size={13} className="shrink-0 text-muted-foreground/60" />
              <span>{formatTimeHelper(response.timeSpentSeconds)}</span>
            </div>
          )}
        </div>

        {/* ─── Cadence Panel (compact on closed card) ─── */}
        <div className="mt-2.5" onClick={(e) => e.stopPropagation()}>
          <CadencePanel responseId={response.id} />
        </div>

        {/* ─── Action Buttons ─── */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
          <Link href={`/validar/${response.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 px-3 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <CheckCircle2 size={13} />
              Validar
            </Button>
          </Link>

          <Button
            variant="default"
            size="sm"
            className={`gap-1.5 text-xs h-8 px-3 ${
              isValidated
                ? "bg-brand hover:bg-brand/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
            disabled={isGenerating || !isValidated}
            onClick={() => {
              if (!isValidated) {
                toast.info("Validação necessária", {
                  description: "É preciso validar a resposta antes de gerar o PDF.",
                });
                return;
              }
              onGenerateFicha(response.id);
            }}
            title={isValidated ? "Gerar ficha PDF" : "Valide a resposta antes de gerar o PDF"}
          >
            {isGenerating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : !isValidated ? (
              <Lock size={13} />
            ) : (
              <FileText size={13} />
            )}
            {isGenerating ? "Gerando..." : !isValidated ? "Validar antes" : "Gerar PDF"}
          </Button>
        </div>
      </div>

      {/* ─── Expanded Details (Tabs: Respostas + Timeline) ─── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50">
              {/* Tab Navigation */}
              <div className="flex border-b border-border/50">
                <button
                  onClick={() => setActiveTab("respostas")}
                  className={`flex-1 px-4 py-2.5 text-xs font-semibold font-body transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "respostas"
                      ? "text-brand border-b-2 border-brand bg-brand/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText size={13} />
                  Respostas
                </button>
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`flex-1 px-4 py-2.5 text-xs font-semibold font-body transition-colors flex items-center justify-center gap-1.5 ${
                    activeTab === "timeline"
                      ? "text-brand border-b-2 border-brand bg-brand/5"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <History size={13} />
                  Timeline
                </button>
              </div>

              {/* Tab Content */}
              <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                {activeTab === "respostas" ? (
                  <>
                    {!isValidated && (
                      <div className="flex items-center gap-2 mt-4 mb-3 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">
                        <Lock size={14} className="text-amber-500 shrink-0" />
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-body">
                          As respostas completas ficam visíveis após a validação do cadastro.
                        </p>
                      </div>
                    )}

                    {isValidated ? (
                      <div className="mt-4">
                        <h4 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          Respostas do formulário
                        </h4>
                        <div className="grid gap-0">
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
                                  className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4 py-2.5 sm:py-3 border-b border-border/30 last:border-0"
                                >
                                  <span className="text-[10px] sm:text-xs font-body font-semibold text-muted-foreground sm:w-1/3 sm:text-right sm:pt-0.5 shrink-0 uppercase tracking-wide">
                                    {q.title}
                                  </span>
                                  <span className="text-xs sm:text-sm font-body text-foreground sm:flex-1 break-words">
                                    {displayValue}
                                  </span>
                                </motion.div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <h4 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">
                          Resumo
                        </h4>
                        <div className="grid gap-0">
                          {/* Show only basic info for non-validated */}
                          {questions
                            .filter((q: any) => q.type !== "welcome" && q.type !== "thank-you")
                            .slice(0, 3)
                            .map((q: any, qIndex: number) => {
                              const answer = answers[q.id];
                              if (answer === undefined || answer === null || answer === "") return null;

                              let displayValue: string;
                              if (Array.isArray(answer)) {
                                displayValue = answer.join(", ");
                              } else if (typeof answer === "object") {
                                displayValue = answer.url ? `📎 ${answer.filename || "Arquivo"}` : "...";
                              } else {
                                displayValue = String(answer);
                              }

                              return (
                                <div
                                  key={q.id}
                                  className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:gap-4 py-2 border-b border-border/30 last:border-0"
                                >
                                  <span className="text-[10px] sm:text-xs font-body font-semibold text-muted-foreground sm:w-1/3 sm:text-right shrink-0 uppercase tracking-wide">
                                    {q.title}
                                  </span>
                                  <span className="text-xs sm:text-sm font-body text-foreground sm:flex-1 break-words">
                                    {displayValue}
                                  </span>
                                </div>
                              );
                            })}
                          {questions.filter((q: any) => q.type !== "welcome" && q.type !== "thank-you").length > 3 && (
                            <p className="text-[10px] text-muted-foreground/60 font-body py-2 italic">
                              + {questions.filter((q: any) => q.type !== "welcome" && q.type !== "thank-you").length - 3} campos ocultos — valide para visualizar todas as respostas
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mt-4">
                    <h4 className="text-xs font-display font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      Histórico de atividades
                    </h4>
                    <ActivityTimeline responseId={response.id} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper
function formatTimeHelper(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
}

// ─── Pagination Component ───
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  // Generate page numbers to show
  const pages: (number | "...")[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-6 sm:mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-xs text-muted-foreground">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
              currentPage === page
                ? "bg-brand text-white shadow-md shadow-brand/20"
                : "text-muted-foreground hover:text-foreground hover:bg-card border border-border"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Main Component ───
export default function Responses() {
  const params = useParams<{ formId: string }>();
  const formId = Number(params.formId);

  // Search & filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [corretorFilter, setCorretorFilter] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
  const [isExporting, setIsExporting] = useState(false);
  const [showConversionStats, setShowConversionStats] = useState(false);
  const [conversionPeriod, setConversionPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");

  const utils = trpc.useUtils();

  // Mark responses as seen when entering the page
  const markSeenMutation = trpc.forms.markSeen.useMutation();
  useEffect(() => {
    if (formId && !formLoading) {
      markSeenMutation.mutate({ formId });
    }
  }, [formId, formLoading]);

  // Conversion stats query
  const { data: conversionStats } = trpc.forms.getConversionStats.useQuery(
    { formId, period: conversionPeriod },
    { enabled: !!formId && showConversionStats }
  );

  // Corretor queries
  const { data: allCorretores } = trpc.corretores.list.useQuery();
  const { data: formCorretores, isLoading: formCorretoresLoading } = trpc.corretores.byForm.useQuery(
    { formId },
    { enabled: !!formId }
  );
  const setFormCorretoresMutation = trpc.corretores.setFormCorretores.useMutation({
    onSuccess: () => {
      utils.corretores.byForm.invalidate({ formId });
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
      toast.success("Protocolo copiado!");
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
        toast.success("Protocolo copiado!");
        setTimeout(() => setCopiedProtocol(null), 2000);
      } catch {
        // Silently fail
      }
      document.body.removeChild(textArea);
    });
  }, []);

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

  // ─── Export CSV Handler ───
  const handleExportCsv = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await utils.responses.exportCsv.fetch({
        formId,
        validationStatus: statusFilter as any,
        dateFilter: dateFilter as any,
        corretorId: corretorFilter !== "all" ? Number(corretorFilter) : undefined,
        search: searchParam,
      });

      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Exporta\u00e7\u00e3o conclu\u00edda!", {
        description: `${result.totalResponses} resposta(s) exportadas para CSV.`,
      });
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Erro ao exportar", {
        description: "N\u00e3o foi poss\u00edvel gerar o arquivo CSV. Tente novamente.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [formId, statusFilter, dateFilter, corretorFilter, searchParam, utils]);

  // ─── Computed Stats ───
  const stats = useMemo(() => {
    if (!responses) return { total: 0, complete: 0, avgTime: 0, validated: 0, rejected: 0 };
    const complete = responses.filter((r: any) => r.isComplete).length;
    const validated = responses.filter((r: any) => r.validationStatus === "approved").length;
    const rejected = responses.filter((r: any) => r.validationStatus === "rejected").length;
    const timesArr = responses
      .filter((r: any) => r.timeSpentSeconds && r.timeSpentSeconds > 0)
      .map((r: any) => r.timeSpentSeconds as number);
    const avgTime = timesArr.length > 0 ? Math.round(timesArr.reduce((a: number, b: number) => a + b, 0) / timesArr.length) : 0;
    return { total: responses.length, complete, avgTime, validated, rejected };
  }, [responses]);

  // ─── Advanced Filtered Responses ───
  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    let result = [...responses];

    if (statusFilter === "complete") result = result.filter((r: any) => r.isComplete);
    else if (statusFilter === "partial") result = result.filter((r: any) => !r.isComplete);
    else if (statusFilter === "approved") result = result.filter((r: any) => r.validationStatus === "approved");
    else if (statusFilter === "rejected") result = result.filter((r: any) => r.validationStatus === "rejected");
    else if (statusFilter === "pending") result = result.filter((r: any) => !r.validationStatus || r.validationStatus === "pending");
    else if (statusFilter === "in_review") result = result.filter((r: any) => r.validationStatus === "in_review");

    if (dateFilter !== "all") {
      const now = new Date();
      let cutoff: Date;
      if (dateFilter === "today") {
        cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === "week") {
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "month") {
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cutoff = new Date(0);
      }
      result = result.filter((r: any) => new Date(r.createdAt) >= cutoff);
    }

    if (corretorFilter !== "all") {
      const corretorId = Number(corretorFilter);
      result = result.filter((r: any) => r.reviewedBy === corretorId);
    }

    return result;
  }, [responses, statusFilter, dateFilter, corretorFilter]);

  // ─── Pagination ───
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResponses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResponses, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, corretorFilter, searchParam]);

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
              <ArrowLeft size={16} className="mr-2" /> Voltar aos Formulários
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const questions: any[] = (form as any).questions ?? [];

  const activeFilterCount = [
    statusFilter !== "all",
    dateFilter !== "all",
    corretorFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 shrink-0 px-2 sm:px-3 h-8 sm:h-9">
                <ArrowLeft size={16} /> <span className="hidden sm:inline">Voltar</span>
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-display font-bold text-foreground truncate">{form.title}</h1>
              <p className="text-[10px] sm:text-sm text-muted-foreground font-body">
                Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
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
        </div>
      </header>

      {/* ─── Corretor assignment panel ─── */}
      <AnimatePresence>
        {showCorretores && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border bg-card"
          >
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-5">
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
                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all ${
                          isAssigned
                            ? "border-brand/20 bg-brand/5"
                            : "border-border bg-background"
                        } ${!corretor.active ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isAssigned ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                          }`}>
                            {corretor.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-foreground truncate">{corretor.name}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{corretor.email}</p>
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

      {/* ─── Content ─── */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* ─── Stats Overview ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
          <StatCard icon={BarChart3} label="Total" value={stats.total} color="brand" />
          <StatCard
            icon={CheckCircle2}
            label="Completas"
            value={stats.complete}
            sublabel={stats.total > 0 ? `${Math.round((stats.complete / stats.total) * 100)}%` : undefined}
            color="green"
          />
          <StatCard
            icon={ShieldCheck}
            label="Aprovadas"
            value={stats.validated}
            sublabel={stats.total > 0 ? `${Math.round((stats.validated / stats.total) * 100)}%` : undefined}
            color="blue"
          />
          <StatCard
            icon={ShieldAlert}
            label="Rejeitadas"
            value={stats.rejected}
            color="red"
          />
          <StatCard
            icon={Timer}
            label="Tempo médio"
            value={stats.avgTime > 0 ? formatTimeHelper(stats.avgTime) : "—"}
            color="amber"
          />
        </div>

        {/* ─── Search Bar ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                type="text"
                placeholder="Buscar por protocolo, nome ou e-mail..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-9 h-9 sm:h-10 font-body text-sm bg-card border-border"
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

            <Button
              variant={showAdvancedFilters ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 h-9 sm:h-10 px-3 text-xs ${showAdvancedFilters ? "bg-brand" : ""}`}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-foreground/20">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              variant={showCharts ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 h-9 sm:h-10 px-3 text-xs ${showCharts ? "bg-brand" : ""}`}
              onClick={() => setShowCharts(!showCharts)}
            >
              <BarChart3 size={14} />
              <span className="hidden sm:inline">Gráficos</span>
            </Button>

            <Button
              variant={showConversionStats ? "default" : "outline"}
              size="sm"
              className={`gap-1.5 h-9 sm:h-10 px-3 text-xs ${showConversionStats ? "bg-brand" : ""}`}
              onClick={() => setShowConversionStats(!showConversionStats)}
            >
              <TrendingUp size={14} />
              <span className="hidden sm:inline">Conversão</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-9 sm:h-10 px-3 text-xs"
              onClick={handleExportCsv}
              disabled={isExporting || !responses || responses.length === 0}
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span className="hidden sm:inline">{isExporting ? "Exportando..." : "Exportar CSV"}</span>
            </Button>
          </div>

          {/* ─── Advanced Filters Panel ─── */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-display font-bold text-foreground uppercase tracking-wider">
                      Filtros Avançados
                    </h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setDateFilter("all");
                          setCorretorFilter("all");
                        }}
                        className="text-[11px] text-brand hover:underline font-body"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-body font-medium text-muted-foreground mb-1 block">
                        Status de Aprovação
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="all">Todos os status</option>
                        <option value="complete">Completas</option>
                        <option value="partial">Parciais</option>
                        <option value="approved">Aprovadas</option>
                        <option value="rejected">Rejeitadas</option>
                        <option value="in_review">Em revisão</option>
                        <option value="pending">Pendentes</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-body font-medium text-muted-foreground mb-1 block">
                        Período
                      </label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="all">Todo o período</option>
                        <option value="today">Hoje</option>
                        <option value="week">Últimos 7 dias</option>
                        <option value="month">Últimos 30 dias</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-body font-medium text-muted-foreground mb-1 block">
                        Corretor Responsável
                      </label>
                      <select
                        value={corretorFilter}
                        onChange={(e) => setCorretorFilter(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-body text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                      >
                        <option value="all">Todos os corretores</option>
                        {(allCorretores ?? []).map((c: any) => (
                          <option key={c.id} value={String(c.id)}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
            {[
              { id: "all", label: "Todos", count: responses?.length ?? 0 },
              { id: "complete", label: "Completas", count: stats.complete },
              { id: "partial", label: "Parciais", count: (responses?.length ?? 0) - stats.complete },
              { id: "approved", label: "Aprovadas", count: stats.validated },
              { id: "rejected", label: "Rejeitadas", count: stats.rejected },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap transition-all border ${
                  statusFilter === filter.id
                    ? "bg-brand/10 text-brand border-brand/20"
                    : "bg-card text-muted-foreground border-border hover:border-brand/20 hover:text-foreground"
                }`}
              >
                {filter.label}
                <span className={`px-1 sm:px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
                  statusFilter === filter.id ? "bg-brand/20" : "bg-muted"
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {searchParam && (
          <p className="text-xs text-muted-foreground font-body -mt-2 sm:-mt-3">
            {responsesLoading ? "Buscando..." : `${filteredResponses.length} resultado(s) para "${searchParam}"`}
          </p>
        )}

        {/* ─── Charts (Collapsible) ─── */}
        <AnimatePresence>
          {showCharts && responses && responses.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <ResponseCharts responses={responses} questions={questions} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Conversion Stats (Funnel) ─── */}
        <AnimatePresence>
          {showConversionStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-brand" />
                    <h3 className="text-sm font-display font-bold text-foreground">Funil de Conversão</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {(["7d", "30d", "90d", "all"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setConversionPeriod(p)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                          conversionPeriod === p
                            ? "bg-brand/10 text-brand border border-brand/20"
                            : "text-muted-foreground hover:text-foreground border border-transparent"
                        }`}
                      >
                        {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : p === "90d" ? "90 dias" : "Tudo"}
                      </button>
                    ))}
                  </div>
                </div>

                {conversionStats ? (
                  <div className="space-y-4">
                    {/* Funnel Bars */}
                    <div className="space-y-3">
                      {[
                        { label: "Iniciados", value: conversionStats.total, color: "bg-blue-500", icon: Users },
                        { label: "Completos", value: conversionStats.complete, color: "bg-amber-500", icon: CheckCircle2 },
                        { label: "Em Revisão", value: conversionStats.inReview, color: "bg-purple-500", icon: Eye },
                        { label: "Aprovados", value: conversionStats.approved, color: "bg-green-500", icon: ShieldCheck },
                        { label: "Rejeitados", value: conversionStats.rejected, color: "bg-red-500", icon: ShieldAlert },
                      ].map((step, i) => {
                        const maxVal = Math.max(conversionStats.total, 1);
                        const pct = Math.round((step.value / maxVal) * 100);
                        const Icon = step.icon;
                        return (
                          <div key={step.label} className="flex items-center gap-3">
                            <div className="flex items-center gap-2 w-24 sm:w-28 shrink-0">
                              <Icon size={14} className="text-muted-foreground" />
                              <span className="text-xs font-body text-muted-foreground">{step.label}</span>
                            </div>
                            <div className="flex-1 h-7 bg-muted/50 rounded-lg overflow-hidden relative">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(pct, 2)}%` }}
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className={`h-full ${step.color} rounded-lg`}
                              />
                              <span className="absolute inset-0 flex items-center justify-end pr-2 text-[11px] font-bold font-body text-foreground">
                                {step.value}
                              </span>
                            </div>
                            <span className="text-xs font-body font-semibold text-muted-foreground w-12 text-right">
                              {pct}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Conversion Rates */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-border/50">
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-display font-bold text-foreground">
                          {conversionStats.completionRate}%
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">Conclusão</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-display font-bold text-foreground">
                          {conversionStats.approvalRate}%
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">Aprovação</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-display font-bold text-foreground">
                          {conversionStats.complete > 0 ? Math.round((conversionStats.rejected / conversionStats.complete) * 100) : 0}%
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">Rejeição</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/30">
                        <p className="text-lg font-display font-bold text-foreground">
                          {conversionStats.incomplete}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-body">Incompletos</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={20} className="animate-spin text-brand" />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Results count + pagination info ─── */}
        {filteredResponses.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-body">
              {filteredResponses.length} resposta{filteredResponses.length !== 1 ? "s" : ""}
              {activeFilterCount > 0 ? " (filtrado)" : ""}
              {totalPages > 1 && (
                <span className="ml-1">
                  — Página {currentPage} de {totalPages}
                </span>
              )}
            </p>
          </div>
        )}

        {/* ─── Response Cards (Vertical) with Pagination ─── */}
        {filteredResponses.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            {searchParam ? (
              <>
                <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-base sm:text-lg text-muted-foreground font-body">
                  Nenhum resultado encontrado
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 font-body mt-2">
                  Tente buscar por outro protocolo, nome ou e-mail.
                </p>
              </>
            ) : activeFilterCount > 0 ? (
              <>
                <Filter size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-base sm:text-lg text-muted-foreground font-body">
                  Nenhuma resposta com esses filtros
                </p>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setDateFilter("all");
                    setCorretorFilter("all");
                  }}
                  className="text-sm text-brand hover:underline mt-2 font-body"
                >
                  Limpar filtros
                </button>
              </>
            ) : (
              <>
                <FileText size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-base sm:text-lg text-muted-foreground font-body">
                  Nenhuma resposta ainda
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground/70 font-body mt-2">
                  Compartilhe o formulário para começar a receber respostas.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {paginatedResponses.map((response: any, index: number) => (
                <ResponseCard
                  key={response.id}
                  response={response}
                  index={index}
                  questions={questions}
                  isExpanded={expandedId === response.id}
                  onToggle={() => setExpandedId(expandedId === response.id ? null : response.id)}
                  onGenerateFicha={handleGenerateFicha}
                  isGenerating={generatingId === response.id}
                  copiedProtocol={copiedProtocol}
                  onCopyProtocol={handleCopyProtocol}
                />
              ))}
            </div>

            {/* ─── Pagination ─── */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                setExpandedId(null); // Collapse any expanded card when changing page
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
