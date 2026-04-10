/**
 * Corretor Responses Page — With Folder Organization.
 * Simplified view for corretores: only responses for assigned forms.
 * Includes folder system for organizing responses.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Mail, Clock, CheckCircle2, XCircle,
  Hash, Search, X, ShieldCheck, ShieldAlert, Eye, Phone,
  Calendar, ChevronRight, ChevronLeft, Timer, Lock, LogOut,
  ArrowRight, User, Inbox, Filter, Bell, BellOff,
  FolderPlus, Folder, FolderOpen, MoreVertical, Pencil, Trash2,
  FolderInput, FolderMinus, Check, CalendarDays, SortAsc, SortDesc, BarChart3,
  Copy, Link2, Settings, Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { StaffNotificationsPanel } from "@/components/StaffNotificationsPanel";

const ITEMS_PER_PAGE = 10;

const FOLDER_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#eab308", "#84cc16", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6b7280", "#78716c",
];

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
      icon: ShieldCheck, label: "Aprovado",
      bg: "bg-green-500/10", text: "text-green-600 dark:text-green-400", border: "border-green-500/20",
    },
    rejected: {
      icon: ShieldAlert, label: "Rejeitado",
      bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-500/20",
    },
    in_review: {
      icon: Eye, label: "Em revisão",
      bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20",
    },
  };
  const config = configs[status] || {
    icon: Clock, label: "Pendente",
    bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20",
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

// ─── Folder Color Dot ───
function FolderDot({ color, size = 8 }: { color: string; size?: number }) {
  return (
    <span
      className="rounded-full shrink-0 inline-block"
      style={{ width: size, height: size, backgroundColor: color }}
    />
  );
}

// ─── Create Folder Dialog ───
function CreateFolderDialog({
  open,
  onClose,
  onSubmit,
  loading,
  editFolder,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, color: string) => void;
  loading: boolean;
  editFolder?: { id: number; name: string; color: string } | null;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editFolder) {
        setName(editFolder.name);
        setColor(editFolder.color);
      } else {
        setName("");
        setColor("#6366f1");
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, editFolder]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-5 z-10"
      >
        <h3 className="text-sm font-display font-bold text-foreground mb-4">
          {editFolder ? "Editar Pasta" : "Nova Pasta"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] text-muted-foreground font-body mb-1.5 block">Nome</label>
            <Input
              ref={inputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Aprovados, Pendentes, VIP..."
              className="h-9 text-xs font-body"
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) {
                  onSubmit(name.trim(), color);
                }
              }}
            />
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground font-body mb-1.5 block">Cor</label>
            <div className="flex flex-wrap gap-1.5">
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-lg transition-all active:scale-90 flex items-center justify-center ${
                    color === c ? "ring-2 ring-offset-2 ring-offset-card" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check size={12} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Button
            variant="outline"
            className="flex-1 h-9 text-xs"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 h-9 text-xs gap-1.5"
            onClick={() => name.trim() && onSubmit(name.trim(), color)}
            disabled={!name.trim() || loading}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : editFolder ? <Check size={13} /> : <FolderPlus size={13} />}
            {editFolder ? "Salvar" : "Criar"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Folder Context Menu ───
function FolderContextMenu({
  folder: _folder,
  onEdit,
  onDelete,
  onClose,
}: {
  folder: any;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute right-0 top-full mt-1 z-20 bg-card rounded-xl border border-border shadow-xl py-1 min-w-[140px]"
    >
      <button
        onClick={() => { onEdit(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-foreground hover:bg-secondary transition-colors"
      >
        <Pencil size={12} /> Editar
      </button>
      <button
        onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-red-500 hover:bg-red-500/5 transition-colors"
      >
        <Trash2 size={12} /> Excluir
      </button>
    </motion.div>
  );
}

// ─── Move to Folder Popover ───
function MoveToFolderPopover({
  folders,
  currentFolderId,
  onMove,
  onRemove,
  onClose,
}: {
  folders: any[];
  currentFolderId: number | null;
  onMove: (folderId: number) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={popRef}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="absolute right-0 top-full mt-1 z-20 bg-card rounded-xl border border-border shadow-xl py-1 min-w-[180px]"
    >
      <p className="px-3 py-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
        Mover para
      </p>
      {folders.map((f: any) => (
        <button
          key={f.id}
          onClick={() => { onMove(f.id); onClose(); }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[11px] hover:bg-secondary transition-colors ${
            currentFolderId === f.id ? "text-brand font-semibold" : "text-foreground"
          }`}
        >
          <FolderDot color={f.color || "#6366f1"} />
          <span className="truncate">{f.name}</span>
          {currentFolderId === f.id && <Check size={11} className="ml-auto text-brand" />}
        </button>
      ))}
      {currentFolderId && (
        <>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => { onRemove(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-muted-foreground hover:bg-secondary transition-colors"
          >
            <FolderMinus size={12} />
            <span>Remover da pasta</span>
          </button>
        </>
      )}
    </motion.div>
  );
}

// ─── Response Card for Corretor ───
function CorretorResponseCard({
  response,
  index,
  folders,
  currentFolderId,
  onMoveToFolder,
  onRemoveFromFolder,
}: {
  response: any;
  index: number;
  folders: any[];
  currentFolderId: number | null;
  onMoveToFolder: (responseId: number, folderId: number) => void;
  onRemoveFromFolder: (responseId: number) => void;
}) {
  const [showFolderMenu, setShowFolderMenu] = useState(false);

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

  const currentFolder = folders.find((f: any) => f.id === currentFolderId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
      className={`bg-card rounded-xl border border-l-[3px] overflow-hidden transition-all shadow-sm hover:shadow-md active:shadow-sm ${statusAccent}`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Top row: Avatar + Name + Status + Folder button */}
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

          {/* Folder action button */}
          <div className="relative shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); setShowFolderMenu(!showFolderMenu); }}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                currentFolderId
                  ? "text-foreground bg-secondary/60 hover:bg-secondary"
                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary/60"
              }`}
              title="Mover para pasta"
            >
              {currentFolderId ? (
                <FolderDot color={currentFolder?.color || "#6366f1"} size={10} />
              ) : (
                <FolderInput size={14} />
              )}
            </button>
            <AnimatePresence>
              {showFolderMenu && folders.length > 0 && (
                <MoveToFolderPopover
                  folders={folders}
                  currentFolderId={currentFolderId}
                  onMove={(folderId) => onMoveToFolder(response.id, folderId)}
                  onRemove={() => onRemoveFromFolder(response.id)}
                  onClose={() => setShowFolderMenu(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Current folder indicator */}
        {currentFolder && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-md bg-secondary/40 border border-border/50">
            <FolderDot color={currentFolder.color || "#6366f1"} size={7} />
            <span className="text-[9px] text-muted-foreground font-medium truncate">{currentFolder.name}</span>
          </div>
        )}

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

        {/* Comprovantes Badge */}
        {response.isComplete && (
          <div className={`flex items-center gap-1.5 mb-2.5 px-2.5 py-1.5 rounded-lg border ${
            response.anaproFileUrl && response.clienteOkFileUrl
              ? "bg-green-500/5 border-green-500/20"
              : "bg-amber-500/5 border-amber-500/20"
          }`}>
            <Paperclip size={11} className={`shrink-0 ${
              response.anaproFileUrl && response.clienteOkFileUrl
                ? "text-green-500"
                : "text-amber-500"
            }`} />
            <span className={`text-[10px] font-medium ${
              response.anaproFileUrl && response.clienteOkFileUrl
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {response.anaproFileUrl && response.clienteOkFileUrl
                ? "Comprovantes anexados"
                : response.anaproFileUrl
                ? "ANAPRO anexado — OK do cliente pendente"
                : response.clienteOkFileUrl
                ? "OK do cliente anexado — ANAPRO pendente"
                : "Comprovantes pendentes"}
            </span>
            {response.anaproFileUrl && response.clienteOkFileUrl && (
              <CheckCircle2 size={10} className="text-green-500 ml-auto shrink-0" />
            )}
          </div>
        )}

        {/* Info Grid */}
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
              <><ShieldCheck size={13} /> Aprovado — Ver Detalhes</>
            ) : isRejected ? (
              <><ShieldAlert size={13} /> Revisar Reprovação</>
            ) : (
              <><CheckCircle2 size={13} /> Validar Respostas <ArrowRight size={13} /></>
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
  const [, _navigate] = useLocation();
  const utils = trpc.useUtils();

  // Force dark theme for corretor pages
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // Restore theme on unmount based on localStorage preference
      const stored = localStorage.getItem("theme-mode") || "dark";
      if (stored !== "dark") {
        document.documentElement.classList.remove("dark");
      }
    };
  }, []);

  // Get current user info
  const { data: me, isLoading: meLoading } = trpc.customAuth.me.useQuery();

  // Search & filters
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 300);
  const searchRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  // Date filters
  const [dateFilterType, setDateFilterType] = useState<"created" | "updated">("created");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolder, setEditingFolder] = useState<{ id: number; name: string; color: string } | null>(null);
  const [contextMenuFolderId, setContextMenuFolderId] = useState<number | null>(null);
  const [showFolderPanel, setShowFolderPanel] = useState(false);

  const searchParam = useMemo(() => debouncedSearch.trim() || undefined, [debouncedSearch]);

  // Get forms assigned to this staff user via form_assignments table
  const { data: assignedForms = [], isLoading: formsLoading } = trpc.forms.myAssigned.useQuery(
    undefined,
    { enabled: !!me && me.type === "staff" }
  );

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

  // ─── Folders ───
  const { data: folders = [], isLoading: foldersLoading } = trpc.folders.list.useQuery(
    undefined,
    { enabled: !!me && me.type === "staff" }
  );
  const { data: folderAssignments = [] } = trpc.folders.assignments.useQuery(
    undefined,
    { enabled: !!me && me.type === "staff" }
  );

  // Build a map: responseId -> folderId
  const responseToFolder = useMemo(() => {
    const map: Record<number, number> = {};
    folderAssignments.forEach((a: any) => {
      map[a.responseId] = a.folderId;
    });
    return map;
  }, [folderAssignments]);

  const createFolderMutation = trpc.folders.create.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      toast.success("Pasta criada!");
      setShowCreateFolder(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao criar pasta"),
  });

  const updateFolderMutation = trpc.folders.update.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      toast.success("Pasta atualizada!");
      setEditingFolder(null);
      setShowCreateFolder(false);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar pasta"),
  });

  const deleteFolderMutation = trpc.folders.delete.useMutation({
    onSuccess: () => {
      utils.folders.list.invalidate();
      utils.folders.assignments.invalidate();
      if (selectedFolderId === contextMenuFolderId) setSelectedFolderId(null);
      toast.success("Pasta excluída!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir pasta"),
  });

  const assignMutation = trpc.folders.assign.useMutation({
    onSuccess: () => {
      utils.folders.assignments.invalidate();
      utils.folders.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao mover resposta"),
  });

  const unassignMutation = trpc.folders.unassign.useMutation({
    onSuccess: () => {
      utils.folders.assignments.invalidate();
      utils.folders.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao remover da pasta"),
  });

  const handleMoveToFolder = (responseId: number, folderId: number) => {
    assignMutation.mutate({ responseId, folderId });
    toast.success("Resposta movida!");
  };

  const handleRemoveFromFolder = (responseId: number) => {
    unassignMutation.mutate({ responseId });
    toast.success("Removida da pasta");
  };

  const handleCreateOrEditFolder = (name: string, color: string) => {
    if (editingFolder) {
      updateFolderMutation.mutate({ folderId: editingFolder.id, name, color });
    } else {
      createFolderMutation.mutate({ name, color });
    }
  };

  const handleDeleteFolder = (folderId: number) => {
    if (confirm("Excluir esta pasta? As respostas não serão apagadas.")) {
      deleteFolderMutation.mutate({ folderId });
    }
  };

  // Logout
  const logoutMutation = trpc.customAuth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logout realizado");
      window.location.href = "/";
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
        await unsubscribePush.mutateAsync({ endpoint: existingSub.endpoint });
        await existingSub.unsubscribe();
        toast.success('Notificações desativadas');
      } else {
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
        toast.success('Notificações ativadas!');
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

    // Filter by folder
    if (selectedFolderId !== null) {
      const folderResponseIds = new Set(
        folderAssignments
          .filter((a: any) => a.folderId === selectedFolderId)
          .map((a: any) => a.responseId)
      );
      result = result.filter((r: any) => folderResponseIds.has(r.id));
    }

    // Filter by status
    if (statusFilter === "complete") result = result.filter((r: any) => r.isComplete);
    else if (statusFilter === "partial") result = result.filter((r: any) => !r.isComplete);
    else if (statusFilter === "approved") result = result.filter((r: any) => r.validationStatus === "approved");
    else if (statusFilter === "rejected") result = result.filter((r: any) => r.validationStatus === "rejected");
    else if (statusFilter === "pending") result = result.filter((r: any) => !r.validationStatus || r.validationStatus === "pending");

    // Filter by date
    if (dateFrom || dateTo) {
      result = result.filter((r: any) => {
        const dateField = dateFilterType === "created" ? r.createdAt : r.updatedAt;
        if (!dateField) return true;
        const d = new Date(dateField);
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          if (d < from) return false;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
        return true;
      });
    }

    // Sort by date
    result.sort((a: any, b: any) => {
      const dateFieldA = dateFilterType === "created" ? a.createdAt : a.updatedAt;
      const dateFieldB = dateFilterType === "created" ? b.createdAt : b.updatedAt;
      const dA = new Date(dateFieldA || 0).getTime();
      const dB = new Date(dateFieldB || 0).getTime();
      return sortOrder === "desc" ? dB - dA : dA - dB;
    });

    return result;
  }, [responses, statusFilter, selectedFolderId, folderAssignments, dateFrom, dateTo, dateFilterType, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    if (!responses) return { total: 0, pending: 0, approved: 0, rejected: 0 };
    // If filtering by folder, show folder-specific stats
    let base = [...responses];
    if (selectedFolderId !== null) {
      const folderResponseIds = new Set(
        folderAssignments
          .filter((a: any) => a.folderId === selectedFolderId)
          .map((a: any) => a.responseId)
      );
      base = base.filter((r: any) => folderResponseIds.has(r.id));
    }
    return {
      total: base.length,
      pending: base.filter((r: any) => !r.validationStatus || r.validationStatus === "pending" || r.validationStatus === "in_review").length,
      approved: base.filter((r: any) => r.validationStatus === "approved").length,
      rejected: base.filter((r: any) => r.validationStatus === "rejected").length,
    };
  }, [responses, selectedFolderId, folderAssignments]);

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResponses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResponses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchParam, selectedFormId, selectedFolderId, dateFrom, dateTo, dateFilterType, sortOrder]);

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
          <Button variant="outline" className="gap-2 h-9 text-xs" onClick={() => logoutMutation.mutate()}>
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
                {selectedForm ? selectedForm.title : "Validação de Respostas"}
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-body mt-0.5">
                Olá, <span className="font-semibold text-foreground">{me?.name || "Corretor"}</span>
                {assignedForms.length > 1 && (
                  <span className="ml-1">· {assignedForms.length} formulários</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {/* Performance dashboard */}
              <Link href="/corretor/performance">
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  title="Performance"
                >
                  <BarChart3 size={14} />
                </button>
              </Link>
              {/* Folder toggle */}
              <button
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                  showFolderPanel
                    ? "text-brand bg-brand/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                onClick={() => setShowFolderPanel(!showFolderPanel)}
                title="Pastas"
              >
                {showFolderPanel ? <FolderOpen size={14} /> : <Folder size={14} />}
                {folders.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-brand text-white text-[7px] font-bold rounded-full flex items-center justify-center ring-2 ring-card">
                    {folders.length}
                  </span>
                )}
              </button>
              {/* In-app notifications panel */}
              <StaffNotificationsPanel />
              {/* Push notification bell */}
              <button
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
                  pushStatus?.hasActiveSubscription
                    ? "text-brand bg-brand/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                onClick={togglePush}
                disabled={pushLoading}
                title={pushStatus?.hasActiveSubscription ? "Desativar notificações push" : "Ativar notificações push"}
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
              <Link href="/corretor/configuracoes">
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95"
                  title="Configurações de notificação"
                >
                  <Settings size={14} />
                </button>
              </Link>
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
        {/* ─── Copy Form Link Button ─── */}
        {selectedForm?.slug && (
          <button
            onClick={() => {
              const url = `${window.location.origin}/${selectedForm.slug}`;
              navigator.clipboard.writeText(url).then(() => {
                toast.success("Link copiado!", { description: url });
              }).catch(() => {
                toast.error("Erro ao copiar link");
              });
            }}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-brand/10 border border-brand/20 text-brand hover:bg-brand/15 transition-all active:scale-[0.98] group"
          >
            <Link2 size={16} className="shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate">
              {window.location.origin}/{selectedForm.slug}
            </span>
            <Copy size={14} className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {/* ─── Form Selector (if multiple forms) ─── */}
        {assignedForms.length > 1 && (
          <div className="bg-card rounded-xl border border-border p-2">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
              {assignedForms.map((form: any) => (
                <button
                  key={form.id}
                  onClick={() => setSelectedFormId(form.id)}
                  className={`relative px-3 py-2 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all active:scale-[0.97] ${
                    selectedFormId === form.id
                      ? "bg-brand text-white shadow-md shadow-brand/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {form.title}
                  {selectedFormId === form.id && (
                    <motion.div
                      layoutId="activeFormTab"
                      className="absolute inset-0 bg-brand rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Folder Panel ─── */}
        <AnimatePresence>
          {showFolderPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-display font-bold text-foreground flex items-center gap-1.5">
                    <Folder size={13} className="text-brand" />
                    Pastas
                  </h3>
                  <button
                    onClick={() => { setEditingFolder(null); setShowCreateFolder(true); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-brand bg-brand/10 hover:bg-brand/15 transition-all active:scale-95"
                  >
                    <FolderPlus size={11} /> Nova
                  </button>
                </div>

                {/* All responses button */}
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all active:scale-[0.98] border ${
                    selectedFolderId === null
                      ? "bg-brand/10 text-brand border-brand/20"
                      : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground"
                  }`}
                >
                  <Inbox size={13} />
                  <span>Todas as respostas</span>
                  <span className="ml-auto text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-full">
                    {responses?.length || 0}
                  </span>
                </button>

                {/* Folder list */}
                {folders.length === 0 && !foldersLoading ? (
                  <p className="text-[10px] text-muted-foreground/60 text-center py-2 font-body">
                    Crie pastas para organizar suas respostas
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    {folders.map((folder: any) => (
                      <div key={folder.id} className="relative group">
                        <button
                          onClick={() => setSelectedFolderId(folder.id === selectedFolderId ? null : folder.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-medium transition-all active:scale-[0.98] border ${
                            selectedFolderId === folder.id
                              ? "bg-brand/10 text-brand border-brand/20"
                              : "bg-transparent text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground"
                          }`}
                        >
                          <FolderDot color={folder.color || "#6366f1"} size={9} />
                          <span className="truncate">{folder.name}</span>
                          <span className="ml-auto text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded-full">
                            {folder.responseCount || 0}
                          </span>
                        </button>

                        {/* Context menu trigger */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setContextMenuFolderId(contextMenuFolderId === folder.id ? null : folder.id);
                          }}
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-muted-foreground hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical size={12} />
                        </button>

                        <AnimatePresence>
                          {contextMenuFolderId === folder.id && (
                            <FolderContextMenu
                              folder={folder}
                              onEdit={() => {
                                setEditingFolder({ id: folder.id, name: folder.name, color: folder.color || "#6366f1" });
                                setShowCreateFolder(true);
                              }}
                              onDelete={() => handleDeleteFolder(folder.id)}
                              onClose={() => setContextMenuFolderId(null)}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Active folder indicator ─── */}
        {selectedFolderId !== null && !showFolderPanel && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand/5 border border-brand/10">
            <FolderDot color={folders.find((f: any) => f.id === selectedFolderId)?.color || "#6366f1"} size={9} />
            <span className="text-[11px] font-semibold text-brand truncate">
              {folders.find((f: any) => f.id === selectedFolderId)?.name}
            </span>
            <button
              onClick={() => setSelectedFolderId(null)}
              className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ─── Form Description (only for single form with description) ─── */}
        {assignedForms.length === 1 && selectedForm?.description && (
          <div className="bg-card/50 rounded-lg border border-border/50 px-3 py-2">
            <p className="text-[10px] sm:text-xs text-muted-foreground font-body line-clamp-2">{selectedForm.description}</p>
          </div>
        )}

        {/* ─── Quick Stats ─── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Incompletos", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
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
            { id: "pending", label: "Incompletos", count: stats.pending },
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

          {/* Date filter toggle */}
          <button
            onClick={() => setShowDateFilter(!showDateFilter)}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition-all border active:scale-[0.97] ${
              showDateFilter || dateFrom || dateTo
                ? "bg-brand/10 text-brand border-brand/20"
                : "bg-card text-muted-foreground border-border hover:border-brand/20 hover:text-foreground"
            }`}
          >
            <CalendarDays size={11} />
            Data
            {(dateFrom || dateTo) && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            )}
          </button>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] sm:text-[11px] font-medium whitespace-nowrap transition-all border active:scale-[0.97] bg-card text-muted-foreground border-border hover:border-brand/20 hover:text-foreground"
            title={sortOrder === "desc" ? "Mais recentes primeiro" : "Mais antigos primeiro"}
          >
            {sortOrder === "desc" ? <SortDesc size={11} /> : <SortAsc size={11} />}
            {sortOrder === "desc" ? "Recentes" : "Antigos"}
          </button>
        </div>

        {/* ─── Date Filter Panel ─── */}
        <AnimatePresence>
          {showDateFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card rounded-xl border border-border p-3 sm:p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-display font-bold text-foreground flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-brand" />
                    Filtrar por Data
                  </h4>
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => { setDateFrom(""); setDateTo(""); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-body flex items-center gap-1 transition-colors"
                    >
                      <X size={10} /> Limpar
                    </button>
                  )}
                </div>

                {/* Date type selector */}
                <div className="flex gap-1.5">
                  {[
                    { id: "created" as const, label: "Data de Criação" },
                    { id: "updated" as const, label: "Data de Edição" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setDateFilterType(opt.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-medium transition-all border active:scale-[0.97] ${
                        dateFilterType === opt.id
                          ? "bg-brand/10 text-brand border-brand/20"
                          : "bg-transparent text-muted-foreground border-border hover:border-brand/20"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Date range inputs */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground font-body mb-1 block">De</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-foreground text-[11px] font-body focus:outline-none focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground font-body mb-1 block">Até</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-foreground text-[11px] font-body focus:outline-none focus:ring-1 focus:ring-brand/30"
                    />
                  </div>
                </div>

                {(dateFrom || dateTo) && (
                  <p className="text-[10px] text-muted-foreground font-body">
                    Mostrando {filteredResponses.length} resultado(s)
                    {dateFrom && ` a partir de ${new Date(dateFrom + "T00:00:00").toLocaleDateString("pt-BR")}`}
                    {dateTo && ` até ${new Date(dateTo + "T00:00:00").toLocaleDateString("pt-BR")}`}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Results info ─── */}
        {searchParam && (
          <p className="text-[11px] text-muted-foreground font-body -mt-1">
            {responsesLoading ? "Buscando..." : `${filteredResponses.length} resultado(s) para "${searchParam}"`}
          </p>
        )}

        {/* ─── Response Cards ─── */}
        {responsesLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3.5 animate-pulse">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-muted rounded-md w-2/3" />
                    <div className="h-2.5 bg-muted rounded-md w-1/2" />
                    <div className="h-2.5 bg-muted rounded-md w-1/3" />
                  </div>
                  <div className="h-6 w-16 bg-muted rounded-full" />
                </div>
              </div>
            ))}
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
            ) : selectedFolderId !== null ? (
              <>
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <FolderOpen size={24} className="text-muted-foreground/40" />
                </div>
                <p className="text-sm font-display font-bold text-foreground mb-1">Pasta vazia</p>
                <p className="text-xs text-muted-foreground font-body mb-3">
                  Mova respostas para esta pasta usando o ícone de pasta em cada card.
                </p>
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className="text-xs text-brand hover:underline font-body font-medium"
                >
                  Ver todas as respostas
                </button>
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
                  folders={folders}
                  currentFolderId={responseToFolder[response.id] || null}
                  onMoveToFolder={handleMoveToFolder}
                  onRemoveFromFolder={handleRemoveFromFolder}
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

      {/* ─── Create/Edit Folder Dialog ─── */}
      <AnimatePresence>
        {showCreateFolder && (
          <CreateFolderDialog
            open={showCreateFolder}
            onClose={() => { setShowCreateFolder(false); setEditingFolder(null); }}
            onSubmit={handleCreateOrEditFolder}
            loading={createFolderMutation.isPending || updateFolderMutation.isPending}
            editFolder={editingFolder}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
