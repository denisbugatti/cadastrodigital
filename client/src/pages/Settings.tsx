import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Shield, Users, Download, Settings as SettingsIcon,
  UserPlus, Mail, Phone, MoreVertical, Power, PowerOff,
  Trash2, Copy, Check, AlertTriangle, Loader2, ArrowLeft,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/* ─── Role helpers ─── */
const ROLE_LABELS: Record<string, string> = {
  master: "Master",
  diretor: "Diretor",
  gerente: "Gerente",
  corretor: "Corretor",
};

const ROLE_COLORS: Record<string, string> = {
  master: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
  diretor: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
  gerente: "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
  corretor: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30",
};

/* ─── Permission labels ─── */
const PERMISSION_LABELS: Record<string, string> = {
  view_all_leads: "Ver todos os cadastros",
  view_team_leads: "Ver cadastros da equipe",
  view_own_leads: "Ver próprios cadastros",
  filter_responsible: "Filtrar por responsável",
  edit_leads: "Editar cadastros",
  delete_leads: "Excluir cadastros",
  bulk_actions: "Ações em massa",
  view_team_profiles: "Ver perfis da equipe",
  manage_forms: "Gerenciar formulários",
  manage_users: "Gerenciar usuários",
  manage_permissions: "Gerenciar permissões",
  view_analytics: "Ver analytics",
  export_data: "Exportar dados",
};

const PERMISSION_GROUPS = [
  { label: "Cadastros", keys: ["view_all_leads", "view_team_leads", "view_own_leads", "filter_responsible", "edit_leads", "delete_leads", "bulk_actions"] },
  { label: "Equipe", keys: ["view_team_profiles", "manage_users", "manage_permissions"] },
  { label: "Sistema", keys: ["manage_forms", "view_analytics", "export_data"] },
];

export default function Settings() {
  const [, navigate] = useLocation();

  // Auth guard: only master can access settings (uses custom auth, not Manus OAuth)
  const staffMeQuery = trpc.customAuth.me.useQuery(undefined, { retry: 1 });
  const staffUser = staffMeQuery.data;

  // Determine redirect state
  const isAuthLoading = staffMeQuery.isLoading;
  const shouldRedirect = !isAuthLoading && (staffUser?.type !== "staff" || staffUser.role !== "master");

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    if (!isAuthLoading && shouldRedirect) {
      navigate("/dashboard");
    }
  }, [isAuthLoading, shouldRedirect, navigate]);

  if (isAuthLoading || shouldRedirect) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">Configurações</h1>
              <p className="text-xs text-muted-foreground">Gerencie permissões, usuários e exportações</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto">

        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="usuarios" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="exportacao" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="usuarios" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="permissoes" className="mt-6">
            <PermissionsTab />
          </TabsContent>

          <TabsContent value="exportacao" className="mt-6">
            <ExportTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   USERS TAB
   ═══════════════════════════════════════════════════════════════ */

