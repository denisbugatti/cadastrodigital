/**
 * Corretores Management Page
 * Allows the owner to manage real estate agents who receive notifications.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Mail,
  Phone,
  User,
  Users,
  Bell,
  BellOff,
  Loader2,
} from "lucide-react";
import { Link } from "wouter";

interface CorretorFormData {
  name: string;
  email: string;
  phone: string;
}

export default function Corretores() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CorretorFormData>({
    name: "",
    email: "",
    phone: "",
  });

  const utils = trpc.useUtils();
  const { data: corretores, isLoading } = trpc.corretores.list.useQuery();

  const createMutation = trpc.corretores.create.useMutation({
    onSuccess: () => {
      utils.corretores.list.invalidate();
      setIsCreateOpen(false);
      resetForm();
      toast.success("Corretor adicionado com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao adicionar corretor");
    },
  });

  const updateMutation = trpc.corretores.update.useMutation({
    onSuccess: () => {
      utils.corretores.list.invalidate();
      setEditingId(null);
      resetForm();
      toast.success("Corretor atualizado com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar corretor");
    },
  });

  const deleteMutation = trpc.corretores.delete.useMutation({
    onSuccess: () => {
      utils.corretores.list.invalidate();
      setDeleteId(null);
      toast.success("Corretor removido com sucesso!");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao remover corretor");
    },
  });

  const toggleActiveMutation = trpc.corretores.update.useMutation({
    onSuccess: () => {
      utils.corretores.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao alterar status");
    },
  });

  function resetForm() {
    setFormData({ name: "", email: "", phone: "" });
  }

  function handleCreate() {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    createMutation.mutate({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
    });
  }

  function handleUpdate() {
    if (!editingId || !formData.name.trim() || !formData.email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }
    updateMutation.mutate({
      id: editingId,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
    });
  }

  function startEdit(corretor: any) {
    setEditingId(corretor.id);
    setFormData({
      name: corretor.name,
      email: corretor.email,
      phone: corretor.phone || "",
    });
  }

  function handleToggleActive(corretor: any) {
    toggleActiveMutation.mutate({
      id: corretor.id,
      active: !corretor.active,
    });
  }

  const activeCount = corretores?.filter((c: any) => c.active).length ?? 0;
  const totalCount = corretores?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Corretores
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gerencie os corretores que recebem notificações de novos cadastros
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-600">{activeCount} ativos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-gray-600">{totalCount} total</span>
            </div>
            <div className="flex-1" />
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Adicionar corretor
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Corretor</DialogTitle>
                  <DialogDescription>
                    Adicione um corretor para receber notificações de novos cadastros.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="create-name">Nome *</Label>
                    <Input
                      id="create-name"
                      placeholder="Nome completo do corretor"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email *</Label>
                    <Input
                      id="create-email"
                      type="email"
                      placeholder="corretor@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-phone">Telefone</Label>
                    <Input
                      id="create-phone"
                      placeholder="(11) 99999-9999"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    Adicionar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : !corretores || corretores.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Nenhum corretor cadastrado
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Adicione corretores para que eles recebam notificações por email quando um novo cadastro for realizado.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="gap-1.5">
              <Plus className="w-4 h-4" />
              Adicionar primeiro corretor
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {corretores.map((corretor: any) => (
              <div
                key={corretor.id}
                className={`bg-white rounded-xl border transition-all ${
                  corretor.active
                    ? "border-gray-200 shadow-sm"
                    : "border-gray-100 opacity-60"
                }`}
              >
                <div className="p-4 sm:p-5 flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${
                      corretor.active
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {corretor.name}
                      </h3>
                      {corretor.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          <Bell className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          <BellOff className="w-3 h-3" />
                          Inativo
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {corretor.email}
                      </span>
                      {corretor.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {corretor.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Switch
                      checked={corretor.active}
                      onCheckedChange={() => handleToggleActive(corretor)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-blue-600"
                      onClick={() => startEdit(corretor)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => setDeleteId(corretor.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog
        open={editingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Corretor</DialogTitle>
            <DialogDescription>
              Atualize as informações do corretor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome *</Label>
              <Input
                id="edit-name"
                placeholder="Nome completo do corretor"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="corretor@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingId(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover corretor?</AlertDialogTitle>
            <AlertDialogDescription>
              O corretor será removido permanentemente e não receberá mais notificações de nenhum formulário. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
