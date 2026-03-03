/**
 * Corretor Responses Page — Pixel-perfect redesign.
 * Simplified view for corretores: only responses for assigned forms.
 * Focus on validation workflow with excellent mobile/web UX.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Loader2, Mail, Clock, CheckCircle2, XCircle,
  Hash, Search, X, ShieldCheck, ShieldAlert, Eye, Phone,
  Calendar, ChevronRight, ChevronLeft, Timer, Lock, LogOut,
  ArrowRight, User, Inbox, Filter, Bell, BellOff,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 10;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as any;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Validation Badge ───
function ValidationBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: any; label: string; bg: string; text: string; border: string }> = {
    approved: {
      icon: ShieldCheck,
      label: "Aprovado",
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/20",
    },
    rejected: {
      icon: ShieldAlert,
      label: "Rejeitado",
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/20",
    },
    in_review: {
      icon: Eye,
      label: "Em revisão",
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20",
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
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.bg} ${config.text} ${config.border}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min}min ${sec}s` : `${min}min`;
}

// ─── Response Card for Corretor ───
function CorretorResponseCard({
  response,
  index,
}: {
  response: any;
  index: number;
}) {
  const isValidated = response.validationStatus === "approved";
  const isRejected = response.validationStatus === "rejected";
  const isInReview = response.validationStatus === "in_review";

  const statusAccent = isValidated
    ? "border-l-green-500"
    : isRejected
    ? "border-l-red-500"
    : isInReview
    ? "border-l-blue-500"
    : response.isComplete
    ? "border-l-brand"
    : "border-l-amber-500";

  const avatarStyle = isValidated
    ? "bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20"
    : isRejected
    ? "bg-red-500/10 text-red-600 dark:text-red-400 ring-1 ring-red-500/20"
    : "bg-brand/10 text-brand ring-1 ring-brand/20";

  const answers = (response.answers ?? {}) as Record<string, any>;
  const phone = Object.values(answers).find(
    (v: any) => typeof v === "string" && /^\+?\d[\d\s()-]{7,}$/.test(v)
  ) as string | undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
      className={`bg-card rounded-xl border border-l-[3px] overflow-hidden transition-all shadow-sm hover:shadow-md active:shadow-sm ${statusAccent}`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Top row: Avatar + Name + Status */}
        <div className="flex items-center gap-3 mb-2.5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-xs shrink-0 ${avatarStyle}`}>
            {response.respondentName
              ? response.respondentName.charAt(0).toUpperCase()
              : "?"}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] sm:text-sm font-display font-bold text-foreground truncate leading-tight">
              {response.respondentName || "Anônimo"}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <ValidationBadge status={response.validationStatus || "pending"} />
              {response.isComplete ? (
                <span className="text-[9px] text-green-600 dark:text-green-400 font-medium flex items-center gap-0.5">
                  <CheckCircle2 size={9} /> Completa
                </span>
              ) : (
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                  <XCircle size={9} /> Parcial
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Protocol Badge */}
        {response.protocolCode && (
          <div className="flex items-center gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-brand/5 border border-brand/10">
            <Hash size={12} className="shrink-0 text-brand" />
            <span className="font-mono font-bold text-xs text-brand tracking-wider">
              {response.protocolCode}
            </span>
            <span className="text-[9px] text-muted-foreground/60 ml-auto">Protocolo</span>
          </div>
        )}

        {/* Info Grid — compact */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3">
          {response.respondentEmail && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body">
              <Mail size={11} className="shrink-0 text-muted-foreground/50" />
              <span className="truncate max-w-[180px]">{response.respondentEmail}</span>
            </div>
          )}
          {phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body">
              <Phone size={11} className="shrink-0 text-muted-foreground/50" />
              <span>{phone}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body">
            <Calendar size={11} className="shrink-0 text-muted-foreground/50" />
            <span>{new Date(response.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
          {response.timeSpentSeconds && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-body">
              <Timer size={11} className="shrink-0 text-muted-foreground/50" />
              <span>{formatTime(response.timeSpentSeconds)}</span>
            </div>
          )}
        </div>

        {/* Action: Validate Button */}
        <Link href={`/validar/${response.id}`}>
          <button
            className={`w-full flex items-center justify-center gap-2 text-xs h-9 rounded-lg font-semibold transition-all active:scale-[0.98] ${
              isValidated
                ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/15"
                : isRejected
                ? "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-500/20"
                : "bg-brand text-white hover:bg-brand/90 shadow-sm shadow-brand/20"
            }`}
          >
            {isValidated ? (
              <>
                <ShieldCheck size={13} />
                Aprovado — Ver Detalhes
              </>
            ) : isRejected ? (
              <>
                <ShieldAlert size={13} />
                Revisar Reprovação
              </>
            ) : (
              <>
                <CheckCircle2 size={13} />
                Validar Respostas
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

// ─── Pagination ───
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

  const pages: (number | "...")[] = [];
  if (totalPages <= 5) {
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
    <div className="flex items-center justify-center gap-1 mt-4 sm:mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-border disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronLeft size={15} />
      </button>
      {pages.map((page, i) =>
        page === "..." ? (
          <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-[10px] text-muted-foreground/50">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-semibold transition-all active:scale-95 ${
              currentPage === page
                ? "bg-brand text-white shadow-sm shadow-brand/20"
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
        className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card border border-border disabled:opacity-25 disabled:cursor-not-allowed transition-all active:scale-95"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ─── Main Component ───
export default function CorretorResponses() {
  const [, navigate] = useLocation();

  // Get current user info
  const { data: me, isLoading: meLoading } = trpc.customAuth.me.useQuery();

  // Search & filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const searchParam = useMemo(() => debouncedSearch.trim() || undefined, [debouncedSearch]);

  // Get all forms to find which ones are assigned to this corretor
  const { data: allForms, isLoading: formsLoading } = trpc.forms.list.useQuery(
    undefined,
    { enabled: !!me && me.type === "staff" }
  );

  // Find forms assigned to this corretor (staff user)
  const assignedForms = useMemo(() => {
    if (!allForms || !me || me.type !== "staff") return [];
    return allForms.filter((f: any) => f.assignedCorretorId === me.id);
  }, [allForms, me]);

  // Selected form
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  // Auto-select first form
  useEffect(() => {
    if (assignedForms.length > 0 && !selectedFormId) {
      setSelectedFormId(assignedForms[0].id);
    }
  }, [assignedForms, selectedFormId]);

  const selectedForm = useMemo(
    () => assignedForms.find((f: any) => f.id === selectedFormId),
    [assignedForms, selectedFormId]
  );

  // Get responses for selected form
  const { data: responses, isLoading: responsesLoading } = trpc.responses.listByForm.useQuery(
    { formId: selectedFormId!, search: searchParam },
    { enabled: !!selectedFormId }
  );

  // Logout
  const logoutMutation = trpc.customAuth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado");
      navigate("/login");
    },
  });

  // ─── Push Notifications ───
  const { data: pushStatus } = trpc.staffPush.status.useQuery();
  const { data: vapidData } = trpc.staffPush.vapidPublicKey.useQuery();
  const subscribePush = trpc.staffPush.subscribe.useMutation();
  const unsubscribePush = trpc.staffPush.unsubscribe.useMutation();
  const [pushLoading, setPushLoading] = useState(false);

  const togglePush = async () => {
    if (pushLoading) return;
    setPushLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        toast.error('Notificações push não suportadas neste navegador');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();

      if (pushStatus?.hasActiveSubscription && existingSub) {
        // Unsubscribe
        await unsubscribePush.mutateAsync({ endpoint: existingSub.endpoint });
        await existingSub.unsubscribe();
        toast.success('Notificações desativadas');
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Permissão de notificação negada');
          return;
        }
        const vapidKey = vapidData?.key;
        if (!vapidKey) {
          toast.error('Chave VAPID não configurada');
          return;
        }
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const json = sub.toJSON();
        await subscribePush.mutateAsync({
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh!,
          auth: json.keys!.auth!,
        });
        toast.success('Notificações ativadas! Você receberá alertas de novas respostas.');
      }
    } catch (err: any) {
      console.error('[Push]', err);
      toast.error('Erro ao configurar notificações');
    } finally {
      setPushLoading(false);
    }
  };

  // ─── Filtered Responses ───
  const filteredResponses = useMemo(() => {
    if (!responses) return [];
    let result = [...responses];

    if (statusFilter === "complete") result = result.filter((r: any) => r.isComplete);
    else if (statusFilter === "partial") result = result.filter((r: any) => !r.isComplete);
    else if (statusFilter === "approved") result = result.filter((r: any) => r.validationStatus === "approved");
    else if (statusFilter === "rejected") result = result.filter((r: any) => r.validationStatus === "rejected");
    else if (statusFilter === "pending") result = result.filter((r: any) => !r.validationStatus || r.validationStatus === "pending");

    return result;
  }, [responses, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!responses) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    return {
      total: responses.length,
      pending: responses.filter((r: any) => !r.validationStatus || r.validationStatus === "pending" || r.validationStatus === "in_review").length,
      approved: responses.filter((r: any) => r.validationStatus === "approved").length,
      rejected: responses.filter((r: any) => r.validationStatus === "rejected").length,
    };
  }, [responses]);

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResponses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResponses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchParam, selectedFormId]);

  const isLoading = meLoading || formsLoading;

  // Not authenticated or not staff
  if (!meLoading && (!me || me.type !== "staff")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-base font-display font-bold text-foreground mb-1">Acesso Restrito</h2>
          <p className="text-xs text-muted-foreground font-body mb-5">
            Esta página é exclusiva para corretores. Faça login com sua conta de equipe.
          </p>
          <Link href="/login">
            <Button className="gap-2 h-10 px-6 text-sm">
              <User size={15} /> Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-brand/20 animate-pulse" />
            <Loader2 className="animate-spin text-brand absolute top-2 left-2" size={24} />
          </div>
          <p className="text-muted-foreground font-body text-xs">Carregando...</p>
        </div>
      </div>
    );
  }

  // No forms assigned
  if (assignedForms.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Inbox size={28} className="text-muted-foreground/40" />
          </div>
          <h2 className="text-base font-display font-bold text-foreground mb-1">Nenhum formulário</h2>
          <p className="text-xs text-muted-foreground font-body mb-5">
            Você ainda não tem formulários atribuídos. Entre em contato com o administrador.
          </p>
          <Button
            variant="outline"
            className="gap-2 h-9 text-xs"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut size={14} /> Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6 sm:pb-8">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-display font-bold text-foreground truncate leading-tight">
                Validação de Respostas
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">
                Olá, <span className="font-semibold text-foreground">{me?.name || "Corretor"}</span>
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Push notification bell */}
              <button
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                  pushStatus?.hasActiveSubscription
                    ? "text-brand bg-brand/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                onClick={togglePush}
                disabled={pushLoading}
                title={pushStatus?.hasActiveSubscription ? "Desativar notificações" : "Ativar notificações"}
              >
                {pushLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : pushStatus?.hasActiveSubscription ? (
                  <Bell size={14} />
                ) : (
                  <BellOff size={14} />
                )}
                {pushStatus?.hasActiveSubscription && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full ring-2 ring-card" />
                )}
              </button>
              <button
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-3 sm:py-5 space-y-3 sm:space-y-4">
        {/* ─── Form Selector (if multiple forms) ─── */}
        {assignedForms.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
            {assignedForms.map((form: any) => (
              <button
                key={form.id}
                onClick={() => setSelectedFormId(form.id)}
                className={`px-3.5 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border active:scale-[0.97] ${
                  selectedFormId === form.id
                    ? "bg-brand/10 text-brand border-brand/20 shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-brand/20 hover:text-foreground"
                }`}
              >
                {form.title}
              </button>
            ))}
          </div>
        )}

        {/* ─── Form Title ─── */}
        {selectedForm && (
          <div className="bg-card rounded-xl border border-border p-3 sm:p-4">
            <h2 className="text-xs sm:text-sm font-display font-bold text-foreground leading-tight">{selectedForm.title}</h2>
            {selectedForm.description && (
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-1 line-clamp-2">{selectedForm.description}</p>
            )}
          </div>
        )}

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Pendentes", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
            { label: "Aprovados", value: stats.approved, color: "text-green-600 dark:text-green-400" },
            { label: "Rejeitados", value: stats.rejected, color: "text-red-600 dark:text-red-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-2.5 sm:p-3 text-center">
              <p className={`text-lg sm:text-xl font-display font-bold leading-tight ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground font-body mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ─── Search ─── */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            ref={searchRef}
            type="text"
            placeholder="Buscar por protocolo, nome ou e-mail..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8 pr-8 h-9 font-body text-xs bg-card border-border"
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); searchRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors active:scale-90"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* ─── Filter Pills ─── */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
          {[
            { id: "all", label: "Todos", count: stats.total },
            { id: "pending", label: "Pendentes", count: stats.pending },
            { id: "approved", label: "Aprovados", count: stats.approved },
            { id: "rejected", label: "Rejeitados", count: stats.rejected },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition-all border active:scale-[0.97] ${
                statusFilter === filter.id
                  ? "bg-brand/10 text-brand border-brand/20"
                  : "bg-card text-muted-foreground border-border hover:border-brand/20 hover:text-foreground"
              }`}
            >
              {filter.label}
              <span className={`px-1 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold ${
                statusFilter === filter.id ? "bg-brand/20" : "bg-muted"
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        {/* ─── Results info ─── */}
        {searchParam && (
          <p className="text-[11px] text-muted-foreground font-body -mt-1">
            {responsesLoading ? "Buscando..." : `${filteredResponses.length} resultado(s) para "${searchParam}"`}
          </p>
        )}

        {/* ─── Response Cards ─── */}
        {responsesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-brand" />
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="text-center py-16">
            {searchParam ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Search size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-display font-bold text-foreground mb-1">Nenhum resultado</p>
                <p className="text-xs text-muted-foreground font-body">Tente buscar por outro termo.</p>
              </>
            ) : statusFilter !== "all" ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Filter size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-display font-bold text-foreground mb-1">Nenhuma resposta</p>
                <p className="text-xs text-muted-foreground font-body mb-3">Nenhuma resposta com esse filtro.</p>
                <button
                  onClick={() => setStatusFilter("all")}
                  className="text-xs text-brand hover:underline font-body font-medium"
                >
                  Ver todas
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Inbox size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-display font-bold text-foreground mb-1">Nenhuma resposta</p>
                <p className="text-xs text-muted-foreground font-body">
                  As respostas aparecerão aqui quando clientes preencherem o formulário.
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {paginatedResponses.map((response: any, index: number) => (
                <CorretorResponseCard
                  key={response.id}
                  response={response}
                  index={index}
                />
              ))}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}
      </main>
    </div>
  );
}
