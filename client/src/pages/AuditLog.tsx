/**
 * AuditLog — Audit trail page showing all important actions in the system.
 * Accessible only by admin roles (master, diretor, gerente).
 */

import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users,
  Eye,
  Lock,
  Settings,
  LogIn,
  UserPlus,
  Trash2,
  Edit,
  Copy,
  UserX,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/* ─── Action Display Config ─── */
const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  "form.create": { label: "Formulário criado", icon: FileText, color: "text-green-600" },
  "form.update": { label: "Formulário editado", icon: Edit, color: "text-blue-600" },
  "form.delete": { label: "Formulário excluído", icon: Trash2, color: "text-red-600" },
  "form.duplicate": { label: "Formulário duplicado", icon: Copy, color: "text-purple-600" },
  "staff.invite": { label: "Convite enviado", icon: UserPlus, color: "text-green-600" },
  "staff.update_role": { label: "Role alterado", icon: Users, color: "text-amber-600" },
  "staff.deactivate": { label: "Membro desativado", icon: UserX, color: "text-red-600" },
  "staff.activate": { label: "Membro ativado", icon: UserCheck, color: "text-green-600" },
  "staff.delete": { label: "Membro removido", icon: Trash2, color: "text-red-600" },
  "response.approve": { label: "Resposta aprovada", icon: Eye, color: "text-green-600" },
  "response.reject": { label: "Resposta rejeitada", icon: Eye, color: "text-red-600" },
  "access.login": { label: "Login realizado", icon: LogIn, color: "text-blue-600" },
  "access.blocked": { label: "Acesso bloqueado", icon: Lock, color: "text-red-600" },
  "settings.update": { label: "Configuração alterada", icon: Settings, color: "text-blue-600" },
};

const CATEGORY_OPTIONS = [
  { value: "all", label: "Todas as categorias" },
  { value: "form", label: "Formulários" },
  { value: "staff", label: "Equipe" },
  { value: "response", label: "Respostas" },
  { value: "access", label: "Acesso" },
  { value: "settings", label: "Configurações" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "Todas as severidades" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Aviso" },
  { value: "critical", label: "Crítico" },
];

const PAGE_SIZE = 25;

function SeverityBadge({ severity }: { severity: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    info: { variant: "secondary", label: "Info" },
    warning: { variant: "outline", label: "Aviso" },
    critical: { variant: "destructive", label: "Crítico" },
  };
  const c = config[severity] ?? config.info;
  return (
    <Badge variant={c.variant} className={severity === "warning" ? "border-amber-500 text-amber-600" : ""}>
      {c.label}
    </Badge>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (!role) return null;
  const colors: Record<string, string> = {
    master: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    diretor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    gerente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    corretor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[role] ?? "bg-gray-100 text-gray-700"}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  );
}

export default function AuditLog() {
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const queryInput = useMemo(() => ({
    ...(category !== "all" ? { category: category as any } : {}),
    ...(severity !== "all" ? { severity: severity as any } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [category, severity, search, page]);

  const { data, isLoading, refetch } = trpc.audit.list.useQuery(queryInput, {
    refetchInterval: 30_000, // Auto-refresh every 30s
  });

  const { data: stats } = trpc.audit.stats.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            Log de Auditoria
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de todas as ações importantes realizadas no sistema
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ações (últimas 24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.totalLast24h : <Skeleton className="h-8 w-16" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              Avisos (últimos 7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.warningsLast7d : <Skeleton className="h-8 w-16" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, ação ou detalhes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={(v) => { setSeverity(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEVERITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Log List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.logs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum registro encontrado</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {search || category !== "all" || severity !== "all"
                  ? "Tente ajustar os filtros"
                  : "As ações serão registradas aqui automaticamente"}
              </p>
            </CardContent>
          </Card>
        ) : (
          data?.logs.map((log: any) => {
            const config = ACTION_CONFIG[log.action] ?? {
              label: log.action,
              icon: ShieldCheck,
              color: "text-muted-foreground",
            };
            const Icon = config.icon;

            return (
              <Card key={log.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.severity === "warning" ? "bg-amber-100 dark:bg-amber-900/30" :
                      log.severity === "critical" ? "bg-red-100 dark:bg-red-900/30" :
                      "bg-muted"
                    }`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{config.label}</span>
                        <SeverityBadge severity={log.severity} />
                        {log.staffRole && <RoleBadge role={log.staffRole} />}
                      </div>

                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium text-foreground/80">{log.staffName ?? "Sistema"}</span>
                        {log.targetName && (
                          <>
                            {" "}— <span className="text-foreground/70">{log.targetName}</span>
                          </>
                        )}
                      </div>

                      {/* Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-1.5 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1 inline-flex flex-wrap gap-x-3 gap-y-1">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-xs text-muted-foreground shrink-0 text-right">
                      <div>{format(new Date(log.createdAt), "dd/MM/yyyy", { locale: ptBR })}</div>
                      <div>{format(new Date(log.createdAt), "HH:mm:ss", { locale: ptBR })}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data?.total ?? 0} registro{(data?.total ?? 0) !== 1 ? "s" : ""} encontrado{(data?.total ?? 0) !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
