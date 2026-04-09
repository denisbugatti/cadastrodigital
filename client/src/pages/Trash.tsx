/**
 * Trash (Lixeira) — View and manage soft-deleted forms and responses.
 * Allows restoring items or permanently deleting them.
 */
import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  FileText,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Inbox,
  Clock,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type Tab = "forms" | "responses";

function formatDate(date: Date | string | null) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const d = new Date(date);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Trash() {
  const [activeTab, setActiveTab] = useState<Tab>("forms");
  const [confirmAction, setConfirmAction] = useState<{
    type: "restoreForm" | "deleteForm" | "restoreResponse" | "deleteResponse" | "emptyTrash";
    id?: number;
    title?: string;
  } | null>(null);

  const utils = trpc.useUtils();
  const trashQuery = trpc.trash.list.useQuery(undefined, {
    refetchOnWindowFocus: true,
  });

  const restoreFormMutation = trpc.trash.restoreForm.useMutation({
    onSuccess: () => {
      utils.trash.list.invalidate();
      utils.forms.list.invalidate();
      toast.success("Formulário restaurado com sucesso!");
    },
    onError: () => toast.error("Erro ao restaurar formulário"),
  });

  const restoreResponseMutation = trpc.trash.restoreResponse.useMutation({
    onSuccess: () => {
      utils.trash.list.invalidate();
      toast.success("Resposta restaurada com sucesso!");
    },
    onError: () => toast.error("Erro ao restaurar resposta"),
  });

  const permanentDeleteFormMutation = trpc.trash.permanentDeleteForm.useMutation({
    onSuccess: () => {
      utils.trash.list.invalidate();
      toast.success("Formulário excluído permanentemente");
    },
    onError: () => toast.error("Erro ao excluir formulário"),
  });

  const permanentDeleteResponseMutation = trpc.trash.permanentDeleteResponse.useMutation({
    onSuccess: () => {
      utils.trash.list.invalidate();
      toast.success("Resposta excluída permanentemente");
    },
    onError: () => toast.error("Erro ao excluir resposta"),
  });

  const emptyTrashMutation = trpc.trash.emptyTrash.useMutation({
    onSuccess: (data) => {
      utils.trash.list.invalidate();
      utils.forms.list.invalidate();
      toast.success("Lixeira esvaziada", {
        description: `${data.deletedForms} formulário(s) e ${data.deletedResponses} resposta(s) excluídos permanentemente.`,
      });
    },
    onError: () => toast.error("Erro ao esvaziar lixeira"),
  });

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case "restoreForm":
        if (confirmAction.id) await restoreFormMutation.mutateAsync({ id: confirmAction.id });
        break;
      case "deleteForm":
        if (confirmAction.id) await permanentDeleteFormMutation.mutateAsync({ id: confirmAction.id });
        break;
      case "restoreResponse":
        if (confirmAction.id) await restoreResponseMutation.mutateAsync({ id: confirmAction.id });
        break;
      case "deleteResponse":
        if (confirmAction.id) await permanentDeleteResponseMutation.mutateAsync({ id: confirmAction.id });
        break;
      case "emptyTrash":
        await emptyTrashMutation.mutateAsync();
        break;
    }
    setConfirmAction(null);
  };

  const isLoading = trashQuery.isLoading;
  const trashedForms = trashQuery.data?.forms ?? [];
  const trashedResponses = trashQuery.data?.responses ?? [];
  const totalItems = trashedForms.length + trashedResponses.length;
  const isMutating =
    restoreFormMutation.isPending ||
    restoreResponseMutation.isPending ||
    permanentDeleteFormMutation.isPending ||
    permanentDeleteResponseMutation.isPending ||
    emptyTrashMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">Lixeira</h1>
                <p className="text-xs text-muted-foreground font-body">
                  {totalItems} {totalItems === 1 ? "item" : "itens"} na lixeira
                </p>
              </div>
            </div>
          </div>
          {totalItems > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction({ type: "emptyTrash" })}
              disabled={isMutating}
              className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600 font-body text-sm"
            >
              <Trash2 size={14} className="mr-1.5" />
              Esvaziar lixeira
            </Button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex gap-1 p-1 bg-secondary rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("forms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              activeTab === "forms"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText size={15} />
            Formulários
            {trashedForms.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 text-xs font-semibold">
                {trashedForms.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              activeTab === "responses"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare size={15} />
            Respostas
            {trashedResponses.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-500 text-xs font-semibold">
                {trashedResponses.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={28} className="animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-body">Carregando lixeira...</p>
          </div>
        ) : activeTab === "forms" ? (
          trashedForms.length === 0 ? (
            <EmptyState type="forms" />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {trashedForms.map((form: any) => (
                  <motion.div
                    key={form.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-border/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${form.color || "#0D8BD9"}15` }}
                        >
                          <FileText size={18} style={{ color: form.color || "#0D8BD9" }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-semibold text-foreground truncate">
                            {form.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                            <span className="flex items-center gap-1">
                              <MessageSquare size={12} />
                              {form.responseCount} resposta{form.responseCount !== 1 ? "s" : ""}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              Excluído {formatDate(form.deletedAt)}
                            </span>
                          </div>
                          {daysSince(form.deletedAt) >= 25 && (
                            <p className="mt-1 text-xs text-amber-500 font-body font-medium">
                              Será excluído permanentemente em breve
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmAction({ type: "restoreForm", id: form.id, title: form.title })
                          }
                          disabled={isMutating}
                          className="text-green-600 border-green-500/30 hover:bg-green-500/10 hover:text-green-700 font-body text-xs"
                        >
                          <RotateCcw size={13} className="mr-1" />
                          Restaurar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setConfirmAction({ type: "deleteForm", id: form.id, title: form.title })
                          }
                          disabled={isMutating}
                          className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600 font-body text-xs"
                        >
                          <Trash2 size={13} className="mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )
        ) : trashedResponses.length === 0 ? (
          <EmptyState type="responses" />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {trashedResponses.map((response: any) => (
                <motion.div
                  key={response.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-border/80 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <MessageSquare size={18} className="text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-foreground truncate">
                          {response.respondentName || response.respondentEmail || `Resposta #${response.id}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground font-body">
                          {response.protocolCode && (
                            <span className="font-mono bg-secondary px-1.5 py-0.5 rounded">
                              {response.protocolCode}
                            </span>
                          )}
                          <span>Formulário: {response.formTitle || `#${response.formId}`}</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            Excluído {formatDate(response.deletedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              response.isComplete
                                ? "bg-green-500/10 text-green-600"
                                : "bg-amber-500/10 text-amber-600"
                            }`}
                          >
                            {response.isComplete ? "Completa" : "Incompleta"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({
                            type: "restoreResponse",
                            id: response.id,
                            title: response.respondentName || `Resposta #${response.id}`,
                          })
                        }
                        disabled={isMutating}
                        className="text-green-600 border-green-500/30 hover:bg-green-500/10 hover:text-green-700 font-body text-xs"
                      >
                        <RotateCcw size={13} className="mr-1" />
                        Restaurar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setConfirmAction({
                            type: "deleteResponse",
                            id: response.id,
                            title: response.respondentName || `Resposta #${response.id}`,
                          })
                        }
                        disabled={isMutating}
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 hover:text-red-600 font-body text-xs"
                      >
                        <Trash2 size={13} className="mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent className="bg-card border-border shadow-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  confirmAction?.type.startsWith("restore")
                    ? "bg-green-50 border border-green-100"
                    : "bg-red-50 border border-red-100"
                }`}
              >
                {confirmAction?.type.startsWith("restore") ? (
                  <RotateCcw size={20} className="text-green-500" />
                ) : (
                  <AlertTriangle size={20} className="text-red-500" />
                )}
              </div>
              <AlertDialogTitle className="font-display text-lg font-bold text-foreground">
                {confirmAction?.type === "emptyTrash"
                  ? "Esvaziar lixeira"
                  : confirmAction?.type.startsWith("restore")
                    ? "Restaurar item"
                    : "Excluir permanentemente"}
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base text-muted-foreground font-body leading-relaxed">
              {confirmAction?.type === "emptyTrash" ? (
                <>
                  Tem certeza que deseja esvaziar a lixeira? Todos os{" "}
                  <span className="font-semibold text-foreground">{totalItems} itens</span> serão
                  excluídos permanentemente.
                  <span className="block mt-2 text-sm text-red-500 font-medium">
                    Esta ação não pode ser desfeita.
                  </span>
                </>
              ) : confirmAction?.type.startsWith("restore") ? (
                <>
                  Deseja restaurar{" "}
                  <span className="font-semibold text-foreground">"{confirmAction.title}"</span>?
                  <span className="block mt-2 text-sm">
                    O item voltará a aparecer normalmente no sistema.
                  </span>
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir permanentemente{" "}
                  <span className="font-semibold text-foreground">"{confirmAction?.title}"</span>?
                  <span className="block mt-2 text-sm text-red-500 font-medium">
                    Esta ação não pode ser desfeita.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2">
            <AlertDialogCancel className="font-body font-medium rounded-xl px-5">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={`font-body font-semibold rounded-xl px-5 shadow-sm ${
                confirmAction?.type.startsWith("restore")
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {confirmAction?.type.startsWith("restore") ? (
                <>
                  <RotateCcw size={15} className="mr-1.5" />
                  Restaurar
                </>
              ) : (
                <>
                  <Trash2 size={15} className="mr-1.5" />
                  {confirmAction?.type === "emptyTrash" ? "Esvaziar" : "Excluir definitivamente"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({ type }: { type: "forms" | "responses" }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <Inbox size={28} className="text-muted-foreground" />
      </div>
      <div className="text-center">
        <h3 className="font-display text-base font-semibold text-foreground">
          Nenhum {type === "forms" ? "formulário" : "a resposta"} na lixeira
        </h3>
        <p className="text-sm text-muted-foreground font-body mt-1">
          {type === "forms"
            ? "Formulários excluídos aparecerão aqui para recuperação."
            : "Respostas excluídas aparecerão aqui para recuperação."}
        </p>
      </div>
    </div>
  );
}
