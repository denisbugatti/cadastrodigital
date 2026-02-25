/**
 * FormFlow Dashboard — Light Clean Design
 * Fontes: Plus Jakarta Sans (display) + Inter (body)
 * Features: busca, filtros por status, ordenação, confirmação de exclusão
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Plus,
  Search,
  FileText,
  Users,
  MoreHorizontal,
  Pencil,
  Trash2,
  Copy,
  Share2,
  BarChart3,
  ArrowUpDown,
  SlidersHorizontal,
  AlertTriangle,
} from "lucide-react";
import {
  userForms as initialForms,
  type UserForm,
} from "@/lib/dashboardData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

/* ─── Types ─── */

type StatusFilter = "all" | "published" | "draft" | "closed";
type SortOption = "updated" | "name" | "responses" | "created";

/* ─── Status config ─── */

function getStatusConfig(status: UserForm["status"]) {
  switch (status) {
    case "published":
      return { label: "Publicado", dotColor: "#22c55e", textClass: "text-green-600", bgClass: "bg-green-50 border-green-200 text-green-700", activeBg: "bg-green-100 border-green-300" };
    case "draft":
      return { label: "Rascunho", dotColor: "#f59e0b", textClass: "text-amber-600", bgClass: "bg-amber-50 border-amber-200 text-amber-700", activeBg: "bg-amber-100 border-amber-300" };
    case "closed":
      return { label: "Encerrado", dotColor: "#94a3b8", textClass: "text-slate-400", bgClass: "bg-slate-50 border-slate-200 text-slate-600", activeBg: "bg-slate-100 border-slate-300" };
  }
}

const statusFilters: { id: StatusFilter; label: string; icon?: string }[] = [
  { id: "all", label: "Todos" },
  { id: "published", label: "Publicados" },
  { id: "draft", label: "Rascunhos" },
  { id: "closed", label: "Encerrados" },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: "updated", label: "Última atualização" },
  { id: "name", label: "Nome (A-Z)" },
  { id: "responses", label: "Mais respostas" },
  { id: "created", label: "Data de criação" },
];