function UsersTab() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");

  const staffQuery = trpc.staff.list.useQuery();
  const invitesQuery = trpc.staff.invites.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      toast.success("Usuário atualizado");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      toast.success("Usuário removido");
    },
    onError: (err) => toast.error(err.message),
  });

  const staffList = useMemo(() => {
    if (!staffQuery.data) return [];
    const q = search.toLowerCase();
    return staffQuery.data.filter((u: any) =>
      !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.includes(q)
    );
  }, [staffQuery.data, search]);

  const toggleActive = (user: any) => {
    updateMutation.mutate({ id: user.id, active: !user.active });
  };

  const handleDelete = (user: any) => {
    if (confirm(`Tem certeza que deseja remover ${user.name}? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate({ id: user.id });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gerenciamento de Usuários</h2>
          <p className="text-sm text-muted-foreground">
            {staffQuery.data?.length ?? 0} usuário(s) cadastrado(s)
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Convidar Usuário
            </Button>
          </DialogTrigger>
          <InviteDialog onClose={() => setInviteOpen(false)} />
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por nome, email ou cargo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Staff List */}
      {staffQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : staffList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {staffList.map((user: any) => (
            <Card key={user.id} className={`transition-all ${!user.active ? "opacity-50" : ""}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">{user.name}</span>
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role] || ""}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                        {!user.active && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-600 border-red-300 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30">
                            Desativado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {user.role !== "master" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleActive(user)}
                          className="gap-2"
                        >
                          {user.active ? (
                            <><PowerOff className="h-4 w-4 text-amber-500" /> Desativar temporariamente</>
                          ) : (
                            <><Power className="h-4 w-4 text-green-500" /> Reativar conta</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          className="text-destructive gap-2"
                        >
                          <Trash2 className="h-4 w-4" /> Remover definitivamente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pending Invites */}
      {invitesQuery.data && invitesQuery.data.filter((i: any) => !i.usedAt).length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Convites Pendentes
          </h3>
          <div className="space-y-2">
            {invitesQuery.data
              .filter((i: any) => !i.usedAt)
              .map((invite: any) => {
                const inviteUrl = `${window.location.origin}/aceitar-convite?token=${invite.token}`;
                return (
                  <Card key={invite.id}>
                    <CardContent className="py-3 px-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-primary" />
                          <div>
                            <span className="text-sm text-foreground font-medium">{invite.email}</span>
                            <Badge variant="outline" className={`ml-2 text-xs ${ROLE_COLORS[invite.role] || ""}`}>
                              {ROLE_LABELS[invite.role] || invite.role}
                            </Badge>
                            {invite.name && (
                              <span className="ml-2 text-xs text-muted-foreground">({invite.name})</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Copiar link de convite"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(inviteUrl);
                                toast.success("Link de convite copiado!");
                              } catch {
                                toast.error("Erro ao copiar");
                              }
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            Expira {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INVITE DIALOG
   ═══════════════════════════════════════════════════════════════ */

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const [inviteResult, setInviteResult] = useState<{ inviteUrl: string; emailSent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const utils = trpc.useUtils();

  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: (data) => {
      utils.staff.invites.invalidate();
      if (data.emailSent) {
        toast.success("Convite enviado por email com sucesso!");
        onClose();
      } else {
        // Email failed but invite was created - show the link
        setInviteResult({ inviteUrl: data.inviteUrl, emailSent: false });
        toast.info("Convite criado! O email não pôde ser enviado. Copie o link abaixo.");
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = () => {
    if (!email || !role) {
      toast.error("Preencha email e cargo");
      return;
    }
    inviteMutation.mutate({
      email,
      role: role as any,
      name: name || undefined,
      phone: phone || undefined,
      origin: window.location.origin,
    });
  };

  const handleCopyLink = async () => {
    if (!inviteResult) return;
    try {
      await navigator.clipboard.writeText(inviteResult.inviteUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar");
    }
  };

  // If invite was created but email failed, show the link
  if (inviteResult && !inviteResult.emailSent) {
    return (
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Convite Criado
          </DialogTitle>
          <DialogDescription>
            O convite foi criado, mas o email não pôde ser enviado automaticamente.
            Copie o link abaixo e envie manualmente para o convidado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <Label>Link de convite</Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteResult.inviteUrl}
              className="text-sm font-mono"
            />
            <Button
              onClick={handleCopyLink}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Para envio automático de emails, verifique um domínio no Resend.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Convidar Novo Usuário</DialogTitle>
        <DialogDescription>
          Um email será enviado com o link de convite. O convite expira em 7 dias.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            placeholder="email@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Cargo *</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="diretor">Diretor</SelectItem>
              <SelectItem value="gerente">Gerente</SelectItem>
              <SelectItem value="corretor">Corretor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Nome (opcional)</Label>
          <Input
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone (opcional)</Label>
          <Input
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={inviteMutation.isPending}
          className="gap-2"
        >
          {inviteMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Enviar Convite
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PERMISSIONS TAB
   ═══════════════════════════════════════════════════════════════ */

function PermissionsTab() {
  const permissionsQuery = trpc.permissions.list.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.permissions.update.useMutation({
    onSuccess: () => {
      utils.permissions.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const permMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (permissionsQuery.data) {
      for (const p of permissionsQuery.data as any[]) {
        map[`${p.role}:${p.permission}`] = p.granted;
      }
    }
    return map;
  }, [permissionsQuery.data]);

  const togglePerm = (role: string, permission: string) => {
    const key = `${role}:${permission}`;
    const current = permMap[key] ?? false;
    updateMutation.mutate({ role, permission, granted: !current });
  };

  const editableRoles = ["gerente", "corretor"];

  if (permissionsQuery.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Permissões de Acesso</h2>
        <p className="text-sm text-muted-foreground">Configure o que cada cargo pode ver e editar. Master e Diretor têm acesso total.</p>
      </div>

      {PERMISSION_GROUPS.map((group) => (
        <Card key={group.label}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-4 w-1/2">Permissão</th>
                    {editableRoles.map((role) => (
                      <th key={role} className="text-center text-xs font-medium pb-2 px-4">
                        <Badge variant="outline" className={`${ROLE_COLORS[role]}`}>
                          {ROLE_LABELS[role]}
                        </Badge>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.keys.map((perm) => (
                    <tr key={perm} className="border-b border-border/50 last:border-0">
                      <td className="py-3 pr-4 text-sm text-foreground">
                        {PERMISSION_LABELS[perm] || perm}
                      </td>
                      {editableRoles.map((role) => {
                        const key = `${role}:${perm}`;
                        const granted = permMap[key] ?? false;
                        return (
                          <td key={role} className="py-3 px-4 text-center">
                            <Switch
                              checked={granted}
                              onCheckedChange={() => togglePerm(role, perm)}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPORT TAB
   ═══════════════════════════════════════════════════════════════ */

function ExportTab() {
  const [exportForm, setExportForm] = useState<string>("all");
  const [exportStatus, setExportStatus] = useState<string>("all");
  const [exportValidation, setExportValidation] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  const formsQuery = trpc.forms.list.useQuery();

  const handleExport = async () => {
    setExporting(true);
    try {
      const resp = await fetch(`/api/trpc/responses.export?input=${encodeURIComponent(JSON.stringify({
        formId: exportForm === "all" ? undefined : Number(exportForm),
        status: exportStatus === "all" ? undefined : exportStatus,
        validationStatus: exportValidation === "all" ? undefined : exportValidation,
      }))}`);

      if (!resp.ok) {
        toast.info("Exportação disponível na página de Respostas de cada formulário");
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `respostas-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída!");
    } catch (err) {
      toast.info("Use a exportação CSV na página de Respostas de cada formulário");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Exportação de Respostas</h2>
        <p className="text-sm text-muted-foreground">Exporte respostas com filtros avançados</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Formulário</Label>
              <Select value={exportForm} onValueChange={setExportForm}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os formulários</SelectItem>
                  {(formsQuery.data ?? []).map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status da resposta</Label>
              <Select value={exportStatus} onValueChange={setExportStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="complete">Completas</SelectItem>
                  <SelectItem value="partial">Incompletas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Validação</Label>
              <Select value={exportValidation} onValueChange={setExportValidation}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="approved">Validados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="rejected">Rejeitados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={exporting}
            className="gap-2 w-full sm:w-auto"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar CSV
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
