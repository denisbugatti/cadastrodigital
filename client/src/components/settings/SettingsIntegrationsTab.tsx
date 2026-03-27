/**
 * SettingsIntegrationsTab
 * Aba de Integrações nas Configurações — visão global de todos os logs de integração,
 * filtros por tipo/status/formulário, stats resumidos e retry manual.
 * Acessível apenas por gestores (role check feito no backend via staffAdminProcedure).
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Webhook, Sheet, CheckCircle2, XCircle, Clock, RefreshCw,
  Filter, ChevronDown, AlertTriangle, Activity, Zap, Globe,
  RotateCcw, ExternalLink, Search, TrendingUp, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

// ─── Type icons ───
const TYPE_ICONS: Record<string, React.ReactNode> = {
  webhook: <Webhook size={14} />,
  google_sheets: <Sheet size={14} />,
  crm: <Globe size={14} />,
  email: <Zap size={14} />,
};

const TYPE_LABELS: Record<string, string> = {
  webhook: "Webhook",
  google_sheets: "Google Sheets",
  crm: "CRM",
  email: "E-mail",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string; badgeClass: string }> = {
  success: {
    label: "Sucesso",
    icon: <CheckCircle2 size={14} />,
    className: "text-emerald-600",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  failure: {
    label: "Falha",
    icon: <XCircle size={14} />,
    className: "text-red-500",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
  },
  retrying: {
    label: "Retry",
    icon: <RefreshCw size={14} className="animate-spin" />,
    className: "text-amber-500",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
  pending: {
    label: "Pendente",
    icon: <Clock size={14} />,
    className: "text-blue-500",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

// ─── Period options ───
const PERIOD_OPTIONS = [
  { value: "1d", label: "Hoje" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "all", label: "Todos" },
];

function periodToDate(period: string): Date | undefined {
  if (period === "all") return undefined;
  const now = new Date();
  if (period === "1d") return new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (period === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (period === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return undefined;
}

export function SettingsIntegrationsTab() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("7d");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const since = useMemo(() => periodToDate(periodFilter), [periodFilter]);

  const { data: stats, isLoading: statsLoading } = trpc.integrations.getGlobalStats.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const { data: logs, isLoading: logsLoading, refetch } = trpc.integrations.getGlobalLogs.useQuery({
    limit: 100,
    offset: 0,
    status: statusFilter !== "all" ? statusFilter : undefined,
    integrationType: typeFilter !== "all" ? typeFilter : undefined,
    since,
  }, {
    refetchInterval: 30_000,
  });

  const retryLog = trpc.integrations.retryLog.useMutation({
    onSuccess: () => {
      toast.success("Retry agendado com sucesso");
      refetch();
    },
    onError: (err) => toast.error(`Erro ao fazer retry: ${err.message}`),
  });

  // Client-side search filter
  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((log: typeof logs[0]) =>
      (log.formTitle ?? "").toLowerCase().includes(q) ||
      log.integrationType.toLowerCase().includes(q) ||
      (log.errorMessage ?? "").toLowerCase().includes(q) ||
      String(log.responseId ?? "").includes(q)
    );
  }, [logs, search]);

  const totalSuccess = stats?.byStatus?.success ?? 0;
  const totalFailure = stats?.byStatus?.failure ?? 0;
  const totalRetrying = stats?.byStatus?.retrying ?? 0;
  const totalAll = totalSuccess + totalFailure + totalRetrying + (stats?.byStatus?.pending ?? 0);
  const successRate = totalAll > 0 ? Math.round((totalSuccess / totalAll) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Taxa de sucesso"
          value={`${successRate}%`}
          sub="últimos 7 dias"
          icon={<TrendingUp size={18} className="text-emerald-500" />}
          color="emerald"
          loading={statsLoading}
        />
        <StatCard
          label="Sucesso"
          value={totalSuccess}
          sub="disparos"
          icon={<CheckCircle2 size={18} className="text-emerald-500" />}
          color="emerald"
          loading={statsLoading}
        />
        <StatCard
          label="Falhas"
          value={totalFailure}
          sub="disparos"
          icon={<XCircle size={18} className="text-red-500" />}
          color="red"
          loading={statsLoading}
        />
        <StatCard
          label="Em retry"
          value={totalRetrying}
          sub="aguardando"
          icon={<RefreshCw size={18} className="text-amber-500" />}
          color="amber"
          loading={statsLoading}
        />
      </div>

      {/* Por tipo de integração */}
      {stats && stats.byType.length > 0 && (
        <Card className="border border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-body font-semibold text-foreground flex items-center gap-2">
              <Activity size={16} className="text-brand" />
              Desempenho por tipo (últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {stats.byType.map((t: { type: string; total: number; success: number; failure: number }) => {
                const rate = t.total > 0 ? Math.round((t.success / t.total) * 100) : 0;
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                      {TYPE_ICONS[t.type] ?? <Webhook size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-body text-foreground">
                          {TYPE_LABELS[t.type] ?? t.type}
                        </span>
                        <span className="text-xs font-body text-muted-foreground">
                          {t.success}/{t.total} ({rate}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${rate >= 90 ? "bg-emerald-500" : rate >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e Logs */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-body font-semibold text-foreground flex items-center gap-2">
              <Activity size={16} className="text-brand" />
              Log de disparos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="h-8 gap-1.5 text-xs font-body"
              >
                <RefreshCw size={13} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8 gap-1.5 text-xs font-body"
              >
                <Filter size={13} />
                Filtros
                <ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Filtros expandíveis */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs font-body"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs font-body">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="failure">Falha</SelectItem>
                  <SelectItem value="retrying">Em retry</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-8 text-xs font-body">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="google_sheets">Google Sheets</SelectItem>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="h-8 text-xs font-body">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          {logsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-secondary animate-pulse" />
              ))}
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center">
              <Activity size={32} className="mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm font-body text-muted-foreground">
                Nenhum log encontrado para os filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log: typeof filteredLogs[0]) => {
                const statusCfg = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.pending;
                const typeIcon = TYPE_ICONS[log.integrationType] ?? <Webhook size={14} />;
                const typeLabel = TYPE_LABELS[log.integrationType] ?? log.integrationType;
                const canRetry = log.status === "failure";

                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors"
                  >
                    {/* Type icon */}
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground shrink-0">
                      {typeIcon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-body font-medium text-foreground truncate max-w-[160px]">
                          {log.formTitle ?? `Formulário #${log.formId}`}
                        </span>
                        <Badge variant="outline" className={`text-[10px] font-body px-1.5 py-0 ${statusCfg.badgeClass}`}>
                          <span className="flex items-center gap-1">
                            {statusCfg.icon}
                            {statusCfg.label}
                          </span>
                        </Badge>
                        <span className="text-xs font-body text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md">
                          {typeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {log.responseId && (
                          <span className="text-xs font-body text-muted-foreground/60">
                            Resp. #{log.responseId}
                          </span>
                        )}
                        {log.httpStatus && (
                          <span className={`text-xs font-body font-mono ${log.httpStatus >= 200 && log.httpStatus < 300 ? "text-emerald-600" : "text-red-500"}`}>
                            HTTP {log.httpStatus}
                          </span>
                        )}
                        {log.durationMs && (
                          <span className="text-xs font-body text-muted-foreground/60">
                            {log.durationMs}ms
                          </span>
                        )}
                        {log.retryCount > 0 && (
                          <span className="text-xs font-body text-amber-600">
                            {log.retryCount} tentativa{log.retryCount > 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="text-xs font-body text-muted-foreground/50 ml-auto">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs font-body text-red-500/80 mt-1 truncate">
                          <AlertTriangle size={11} className="inline mr-1" />
                          {log.errorMessage}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {canRetry && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => retryLog.mutate({ logId: log.id })}
                        disabled={retryLog.isPending}
                        className="h-7 px-2 text-xs font-body shrink-0"
                        title="Tentar novamente"
                      >
                        <RotateCcw size={12} />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({
  label, value, sub, icon, color, loading,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  color: "emerald" | "red" | "amber" | "blue";
  loading?: boolean;
}) {
  const colorMap = {
    emerald: "bg-emerald-50 border-emerald-100",
    red: "bg-red-50 border-red-100",
    amber: "bg-amber-50 border-amber-100",
    blue: "bg-blue-50 border-blue-100",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-body text-muted-foreground">{label}</span>
        {icon}
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-secondary animate-pulse rounded-lg" />
      ) : (
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
      )}
      <p className="text-xs font-body text-muted-foreground/60 mt-0.5">{sub}</p>
    </div>
  );
}