/* ─── Dashboard ─── */

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [forms, setForms] = useState<UserForm[]>(initialForms);
  const [deleteTarget, setDeleteTarget] = useState<UserForm | null>(null);
  const [, navigate] = useLocation();

  const filteredAndSortedForms = useMemo(() => {
    let result = [...forms];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((f) => f.status === statusFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "updated":
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
        break;
      case "responses":
        result.sort((a, b) => b.responsesCount - a.responsesCount);
        break;
      case "created":
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return result;
  }, [forms, searchQuery, statusFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { all: forms.length, published: 0, draft: 0, closed: 0 };
    forms.forEach((f) => { counts[f.status]++; });
    return counts;
  }, [forms]);

  const handleDelete = (form: UserForm) => {
    setForms((prev) => prev.filter((f) => f.id !== form.id));
    setDeleteTarget(null);
    toast.success("Formulário excluído", {
      description: `"${form.title}" foi removido com sucesso.`,
    });
  };

  const handleRequestDelete = (form: UserForm) => {
    setDeleteTarget(form);
  };

  const handleDuplicate = (form: UserForm) => {
    const newForm: UserForm = {
      ...form,
      id: `${form.id}_copy_${Date.now()}`,
      title: `${form.title} (cópia)`,
      status: "draft" as const,
      responsesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setForms((prev) => [newForm, ...prev]);
    toast.success("Formulário duplicado!", {
      description: `"${form.title}" foi duplicado como rascunho.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-brand flex items-center justify-center brand-shadow">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 7.5H12M6 10.5H9.5"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeOpacity="0.8"
                />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-foreground tracking-tight">
              FormFlow
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-lg relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar formulários..."
              className="w-full pl-12 pr-4 py-3 rounded-xl font-body text-base text-foreground placeholder:text-muted-foreground/50 bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all duration-200"
            />
          </div>

          {/* Create new button */}
          <Link href="/editor">
            <motion.button
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-body text-base font-semibold brand-shadow brand-shadow-hover hover:bg-brand-dark active:scale-[0.98] transition-all duration-200 shrink-0"
              whileTap={{ scale: 0.98 }}
            >
              <Plus size={18} />
              Criar formulário
            </motion.button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <section>
          {/* Title row */}
          <div className="mb-6">
            <h2 className="font-display text-3xl font-bold text-foreground tracking-tight">
              Meus formulários
            </h2>
            <p className="mt-2 text-base text-muted-foreground font-body">
              {filteredAndSortedForms.length} formulário{filteredAndSortedForms.length !== 1 ? "s" : ""} encontrado{filteredAndSortedForms.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* ─── Filters & Sort Bar ─── */}
          <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
            {/* Status filter pills */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-muted-foreground mr-1" />
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.id;
                const count = statusCounts[filter.id];
                return (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-body font-medium border transition-all duration-200 ${
                      isActive
                        ? "bg-brand/10 border-brand/30 text-brand shadow-sm"
                        : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-brand/20 hover:bg-secondary/50"
                    }`}
                  >
                    {filter.id !== "all" && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: getStatusConfig(filter.id as UserForm["status"]).dotColor }}
                      />
                    )}
                    {filter.label}
                    <span className={`ml-1 text-xs font-semibold ${isActive ? "text-brand" : "text-muted-foreground/60"}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium text-muted-foreground border border-border hover:text-foreground hover:border-brand/20 hover:bg-secondary/50 transition-all duration-200">
                  <ArrowUpDown size={15} />
                  {sortOptions.find((s) => s.id === sortBy)?.label}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-border shadow-lg w-52">
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setSortBy(option.id)}
                    className={sortBy === option.id ? "bg-brand/5 text-brand font-semibold" : ""}
                  >
                    {sortBy === option.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-brand mr-2 shrink-0" />
                    )}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ─── Cards Grid ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Create new card */}
            <Link href="/editor">
              <motion.div
                className="group relative h-full min-h-[220px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-200 hover:border-brand/40 hover:bg-brand-lighter/30"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-lighter flex items-center justify-center transition-all duration-200 group-hover:bg-brand/10 group-hover:scale-110">
                  <Plus size={28} className="text-brand" />
                </div>
                <div className="text-center">
                  <p className="font-display text-base font-semibold text-foreground/80 group-hover:text-foreground transition-colors">
                    Criar novo formulário
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Comece do zero
                  </p>
                </div>
              </motion.div>
            </Link>

            {/* User form cards */}
            <AnimatePresence mode="popLayout">
              {filteredAndSortedForms.map((form, i) => (
                <FormCard
                  key={form.id}
                  form={form}
                  index={i}
                  onNavigate={navigate}
                  onRequestDelete={handleRequestDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Empty state */}
          {filteredAndSortedForms.length === 0 && (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground font-body">
                {searchQuery
                  ? `Nenhum formulário encontrado para "${searchQuery}"`
                  : `Nenhum formulário ${statusFilter !== "all" ? statusFilters.find(f => f.id === statusFilter)?.label.toLowerCase() : ""}`}
              </p>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="mt-4 text-sm font-body font-medium text-brand hover:underline"
                >
                  Limpar filtro
                </button>
              )}
            </motion.div>
          )}
        </section>
      </main>

      {/* ─── Delete Confirmation Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-white border-border shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <AlertDialogTitle className="font-display text-lg font-bold text-foreground">
                Excluir formulário
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-muted-foreground font-body leading-relaxed">
              Tem certeza que deseja excluir{" "}
              <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span>?
              {deleteTarget && deleteTarget.responsesCount > 0 && (
                <span className="block mt-2 text-sm text-red-500 font-medium">
                  Este formulário possui {deleteTarget.responsesCount} resposta{deleteTarget.responsesCount !== 1 ? "s" : ""} que também será{deleteTarget.responsesCount !== 1 ? "ão" : ""} removida{deleteTarget.responsesCount !== 1 ? "s" : ""}.
                </span>
              )}
              <span className="block mt-2 text-sm">
                Esta ação não pode ser desfeita.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="font-body font-medium rounded-xl px-5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-red-500 hover:bg-red-600 text-white font-body font-semibold rounded-xl px-5 shadow-sm"
            >
              <Trash2 size={15} className="mr-1.5" />
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Form Card Component ─── */

interface FormCardProps {
  form: UserForm;
  index: number;
  onNavigate: (to: string) => void;
  onRequestDelete: (form: UserForm) => void;
  onDuplicate: (form: UserForm) => void;
}

function FormCard({ form, index, onNavigate, onRequestDelete, onDuplicate }: FormCardProps) {
  const statusConfig = getStatusConfig(form.status);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if (dropdownOpen) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onNavigate(`/editor/${form.id}`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      onClick={handleCardClick}
      className="group relative clean-card rounded-2xl p-6 transition-all duration-200 cursor-pointer hover:shadow-lg"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-8 right-8 h-[3px] rounded-b-full opacity-70 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${form.color}, transparent)`,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${form.color}15`,
            border: `1px solid ${form.color}25`,
          }}
        >
          <FileText size={20} style={{ color: form.color }} />
        </div>

        {/* Actions dropdown */}
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border-border shadow-lg w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDropdownOpen(false);
                onNavigate(`/editor/${form.id}`);
              }}
            >
              <Pencil size={15} className="mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDropdownOpen(false);
                toast.info("Respostas", {
                  description: `${form.responsesCount} respostas coletadas para "${form.title}"`,
                });
              }}
            >
              <BarChart3 size={15} className="mr-2" /> Ver respostas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDropdownOpen(false);
                onDuplicate(form);
              }}
            >
              <Copy size={15} className="mr-2" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDropdownOpen(false);
                navigator.clipboard.writeText(`https://formflow.app/f/${form.id}`);
                toast.success("Link copiado!", {
                  description: `O link de "${form.title}" foi copiado para a área de transferência.`,
                });
              }}
            >
              <Share2 size={15} className="mr-2" /> Compartilhar link
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setDropdownOpen(false);
                onRequestDelete(form);
              }}
            >
              <Trash2 size={15} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & description */}
      <h3 className="font-display text-lg font-bold text-foreground mb-1.5 line-clamp-1">
        {form.title}
      </h3>
      <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-5 leading-relaxed">
        {form.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-5 text-sm text-muted-foreground font-body">
        <span className="flex items-center gap-2">
          <FileText size={14} />
          {form.questionsCount} perguntas
        </span>
        <span className="flex items-center gap-2">
          <Users size={14} />
          {form.responsesCount} respostas
        </span>
      </div>

      {/* Footer: status + date */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: statusConfig.dotColor }}
          />
          <span className={`text-sm font-body font-medium ${statusConfig.textClass}`}>
            {statusConfig.label}
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-body">
          {new Date(form.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </motion.div>
  );
}
