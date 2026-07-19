/**
 * Responses Panel — glass redesign.
 * Cadastros são apenas recebidos (sem validação/PDF/cadência):
 *  - Cards com nome em destaque; clique abre o detalhe.
 *  - Detalhe: copiar qualquer resposta, endereço linha a linha, preview grande
 *    de documentos (trocar/excluir), observações com autosave e lixeira com undo.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ClipboardList, Search, X, FileSpreadsheet, FileText,
  CheckCircle2, Loader2, Check, Copy, Phone, Clock, Calendar,
  ExternalLink, Image as ImageIcon, Trash2, RotateCcw, ChevronDown,
  StickyNote, UploadCloud, MessageCircle, Inbox, CircleDashed, RefreshCw, ShoppingBag, Plus, FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { BuilderQuestion } from "@/lib/builderTypes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface ResponsesPanelProps {
  formTitle: string;
  responseCount: number;
  questions?: BuilderQuestion[];
  formId?: number;
}

type DateFilter = "all" | "today" | "7days" | "30days";
type StatusFilter = "all" | "complete" | "incomplete" | "purchased";

/* Strong ease-out — snappy, intentional (never ease-in on UI) */
const EASE = [0.23, 1, 0.32, 1] as const;

/* ─── Helpers ─── */

interface FileValue { url: string; filename: string; mimeType: string }

function parseFiles(value: unknown): FileValue[] {
  if (!value) return [];
  let v: unknown = value;
  if (typeof v === "string") {
    if (!v.startsWith("{") && !v.startsWith("[")) return [];
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (Array.isArray(v)) return v.filter((f: any) => f && typeof f === "object" && f.url);
  if (v && typeof v === "object" && (v as any).url) return [v as FileValue];
  return [];
}

const ADDRESS_LABELS: Record<string, string> = {
  cep: "CEP", street: "Rua", number: "Número", complement: "Complemento",
  neighborhood: "Bairro", city: "Cidade", state: "Estado",
};
const ADDRESS_ORDER = ["cep", "street", "number", "complement", "neighborhood", "city", "state"];

function parseAddress(value: unknown): { label: string; value: string }[] | null {
  let v: unknown = value;
  if (typeof v === "string" && v.startsWith("{")) {
    try { v = JSON.parse(v); } catch { return null; }
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const obj = v as Record<string, unknown>;
  if (!("cep" in obj) && !("street" in obj) && !("city" in obj)) return null;
  const push = (acc: { label: string; value: string }[], key: string) => {
    const val = obj[key];
    if (val !== null && val !== undefined && String(val).trim() !== "") {
      acc.push({ label: ADDRESS_LABELS[key] ?? key, value: String(val).trim() });
    }
  };
  const lines: { label: string; value: string }[] = [];
  ADDRESS_ORDER.forEach((key) => push(lines, key));
  // Keep any extra field the form may carry (país, referência…) so nothing is lost.
  Object.keys(obj).filter((k) => !ADDRESS_ORDER.includes(k)).forEach((k) => push(lines, k));
  return lines.length > 0 ? lines : null;
}

/** Single-line address, handy for pasting into other systems. */
function addressOneLine(lines: { label: string; value: string }[]): string {
  const get = (label: string) => lines.find((l) => l.label === label)?.value ?? "";
  const street = [get("Rua"), get("Número")].filter(Boolean).join(", ");
  const extra = [get("Complemento"), get("Bairro")].filter(Boolean).join(" - ");
  const cityState = [get("Cidade"), get("Estado")].filter(Boolean).join("/");
  return [street, extra, cityState, get("CEP")].filter(Boolean).join(" · ");
}

function formatPlainAnswer(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map((x) => formatPlainAnswer(x)).join(", ");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
      .map(([k, v]) => `${ADDRESS_LABELS[k] ?? k}: ${v}`)
      .join("\n");
  }
  return String(value);
}

/** Resolve a choice id (c_pf) to its human label when the question has choices. */
function resolveChoiceLabel(question: BuilderQuestion | undefined, value: unknown): string {
  const plain = formatPlainAnswer(value);
  const choices = (question as any)?.choices as { id: string; label: string }[] | undefined;
  if (!choices?.length) return plain;
  const parts = Array.isArray(value) ? value : [value];
  const labels = parts.map((p) => choices.find((c) => c.id === p)?.label ?? formatPlainAnswer(p));
  return labels.join(", ");
}

/** Nome e telefone efetivamente respondidos (o form tem campos PF e PJ). */
function extractContact(response: any, questions: BuilderQuestion[]): { name: string; phone: string } {
  const answers = (response.answers ?? {}) as Record<string, any>;
  const firstAnswered = (match: (q: BuilderQuestion) => boolean) => {
    for (const q of questions) {
      if (!match(q)) continue;
      const val = formatPlainAnswer(answers[q.id]).trim();
      if (val) return val;
    }
    return "";
  };
  const name =
    (response.respondentName ?? "").trim() ||
    firstAnswered((q) => q.type === "name") ||
    firstAnswered((q) => /nome|razão social|razao social/i.test(q.title ?? "")) ||
    "Sem nome";
  const phone =
    firstAnswered((q) => q.type === "phone") ||
    firstAnswered((q) => /telefone|celular|whatsapp|fone/i.test(q.title ?? ""));
  return { name, phone };
}

function formatWhatsAppLink(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, "");
  const number = cleaned.startsWith("+") ? cleaned.replace("+", "") : cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  return `https://wa.me/${number}`;
}

