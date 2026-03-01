/**
 * FormFlow Dashboard — Light Clean Design with Folders
 * Fontes: Plus Jakarta Sans (display) + Inter (body)
 * Features: pastas, busca, filtros por status, ordenação, duplicar, excluir
 * Now uses tRPC API for all data operations (database persistence).
 */

import { useState, useMemo, useRef, useCallback } from "react";
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
  FolderOpen,
  FolderPlus,
  ChevronRight,
  X,
  Download,
  Upload,
  Loader2,
  Sparkles,
  LayoutTemplate,
  Building2,
  ClipboardList,
  Menu,
  Bell,
  BellOff,
  BellRing,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

import { exportFormAsJSON, importFormFromJSON } from "@/lib/formStorage";
import { createOneInnovationForm } from "@/lib/oneInnovationForm";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/* ─── Types ─── */

type StatusFilter = "all" | "published" | "draft" | "closed";
type SortOption = "updated" | "name" | "responses" | "created";

interface DashboardForm {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  status: "published" | "draft" | "closed";
  responseCount: number;
  questionsCount: number;
  color: string | null;
  workspaceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface DashboardFolder {
  id: number;
  name: string;
  color: string;
  createdAt: Date;
}

/* ─── Status config ─── */

function getStatusConfig(status: DashboardForm["status"]) {
  switch (status) {
    case "published":
      return { label: "Publicado", dotColor: "#22c55e", textClass: "text-green-600", bgClass: "bg-green-50 border-green-200 text-green-700" };
    case "draft":
      return { label: "Rascunho", dotColor: "#f59e0b", textClass: "text-amber-600", bgClass: "bg-amber-50 border-amber-200 text-amber-700" };
    case "closed":
      return { label: "Encerrado", dotColor: "#94a3b8", textClass: "text-slate-400", bgClass: "bg-slate-50 border-slate-200 text-slate-600" };
  }
}

const statusFilters: { id: StatusFilter; label: string }[] = [
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

const FOLDER_COLORS = ["#0D8BD9", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

/* ─── Template Gallery ─── */

interface FormTemplate {
  id: string;
  title: string;
  description: string;
  icon: typeof Building2;
  color: string;
  gradient: string;
  tags: string[];
  factory: () => ReturnType<typeof createOneInnovationForm>;
}

const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: "one-innovation",
    title: "Cadastro Online",
    description: "Cadastro imobiliário com fluxo PF/PJ, validação de CPF/CNPJ e upload de documentos.",
    icon: Building2,
    color: "#0D8BD9",
    gradient: "from-blue-500 to-cyan-400",
    tags: ["Imobiliário", "PF/PJ", "Documentos"],
    factory: createOneInnovationForm,
  },
  {
    id: "satisfaction-survey",
    title: "Pesquisa de Satisfação",
    description: "NPS, rating por estrelas, múltipla escolha e campo aberto para feedback.",
    icon: ClipboardList,
    color: "#8b5cf6",
    gradient: "from-violet-500 to-purple-400",
    tags: ["NPS", "Feedback", "Rating"],
    factory: () => {
      // Simple satisfaction survey template
      const form = createOneInnovationForm();
      return {
        ...form,
        id: `template_satisfaction_${Date.now()}`,
        title: "Pesquisa de Satisfação",
        description: "Queremos ouvir você! Sua opinião nos ajuda a melhorar.",
        design: {
          ...form.design,
          backgroundColor: "#7C3AED",
          buttonColor: "#FFFFFF",
          buttonTextColor: "#7C3AED",
          questionColor: "#FFFFFF",
          answerColor: "#FFFFFF",
          logoUrl: "",
        },
      };
    },
  },
];

/* ─── Dashboard ─── */

/* ─── Notification Bell Component ─── */

function NotificationBell() {
  const { isSupported, permission, isSubscribed, isLoading, toggle } = usePushNotifications();

  if (!isSupported) return null;

  const handleClick = async () => {
    if (permission === "denied") {
      toast.error("Notificações bloqueadas", {
        description: "Ative as notificações nas configurações do navegador para receber alertas de novas respostas.",
      });
      return;
    }
    const success = await toggle();
    if (success) {
      if (!isSubscribed) {
        toast.success("Notificações ativadas!", {
          description: "Você receberá alertas quando novas respostas forem enviadas.",
        });
      } else {
        toast.info("Notificações desativadas");
      }
    }
  };

  const BellIcon = permission === "denied" ? BellOff : isSubscribed ? BellRing : Bell;
  const title = permission === "denied"
    ? "Notificações bloqueadas pelo navegador"
    : isSubscribed
      ? "Notificações ativas — clique para desativar"
      : "Ativar notificações push";

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={title}
      className={`relative p-2.5 rounded-xl border transition-all duration-200 shrink-0 ${
        isSubscribed
          ? "bg-brand/10 border-brand/30 text-brand hover:bg-brand/20"
          : permission === "denied"
            ? "bg-secondary border-border text-muted-foreground/50 cursor-not-allowed"
            : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      }`}
    >
      <BellIcon size={18} className={isLoading ? "animate-pulse" : ""} />
      {isSubscribed && (
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
      )}
    </button>
  );
}

