import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
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
  Trash2, Copy, Check, AlertTriangle, Loader2,
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
  master: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  diretor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  gerente: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  corretor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
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
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Auth guard: only master can access settings
  const staffMeQuery = trpc.customAuth.me.useQuery(undefined, { retry: 1 });
  const staffUser = staffMeQuery.data;

  // Determine redirect state (computed before hooks to keep hook order stable)
  const isAuthLoading = loading || staffMeQuery.isLoading;
  const shouldRedirect = !isAuthLoading && (staffUser?.type !== "staff" || staffUser.role !== "master");

  // ALL hooks must be called before any conditional return
  useEffect(() => {
    if (!isAuthLoading && shouldRedirect) {
      navigate("/dashboard");
    }
  }, [isAuthLoading, shouldRedirect, navigate]);

  if (isAuthLoading || shouldRedirect) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-7 w-7 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
            <p className="text-sm text-gray-400">Gerencie permissões, usuários e exportações</p>
          </div>
        </div>

        <Tabs defaultValue="usuarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="usuarios" className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="permissoes" className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <Shield className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="exportacao" className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
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
    </DashboardLayout>
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
          <h2 className="text-lg font-semibold text-white">Gerenciamento de Usuários</h2>
          <p className="text-sm text-gray-400">
            {staffQuery.data?.length ?? 0} usuário(s) cadastrado(s)
          </p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
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
        className="bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-500"
      />

      {/* Staff List */}
      {staffQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : staffList.length === 0 ? (
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">Nenhum usuário encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {staffList.map((user: any) => (
            <Card key={user.id} className={`bg-gray-900/50 border-gray-700/50 transition-all ${!user.active ? "opacity-50" : ""}`}>
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
                        <span className="font-medium text-white truncate">{user.name}</span>
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[user.role] || "text-gray-400"}`}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                        {!user.active && (
                          <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/30">
                            Desativado
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-900 border-gray-700">
                        <DropdownMenuItem
                          onClick={() => toggleActive(user)}
                          className="text-gray-300 hover:text-white gap-2"
                        >
                          {user.active ? (
                            <><PowerOff className="h-4 w-4 text-amber-500" /> Desativar temporariamente</>
                          ) : (
                            <><Power className="h-4 w-4 text-green-500" /> Reativar conta</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={() => handleDelete(user)}
                          className="text-red-400 hover:text-red-300 gap-2"
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
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Convites Pendentes
          </h3>
          <div className="space-y-2">
            {invitesQuery.data
              .filter((i: any) => !i.usedAt)
              .map((invite: any) => (
                <Card key={invite.id} className="bg-gray-900/30 border-gray-700/30">
                  <CardContent className="py-3 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-blue-400" />
                        <div>
                          <span className="text-sm text-white">{invite.email}</span>
                          <Badge variant="outline" className={`ml-2 text-xs ${ROLE_COLORS[invite.role] || ""}`}>
                            {ROLE_LABELS[invite.role] || invite.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Expira {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Invite Dialog ─── */

function InviteDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<string>("");
  const utils = trpc.useUtils();

  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: () => {
      utils.staff.invites.invalidate();
      toast.success("Convite enviado com sucesso!");
      onClose();
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

  return (
    <DialogContent className="bg-gray-900 border-gray-700 text-white sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Convidar Novo Usuário</DialogTitle>
        <DialogDescription className="text-gray-400">
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
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div className="space-y-2">
          <Label>Cargo *</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Selecione o cargo" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-700">
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
            className="bg-gray-800 border-gray-700"
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone (opcional)</Label>
          <Input
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300">
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={inviteMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Permissões de Acesso</h2>
        <p className="text-sm text-gray-400">Configure o que cada cargo pode ver e editar. Master e Diretor têm acesso total.</p>
      </div>

      {PERMISSION_GROUPS.map((group) => (
        <Card key={group.label} className="bg-gray-900/50 border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
              {group.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left text-xs text-gray-500 font-medium pb-2 pr-4 w-1/2">Permissão</th>
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
                    <tr key={perm} className="border-b border-gray-800/50 last:border-0">
                      <td className="py-3 pr-4 text-sm text-gray-300">
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
                              className="data-[state=checked]:bg-blue-600"
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
      // Build query params
      const params = new URLSearchParams();
      if (exportForm !== "all") params.set("formId", exportForm);
      if (exportStatus !== "all") params.set("status", exportStatus);
      if (exportValidation !== "all") params.set("validation", exportValidation);

      // For now, trigger CSV download via the existing export endpoint
      const resp = await fetch(`/api/trpc/responses.export?input=${encodeURIComponent(JSON.stringify({
        formId: exportForm === "all" ? undefined : Number(exportForm),
        status: exportStatus === "all" ? undefined : exportStatus,
        validationStatus: exportValidation === "all" ? undefined : exportValidation,
      }))}`);

      if (!resp.ok) {
        // Fallback: use the existing CSV export from responses page
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
        <h2 className="text-lg font-semibold text-white">Exportação de Respostas</h2>
        <p className="text-sm text-gray-400">Exporte respostas com filtros avançados</p>
      </div>

      <Card className="bg-gray-900/50 border-gray-700/50">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Formulário</Label>
              <Select value={exportForm} onValueChange={setExportForm}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">Todos os formulários</SelectItem>
                  {(formsQuery.data ?? []).map((f: any) => (
                    <SelectItem key={f.id} value={String(f.id)}>{f.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Status da resposta</Label>
              <Select value={exportStatus} onValueChange={setExportStatus}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="complete">Completas</SelectItem>
                  <SelectItem value="partial">Incompletas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Validação</Label>
              <Select value={exportValidation} onValueChange={setExportValidation}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
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
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 w-full sm:w-auto"
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
