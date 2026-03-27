/**
 * IntegrationLogsPanel — displays integration dispatch logs for a form.
 * Shows status, type, error messages, and allows manual retry.
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle, XCircle, Clock, RefreshCw, Loader2,
  Webhook, Table2, Building2, Mail, MessageCircle, Tag,
  ChevronDown, ChevronRight, AlertTriangle, Filter,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface IntegrationLogsPanelProps {
  formId: number;
}

const INTEGRATION_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  webhook: { label: "Webhook", icon: <Webhook size={14} />, color: "text-blue-600 bg-blue-50" },
  googleSheets: { label: "Google Sheets", icon: <Table2 size={14} />, color: "text-green-600 bg-green-50" },
  crmManus: { label: "CRM", icon: <Building2 size={14} />, color: "text-indigo-600 bg-indigo-50" },
  rdStation: { label: "RD Station", icon: <Tag size={14} />, color: "text-orange-600 bg-orange-50" },
  email: { label: "Email", icon: <Mail size={14} />, color: "text-purple-600 bg-purple-50" },
  whatsapp: { label: "WhatsApp", icon: <MessageCircle size={14} />, color: "text-emerald-600 bg-emerald-50" },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  success: { label: "Sucesso", icon: <CheckCircle size={14} />, color: "text-green-700", bg: "bg-green-50 border-green-200" },
  failure: { label: "Falha", icon: <XCircle size={14} />, color: "text-red-700", bg: "bg-red-50 border-red-200" },
  retrying: { label: "Aguardando retry", icon: <Clock size={14} />, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  pending: { label: "Pendente", icon: <Clock size={14} />, color: "text-gray-700", bg: "bg-gray-50 border-gray-200" },
};

type StatusFilter = "all" | "success" | "failure" | "retrying";

export function IntegrationLogsPanel({ formId }: IntegrationLogsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, refetch } = trpc.integrations.getLogs.useQuery(
    { formId, limit: pageSize, offset: page * pageSize },
    { refetchInterval: 30000 }, // Refresh every 30s
  );

  const retryMutation = trpc.integrations.retryLog.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Integração reenviada com sucesso!");
      } else {
        toast.error(result.error || "Falha ao reenviar");
      }
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao reenviar");
    },
  });

  const logs = data?.logs ?? [];
  const counts = data?.counts ?? { pending: 0, success: 0, failure: 0, retrying: 0 };

  const filteredLogs = useMemo(() => {
    if (statusFilter === "all") return logs;
    return logs.filter((log: any) => log.status === statusFilter);
  }, [logs, statusFilter]);

  const totalLogs = counts.success + counts.failure + counts.retrying + counts.pending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (totalLogs === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
          <Webhook size={24} className="text-muted-foreground" />
        </div>
        <h4 className="text-sm font-semibold text-foreground">Nenhum log de integração</h4>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Os logs aparecerão aqui quando respostas forem enviadas e as integrações forem disparadas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <SummaryCard
          label="Sucesso"
          count={counts.success}
          color="text-green-700 bg-green-50 border-green-200"
          icon={<CheckCircle size={14} />}
          active={statusFilter === "success"}
          onClick={() => setStatusFilter(statusFilter === "success" ? "all" : "success")}
        />
        <SummaryCard
          label="Falha"
          count={counts.failure}
          color="text-red-700 bg-red-50 border-red-200"
          icon={<XCircle size={14} />}
          active={statusFilter === "failure"}
          onClick={() => setStatusFilter(statusFilter === "failure" ? "all" : "failure")}
        />
        <SummaryCard
          label="Retry"
          count={counts.retrying}
          color="text-amber-700 bg-amber-50 border-amber-200"
          icon={<Clock size={14} />}
          active={statusFilter === "retrying"}
          onClick={() => setStatusFilter(statusFilter === "retrying" ? "all" : "retrying")}
        />
        <SummaryCard
          label="Total"
          count={totalLogs}
          color="text-gray-700 bg-gray-50 border-gray-200"
          icon={<Filter size={14} />}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
      </div>

      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw size={12} />
          Atualizar
        </button>
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {filteredLogs.map((log: any) => {
          const integration = INTEGRATION_LABELS[log.integrationType] ?? {
            label: log.integrationType,
            icon: <Webhook size={14} />,
            color: "text-gray-600 bg-gray-50",
          };
          const status = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.pending;
          const isExpanded = expandedLogId === log.id;
          const canRetry = log.status === "failure" || log.status === "retrying";

          return (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-xl border ${status.bg} transition-all`}
            >
              {/* Log Header */}
              <button
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${integration.color}`}>
                  {integration.icon}
                  {integration.label}
                </div>

                <div className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                  {status.icon}
                  {status.label}
                </div>

                {log.durationMs != null && (
                  <span className="text-[11px] text-muted-foreground">
                    {log.durationMs}ms
                  </span>
                )}

                {log.httpStatus && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    HTTP {log.httpStatus}
                  </span>
                )}

                <span className="ml-auto text-[11px] text-muted-foreground">
                  {formatDate(log.createdAt)}
                </span>

                {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
              </button>

              {/* Log Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 space-y-2">
                      {/* Error Message */}
                      {log.errorMessage && (
                        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-100/50 text-red-700 text-xs">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          <span className="break-all">{log.errorMessage}</span>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Resposta ID:</span>{" "}
                          <span className="font-mono font-medium">{log.responseId}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tentativas:</span>{" "}
                          <span className="font-medium">{log.retryCount}/{log.maxRetries}</span>
                        </div>
                        {log.nextRetryAt && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Próximo retry:</span>{" "}
                            <span className="font-medium">{formatDate(log.nextRetryAt)}</span>
                          </div>
                        )}
                      </div>

                      {/* Retry Button */}
                      {canRetry && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            retryMutation.mutate({ logId: log.id });
                          }}
                          disabled={retryMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 disabled:opacity-50 transition-colors"
                        >
                          {retryMutation.isPending ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <RefreshCw size={12} />
                          )}
                          Reenviar manualmente
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalLogs > pageSize && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-30 transition-colors"
          >
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            Página {page + 1}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={filteredLogs.length < pageSize}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80 disabled:opacity-30 transition-colors"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Summary Card ─── */

function SummaryCard({
  label,
  count,
  color,
  icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  color: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all ${color} ${
        active ? "ring-2 ring-brand/30 shadow-sm" : "opacity-70 hover:opacity-100"
      }`}
    >
      {icon}
      <div>
        <p className="text-lg font-bold leading-none">{count}</p>
        <p className="text-[10px] font-medium opacity-70">{label}</p>
      </div>
    </button>
  );
}

/* ─── Helpers ─── */

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
