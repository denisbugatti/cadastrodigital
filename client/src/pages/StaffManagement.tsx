/**
 * Staff Management Page — Manage team members, send invites, edit roles.
 * Includes hierarchy management panel for assigning corretores to gerentes.
 * Only accessible by master/diretor roles.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowLeft, UserPlus, Mail, Phone, RotateCw,
  Star, Building2, Users, Loader2, CheckCircle2, XCircle,
  Crown, Briefcase, Pencil, Trash2, Clock, ArrowRightLeft,
  ChevronDown, ChevronRight, UserMinus,
} from "lucide-react";

const roleConfig: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  master: { label: "Master", icon: Crown, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  diretor: { label: "Diretor", icon: Star, color: "text-purple-500", bgColor: "bg-purple-500/10" },
  gerente: { label: "Gerente", icon: Building2, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  corretor: { label: "Corretor", icon: Briefcase, color: "text-green-500", bgColor: "bg-green-500/10" },
};

/* ─── Tabs ─── */
type TabId = "membros" | "hierarquia";

export default function StaffManagement() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabId>("membros");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("corretor");

  const utils = trpc.useUtils();

  const staffQuery = trpc.staff.list.useQuery();
  const invitesQuery = trpc.staff.invites.useQuery();

  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: () => {
      toast.success("Convite enviado com sucesso!");
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInvitePhone("");
      setInviteRole("corretor");
      utils.staff.invites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado!");
      setEditingUser(null);
      utils.staff.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário removido!");
      setDeleteTarget(null);
      utils.staff.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Invite edit/delete
  const [editingInvite, setEditingInvite] = useState<any>(null);
  const [deleteInviteId, setDeleteInviteId] = useState<number | null>(null);

  const deleteInviteMutation = trpc.staff.deleteInvite.useMutation({
    onSuccess: () => {
      toast.success("Convite excluído!");
      setDeleteInviteId(null);
      utils.staff.invites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateInviteMutation = trpc.staff.updateInvite.useMutation({
    onSuccess: () => {
      toast.success("Convite atualizado!");
      setEditingInvite(null);
      utils.staff.invites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resendInviteMutation = trpc.staff.resendInvite.useMutation({
    onSuccess: () => {
      toast.success("Convite reenviado com sucesso! Novo email enviado.");
      utils.staff.invites.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) {
      toast.error("Informe o email");
      return;
    }
    inviteMutation.mutate({
      email: inviteEmail,
      role: inviteRole as any,
      name: inviteName || undefined,
      phone: invitePhone || undefined,
      origin: window.location.origin,
    });
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return clean.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const staff = staffQuery.data ?? [];
  const invites = (invitesQuery.data ?? []) as any[];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground font-display">Equipe</h1>
              <p className="text-sm text-muted-foreground">Gerencie membros e permissões</p>
            </div>
          </div>
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Convidar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("membros")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "membros"
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Membros
            </button>
            <button
              onClick={() => setActiveTab("hierarquia")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "hierarquia"
                  ? "border-blue-500 text-blue-500"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              Hierarquia
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === "membros" ? (
          <MembrosTab
            staff={staff}
            invites={invites}
            staffQuery={staffQuery}
            setEditingUser={setEditingUser}
            setDeleteTarget={setDeleteTarget}
            resendInviteMutation={resendInviteMutation}
            setEditingInvite={setEditingInvite}
            setDeleteInviteId={setDeleteInviteId}
          />
        ) : (
          <HierarquiaTab />
        )}
      </div>

      {/* ─── Invite Dialog ─── */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Membro</DialogTitle>
            <DialogDescription>
              Envie um convite por email. O usuário receberá um link para criar sua senha.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                type="text"
                placeholder="Nome do membro"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                type="text"
                placeholder="(00) 00000-0000"
                value={invitePhone}
                onChange={(e) => setInvitePhone(formatPhone(e.target.value))}
                maxLength={15}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Cargo</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diretor">Diretor</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="corretor">Corretor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Enviando...</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2" /> Enviar Convite</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Edit User Dialog ─── */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Membro</DialogTitle>
              <DialogDescription>
                Atualize as informações do membro da equipe.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  type="text"
                  placeholder="Nome completo"
                  value={editingUser.name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={editingUser.email || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: formatPhone(e.target.value) })}
                  maxLength={15}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Select
                  value={editingUser.role}
                  onValueChange={(v) => setEditingUser({ ...editingUser, role: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="corretor">Corretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium">Status ativo</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Membros inativos não podem acessar o sistema
                  </p>
                </div>
                <Switch
                  checked={editingUser.active}
                  onCheckedChange={(checked) => setEditingUser({ ...editingUser, active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  updateMutation.mutate({
                    id: editingUser.id,
                    name: editingUser.name,
                    phone: editingUser.phone,
                    role: editingUser.role,
                    active: editingUser.active,
                  });
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Edit Invite Dialog ─── */}
      {editingInvite && (
        <Dialog open={!!editingInvite} onOpenChange={() => setEditingInvite(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Convite</DialogTitle>
              <DialogDescription>
                Atualize as informações do convite pendente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={editingInvite.email || ""}
                  onChange={(e) => setEditingInvite({ ...editingInvite, email: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Nome</Label>
                <Input
                  type="text"
                  placeholder="Nome do membro"
                  value={editingInvite.name || ""}
                  onChange={(e) => setEditingInvite({ ...editingInvite, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={editingInvite.phone || ""}
                  onChange={(e) => setEditingInvite({ ...editingInvite, phone: formatPhone(e.target.value) })}
                  maxLength={15}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Select
                  value={editingInvite.role}
                  onValueChange={(v) => setEditingInvite({ ...editingInvite, role: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diretor">Diretor</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="corretor">Corretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingInvite(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  updateInviteMutation.mutate({
                    id: editingInvite.id,
                    email: editingInvite.email,
                    role: editingInvite.role,
                    name: editingInvite.name || undefined,
                    phone: editingInvite.phone || undefined,
                  });
                }}
                disabled={updateInviteMutation.isPending}
              >
                {updateInviteMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...</>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── Delete Invite Confirmation ─── */}
      <AlertDialog open={deleteInviteId !== null} onOpenChange={(open) => { if (!open) setDeleteInviteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir convite?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este convite? O link enviado por email deixará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInviteId && deleteInviteMutation.mutate({ id: deleteInviteId })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteInviteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Excluindo...</>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Delete Confirmation ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover membro?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deleteTarget?.name || deleteTarget?.email}</strong> da equipe?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Removendo...</>
              ) : (
                "Remover"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Membros Tab — original staff list + invites
   ═══════════════════════════════════════════════════════════════════════════ */
function MembrosTab({
  staff,
  invites,
  staffQuery,
  setEditingUser,
  setDeleteTarget,
  resendInviteMutation,
  setEditingInvite,
  setDeleteInviteId,
}: {
  staff: any[];
  invites: any[];
  staffQuery: any;
  setEditingUser: (u: any) => void;
  setDeleteTarget: (u: any) => void;
  resendInviteMutation: any;
  setEditingInvite: (i: any) => void;
  setDeleteInviteId: (id: number | null) => void;
}) {
  return (
    <>
      {/* Staff List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">
            Membros da equipe ({staff.length})
          </h2>
        </div>

        {staffQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : staff.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhum membro na equipe</p>
            <p className="text-xs mt-1">Clique em "Convidar" para adicionar membros</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {staff.map((member: any) => {
              const role = roleConfig[member.role] || roleConfig.corretor;
              const RoleIcon = role.icon;
              return (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full ${role.bgColor} flex items-center justify-center shrink-0`}>
                      <RoleIcon className={`w-5 h-5 ${role.color}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{member.name || member.email}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${role.bgColor} ${role.color} font-medium`}>
                          {role.label}
                        </span>
                        {!member.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 font-medium">
                            Inativo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {member.email}
                        </span>
                        {member.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {member.role !== "master" && (
                    <div className="flex items-center gap-1 shrink-0 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser({ ...member })}
                        className="text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 h-8 w-8 p-0"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(member)}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Convites pendentes ({invites.filter((i: any) => i.status === "pending").length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {invites.map((invite: any) => (
              <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm text-foreground truncate block">{invite.email}</span>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleConfig[invite.role]?.bgColor || 'bg-muted'} ${roleConfig[invite.role]?.color || 'text-muted-foreground'}`}>
                        {roleConfig[invite.role]?.label || invite.role}
                      </span>
                      {invite.name && (
                        <span className="text-xs text-muted-foreground">{invite.name}</span>
                      )}
                      {!invite.usedAt && invite.expiresAt ? (
                        new Date(invite.expiresAt) > new Date() ? (
                          <span className="text-xs text-amber-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Expirado
                          </span>
                        )
                      ) : invite.usedAt ? (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Aceito
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                {!invite.usedAt && (
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resendInviteMutation.mutate({ id: invite.id, origin: window.location.origin })}
                      disabled={resendInviteMutation.isPending}
                      className="text-muted-foreground hover:text-green-600 hover:bg-green-500/10 h-8 w-8 p-0"
                      title="Reenviar convite"
                    >
                      {resendInviteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RotateCw className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingInvite({ ...invite })}
                      className="text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 h-8 w-8 p-0"
                      title="Editar convite"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteInviteId(invite.id)}
                      className="text-muted-foreground hover:text-red-600 hover:bg-red-500/10 h-8 w-8 p-0"
                      title="Excluir convite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hierarquia Tab — visual panel for gerente→corretor assignments
   ═══════════════════════════════════════════════════════════════════════════ */
function HierarquiaTab() {
  const utils = trpc.useUtils();
  const gerentesQuery = trpc.staff.gerentes.useQuery();
  const corretoresQuery = trpc.staff.corretoresWithManager.useQuery();

  const assignMutation = trpc.staff.assignManager.useMutation({
    onSuccess: () => {
      toast.success("Corretor reatribuído com sucesso!");
      utils.staff.corretoresWithManager.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const gerentes = gerentesQuery.data ?? [];
  const corretores = corretoresQuery.data ?? [];

  // Group corretores by managerId (with fallback to invitedBy)
  const corretoresByManager = useMemo(() => {
    const map: Record<number | string, typeof corretores> = { unassigned: [] };
    for (const g of gerentes) {
      map[g.id] = [];
    }
    for (const c of corretores) {
      const mgId = c.managerId ?? c.invitedBy;
      if (mgId && map[mgId]) {
        map[mgId].push(c);
      } else {
        map["unassigned"].push(c);
      }
    }
    return map;
  }, [gerentes, corretores]);

  const [expandedGerentes, setExpandedGerentes] = useState<Set<number | string>>(new Set(["unassigned"]));

  const toggleExpand = (id: number | string) => {
    setExpandedGerentes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Expand all gerentes on first load
  useMemo(() => {
    if (gerentes.length > 0) {
      setExpandedGerentes(new Set([...gerentes.map((g: any) => g.id), "unassigned"]));
    }
  }, [gerentes.length]);

  const isLoading = gerentesQuery.isLoading || corretoresQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (gerentes.length === 0 && corretores.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <ArrowRightLeft className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Nenhum gerente ou corretor cadastrado</p>
        <p className="text-xs mt-1">Convide gerentes e corretores para gerenciar a hierarquia</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-xl border border-border p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          <ArrowRightLeft className="w-4 h-4 inline-block mr-1.5 -mt-0.5 text-blue-500" />
          Arraste ou use o dropdown para reatribuir corretores entre gerentes. Cada corretor pode ter apenas um gerente responsável.
        </p>
      </div>

      {/* Gerente cards */}
      {gerentes.map((gerente: any) => {
        const assigned = corretoresByManager[gerente.id] ?? [];
        const isExpanded = expandedGerentes.has(gerente.id);

        return (
          <div key={gerente.id} className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Gerente header */}
            <button
              onClick={() => toggleExpand(gerente.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{gerente.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                      Gerente
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{gerente.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {assigned.length} {assigned.length === 1 ? "corretor" : "corretores"}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Corretores list */}
            {isExpanded && (
              <div className="border-t border-border">
                {assigned.length === 0 ? (
                  <div className="px-5 py-6 text-center text-muted-foreground">
                    <UserMinus className="w-5 h-5 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Nenhum corretor atribuído</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {assigned.map((corretor: any) => (
                      <CorretorRow
                        key={corretor.id}
                        corretor={corretor}
                        gerentes={gerentes}
                        currentManagerId={gerente.id}
                        onAssign={(managerId) =>
                          assignMutation.mutate({ corretorId: corretor.id, managerId })
                        }
                        isPending={assignMutation.isPending}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Unassigned corretores */}
      {(corretoresByManager["unassigned"]?.length ?? 0) > 0 && (
        <div className="bg-card rounded-xl border border-amber-500/30 overflow-hidden">
          <button
            onClick={() => toggleExpand("unassigned")}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
                <UserMinus className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div className="text-left">
                <span className="text-sm font-semibold text-foreground">Sem gerente</span>
                <p className="text-xs text-muted-foreground">Corretores não atribuídos a nenhum gerente</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                {corretoresByManager["unassigned"].length}
              </span>
              {expandedGerentes.has("unassigned") ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {expandedGerentes.has("unassigned") && (
            <div className="border-t border-amber-500/30">
              <div className="divide-y divide-border/50">
                {corretoresByManager["unassigned"].map((corretor: any) => (
                  <CorretorRow
                    key={corretor.id}
                    corretor={corretor}
                    gerentes={gerentes}
                    currentManagerId={null}
                    onAssign={(managerId) =>
                      assignMutation.mutate({ corretorId: corretor.id, managerId })
                    }
                    isPending={assignMutation.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Corretor Row with reassignment dropdown ─── */
function CorretorRow({
  corretor,
  gerentes,
  currentManagerId,
  onAssign,
  isPending,
}: {
  corretor: any;
  gerentes: any[];
  currentManagerId: number | null;
  onAssign: (managerId: number | null) => void;
  isPending: boolean;
}) {
  return (
    <div className="px-5 py-3 flex items-center justify-between hover:bg-accent/20 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
          <Briefcase className="w-4 h-4 text-green-500" />
        </div>
        <div className="min-w-0">
          <span className="text-sm text-foreground">{corretor.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{corretor.email}</span>
            {!corretor.active && (
              <span className="text-xs text-red-500">Inativo</span>
            )}
          </div>
        </div>
      </div>

      <Select
        value={currentManagerId?.toString() ?? "none"}
        onValueChange={(val) => {
          const newId = val === "none" ? null : parseInt(val, 10);
          if (newId !== currentManagerId) {
            onAssign(newId);
          }
        }}
        disabled={isPending}
      >
        <SelectTrigger className="w-[180px] h-8 text-xs">
          <SelectValue placeholder="Selecionar gerente" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-amber-500">Sem gerente</span>
          </SelectItem>
          {gerentes.map((g) => (
            <SelectItem key={g.id} value={g.id.toString()}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
