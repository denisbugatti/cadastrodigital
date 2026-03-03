/**
 * FormCopiesManagement — Admin panel to manage form copies (child forms).
 * Shows all child forms of the main One Innovation form with sync status.
 * Route: /formularios-copias
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Loader2, RefreshCw, Copy, Users, CheckCircle2,
  AlertTriangle, ExternalLink, FileText, BarChart3, Search,
  Clock, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/* ─── Helper: format date ─── */
function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Child Form Card ─── */
function ChildFormCard({
  child,
  parentUpdatedAt,
  onForceSync,
  isSyncing,
}: {
  child: any;
  parentUpdatedAt: Date | string | null;
  onForceSync: () => void;
  isSyncing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  // Determine sync status
  const childUpdated = child.updatedAt ? new Date(child.updatedAt).getTime() : 0;
  const parentUpdated = parentUpdatedAt ? new Date(parentUpdatedAt).getTime() : 0;
  // Child is synced if it was updated after or close to the parent's last update
  const isSynced = childUpdated >= parentUpdated - 5000; // 5s tolerance

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      isSynced
        ? "border-border/50 bg-card/50"
        : "border-amber-500/30 bg-amber-500/5"
    }`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        {/* Sync status icon */}
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          isSynced
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {isSynced ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </div>

        {/* Form info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{child.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Corretor: <span className="font-medium text-foreground">{child.corretorName}</span>
            {" · "}
            <span className="text-muted-foreground">/{child.slug}</span>
          </p>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="font-bold text-foreground">{child.responseCount ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Respostas</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
            child.status === "published"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-slate-500/10 text-slate-400"
          }`}>
            {child.status === "published" ? "Publicado" : "Rascunho"}
          </span>
        </div>

        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground font-medium">Status</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                {child.status === "published" ? "Publicado" : "Rascunho"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground font-medium">Respostas</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{child.responseCount ?? 0}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground font-medium">Criado em</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(child.createdAt)}</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-[10px] text-muted-foreground font-medium">Atualizado</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{formatDate(child.updatedAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Link href={`/responses/${child.id}`}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Eye size={13} /> Ver Respostas
              </Button>
            </Link>
            <Link href={`/editor/${child.id}`}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <ExternalLink size={13} /> Abrir Editor
              </Button>
            </Link>
            {!isSynced && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={onForceSync}
                disabled={isSyncing}
              >
                {isSyncing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                Sincronizar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function FormCopiesManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  // Get the main form (first published form without parent)
  const { data: allForms, isLoading: loadingForms } = trpc.forms.list.useQuery();

  const mainForm = useMemo(() => {
    if (!allForms) return null;
    return allForms.find((f: any) => f.status === "published" && !f.parentFormId && !f.assignedCorretorId) ?? allForms[0];
  }, [allForms]);

  // Get child forms
  const { data: children, isLoading: loadingChildren, refetch: refetchChildren } = trpc.formSync.children.useQuery(
    { formId: mainForm?.id! },
    { enabled: !!mainForm?.id }
  );

  // Force sync mutation
  const forceSync = trpc.formSync.forceSync.useMutation({
    onSuccess: (result) => {
      toast.success(`Sincronização concluída`, {
        description: `${result.synced} formulário(s) atualizado(s)`,
      });
      refetchChildren();
    },
    onError: (err) => {
      toast.error("Erro ao sincronizar", { description: err.message });
    },
  });

  // Filter children by search
  const filteredChildren = useMemo(() => {
    if (!children) return [];
    if (!search.trim()) return children;
    const q = search.toLowerCase();
    return children.filter((c: any) =>
      c.title.toLowerCase().includes(q) ||
      c.corretorName.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
    );
  }, [children, search]);

  // Stats
  const stats = useMemo(() => {
    if (!children) return { total: 0, published: 0, synced: 0, totalResponses: 0 };
    const parentTime = mainForm?.updatedAt ? new Date(mainForm.updatedAt).getTime() : 0;
    return {
      total: children.length,
      published: children.filter((c: any) => c.status === "published").length,
      synced: children.filter((c: any) => {
        const ct = c.updatedAt ? new Date(c.updatedAt).getTime() : 0;
        return ct >= parentTime - 5000;
      }).length,
      totalResponses: children.reduce((sum: number, c: any) => sum + (c.responseCount ?? 0), 0),
    };
  }, [children, mainForm]);

  const isLoading = loadingForms || loadingChildren;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted-foreground">Carregando formulários...</p>
        </div>
      </div>
    );
  }

  if (!mainForm) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText size={48} className="text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Nenhum formulário principal encontrado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Crie e publique um formulário primeiro.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Copy size={22} className="text-primary" />
          Gerenciamento de Cópias
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Formulário principal: <span className="font-semibold text-foreground">{mainForm.title}</span>
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Copy size={14} className="text-blue-400" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Cópias</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sincronizadas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.synced}<span className="text-sm text-muted-foreground font-normal">/{stats.total}</span>
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-purple-400" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Publicadas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.published}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={14} className="text-amber-400" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Total Respostas</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{stats.totalResponses}</p>
        </div>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, corretor ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {stats.synced < stats.total && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => forceSync.mutate({ formId: mainForm.id })}
            disabled={forceSync.isPending}
          >
            {forceSync.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Sincronizar Todas ({stats.total - stats.synced})
          </Button>
        )}
      </div>

      {/* Children list */}
      {filteredChildren.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={48} className="text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-semibold text-foreground">
            {search ? "Nenhuma cópia encontrada" : "Nenhuma cópia criada"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Tente outro termo de busca."
              : "Convide corretores na página de Equipe para criar cópias automaticamente."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredChildren.map((child: any) => (
            <ChildFormCard
              key={child.id}
              child={child}
              parentUpdatedAt={mainForm.updatedAt}
              onForceSync={() => forceSync.mutate({ formId: mainForm.id })}
              isSyncing={forceSync.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
