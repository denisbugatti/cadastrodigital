/**
 * FormCopiesManagement — Galeria de Templates.
 * Shows template forms that can be duplicated by gerentes to create their own forms.
 * Master/diretor see the full admin view with sync management.
 * Gerentes see templates they can duplicate + their own created forms.
 * Route: /formularios-copias
 */

import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  Loader2, RefreshCw, Copy, Users, CheckCircle2,
  AlertTriangle, ExternalLink, FileText, BarChart3, Search,
  Eye, ChevronDown, ChevronUp, Plus, Lock, Pencil,
  LayoutTemplate,
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

/* ─── Template Card (for gerentes) ─── */
function TemplateCard({
  form,
  onDuplicate,
  isDuplicating,
  isOwner,
}: {
  form: any;
  onDuplicate: () => void;
  isDuplicating: boolean;
  isOwner: boolean;
}) {
  const isTemplate = form.isTemplate;

  return (
    <div className="border border-border/50 rounded-xl bg-card/50 p-5 hover:border-primary/30 transition-all">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
          isTemplate
            ? "bg-primary/10 text-primary"
            : "bg-blue-500/10 text-blue-400"
        }`}>
          {isTemplate ? <LayoutTemplate size={22} /> : <FileText size={22} />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground text-sm truncate">{form.title}</h3>
            {isTemplate && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary flex items-center gap-1">
                <Lock size={10} /> Template
              </span>
            )}
          </div>
          {form.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              form.status === "published"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-slate-500/10 text-slate-400"
            }`}>
              {form.status === "published" ? "Publicado" : "Rascunho"}
            </span>
            <span>{form.responseCount ?? 0} respostas</span>
            <span>/{form.slug}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="shrink-0 flex flex-col gap-2">
          <Button
            variant="default"
            size="sm"
            className="text-xs gap-1.5"
            onClick={onDuplicate}
            disabled={isDuplicating}
          >
            {isDuplicating ? <Loader2 size={13} className="animate-spin" /> : <Copy size={13} />}
            Usar Template
          </Button>
          {!isTemplate && (
            <div className="flex gap-1">
              <Link href={`/editor/${form.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                  <Pencil size={11} /> Editar
                </Button>
              </Link>
              <Link href={`/responses/${form.id}`}>
                <Button variant="outline" size="sm" className="text-xs gap-1 h-7">
                  <Eye size={11} /> Respostas
                </Button>
              </Link>
            </div>
          )}
          {isTemplate && isOwner && (
            <Link href={`/editor/${form.id}`}>
              <Button variant="outline" size="sm" className="text-xs gap-1.5 w-full">
                <Pencil size={11} /> Editar Template
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Child Form Card (admin view) ─── */
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

  const childUpdated = child.updatedAt ? new Date(child.updatedAt).getTime() : 0;
  const parentUpdated = parentUpdatedAt ? new Date(parentUpdatedAt).getTime() : 0;
  const isSynced = childUpdated >= parentUpdated - 5000;

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
        <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          isSynced
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-amber-500/10 text-amber-400"
        }`}>
          {isSynced ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{child.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Corretor: <span className="font-medium text-foreground">{child.corretorName}</span>
            {" · "}
            <span className="text-muted-foreground">/{child.slug}</span>
          </p>
        </div>

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
  const { user, isStaff } = useCustomAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "copies">("templates");

  const staffUser = isStaff ? (user as { type: "staff"; role: string }) : null;
  const isOwner = staffUser?.role === "master" || staffUser?.role === "diretor";
  const isGerente = staffUser?.role === "gerente";

  // Get all forms
  const { data: allForms, isLoading: loadingForms, refetch: refetchForms } = trpc.forms.list.useQuery();

  // Separate templates from regular forms
  const templates = useMemo(() => {
    if (!allForms) return [];
    return allForms.filter((f: any) => f.isTemplate);
  }, [allForms]);

  const myForms = useMemo(() => {
    if (!allForms) return [];
    return allForms.filter((f: any) => !f.isTemplate && !f.assignedCorretorId);
  }, [allForms]);

  // Get main form for admin sync view
  const mainForm = useMemo(() => {
    if (!allForms) return null;
    return allForms.find((f: any) => f.isTemplate) ?? allForms.find((f: any) => f.status === "published" && !f.parentFormId && !f.assignedCorretorId) ?? allForms[0];
  }, [allForms]);

  // Get child forms (admin view)
  const { data: children, isLoading: loadingChildren, refetch: refetchChildren } = trpc.formSync.children.useQuery(
    { formId: mainForm?.id! },
    { enabled: !!mainForm?.id && isOwner }
  );

  // Force sync mutation
  const forceSync = trpc.formSync.forceSync.useMutation({
    onSuccess: (result: any) => {
      toast.success(`Sincronização concluída`, {
        description: `${result.synced} formulário(s) atualizado(s)`,
      });
      refetchChildren();
    },
    onError: (err: any) => {
      toast.error("Erro ao sincronizar", { description: err.message });
    },
  });

  // Duplicate mutation
  const duplicateForm = trpc.forms.duplicate.useMutation({
    onSuccess: (result: any) => {
      toast.success("Formulário criado com sucesso!", {
        description: "Você pode editá-lo e publicá-lo.",
      });
      refetchForms();
      // Navigate to editor for the new form
      if (result?.id) {
        navigate(`/editor/${result.id}`);
      }
    },
    onError: (err: any) => {
      toast.error("Erro ao duplicar formulário", { description: err.message });
    },
  });

  // Filter children by search (admin view)
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

  // Filter templates/forms by search
  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter((f: any) => f.title.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q));
  }, [templates, search]);

  const filteredMyForms = useMemo(() => {
    if (!search.trim()) return myForms;
    const q = search.toLowerCase();
    return myForms.filter((f: any) => f.title.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q));
  }, [myForms, search]);

  // Stats (admin)
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

  const isLoading = loadingForms || (isOwner && loadingChildren);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <LayoutTemplate size={22} className="text-primary" />
            Galeria de Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isGerente
              ? "Duplique um template para criar seu próprio formulário"
              : "Gerencie templates e cópias de formulários"
            }
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          className="gap-1.5"
          onClick={() => navigate("/editor")}
        >
          <Plus size={14} /> Criar do Zero
        </Button>
      </div>

      {/* Tabs (admin only) */}
      {isOwner && (
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "templates"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab("copies")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === "copies"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cópias ({stats.total})
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={activeTab === "copies" ? "Buscar por nome, corretor ou slug..." : "Buscar templates..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {isOwner && activeTab === "copies" && stats.synced < stats.total && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => mainForm && forceSync.mutate({ formId: mainForm.id })}
            disabled={forceSync.isPending}
          >
            {forceSync.isPending ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Sincronizar Todas ({stats.total - stats.synced})
          </Button>
        )}
      </div>

      {/* ─── Templates Tab ─── */}
      {(activeTab === "templates" || isGerente) && (
        <div className="space-y-6">
          {/* Templates section */}
          {filteredTemplates.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Lock size={12} /> Templates Disponíveis
              </h2>
              {filteredTemplates.map((form: any) => (
                <TemplateCard
                  key={form.id}
                  form={form}
                  onDuplicate={() => duplicateForm.mutate({ id: form.id, title: `${form.title} (cópia)` })}
                  isDuplicating={duplicateForm.isPending}
                  isOwner={isOwner}
                />
              ))}
            </div>
          )}

          {/* My Forms section (gerente's own created forms) */}
          {filteredMyForms.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FileText size={12} /> Meus Formulários
              </h2>
              {filteredMyForms.map((form: any) => (
                <TemplateCard
                  key={form.id}
                  form={form}
                  onDuplicate={() => duplicateForm.mutate({ id: form.id, title: `${form.title} (cópia)` })}
                  isDuplicating={duplicateForm.isPending}
                  isOwner={isOwner}
                />
              ))}
            </div>
          )}

          {filteredTemplates.length === 0 && filteredMyForms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <LayoutTemplate size={48} className="text-muted-foreground/30 mb-4" />
              <h2 className="text-lg font-semibold text-foreground">
                {search ? "Nenhum template encontrado" : "Nenhum template disponível"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {search ? "Tente outro termo de busca." : "Templates serão adicionados pelo administrador."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Copies Tab (admin only) ─── */}
      {isOwner && activeTab === "copies" && (
        <div className="space-y-4">
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
                  parentUpdatedAt={mainForm?.updatedAt ?? null}
                  onForceSync={() => mainForm && forceSync.mutate({ formId: mainForm.id })}
                  isSyncing={forceSync.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