function formatDate(d: string | Date): { day: string; time: string } {
  const date = new Date(d);
  return {
    day: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
    time: date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  };
}

/* ─── Copy button (per-answer) ─── */
function CopyButton({ text, label, small }: { text: string; label?: string; small?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    }).catch(() => toast.error("Não foi possível copiar"));
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      title={label ?? "Copiar"}
      className={`shrink-0 inline-flex items-center justify-center rounded-lg border transition-[transform,background-color,border-color] duration-150 active:scale-[0.94] ${
        small ? "w-7 h-7" : "w-8 h-8"
      } ${copied
        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-400"
        : "border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground hover:bg-white/[0.08]"}`}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15, ease: EASE }}>
            <Check size={small ? 12 : 14} />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.15, ease: EASE }}>
            <Copy size={small ? 12 : 14} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

/* ─── Status chip ─── */
function StatusChip({ complete }: { complete: boolean }) {
  return complete ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/25">
      <CheckCircle2 size={10} /> Completo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/25">
      <CircleDashed size={10} /> Incompleto
    </span>
  );
}

/* ─── "Comprou" badge ─── */
function PurchasedBadge() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-violet-300 border border-violet-400/40"
    >
      <ShoppingBag size={10} /> Comprou
    </motion.span>
  );
}

/* ─── Add file: anexa um novo documento a uma pergunta (sem apagar os que já existem) ─── */
function AddFileButton({
  responseId, questionId, allFiles, formId, label = "Adicionar arquivo", variant = "ghost",
}: {
  responseId: number;
  questionId: string;
  allFiles: FileValue[];
  formId: number;
  label?: string;
  variant?: "ghost" | "brand";
}) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const uploadMutation = trpc.files.publicUpload.useMutation();
  const updateAnswer = trpc.responses.updateAnswer.useMutation({
    onSuccess: () => utils.responses.listByForm.invalidate({ formId }),
  });

  const handlePick = useCallback(async (picked: File) => {
    setBusy(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(picked);
      });
      const uploaded = await uploadMutation.mutateAsync({
        filename: picked.name, contentBase64: base64, mimeType: picked.type, context: "form-response",
      });
      const next = [...allFiles, { url: uploaded.url, filename: picked.name, mimeType: uploaded.mimeType }];
      const value = next.length === 1 ? JSON.stringify(next[0]) : JSON.stringify(next);
      await updateAnswer.mutateAsync({ responseId, questionId, value });
      toast.success("Arquivo adicionado");
    } catch {
      toast.error("Erro ao adicionar o arquivo");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [allFiles, responseId, questionId, uploadMutation, updateAnswer]);

  return (
    <>
      <input
        ref={inputRef} type="file" className="hidden"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.heic"
        onChange={(e) => e.target.files?.[0] && handlePick(e.target.files[0])}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={`w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-dashed transition-[transform,background-color] duration-150 active:scale-[0.97] disabled:opacity-50 ${
          variant === "brand"
            ? "border-brand/40 bg-brand/[0.06] text-brand hover:bg-brand/[0.12]"
            : "border-white/15 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.06]"
        }`}
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
        {label}
      </button>
    </>
  );
}