export default function Dashboard() {

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardForm | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<DashboardFolder | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [, navigate] = useLocation();
  const [showTemplates, setShowTemplates] = useState(false);
  const [cloningTemplate, setCloningTemplate] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<DashboardForm | null>(null);
  const [duplicateTitle, setDuplicateTitle] = useState("");
  const [duplicateFolderId, setDuplicateFolderId] = useState<string>("same");

  const utils = trpc.useUtils();

  // ─── tRPC Queries ───
  const formsQuery = trpc.forms.list.useQuery(undefined);
  const workspacesQuery = trpc.workspaces.list.useQuery(undefined);

  // ─── tRPC Mutations ───
  const createFormMutation = trpc.forms.create.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
    },
  });

  const deleteFormMutation = trpc.forms.delete.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
    },
  });

  const duplicateFormMutation = trpc.forms.duplicate.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
    },
  });

  const updateFormMutation = trpc.forms.update.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
    },
  });

  const createWorkspaceMutation = trpc.workspaces.create.useMutation({
    onSuccess: () => {
      utils.workspaces.list.invalidate();
    },
  });

  const updateWorkspaceMutation = trpc.workspaces.update.useMutation({
    onSuccess: () => {
      utils.workspaces.list.invalidate();
    },
  });

  const deleteWorkspaceMutation = trpc.workspaces.delete.useMutation({
    onSuccess: () => {
      utils.workspaces.list.invalidate();
      utils.forms.list.invalidate();
    },
  });

  // ─── Transform API data to dashboard format ───
  const forms: DashboardForm[] = useMemo(() => {
    if (!formsQuery.data) return [];
    return formsQuery.data.map((f: any) => ({
      id: f.id,
      slug: f.slug,
      title: f.title,
      description: f.description,
      status: f.status as "published" | "draft" | "closed",
      responseCount: f.responseCount ?? 0,
      questionsCount: Array.isArray(f.questions) ? f.questions.length : 0,
      color: f.color ?? "#0D8BD9",
      workspaceId: f.workspaceId,
      createdAt: new Date(f.createdAt),
      updatedAt: new Date(f.updatedAt),
    }));
  }, [formsQuery.data]);

  const folders: DashboardFolder[] = useMemo(() => {
    if (!workspacesQuery.data) return [];
    return workspacesQuery.data.map((w: any) => ({
      id: w.id,
      name: w.name,
      color: (w.designDefaults as any)?.color ?? "#0D8BD9",
      createdAt: new Date(w.createdAt),
    }));
  }, [workspacesQuery.data]);

  // Import form from JSON file
  const handleImportForm = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await importFormFromJSON(file);
    if (imported) {
      try {
        await createFormMutation.mutateAsync({
          title: imported.title,
          description: imported.description || "Formulário importado",
          questions: imported.questions,
          design: imported.design,
          webhook: imported.webhook,
          sharing: imported.sharing,
          status: "draft",
        });
        toast.success("Formulário importado!", { description: `"${imported.title}" foi adicionado.` });
      } catch (err) {
        toast.error("Erro ao importar", { description: "Falha ao salvar no banco de dados." });
      }
    } else {
      toast.error("Erro ao importar", { description: "O arquivo não é um formulário Cadastro Digital válido." });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [createFormMutation]);

  // Export form as JSON
  const handleExportForm = useCallback(async (form: DashboardForm) => {
    // Fetch full form data from API
    try {
      const fullForm = await utils.forms.getById.fetch({ id: form.id });
      if (fullForm) {
        const exportData = {
          _type: "formflow_export",
          _version: "1.0",
          _exportedAt: new Date().toISOString(),
          form: {
            id: fullForm.slug,
            title: fullForm.title,
            description: fullForm.description,
            questions: fullForm.questions,
            design: fullForm.design,
            webhook: fullForm.webhook,
            sharing: fullForm.sharing,
          },
        };
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${form.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "_")}_formflow.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Formulário exportado!", { description: `"${form.title}" foi baixado como JSON.` });
      }
    } catch (err) {
      toast.error("Erro ao exportar", { description: "Falha ao buscar dados do formulário." });
    }
  }, [utils]);

  const handleExportCsv = useCallback(async (form: DashboardForm) => {
    try {
      const result = await utils.responses.exportCsv.fetch({ formId: form.id });
      if (result.totalResponses === 0) {
        toast.info("Sem respostas", { description: "Este formulário ainda não tem respostas para exportar." });
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Respostas exportadas!", { description: `${result.totalResponses} respostas baixadas como CSV.` });
    } catch (err) {
      toast.error("Erro ao exportar respostas", { description: "Falha ao gerar o arquivo CSV." });
    }
  }, [utils]);

  const filteredAndSortedForms = useMemo(() => {
    let result = [...forms];

    // Filter by folder
    if (selectedFolderId !== null) {
      if (selectedFolderId === -1) {
        // "Sem pasta" filter
        result = result.filter((f) => !f.workspaceId);
      } else {
        result = result.filter((f) => f.workspaceId === String(selectedFolderId));
      }
    }

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
          (f.description ?? "").toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case "updated":
        result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        break;
      case "name":
        result.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
        break;
      case "responses":
        result.sort((a, b) => b.responseCount - a.responseCount);
        break;
      case "created":
        result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    return result;
  }, [forms, searchQuery, statusFilter, sortBy, selectedFolderId]);

  const statusCounts = useMemo(() => {
    const base = selectedFolderId !== null
      ? forms.filter((f) => selectedFolderId === -1 ? !f.workspaceId : f.workspaceId === String(selectedFolderId))
      : forms;
    const counts = { all: base.length, published: 0, draft: 0, closed: 0 };
    base.forEach((f) => { counts[f.status]++; });
    return counts;
  }, [forms, selectedFolderId]);

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    folders.forEach((f) => { counts[String(f.id)] = forms.filter((form) => form.workspaceId === String(f.id)).length; });
    counts["__none__"] = forms.filter((f) => !f.workspaceId).length;
    return counts;
  }, [forms, folders]);

  const handleDelete = async (form: DashboardForm) => {
    try {
      await deleteFormMutation.mutateAsync({ id: form.id });
      setDeleteTarget(null);
      toast.success("Formulário excluído", {
        description: `"${form.title}" foi removido com sucesso.`,
      });
    } catch (err) {
      toast.error("Erro ao excluir formulário");
    }
  };

  const handleDuplicate = (form: DashboardForm) => {
    setDuplicateTarget(form);
    setDuplicateTitle(`${form.title} (cópia)`);
    setDuplicateFolderId("same");
  };

  const handleConfirmDuplicate = async () => {
    if (!duplicateTarget) return;
    try {
      const workspaceId = duplicateFolderId === "same"
        ? duplicateTarget.workspaceId
        : duplicateFolderId === "none"
          ? null
          : duplicateFolderId;
      await duplicateFormMutation.mutateAsync({
        id: duplicateTarget.id,
        title: duplicateTitle.trim() || `${duplicateTarget.title} (cópia)`,
        workspaceId,
      });
      toast.success("Formulário duplicado!", {
        description: `"${duplicateTitle.trim()}" foi criado como rascunho.`,
      });
      setDuplicateTarget(null);
    } catch (err) {
      toast.error("Erro ao duplicar formulário");
    }
  };

  const handleMoveToFolder = async (formId: number, folderId: number | undefined) => {
    try {
      await updateFormMutation.mutateAsync({
        id: formId,
        workspaceId: folderId ? String(folderId) : null,
      });
      const folderName = folderId ? folders.find((f) => f.id === folderId)?.name : "Sem pasta";
      toast.success("Formulário movido", { description: `Movido para "${folderName}"` });
    } catch (err) {
      toast.error("Erro ao mover formulário");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createWorkspaceMutation.mutateAsync({
        name: newFolderName.trim(),
        designDefaults: { color: FOLDER_COLORS[folders.length % FOLDER_COLORS.length] },
      });
      setNewFolderName("");
      setCreatingFolder(false);
      toast.success("Pasta criada!", { description: `"${newFolderName.trim()}" foi criada.` });
    } catch (err) {
      toast.error("Erro ao criar pasta");
    }
  };

  const handleRenameFolder = async (folderId: number) => {
    if (!editingFolderName.trim()) return;
    try {
      await updateWorkspaceMutation.mutateAsync({
        id: folderId,
        name: editingFolderName.trim(),
      });
      setEditingFolderId(null);
      setEditingFolderName("");
      toast.success("Pasta renomeada!");
    } catch (err) {
      toast.error("Erro ao renomear pasta");
    }
  };

  const handleDeleteFolder = async (folder: DashboardFolder) => {
    try {
      await deleteWorkspaceMutation.mutateAsync({ id: folder.id });
      if (selectedFolderId === folder.id) setSelectedFolderId(null);
      setDeleteFolderTarget(null);
      toast.success("Pasta excluída", { description: `Os formulários foram movidos para "Sem pasta".` });
    } catch (err) {
      toast.error("Erro ao excluir pasta");
    }
  };

  const handleRenameForm = async (formId: number, newTitle: string) => {
    try {
      await updateFormMutation.mutateAsync({ id: formId, title: newTitle });
      toast.success("Formulário renomeado!", { description: `Novo nome: "${newTitle}"` });
    } catch (err) {
      toast.error("Erro ao renomear formulário");
    }
  };

  const handleUseTemplate = async (template: FormTemplate) => {
    setCloningTemplate(template.id);
    try {
      const formData = template.factory();
      const result = await createFormMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        questions: formData.questions,
        design: formData.design,
        webhook: formData.webhook,
        sharing: formData.sharing,
        status: "draft",
        color: template.color,
      });
      toast.success("Template clonado!", {
        description: `"${formData.title}" foi adicionado ao seu dashboard.`,
      });
      setShowTemplates(false);
      navigate(`/editor/${result.id}`);
    } catch (err) {
      toast.error("Erro ao clonar template", {
        description: "Tente novamente.",
      });
    } finally {
      setCloningTemplate(null);
    }
  };

  const isLoading = formsQuery.isLoading || workspacesQuery.isLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-6">
          {/* Mobile: hamburger + logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors lg:hidden"
            >
              <Menu size={20} />
            </button>
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand flex items-center justify-center brand-shadow">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M6 7.5H12M6 10.5H9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
                </svg>
              </div>
              <span className="font-display text-lg sm:text-xl font-bold text-foreground tracking-tight hidden sm:inline">Cadastro Digital</span>
            </Link>
          </div>

          {/* Search - hidden on mobile, shown inline on desktop */}
          <div className="hidden sm:block flex-1 max-w-lg relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar formulários..."
              className="w-full pl-12 pr-4 py-3 rounded-xl font-body text-base text-foreground placeholder:text-muted-foreground/50 bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all duration-200"
            />
          </div>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <Link href="/configuracoes">
              <button
                title="Configurações"
                className="relative p-2.5 rounded-xl border bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200 shrink-0"
              >
                <SlidersHorizontal size={18} />
              </button>
            </Link>

            <NotificationBell />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary text-foreground font-body text-base font-medium hover:bg-secondary/80 border border-border active:scale-[0.98] transition-all duration-200 shrink-0"
            >
              <Upload size={18} />
              <span>Importar</span>
            </button>

            <Link href="/editor">
              <motion.button
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand text-white font-body text-base font-semibold brand-shadow brand-shadow-hover hover:bg-brand-dark active:scale-[0.98] transition-all duration-200 shrink-0"
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={18} />
                <span>Criar formulário</span>
              </motion.button>
            </Link>
          </div>

          {/* Mobile action buttons - simplified */}
          <div className="flex sm:hidden items-center gap-1.5">
            <NotificationBell />
            <Link href="/editor">
              <motion.button
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand text-white font-body text-sm font-semibold active:scale-[0.98] transition-all duration-200"
                whileTap={{ scale: 0.98 }}
              >
                <Plus size={16} />
              </motion.button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-xl border bg-secondary border-border text-muted-foreground hover:text-foreground transition-all duration-200">
                  <MoreHorizontal size={18} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-border shadow-lg w-48">
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes" className="flex items-center gap-2 cursor-pointer">
                    <SlidersHorizontal size={16} /> Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 cursor-pointer">
                  <Upload size={16} /> Importar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground/50 bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all duration-200"
            />
          </div>
        </div>
      </header>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportForm}
      />

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex gap-4 sm:gap-8">
        {/* ─── Folder Sidebar ─── */}
        <AnimatePresence>
        {(mobileSidebarOpen || true) && (
        <motion.aside
          className={`${
            mobileSidebarOpen
              ? "fixed top-0 left-0 h-full w-72 bg-white z-50 shadow-2xl pt-4 px-4 pb-8 overflow-y-auto"
              : "hidden lg:block w-60 shrink-0"
          }`}
          initial={mobileSidebarOpen ? { x: "-100%" } : false}
          animate={mobileSidebarOpen ? { x: 0 } : undefined}
          exit={mobileSidebarOpen ? { x: "-100%" } : undefined}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className={mobileSidebarOpen ? "" : "sticky top-24"}>
            {mobileSidebarOpen && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-foreground">Pastas</h3>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <h3 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 hidden lg:block">Pastas</h3>

            <div className="space-y-1">
              {/* All forms */}
              <button
                onClick={() => { setSelectedFolderId(null); setMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150 ${
                  selectedFolderId === null
                    ? "bg-brand/10 text-brand border border-brand/20"
                    : "text-foreground hover:bg-secondary border border-transparent"
                }`}
              >
                <FileText size={16} className={selectedFolderId === null ? "text-brand" : "text-muted-foreground"} />
                <span className="flex-1 text-left">Todos</span>
                <span className="text-xs text-muted-foreground">{forms.length}</span>
              </button>

              {/* Folders */}
              {folders.map((folder) => (
                <div key={folder.id} className="group relative">
                  {editingFolderId === folder.id ? (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <div className="w-4 h-4 rounded shrink-0" style={{ backgroundColor: folder.color }} />
                      <input
                        autoFocus
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameFolder(folder.id);
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                        onBlur={() => handleRenameFolder(folder.id)}
                        className="flex-1 text-sm font-body bg-transparent border-b border-brand focus:outline-none"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => { setSelectedFolderId(selectedFolderId === folder.id ? null : folder.id); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150 ${
                        selectedFolderId === folder.id
                          ? "bg-brand/10 text-brand border border-brand/20"
                          : "text-foreground hover:bg-secondary border border-transparent"
                      }`}
                    >
                      <FolderOpen size={16} style={{ color: folder.color }} />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className="text-xs text-muted-foreground">{folderCounts[String(folder.id)] || 0}</span>
                    </button>
                  )}

                  {/* Folder actions on hover */}
                  {editingFolderId !== folder.id && (
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                        className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                        title="Renomear"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFolderTarget(folder);
                        }}
                        className="p-1 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {/* Sem pasta */}
              {folderCounts["__none__"] > 0 && (
                <button
                  onClick={() => { setSelectedFolderId(selectedFolderId === -1 ? null : -1); setMobileSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-150 ${
                    selectedFolderId === -1
                      ? "bg-brand/10 text-brand border border-brand/20"
                      : "text-muted-foreground hover:bg-secondary border border-transparent"
                  }`}
                >
                  <FileText size={16} />
                  <span className="flex-1 text-left">Sem pasta</span>
                  <span className="text-xs text-muted-foreground">{folderCounts["__none__"]}</span>
                </button>
              )}
            </div>

            {/* ─── Management Links ─── */}
            <div className="mt-6 pt-4 border-t border-border space-y-1">
              <h3 className="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Gestão</h3>
              <Link href="/equipe">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-foreground hover:bg-secondary border border-transparent transition-all duration-150"
                >
                  <Users size={16} className="text-muted-foreground" />
                  <span className="flex-1 text-left">Equipe</span>
                </button>
              </Link>
              <Link href="/configuracoes">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-foreground hover:bg-secondary border border-transparent transition-all duration-150"
                >
                  <SlidersHorizontal size={16} className="text-muted-foreground" />
                  <span className="flex-1 text-left">Configurações</span>
                </button>
              </Link>
            </div>

            {/* Create folder */}
            {creatingFolder ? (
              <div className="mt-3 flex items-center gap-2 px-3">
                <FolderPlus size={16} className="text-brand shrink-0" />
                <input
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") { setCreatingFolder(false); setNewFolderName(""); }
                  }}
                  placeholder="Nome da pasta"
                  className="flex-1 text-sm font-body bg-transparent border-b border-brand focus:outline-none placeholder:text-muted-foreground/50"
                />
                <button onClick={() => { setCreatingFolder(false); setNewFolderName(""); }} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingFolder(true)}
                className="mt-3 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-body font-medium text-muted-foreground hover:text-brand hover:bg-brand/5 transition-all duration-150 border border-dashed border-border hover:border-brand/30"
              >
                <FolderPlus size={16} />
                Nova pasta
              </button>
            )}
          </div>
        </motion.aside>
        )}
        </AnimatePresence>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0">
          {/* Title row */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-body mb-1">
              <button onClick={() => setSelectedFolderId(null)} className="hover:text-foreground transition-colors">
                Formulários
              </button>
              {selectedFolderId !== null && selectedFolderId !== -1 && (
                <>
                  <ChevronRight size={14} />
                  <span className="text-foreground font-medium">
                    {folders.find((f) => f.id === selectedFolderId)?.name}
                  </span>
                </>
              )}
              {selectedFolderId === -1 && (
                <>
                  <ChevronRight size={14} />
                  <span className="text-foreground font-medium">Sem pasta</span>
                </>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {selectedFolderId !== null && selectedFolderId !== -1
                ? folders.find((f) => f.id === selectedFolderId)?.name || "Meus formulários"
                : selectedFolderId === -1
                ? "Sem pasta"
                : "Meus formulários"}
            </h2>
            <p className="mt-2 text-base text-muted-foreground font-body">
              {filteredAndSortedForms.length} formulário{filteredAndSortedForms.length !== 1 ? "s" : ""} encontrado{filteredAndSortedForms.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Filters & Sort Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              <SlidersHorizontal size={15} className="text-muted-foreground mr-1" />
              {statusFilters.map((filter) => {
                const isActive = statusFilter === filter.id;
                const count = statusCounts[filter.id];
                return (
                  <button
                    key={filter.id}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-body font-medium border transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? "bg-brand/10 border-brand/30 text-brand shadow-sm"
                        : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-brand/20 hover:bg-secondary/50"
                    }`}
                  >
                    {filter.id !== "all" && (
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: getStatusConfig(filter.id as DashboardForm["status"]).dotColor }}
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
                    {sortBy === option.id && <div className="w-1.5 h-1.5 rounded-full bg-brand mr-2 shrink-0" />}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-brand" />
            </div>
          )}

          {/* Error state with retry */}
          {!isLoading && (formsQuery.isError || workspacesQuery.isError) && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertTriangle size={40} className="text-amber-500" />
              <p className="font-body text-muted-foreground text-center">
                Erro ao carregar formulários. A conexão pode estar instável.
              </p>
              <button
                onClick={() => {
                  formsQuery.refetch();
                  workspacesQuery.refetch();
                }}
                className="px-5 py-2.5 rounded-xl bg-brand text-white font-body text-sm font-semibold hover:bg-brand/90 transition-all duration-200 active:scale-[0.97]"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Template Gallery Toggle */}
          {!isLoading && !formsQuery.isError && (
            <div className="mb-6">
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-medium border transition-all duration-200 ${
                  showTemplates
                    ? "bg-brand/10 border-brand/30 text-brand shadow-sm"
                    : "bg-white border-border text-muted-foreground hover:text-foreground hover:border-brand/20 hover:bg-secondary/50"
                }`}
              >
                <LayoutTemplate size={16} />
                Galeria de Templates
                <ChevronRight size={14} className={`transition-transform duration-200 ${showTemplates ? "rotate-90" : ""}`} />
              </button>
            </div>
          )}

          {/* Template Gallery */}
          <AnimatePresence>
            {showTemplates && !isLoading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden mb-8"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FORM_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    const isCloning = cloningTemplate === template.id;
                    return (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group relative rounded-2xl border border-border bg-white overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => !isCloning && handleUseTemplate(template)}
                      >
                        {/* Gradient header */}
                        <div className={`h-20 bg-gradient-to-r ${template.gradient} flex items-center justify-center relative`}>
                          <div className="absolute inset-0 bg-black/5" />
                          <Icon size={32} className="text-white relative z-10 drop-shadow-md" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {template.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white backdrop-blur-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Content */}
                        <div className="p-4">
                          <h4 className="font-display text-base font-bold text-foreground mb-1">{template.title}</h4>
                          <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-2">{template.description}</p>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              disabled={isCloning}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
                            >
                              {isCloning ? (
                                <><Loader2 size={12} className="animate-spin" /> Clonando...</>
                              ) : (
                                <><Sparkles size={12} /> Usar template</>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards Grid */}
          {!isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                    <p className="text-sm text-muted-foreground mt-1">Comece do zero</p>
                  </div>
                </motion.div>
              </Link>

              <AnimatePresence mode="popLayout">
                {filteredAndSortedForms.map((form, i) => (
                  <FormCard
                    key={form.id}
                    form={form}
                    index={i}
                    folders={folders}
                    onNavigate={navigate}
                    onRequestDelete={(f) => setDeleteTarget(f)}
                    onDuplicate={handleDuplicate}
                    onRename={handleRenameForm}
                    onMoveToFolder={handleMoveToFolder}
                    onExport={handleExportForm}
                    onExportCsv={handleExportCsv}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {!isLoading && filteredAndSortedForms.length === 0 && (
            <motion.div className="text-center py-20" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Search size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground font-body">
                {searchQuery
                  ? `Nenhum formulário encontrado para "${searchQuery}"`
                  : forms.length === 0
                  ? "Nenhum formulário criado ainda. Use um template ou crie do zero!"
                  : "Nenhum formulário nesta pasta"}
              </p>
              {forms.length === 0 && !searchQuery && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl text-sm font-body font-semibold bg-brand/10 text-brand hover:bg-brand/20 transition-colors"
                >
                  <LayoutTemplate size={16} />
                  Ver templates disponíveis
                </button>
              )}
              {(statusFilter !== "all" || selectedFolderId !== null) && (
                <button
                  onClick={() => { setStatusFilter("all"); setSelectedFolderId(null); }}
                  className="mt-4 text-sm font-body font-medium text-brand hover:underline"
                >
                  Limpar filtros
                </button>
              )}
            </motion.div>
          )}
        </main>
      </div>

      {/* Delete Form Dialog */}
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
              {deleteTarget && deleteTarget.responseCount > 0 && (
                <span className="block mt-2 text-sm text-red-500 font-medium">
                  Este formulário possui {deleteTarget.responseCount} resposta{deleteTarget.responseCount !== 1 ? "s" : ""}.
                </span>
              )}
              <span className="block mt-2 text-sm">Esta ação não pode ser desfeita.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="font-body font-medium rounded-xl px-5">Cancelar</AlertDialogCancel>
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

      {/* Delete Folder Dialog */}
      <AlertDialog open={!!deleteFolderTarget} onOpenChange={(open) => !open && setDeleteFolderTarget(null)}>
        <AlertDialogContent className="bg-white border-border shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <AlertDialogTitle className="font-display text-lg font-bold text-foreground">
                Excluir pasta
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-muted-foreground font-body leading-relaxed">
              Tem certeza que deseja excluir a pasta{" "}
              <span className="font-semibold text-foreground">"{deleteFolderTarget?.name}"</span>?
              <span className="block mt-2 text-sm">
                Os formulários dentro dela serão movidos para "Sem pasta".
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="font-body font-medium rounded-xl px-5">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFolderTarget && handleDeleteFolder(deleteFolderTarget)}
              className="bg-red-500 hover:bg-red-600 text-white font-body font-semibold rounded-xl px-5 shadow-sm"
            >
              <Trash2 size={15} className="mr-1.5" />
              Excluir pasta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Duplicate Form Dialog ─── */}
      <Dialog open={!!duplicateTarget} onOpenChange={(open) => !open && setDuplicateTarget(null)}>
        <DialogContent className="bg-white border-border shadow-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold text-foreground">
              Duplicar formulário
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-body">
              Crie uma cópia de <span className="font-semibold text-foreground">"{duplicateTarget?.title}"</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="duplicate-title" className="text-sm font-medium text-foreground">Nome do formulário</Label>
              <Input
                id="duplicate-title"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
                placeholder="Nome do formulário"
                className="font-body"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmDuplicate(); }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duplicate-folder" className="text-sm font-medium text-foreground">Pasta de destino</Label>
              <Select value={duplicateFolderId} onValueChange={setDuplicateFolderId}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Escolha uma pasta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same">
                    <span className="flex items-center gap-2">
                      <FolderOpen size={14} className="text-muted-foreground" />
                      Mesma pasta do original
                    </span>
                  </SelectItem>
                  <SelectItem value="none">
                    <span className="flex items-center gap-2">
                      <FileText size={14} className="text-muted-foreground" />
                      Sem pasta
                    </span>
                  </SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={String(folder.id)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: folder.color }}
                        />
                        {folder.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setDuplicateTarget(null)}
              className="font-body font-medium rounded-xl px-5"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDuplicate}
              disabled={duplicateFormMutation.isPending || !duplicateTitle.trim()}
              className="font-body font-medium rounded-xl px-5 bg-brand hover:bg-brand-dark text-white"
            >
              {duplicateFormMutation.isPending ? (
                <><Loader2 size={14} className="animate-spin mr-1.5" /> Duplicando...</>
              ) : (
                <><Copy size={14} className="mr-1.5" /> Duplicar</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Form Card Component ─── */

interface FormCardProps {
  form: DashboardForm;
  index: number;
  folders: DashboardFolder[];
  onNavigate: (to: string) => void;
  onRequestDelete: (form: DashboardForm) => void;
  onDuplicate: (form: DashboardForm) => void;
  onRename: (formId: number, newTitle: string) => void;
  onMoveToFolder: (formId: number, folderId: number | undefined) => void;
  onExport: (form: DashboardForm) => void;
  onExportCsv: (form: DashboardForm) => void;
}

function FormCard({ form, index, folders, onNavigate, onRequestDelete, onDuplicate, onRename, onMoveToFolder, onExport, onExportCsv }: FormCardProps) {
  const statusConfig = getStatusConfig(form.status);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(form.title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const currentFolder = folders.find((f) => String(f.id) === form.workspaceId);

  const handleCardClick = (e: React.MouseEvent) => {
    if (dropdownOpen || isRenaming) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onNavigate(`/editor/${form.id}`);
  };

  const handleStartRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setRenameValue(form.title);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const handleConfirmRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== form.title) {
      onRename(form.id, trimmed);
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      handleConfirmRename();
    } else if (e.key === "Escape") {
      setIsRenaming(false);
      setRenameValue(form.title);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      onClick={handleCardClick}
      className="group relative clean-card rounded-2xl p-4 sm:p-6 transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
    >
      <div
        className="absolute top-0 left-4 right-4 h-[3px] rounded-b-full transition-opacity duration-300"
        style={{ background: form.color ?? "#0D8BD9" }}
      />

      <div className="flex items-start justify-between mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${form.color ?? "#0D8BD9"}15`, border: `1px solid ${form.color ?? "#0D8BD9"}25` }}
        >
          <FileText size={20} style={{ color: form.color ?? "#0D8BD9" }} />
        </div>

        {/* More actions menu */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleStartRename}
            className="p-2 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Renomear"
          >
            <Pencil size={16} />
          </button>

          <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-border shadow-lg w-52">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onNavigate(`/editor/${form.id}`); }}>
                <Pencil size={15} className="mr-2" /> Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onNavigate(`/responses/${form.id}`); }}>
                <BarChart3 size={15} className="mr-2" /> Ver respostas
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger onClick={(e) => e.stopPropagation()}>
                  <FolderOpen size={15} className="mr-2" /> Mover para pasta
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-white border-border shadow-lg w-48">
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onMoveToFolder(form.id, undefined); }}>
                    <X size={14} className="mr-2 text-muted-foreground" /> Sem pasta
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {folders.map((folder) => (
                    <DropdownMenuItem
                      key={folder.id}
                      onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onMoveToFolder(form.id, folder.id); }}
                      className={form.workspaceId === String(folder.id) ? "bg-brand/5 font-semibold" : ""}
                    >
                      <div className="w-3 h-3 rounded shrink-0 mr-2" style={{ backgroundColor: folder.color }} />
                      {folder.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`); toast.success("Link copiado!"); }}>
                <Share2 size={15} className="mr-2" /> Compartilhar link
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onExportCsv(form); }}>
                <BarChart3 size={15} className="mr-2" /> Exportar respostas (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setDropdownOpen(false); onExport(form); }}>
                <Download size={15} className="mr-2" /> Exportar JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inline rename input */}
      {isRenaming ? (
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleConfirmRename}
          onKeyDown={handleRenameKeyDown}
          onClick={(e) => { e.stopPropagation(); }}
          className="font-display text-lg font-bold text-foreground mb-1.5 w-full bg-secondary/50 border border-border rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-brand/30"
          autoFocus
        />
      ) : (
        <h3 className="font-display text-lg font-bold text-foreground mb-1.5 line-clamp-1">{form.title}</h3>
      )}
      <p className="text-sm text-muted-foreground font-body line-clamp-2 mb-5 leading-relaxed min-h-[2.5rem]">{form.description || "Sem descrição"}</p>

      <div className="flex items-center gap-5 text-sm text-muted-foreground font-body">
        <span className="flex items-center gap-2">
          <FileText size={14} />
          {form.questionsCount} perguntas
        </span>
        <span className="flex items-center gap-2">
          <Users size={14} />
          {form.responseCount} respostas
        </span>
      </div>

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusConfig.dotColor }} />
            <span className={`text-sm font-body font-medium ${statusConfig.textClass}`}>{statusConfig.label}</span>
          </div>
          {currentFolder && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-body font-medium bg-secondary text-muted-foreground border border-border">
              <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: currentFolder.color }} />
              {currentFolder.name}
            </span>
          )}
        </div>
        <span className="text-sm text-muted-foreground font-body">
          {form.updatedAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>

      {/* ─── Action buttons ─── */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onNavigate(`/editor/${form.id}`); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-body font-semibold text-white bg-brand hover:bg-brand-dark transition-all shadow-sm"
        >
          <Pencil size={13} /> Editar
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDuplicate(form); }}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-body font-semibold text-muted-foreground bg-secondary hover:bg-secondary/80 border border-border transition-all"
          title="Duplicar"
        >
          <Copy size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onRequestDelete(form); }}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-body font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200/50 transition-all"
          title="Excluir"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}
