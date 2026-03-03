import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Mail,
  MailX,
  MoreHorizontal,
  Pause,
  Play,
  RefreshCw,
  Search,
  Square,
  Timer,
  XCircle,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "paused" | "stopped";
type TypeFilter = "all" | "abandono" | "reprovacao";

export default function CadenceManagement() {
  const { user, loading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [formFilter, setFormFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const pageSize = 20;

  const utils = trpc.useUtils();

  // Queries
  const { data, isLoading, refetch } = trpc.cadenceManagement.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    cadenceType: typeFilter === "all" ? undefined : typeFilter,
    formId: formFilter !== "all" ? parseInt(formFilter) : undefined,
    search: searchQuery || undefined,
    page,
    pageSize,
  });

  const { data: formsData } = trpc.cadenceManagement.getFormsWithCadences.useQuery();

  // Mutations
  const pauseMutation = trpc.cadenceManagement.pause.useMutation({
    onSuccess: () => {
      toast.success("Cadência pausada");
      utils.cadenceManagement.list.invalidate();
    },
    onError: () => toast.error("Erro ao pausar cadência"),
  });

  const resumeMutation = trpc.cadenceManagement.resume.useMutation({
    onSuccess: () => {
      toast.success("Cadência retomada");
      utils.cadenceManagement.list.invalidate();
    },
    onError: () => toast.error("Erro ao retomar cadência"),
  });

  const stopMutation = trpc.cadenceManagement.stop.useMutation({
    onSuccess: () => {
      toast.success("Cadência encerrada");
      utils.cadenceManagement.list.invalidate();
    },
    onError: () => toast.error("Erro ao encerrar cadência"),
  });

  const batchPauseMutation = trpc.cadenceManagement.batchPause.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} cadências pausadas`);
      setSelectedIds(new Set());
      utils.cadenceManagement.list.invalidate();
    },
    onError: () => toast.error("Erro ao pausar cadências"),
  });

  const batchStopMutation = trpc.cadenceManagement.batchStop.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} cadências encerradas`);
      setSelectedIds(new Set());
      utils.cadenceManagement.list.invalidate();
    },
    onError: () => toast.error("Erro ao encerrar cadências"),
  });

  const cadences = data?.cadences ?? [];
  const stats = data?.stats ?? { active: 0, paused: 0, stopped: 0, total: 0, abandonoActive: 0, reprovacaoActive: 0 };
  const totalPages = Math.ceil((data?.total ?? 0) / pageSize);

  // Selection helpers
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === cadences.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cadences.map((c) => c.id)));
    }
  };

  const getStatusBadge = (cadence: typeof cadences[0]) => {
    if (!cadence.active) {
      const reasonLabels: Record<string, string> = {
        completed: "Concluída",
        form_completed: "Cadastro completo",
        form_approved: "Cadastro aprovado",
        manual: "Encerrada manualmente",
        max_reached: "Limite atingido",
      };
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          <XCircle size={12} />
          {reasonLabels[cadence.stoppedReason ?? ""] ?? "Encerrada"}
        </span>
      );
    }
    if (!cadence.nextSendAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <Pause size={12} />
          Pausada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Play size={12} />
        Ativa
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === "abandono") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Clock size={12} />
          Abandono
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
        <MailX size={12} />
        Reprovação
      </span>
    );
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="animate-spin text-brand" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className="p-2 rounded-xl hover:bg-secondary transition-colors">
                  <ArrowLeft size={20} className="text-muted-foreground" />
                </button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                  Cadências de Email
                </h1>
                <p className="text-sm text-muted-foreground font-body">
                  Gerencie todas as cadências de email dos formulários
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              <RefreshCw size={14} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${statusFilter === "all" ? "ring-2 ring-brand" : "hover:shadow-md"}`}
              onClick={() => { setStatusFilter("all"); setPage(1); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-brand/10">
                    <Mail size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground font-body">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${statusFilter === "active" ? "ring-2 ring-emerald-500" : "hover:shadow-md"}`}
              onClick={() => { setStatusFilter("active"); setPage(1); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10">
                    <Play size={18} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">{stats.active}</p>
                    <p className="text-xs text-muted-foreground font-body">Ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${statusFilter === "paused" ? "ring-2 ring-amber-500" : "hover:shadow-md"}`}
              onClick={() => { setStatusFilter("paused"); setPage(1); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10">
                    <Pause size={18} className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">{stats.paused}</p>
                    <p className="text-xs text-muted-foreground font-body">Pausadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-200 ${statusFilter === "stopped" ? "ring-2 ring-muted-foreground" : "hover:shadow-md"}`}
              onClick={() => { setStatusFilter("stopped"); setPage(1); }}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted">
                    <Square size={18} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">{stats.stopped}</p>
                    <p className="text-xs text-muted-foreground font-body">Encerradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Type breakdown */}
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-body">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {stats.abandonoActive} abandono ativas
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {stats.reprovacaoActive} reprovação ativas
          </span>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-body bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
            />
          </div>

          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as TypeFilter); setPage(1); }}>
              <SelectTrigger className="w-[150px] rounded-xl">
                <Filter size={14} className="mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="abandono">Abandono</SelectItem>
                <SelectItem value="reprovacao">Reprovação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={formFilter} onValueChange={(v) => { setFormFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue placeholder="Formulário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos formulários</SelectItem>
                {formsData?.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Batch Actions */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl bg-brand/5 border border-brand/20">
                <span className="text-sm font-body font-medium text-foreground">
                  {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
                </span>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => batchPauseMutation.mutate({ cadenceIds: Array.from(selectedIds) })}
                    disabled={batchPauseMutation.isPending}
                    className="gap-1.5"
                  >
                    <Pause size={14} />
                    Pausar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => batchStopMutation.mutate({ cadenceIds: Array.from(selectedIds) })}
                    disabled={batchStopMutation.isPending}
                    className="gap-1.5"
                  >
                    <Square size={14} />
                    Encerrar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cadence List */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        ) : cadences.length === 0 ? (
          <div className="text-center py-16">
            <Mail size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-display font-semibold text-foreground mb-1">
              Nenhuma cadência encontrada
            </h3>
            <p className="text-sm text-muted-foreground font-body">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all" || formFilter !== "all"
                ? "Tente ajustar os filtros para encontrar cadências."
                : "As cadências serão criadas automaticamente quando houver cadastros incompletos ou reprovados."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[40px_1fr_140px_120px_100px_120px_120px_48px] gap-3 px-4 py-2 text-xs font-body font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="flex items-center">
                <Checkbox
                  checked={selectedIds.size === cadences.length && cadences.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </div>
              <div>Destinatário</div>
              <div>Formulário</div>
              <div>Tipo</div>
              <div>Status</div>
              <div>Progresso</div>
              <div>Próximo envio</div>
              <div />
            </div>

            {/* Cadence Rows */}
            {cadences.map((cadence, idx) => (
              <motion.div
                key={cadence.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <Card className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-0">
                    {/* Desktop Row */}
                    <div className="hidden md:grid grid-cols-[40px_1fr_140px_120px_100px_120px_120px_48px] gap-3 items-center px-4 py-3">
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedIds.has(cadence.id)}
                          onCheckedChange={() => toggleSelect(cadence.id)}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-body font-medium text-foreground truncate">
                          {cadence.recipientName || "Sem nome"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{cadence.recipientEmail}</p>
                        {cadence.protocol && (
                          <p className="text-xs text-brand font-mono mt-0.5">#{cadence.protocol}</p>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground font-body truncate" title={cadence.formTitle}>
                        {cadence.formTitle}
                      </div>

                      <div>{getTypeBadge(cadence.cadenceType)}</div>

                      <div>{getStatusBadge(cadence)}</div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-brand transition-all duration-300"
                              style={{
                                width: `${cadence.maxSequence > 0 ? (cadence.sequenceNumber / cadence.maxSequence) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                            {cadence.sequenceNumber}/{cadence.maxSequence}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground font-body">
                        {cadence.active && cadence.nextSendAt ? (
                          <span className="flex items-center gap-1">
                            <Timer size={12} />
                            {formatDate(cadence.nextSendAt)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </div>

                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {cadence.active && cadence.nextSendAt && (
                              <DropdownMenuItem
                                onClick={() => pauseMutation.mutate({ cadenceId: cadence.id })}
                                className="gap-2"
                              >
                                <Pause size={14} /> Pausar
                              </DropdownMenuItem>
                            )}
                            {cadence.active && !cadence.nextSendAt && (
                              <DropdownMenuItem
                                onClick={() => resumeMutation.mutate({ cadenceId: cadence.id })}
                                className="gap-2"
                              >
                                <Play size={14} /> Retomar
                              </DropdownMenuItem>
                            )}
                            {cadence.active && (
                              <DropdownMenuItem
                                onClick={() => stopMutation.mutate({ cadenceId: cadence.id })}
                                className="gap-2 text-destructive"
                              >
                                <Square size={14} /> Encerrar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/responses/${cadence.formId}`} className="gap-2 cursor-pointer">
                                <Mail size={14} /> Ver formulário
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Mobile Card */}
                    <div className="md:hidden p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(cadence.id)}
                            onCheckedChange={() => toggleSelect(cadence.id)}
                            className="mt-1"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-body font-medium text-foreground">
                              {cadence.recipientName || "Sem nome"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{cadence.recipientEmail}</p>
                            {cadence.protocol && (
                              <p className="text-xs text-brand font-mono mt-0.5">#{cadence.protocol}</p>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {cadence.active && cadence.nextSendAt && (
                              <DropdownMenuItem
                                onClick={() => pauseMutation.mutate({ cadenceId: cadence.id })}
                                className="gap-2"
                              >
                                <Pause size={14} /> Pausar
                              </DropdownMenuItem>
                            )}
                            {cadence.active && !cadence.nextSendAt && (
                              <DropdownMenuItem
                                onClick={() => resumeMutation.mutate({ cadenceId: cadence.id })}
                                className="gap-2"
                              >
                                <Play size={14} /> Retomar
                              </DropdownMenuItem>
                            )}
                            {cadence.active && (
                              <DropdownMenuItem
                                onClick={() => stopMutation.mutate({ cadenceId: cadence.id })}
                                className="gap-2 text-destructive"
                              >
                                <Square size={14} /> Encerrar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/responses/${cadence.formId}`} className="gap-2 cursor-pointer">
                                <Mail size={14} /> Ver formulário
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {getTypeBadge(cadence.cadenceType)}
                        {getStatusBadge(cadence)}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground font-body">
                        <span className="truncate max-w-[140px]">{cadence.formTitle}</span>
                        <span className="font-mono">{cadence.sequenceNumber}/{cadence.maxSequence} emails</span>
                      </div>

                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-300"
                          style={{
                            width: `${cadence.maxSequence > 0 ? (cadence.sequenceNumber / cadence.maxSequence) * 100 : 0}%`,
                          }}
                        />
                      </div>

                      {cadence.active && cadence.nextSendAt && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Timer size={12} />
                          Próximo envio: {formatDate(cadence.nextSendAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground font-body">
              Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data?.total ?? 0)} de {data?.total ?? 0}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="gap-1"
              >
                <ChevronLeft size={14} />
                Anterior
              </Button>
              <span className="text-sm font-body text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="gap-1"
              >
                Próxima
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