/* ─── Document block: big preview + replace/remove (admin) ─── */
function DocumentBlock({
  file, responseId, questionId, allFiles, formId,
}: {
  file: FileValue;
  responseId: number;
  questionId: string;
  allFiles: FileValue[];
  formId: number;
}) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"replace" | "remove" | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [pdfOpen, setPdfOpen] = useState(false);
  const uploadMutation = trpc.files.publicUpload.useMutation();
  const updateAnswer = trpc.responses.updateAnswer.useMutation({
    onSuccess: () => utils.responses.listByForm.invalidate({ formId }),
  });

  const isImage = file.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic)$/i.test(file.filename ?? "");
  const isPdf = file.mimeType === "application/pdf" || /\.pdf$/i.test(file.filename ?? "");

  const persist = useCallback(async (next: FileValue[]) => {
    const value = next.length === 0 ? "" : next.length === 1 ? JSON.stringify(next[0]) : JSON.stringify(next);
    await updateAnswer.mutateAsync({ responseId, questionId, value });
  }, [responseId, questionId, updateAnswer]);

  const handleReplace = useCallback(async (picked: File) => {
    setBusy("replace");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(picked);
      });
      const uploaded = await uploadMutation.mutateAsync({
        filename: picked.name, contentBase64: base64, mimeType: picked.type, context: "form-response",
      });
      const next = allFiles.map((f) => (f.url === file.url ? { url: uploaded.url, filename: picked.name, mimeType: uploaded.mimeType } : f));
      await persist(next);
      toast.success("Documento substituído");
    } catch {
      toast.error("Erro ao substituir o documento");
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }, [allFiles, file.url, persist, uploadMutation]);

  const handleRemove = useCallback(async () => {
    setBusy("remove");
    try {
      await persist(allFiles.filter((f) => f.url !== file.url));
      toast.success("Documento removido");
    } catch {
      toast.error("Erro ao remover o documento");
    } finally {
      setBusy(null);
      setConfirmRemove(false);
    }
  }, [allFiles, file.url, persist]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Big preview */}
      {isImage ? (
        <a href={file.url} target="_blank" rel="noopener noreferrer" className="block bg-black/30">
          <img src={file.url} alt={file.filename} loading="lazy" className="w-full max-h-[420px] object-contain" />
        </a>
      ) : isPdf ? (
        pdfOpen ? (
          <div className="bg-black/30">
            <embed src={`${file.url}#toolbar=0&navpanes=0`} type="application/pdf" className="w-full h-[380px]" />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setPdfOpen(true)}
            className="w-full h-28 flex flex-col items-center justify-center gap-2 bg-black/20 hover:bg-black/30 transition-colors"
          >
            <FileText size={24} className="text-brand" />
            <span className="text-xs text-muted-foreground">Clique para visualizar o PDF</span>
          </button>
        )
      ) : (
        <div className="h-24 flex items-center justify-center bg-black/20">
          <FileText size={28} className="text-muted-foreground" />
        </div>
      )}

      {/* File bar */}
      <div className="px-3.5 py-2.5 flex items-center gap-2.5 border-t border-white/[0.06]">
        {isImage ? <ImageIcon size={15} className="text-brand shrink-0" /> : <FileText size={15} className="text-brand shrink-0" />}
        <span className="text-xs sm:text-sm text-foreground truncate flex-1">{file.filename || "arquivo"}</span>
        <a
          href={file.url} target="_blank" rel="noopener noreferrer"
          className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir em nova aba"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Actions */}
      <div className="px-3.5 pb-3 flex items-center gap-2">
        <input
          ref={inputRef} type="file" className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.heic"
          onChange={(e) => e.target.files?.[0] && handleReplace(e.target.files[0])}
        />
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => inputRef.current?.click()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08] transition-[transform,background-color] duration-150 active:scale-[0.97] disabled:opacity-50"
        >
          {busy === "replace" ? <Loader2 size={13} className="animate-spin" /> : <UploadCloud size={13} />}
          Trocar arquivo
        </button>
        <AnimatePresence mode="wait" initial={false}>
          {confirmRemove ? (
            <motion.button
              key="confirm" type="button" disabled={busy !== null} onClick={handleRemove}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-red-500/90 text-white transition-transform duration-150 active:scale-[0.97]"
            >
              {busy === "remove" ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Confirmar exclusão
            </motion.button>
          ) : (
            <motion.button
              key="remove" type="button" onClick={() => { setConfirmRemove(true); setTimeout(() => setConfirmRemove(false), 3000); }}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: EASE }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border border-red-400/25 bg-red-400/[0.06] text-red-400 hover:bg-red-400/[0.12] transition-[transform,background-color] duration-150 active:scale-[0.97]"
            >
              <Trash2 size={13} /> Excluir
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Observações (autosave) ─── */
function NotesField({ responseId, initial, formId }: { responseId: number; initial: string; formId: number }) {
  const utils = trpc.useUtils();
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const updateNotes = trpc.responses.updateNotes.useMutation({
    onSuccess: () => {
      setState("saved");
      utils.responses.listByForm.invalidate({ formId });
      setTimeout(() => setState("idle"), 1600);
    },
    onError: () => { setState("idle"); toast.error("Erro ao salvar observações"); },
  });

  const onChange = (v: string) => {
    setValue(v);
    setState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => updateNotes.mutate({ responseId, notes: v }), 800);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <StickyNote size={13} className="text-amber-400" /> Observações
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {state === "saving" && (
            <motion.span key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" /> Salvando…
            </motion.span>
          )}
          {state === "saved" && (
            <motion.span key="saved" initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, ease: EASE }} className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
              <Check size={10} /> Salvo
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Anote qualquer coisa sobre este cadastro…"
        rows={3}
        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-y leading-relaxed"
      />
    </div>
  );
}

/* ─── Detail sheet (opens on card click) ─── */
function ResponseDetailSheet({
  response, questions, formId, onClose, onDeleted,
}: {
  response: any;
  questions: BuilderQuestion[];
  formId: number;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const utils = trpc.useUtils();
  const answers = (response.answers ?? {}) as Record<string, any>;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const softDelete = trpc.responses.softDelete.useMutation({
    onSuccess: () => {
      utils.responses.listByForm.invalidate({ formId });
      utils.trash.list.invalidate();
      onDeleted();
      toast.success("Cadastro movido para a lixeira", {
        action: {
          label: "Desfazer",
          onClick: () => restore.mutate({ id: response.id }),
        },
      });
    },
    onError: (e) => toast.error(e.message || "Erro ao excluir"),
  });
  const restore = trpc.trash.restoreResponse.useMutation({
    onSuccess: () => {
      utils.responses.listByForm.invalidate({ formId });
      utils.trash.list.invalidate();
      toast.success("Cadastro restaurado");
    },
  });

  const answered = useMemo(
    () => questions.filter((q) =>
      q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement" &&
      answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ""
    ),
    [questions, answers]
  );

  /* Documentos que o cliente ainda não enviou — a equipe pode anexar por ele
     (recebido por e-mail/WhatsApp, por exemplo). Fica recolhido pra não poluir. */
  const [pendingDocsOpen, setPendingDocsOpen] = useState(false);
  const pendingDocs = useMemo(
    () => questions.filter((q) => q.type === "file-upload" && parseFiles(answers[q.id]).length === 0),
    [questions, answers]
  );

  const { name, phone } = extractContact(response, questions);
  const wa = phone ? formatWhatsAppLink(phone) : null;
  const dt = formatDate(response.createdAt);

  const setPurchased = trpc.responses.setPurchased.useMutation({
    onSuccess: (_d, vars) => {
      utils.responses.listByForm.invalidate({ formId });
      toast.success(vars.purchased ? "Marcado como comprou 🎉" : "Marcação removida");
    },
    onError: (e) => toast.error(e.message || "Erro ao marcar"),
  });

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl p-0 border-l border-white/10 bg-[#0b1220]/85 backdrop-blur-2xl overflow-hidden flex flex-col"
      >
        {/* Header — client name BIG */}
        <SheetHeader className="px-5 sm:px-6 pt-6 pb-4 border-b border-white/[0.06] shrink-0 text-left space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-lg sm:text-xl font-display font-bold text-foreground leading-snug break-words">
                {name}
              </SheetTitle>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {response.purchased && <PurchasedBadge />}
                <StatusChip complete={!!response.isComplete} />
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar size={10} /> {dt.day} · {dt.time}
                </span>
                {response.protocolCode && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-brand/90">
                    #{response.protocolCode}
                    <CopyButton text={response.protocolCode} small label="Copiar protocolo" />
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {phone && (
              <>
                <a
                  href={wa ?? undefined} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-medium bg-emerald-400/10 text-emerald-400 border border-emerald-400/25 hover:bg-emerald-400/[0.18] transition-[transform,background-color] duration-150 active:scale-[0.97]"
                >
                  <MessageCircle size={13} /> {phone}
                </a>
                <CopyButton text={phone} small label="Copiar telefone" />
              </>
            )}
            <button
              type="button"
              disabled={setPurchased.isPending}
              onClick={() => setPurchased.mutate({ responseId: response.id, purchased: !response.purchased })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold border transition-[transform,background-color,border-color] duration-150 active:scale-[0.97] disabled:opacity-60 ${
                response.purchased
                  ? "bg-violet-500/20 text-violet-300 border-violet-400/40 hover:bg-violet-500/30"
                  : "bg-white/[0.04] text-muted-foreground border-white/10 hover:text-violet-300 hover:border-violet-400/30"
              }`}
            >
              {setPurchased.isPending
                ? <Loader2 size={13} className="animate-spin" />
                : <ShoppingBag size={13} />}
              {response.purchased ? "Comprou ✓" : "Marcar comprou"}
            </button>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 sm:px-6 py-4 space-y-3">
          <NotesField responseId={response.id} initial={response.reviewNotes ?? ""} formId={formId} />

          {answered.map((q, i) => {
            const raw = answers[q.id];
            const files = q.type === "file-upload" ? parseFiles(raw) : [];
            const addressLines = files.length === 0 ? parseAddress(raw) : null;
            const display = resolveChoiceLabel(q, raw);

            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: EASE, delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5"
              >
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">{q.title}</p>

                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((f) => (
                      <DocumentBlock key={f.url} file={f} allFiles={files} responseId={response.id} questionId={q.id} formId={formId} />
                    ))}
                    <AddFileButton
                      responseId={response.id} questionId={q.id} allFiles={files} formId={formId}
                      label="Adicionar outro arquivo"
                    />
                  </div>
                ) : addressLines ? (
                  <div className="space-y-1.5">
                    {addressLines.map((line) => (
                      <div key={line.label} className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                        <span className="text-[11px] text-muted-foreground w-24 shrink-0">{line.label}</span>
                        <span className="text-sm text-foreground flex-1 truncate">{line.value}</span>
                        <CopyButton text={line.value} small label={`Copiar ${line.label}`} />
                      </div>
                    ))}
                    {/* Endereço completo em uma linha — pronto pra colar em outro sistema */}
                    <div className="flex items-center gap-2.5 rounded-xl bg-brand/[0.06] border border-brand/20 px-3 py-2 mt-1">
                      <span className="text-[11px] text-brand/80 w-24 shrink-0">Completo</span>
                      <span className="text-[13px] text-foreground flex-1 leading-snug break-words">{addressOneLine(addressLines)}</span>
                      <CopyButton text={addressOneLine(addressLines)} small label="Copiar endereço completo" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <p className="text-sm text-foreground leading-relaxed break-words flex-1 whitespace-pre-line">{display}</p>
                    <CopyButton text={display} label="Copiar resposta" />
                  </div>
                )}
              </motion.div>
            );
          })}

          {answered.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">Nenhuma resposta preenchida ainda.</div>
          )}

          {/* Anexar um documento que o cliente não enviou */}
          {pendingDocs.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <button
                type="button"
                onClick={() => setPendingDocsOpen((v) => !v)}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 text-left hover:bg-white/[0.03] transition-colors"
              >
                <FolderPlus size={15} className="text-brand shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground flex-1">
                  Anexar documento que falta
                </span>
                <span className="text-[11px] text-muted-foreground">{pendingDocs.length}</span>
                <motion.span animate={{ rotate: pendingDocsOpen ? 180 : 0 }} transition={{ duration: 0.2, ease: EASE }}>
                  <ChevronDown size={15} className="text-muted-foreground" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {pendingDocsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="px-3.5 pb-3.5 space-y-2 border-t border-white/[0.06] pt-3">
                      {pendingDocs.map((q) => (
                        <div key={q.id} className="space-y-1.5">
                          <p className="text-[11px] text-muted-foreground">{q.title}</p>
                          <AddFileButton
                            responseId={response.id} questionId={q.id} allFiles={[]} formId={formId}
                            label="Enviar arquivo" variant="brand"
                          />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer — delete to trash */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-white/[0.06] shrink-0">
          <AnimatePresence mode="wait" initial={false}>
            {confirmDelete ? (
              <motion.div
                key="confirm" className="flex items-center gap-2"
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15, ease: EASE }}
              >
                <button
                  type="button"
                  onClick={() => softDelete.mutate({ responseId: response.id })}
                  disabled={softDelete.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-red-500/90 text-white transition-transform duration-150 active:scale-[0.97]"
                >
                  {softDelete.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Mover para a lixeira
                </button>
                <button
                  type="button" onClick={() => setConfirmDelete(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground border border-white/10 hover:bg-white/[0.05] transition-colors"
                >
                  Cancelar
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="ask" type="button" onClick={() => setConfirmDelete(true)}
                initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15, ease: EASE }}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-400/25 bg-red-400/[0.05] hover:bg-red-400/[0.12] transition-[transform,background-color] duration-150 active:scale-[0.97]"
              >
                <Trash2 size={14} /> Excluir cadastro
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ─── Response card (list item) ─── */
function ResponseCard({
  response, questions, index, onOpen,
}: {
  response: any;
  questions: BuilderQuestion[];
  index: number;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const { name, phone } = extractContact(response, questions);
  const wa = phone ? formatWhatsAppLink(phone) : null;
  const dt = formatDate(response.createdAt);
  const hasNotes = !!(response.reviewNotes && String(response.reviewNotes).trim());

  return (
    <motion.button
      type="button"
      layout
      onClick={onOpen}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.15, ease: EASE } }}
      transition={{ duration: 0.3, ease: EASE, delay: Math.min(index * 0.04, 0.36) }}
      className={`group w-full text-left rounded-2xl border backdrop-blur-xl p-3.5 sm:p-4 transition-[border-color,background-color,transform] duration-200 active:scale-[0.985] ${
        response.purchased
          ? "border-violet-400/30 bg-violet-400/[0.05] hover:border-violet-400/50"
          : "border-white/10 bg-white/[0.035] hover:border-brand/30 hover:bg-white/[0.055]"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}
    >
      <div className="flex items-start justify-between gap-2.5">
        <h3 className="text-sm sm:text-base font-display font-semibold text-foreground leading-snug break-words min-w-0">
          {name}
        </h3>
        <div className="shrink-0 flex items-center gap-1.5 pt-0.5">
          {response.purchased && <PurchasedBadge />}
          <StatusChip complete={!!response.isComplete} />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {phone ? (
          <span
            role="link"
            onClick={(e) => { e.stopPropagation(); if (wa) window.open(wa, "_blank", "noopener"); }}
            className="inline-flex items-center gap-1 text-xs sm:text-[13px] font-medium text-emerald-400 hover:underline underline-offset-2 cursor-pointer"
          >
            <Phone size={11} /> {phone}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/60">
            <Phone size={11} /> sem telefone
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Clock size={10} /> {dt.day} · {dt.time}
        </span>
        {response.protocolCode && (
          <span className="text-[11px] font-mono text-brand/80">#{response.protocolCode}</span>
        )}
        {hasNotes && (
          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400/90">
            <StickyNote size={10} /> obs
          </span>
        )}
      </div>
    </motion.button>
  );
}

/* ─── Trash view ─── */
function TrashList({ formId, onClose }: { formId: number; onClose: () => void }) {
  const utils = trpc.useUtils();
  const trashQuery = trpc.trash.list.useQuery(undefined, { staleTime: 5000 });
  const restore = trpc.trash.restoreResponse.useMutation({
    onSuccess: () => {
      utils.trash.list.invalidate();
      utils.responses.listByForm.invalidate({ formId });
      toast.success("Cadastro restaurado");
    },
    onError: (e) => toast.error(e.message || "Erro ao restaurar"),
  });

  const items = (trashQuery.data?.responses ?? []).filter((r: any) => r.formId === formId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
    >
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/[0.06]">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Trash2 size={15} className="text-red-400" /> Lixeira deste formulário
          <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
        </span>
        <button type="button" onClick={onClose} className="w-7 h-7 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors">
          <X size={14} />
        </button>
      </div>

      {trashQuery.isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 size={18} className="animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Lixeira vazia.</div>
      ) : (
        <div className="divide-y divide-white/[0.05]">
          {items.map((r: any) => {
            const dt = formatDate(r.deletedAt ?? r.createdAt);
            return (
              <div key={r.id} className="px-4 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{r.respondentName || r.protocolCode || `Cadastro #${r.id}`}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Excluído em {dt.day} · {dt.time}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restore.mutate({ id: r.id })}
                  disabled={restore.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-brand border border-brand/25 bg-brand/[0.06] hover:bg-brand/[0.12] transition-[transform,background-color] duration-150 active:scale-[0.96]"
                >
                  <RotateCcw size={12} /> Restaurar
                </button>
              </div>
            );
          })}
        </div>
      )}
      <p className="px-4 py-2.5 text-[11px] text-muted-foreground border-t border-white/[0.06]">
        Itens da lixeira também aparecem em Gestão → Lixeira, onde podem ser excluídos definitivamente.
      </p>
    </motion.div>
  );
}

/* ─── Main panel ─── */
export function ResponsesPanel({ formTitle, responseCount: _rc, questions = [], formId }: ResponsesPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  const actualQuestions = useMemo(
    () => questions.filter((q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement"),
    [questions]
  );

  const responsesQuery = trpc.responses.listByForm.useQuery(
    { formId: formId!, search: searchQuery || undefined },
    { enabled: !!formId, staleTime: 10000, refetchInterval: 30000 }
  );
  const responses = responsesQuery.data ?? [];

  const filtered = useMemo(() => {
    let list = [...responses];
    if (statusFilter === "complete") list = list.filter((r: any) => r.isComplete);
    if (statusFilter === "incomplete") list = list.filter((r: any) => !r.isComplete);
    if (statusFilter === "purchased") list = list.filter((r: any) => r.purchased);
    if (dateFilter !== "all") {
      const now = Date.now();
      const spans: Record<Exclude<DateFilter, "all">, number> = {
        today: 1 * 24 * 60 * 60 * 1000,
        "7days": 7 * 24 * 60 * 60 * 1000,
        "30days": 30 * 24 * 60 * 60 * 1000,
      };
      const span = spans[dateFilter];
      list = list.filter((r: any) => now - new Date(r.createdAt).getTime() <= span);
    }
    return list;
  }, [responses, statusFilter, dateFilter]);

  const stats = useMemo(() => ({
    total: responses.length,
    complete: responses.filter((r: any) => r.isComplete).length,
    incomplete: responses.filter((r: any) => !r.isComplete).length,
    purchased: responses.filter((r: any) => r.purchased).length,
  }), [responses]);

  const openResponse = useMemo(
    () => filtered.find((r: any) => r.id === openId) ?? responses.find((r: any) => r.id === openId) ?? null,
    [filtered, responses, openId]
  );

  // CSV export (kept — status is now Completo/Incompleto + observações)
  const exportCSV = useCallback(() => {
    const headers = ["Data", "Status", "Comprou", ...actualQuestions.map((q) => q.title), "Observações"];
    const rows = filtered.map((r: any) => {
      const answers = (r.answers ?? {}) as Record<string, any>;
      return [
        new Date(r.createdAt).toLocaleString("pt-BR"),
        r.isComplete ? "Completo" : "Incompleto",
        r.purchased ? "Sim" : "Não",
        ...actualQuestions.map((q) => formatPlainAnswer(answers[q.id]).replace(/\n/g, " | ")),
        (r.reviewNotes ?? "").replace(/\n/g, " | "),
      ];
    });
    const csvContent = [
      headers.map((h) => `"${h}"`).join(","),
      ...rows.map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${formTitle.replace(/\s+/g, "_")}_respostas_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered, actualQuestions, formTitle]);

  if (!formId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Salve o formulário para ver as respostas.</p>
      </div>
    );
  }

  const dateLabels: Record<DateFilter, string> = { all: "Período", today: "Hoje", "7days": "7 dias", "30days": "30 dias" };

  const statTiles: { key: StatusFilter; label: string; value: number; icon: React.ReactNode; accent: string }[] = [
    { key: "all", label: "Total", value: stats.total, icon: <Inbox size={13} />, accent: "text-brand" },
    { key: "complete", label: "Completos", value: stats.complete, icon: <CheckCircle2 size={13} />, accent: "text-emerald-400" },
    { key: "incomplete", label: "Incompletos", value: stats.incomplete, icon: <CircleDashed size={13} />, accent: "text-amber-400" },
    { key: "purchased", label: "Comprou", value: stats.purchased, icon: <ShoppingBag size={13} />, accent: "text-violet-300" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* ─── Header (glass) ─── */}
      <div className="border-b border-white/[0.06] px-4 sm:px-6 py-4 shrink-0 bg-white/[0.02] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-display font-bold text-foreground">Respostas</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {filtered.length === responses.length
                ? `${responses.length} cadastro${responses.length === 1 ? "" : "s"}`
                : `${filtered.length} de ${responses.length} cadastros`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => responsesQuery.refetch()}
              title="Atualizar"
              className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-muted-foreground border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-[transform,background-color] duration-150 active:scale-[0.94]"
            >
              <RefreshCw size={14} className={responsesQuery.isFetching ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => setShowTrash((v) => !v)}
              title="Lixeira"
              className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border transition-[transform,background-color,border-color] duration-150 active:scale-[0.94] ${
                showTrash
                  ? "text-red-400 border-red-400/30 bg-red-400/[0.08]"
                  : "text-muted-foreground border-white/10 bg-white/[0.03] hover:bg-white/[0.07]"
              }`}
            >
              <Trash2 size={14} />
            </button>
            <button
              type="button"
              onClick={exportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 h-9 rounded-xl text-sm font-medium text-foreground border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] transition-[transform,background-color] duration-150 active:scale-[0.97]"
            >
              <FileSpreadsheet size={14} /> CSV
            </button>
          </div>
        </div>

        {/* Stats — clicáveis (filtram) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5">
          {statTiles.map((s, i) => (
            <motion.button
              key={s.key}
              type="button"
              onClick={() => setStatusFilter(s.key)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE, delay: i * 0.05 }}
              className={`rounded-xl border px-3 py-2 text-left backdrop-blur-xl transition-[border-color,background-color,transform] duration-200 active:scale-[0.98] ${
                statusFilter === s.key
                  ? s.key === "purchased" ? "border-violet-400/40 bg-violet-400/[0.08]" : "border-brand/40 bg-brand/[0.08]"
                  : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <span className={s.accent}>{s.icon}</span> {s.label}
              </span>
              <p className={`mt-0.5 text-base sm:text-lg font-display font-bold ${s.accent}`}>{s.value}</p>
            </motion.button>
          ))}
        </div>

        {/* Search + período */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail ou protocolo…"
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-white/[0.03] border border-white/10 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-brand/40 focus:bg-white/[0.05] transition-colors"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker((v) => !v)}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-sm border transition-colors ${
                dateFilter !== "all"
                  ? "text-brand border-brand/30 bg-brand/[0.07]"
                  : "text-muted-foreground border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              }`}
            >
              <Calendar size={14} />
              <span className="hidden sm:inline">{dateLabels[dateFilter]}</span>
              <ChevronDown size={12} className={`transition-transform duration-200 ${showDatePicker ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showDatePicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.15, ease: EASE }}
                  style={{ transformOrigin: "top right" }}
                  className="absolute right-0 top-11 z-30 w-36 rounded-xl border border-white/10 bg-[#0d1526]/95 backdrop-blur-2xl shadow-xl overflow-hidden"
                >
                  {(Object.keys(dateLabels) as DateFilter[]).map((k) => (
                    <button
                      key={k} type="button"
                      onClick={() => { setDateFilter(k); setShowDatePicker(false); }}
                      className={`w-full text-left px-3.5 py-2 text-sm transition-colors ${
                        dateFilter === k ? "text-brand bg-brand/[0.08]" : "text-foreground hover:bg-white/[0.05]"
                      }`}
                    >
                      {k === "all" ? "Todo período" : dateLabels[k]}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 py-4">
        <AnimatePresence>{showTrash && <TrashList formId={formId} onClose={() => setShowTrash(false)} />}</AnimatePresence>

        {responsesQuery.isLoading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Loader2 size={22} className="animate-spin text-brand" />
            <p className="text-sm text-muted-foreground">Carregando cadastros…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }}
            className="py-16 flex flex-col items-center gap-3 text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
              <ClipboardList size={22} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Nenhum cadastro {statusFilter !== "all" || searchQuery || dateFilter !== "all" ? "com esses filtros" : "ainda"}</p>
              <p className="text-xs text-muted-foreground mt-1">Os cadastros aparecem aqui assim que os clientes preencherem o formulário.</p>
            </div>
          </motion.div>
        ) : (
          <div className={`grid gap-2.5 sm:gap-3 grid-cols-1 xl:grid-cols-2 ${showTrash ? "mt-3" : ""}`}>
            <AnimatePresence mode="popLayout">
              {filtered.map((r: any, i: number) => (
                <ResponseCard key={r.id} response={r} questions={questions} index={i} onOpen={() => setOpenId(r.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ─── Detail sheet ─── */}
      <AnimatePresence>
        {openResponse && (
          <ResponseDetailSheet
            key={openResponse.id}
            response={openResponse}
            questions={questions}
            formId={formId}
            onClose={() => setOpenId(null)}
            onDeleted={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
