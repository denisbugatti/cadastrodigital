import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Shield, Users, Download, ArrowLeft, SlidersHorizontal,
  Loader2, UserPlus, Mail, Phone, CheckCircle2, XCircle,
  Clock, FileDown, Filter, Palette, Sun, Moon, Monitor
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Permission definitions ───
const PERMISSION_DEFS: Record<string, { label: string; description: string }> = {
  view_forms: { label: "Ver formulários", description: "Visualizar formulários da equipe" },
  edit_forms: { label: "Editar formulários", description: "Criar e editar formulários" },
  view_responses: { label: "Ver respostas", description: "Visualizar respostas recebidas" },
  validate_responses: { label: "Validar respostas", description: "Aprovar ou reprovar respostas" },
  generate_pdf: { label: "Gerar PDF", description: "Gerar fichas em PDF das respostas aprovadas" },
  manage_team: { label: "Gerenciar equipe", description: "Adicionar e remover membros" },
  export_data: { label: "Exportar dados", description: "Exportar respostas em CSV" },
  share_forms: { label: "Compartilhar formulários", description: "Gerar links de compartilhamento" },
};

const ROLES_CONFIG = [
  { role: "gerente", label: "Gerente", color: "amber", icon: Shield },
  { role: "corretor", label: "Corretor", color: "blue", icon: Users },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Todos os status" },
  { value: "pending", label: "Pendentes" },
  { value: "in_review", label: "Em revisão" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Reprovados" },
];

export default function Settings() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl border bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <SlidersHorizontal className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Configurações</h1>
              <p className="text-xs text-muted-foreground font-body">Gerencie permissões, usuários e aparência</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="aparencia" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary border border-border rounded-xl p-1 h-auto">
            <TabsTrigger
              value="aparencia"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger
              value="permissoes"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
            <TabsTrigger
              value="usuarios"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger
              value="exportacao"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportação</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="aparencia" className="mt-6">
            <AppearanceTab />
          </TabsContent>

          <TabsContent value="permissoes" className="mt-6">
            <PermissionsTab />
          </TabsContent>

          <TabsContent value="usuarios" className="mt-6">
            <UsersTab />
          </TabsContent>

          <TabsContent value="exportacao" className="mt-6">
            <ExportTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

// ─── Appearance Tab ───
function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  const themeOptions = [
    {
      value: "light" as const,
      label: "Claro",
      description: "Interface clara com fundo branco e texto escuro",
      icon: Sun,
      preview: {
        bg: "bg-white",
        card: "bg-gray-50",
        text: "bg-gray-800",
        accent: "bg-blue-500",
        border: "border-gray-200",
      },
    },
    {
      value: "dark" as const,
      label: "Escuro",
      description: "Interface escura que reduz o cansaço visual",
      icon: Moon,
      preview: {
        bg: "bg-gray-900",
        card: "bg-gray-800",
        text: "bg-gray-200",
        accent: "bg-blue-400",
        border: "border-gray-700",
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card border border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <Palette className="h-5 w-5 text-brand" />
            </div>
            <div>
              <CardTitle className="text-foreground font-display text-lg">Tema da Interface</CardTitle>
              <CardDescription className="font-body text-sm">
                Escolha entre o modo claro ou escuro para o painel administrativo
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themeOptions.map((option) => {
              const isActive = theme === option.value;
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    if (theme !== option.value && toggleTheme) {
                      toggleTheme();
                      toast.success(`Tema ${option.label.toLowerCase()} ativado`);
                    }
                  }}
                  className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                    isActive
                      ? "border-brand bg-brand/5 shadow-md"
                      : "border-border hover:border-brand/30 hover:bg-secondary/50"
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Mini preview */}
                  <div className={`w-full h-24 rounded-xl ${option.preview.bg} ${option.preview.border} border overflow-hidden p-3 mb-4`}>
                    {/* Mini header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${option.preview.accent}`} />
                      <div className={`h-2 w-16 rounded-full ${option.preview.text} opacity-30`} />
                    </div>
                    {/* Mini cards */}
                    <div className="flex gap-2">
                      <div className={`flex-1 h-10 rounded-lg ${option.preview.card} ${option.preview.border} border`}>
                        <div className={`h-1.5 w-8 rounded-full ${option.preview.text} opacity-20 mt-2 ml-2`} />
                        <div className={`h-1.5 w-12 rounded-full ${option.preview.text} opacity-10 mt-1 ml-2`} />
                      </div>
                      <div className={`flex-1 h-10 rounded-lg ${option.preview.card} ${option.preview.border} border`}>
                        <div className={`h-1.5 w-10 rounded-full ${option.preview.text} opacity-20 mt-2 ml-2`} />
                        <div className={`h-1.5 w-6 rounded-full ${option.preview.text} opacity-10 mt-1 ml-2`} />
                      </div>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isActive ? "bg-brand/10" : "bg-secondary"
                    }`}>
                      <Icon className={`h-4 w-4 ${isActive ? "text-brand" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-body font-semibold ${isActive ? "text-brand" : "text-foreground"}`}>
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Info note */}
          <div className="mt-4 p-3 rounded-xl bg-secondary/50 border border-border">
            <p className="text-xs text-muted-foreground font-body flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              Sua preferência é salva automaticamente e será lembrada na próxima vez que acessar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Permissions Tab ───
function PermissionsTab() {
  const utils = trpc.useUtils();
  const { data: permissions, isLoading } = trpc.permissions.list.useQuery();
  const updatePermission = trpc.permissions.update.useMutation({
    onSuccess: () => {
      utils.permissions.list.invalidate();
    },
  });

  // Build a lookup map: role -> permission -> granted
  const permMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const rc of ROLES_CONFIG) {
      map[rc.role] = {};
      for (const key of Object.keys(PERMISSION_DEFS)) {
        map[rc.role][key] = false;
      }
    }
    if (permissions) {
      for (const p of permissions as any[]) {
        if (map[p.role]) {
          map[p.role][p.permission] = !!p.granted;
        }
      }
    }
    return map;
  }, [permissions]);

  const handleToggle = (role: string, permission: string, granted: boolean) => {
    updatePermission.mutate({ role, permission, granted });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ROLES_CONFIG.map(({ role, label, color, icon: Icon }) => (
        <Card key={role} className="bg-card border border-border rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                color === "amber" ? "bg-amber-500/10" : "bg-blue-500/10"
              }`}>
                <Icon className={`h-4.5 w-4.5 ${
                  color === "amber" ? "text-amber-500" : "text-blue-500"
                }`} />
              </div>
              <div>
                <CardTitle className="text-foreground font-display text-base">{label}</CardTitle>
                <CardDescription className="font-body text-xs">
                  {role === "gerente" ? "Acesso intermediário — gerencia equipe e formulários" : "Acesso básico — valida respostas e gera PDFs"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(PERMISSION_DEFS).map(([key, def]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-body font-medium text-foreground">{def.label}</p>
                    <p className="text-xs text-muted-foreground font-body truncate">{def.description}</p>
                  </div>
                  <Switch
                    checked={permMap[role]?.[key] ?? false}
                    onCheckedChange={(checked) => handleToggle(role, key, checked)}
                    disabled={updatePermission.isPending}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Users Tab ───
function UsersTab() {
  const utils = trpc.useUtils();
  const { data: staffUsers, isLoading: loadingUsers } = trpc.staff.list.useQuery();
  const { data: pendingInvites, isLoading: loadingInvites } = trpc.staff.invites.useQuery();
  const deleteUser = trpc.staff.delete.useMutation({
    onSuccess: () => {
      utils.staff.list.invalidate();
      toast.success("Usuário removido");
    },
    onError: (err) => toast.error(err.message),
  });

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    name: "",
    phone: "",
    role: "corretor" as "diretor" | "gerente" | "corretor",
  });

  const inviteMutation = trpc.staff.invite.useMutation({
    onSuccess: () => {
      utils.staff.invites.invalidate();
      setShowInviteDialog(false);
      setInviteForm({ email: "", name: "", phone: "", role: "corretor" });
      toast.success("Convite enviado com sucesso!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInvite = () => {
    if (!inviteForm.email) {
      toast.error("Email é obrigatório");
      return;
    }
    inviteMutation.mutate({
      email: inviteForm.email,
      role: inviteForm.role,
      name: inviteForm.name || undefined,
      phone: inviteForm.phone || undefined,
      origin: window.location.origin,
    });
  };

  const roleColors: Record<string, string> = {
    master: "bg-purple-500/10 text-purple-500",
    diretor: "bg-red-500/10 text-red-500",
    gerente: "bg-amber-500/10 text-amber-500",
    corretor: "bg-blue-500/10 text-blue-500",
  };

  const roleLabels: Record<string, string> = {
    master: "Master",
    diretor: "Diretor",
    gerente: "Gerente",
    corretor: "Corretor",
  };

  if (loadingUsers || loadingInvites) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Staff Users List */}
      <Card className="bg-card border border-border rounded-2xl shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground font-display text-lg">Equipe</CardTitle>
              <CardDescription className="font-body text-sm">
                {(staffUsers as any[])?.length || 0} membro{((staffUsers as any[])?.length || 0) !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <button
              onClick={() => setShowInviteDialog(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white font-body text-sm font-semibold hover:bg-brand-dark active:scale-[0.98] transition-all duration-200"
            >
              <UserPlus size={16} />
              Convidar
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(staffUsers as any[])?.map((user: any) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border hover:bg-secondary/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <span className="text-brand font-display font-bold text-sm">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-body font-medium text-foreground text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-body truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user.active ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-body font-semibold ${roleColors[user.role] || "bg-secondary text-muted-foreground"}`}>
                    {roleLabels[user.role] || user.role}
                  </span>
                  {user.role !== "master" && (
                    <button
                      onClick={() => {
                        if (confirm(`Remover ${user.name}?`)) {
                          deleteUser.mutate({ id: user.id });
                        }
                      }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-destructive/10 transition-colors"
                      title="Remover"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {(pendingInvites as any[])?.length > 0 && (
        <Card className="bg-card border border-border rounded-2xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-foreground font-display text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Convites Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(pendingInvites as any[])?.map((invite: any) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-body font-medium text-foreground text-sm truncate">{invite.email}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-body font-semibold ${roleColors[invite.role] || "bg-secondary text-muted-foreground"}`}>
                    {roleLabels[invite.role] || invite.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Convidar Novo Membro</DialogTitle>
            <DialogDescription className="font-body text-sm">
              Um email será enviado com o link de cadastro
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-body text-sm">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Nome</Label>
              <Input
                placeholder="Nome completo"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="(11) 99999-9999"
                  value={inviteForm.phone}
                  onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm">Cargo *</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(val) => setInviteForm({ ...inviteForm, role: val as any })}
              >
                <SelectTrigger>
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
            <button
              onClick={() => setShowInviteDialog(false)}
              className="px-4 py-2 rounded-xl border border-border text-foreground font-body text-sm font-medium hover:bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvite}
              disabled={inviteMutation.isPending || !inviteForm.email}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white font-body text-sm font-semibold hover:bg-brand-dark active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {inviteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              Enviar Convite
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Export Tab ───
function ExportTab() {
  const { data: forms, isLoading: loadingForms } = trpc.forms.list.useQuery();
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: csvData, isLoading: loadingCsv, refetch, isFetching } = trpc.responses.exportCsv.useQuery(
    { formId: selectedFormId!, validationStatus: statusFilter as any },
    { enabled: false }
  );

  const handleExport = async () => {
    if (!selectedFormId) {
      toast.error("Selecione um formulário");
      return;
    }
    const result = await refetch();
    if (result.data) {
      const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.data.totalResponses} respostas exportadas`);
    }
  };

  if (loadingForms) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  const formsList = (forms as any[]) || [];

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <FileDown className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <CardTitle className="text-foreground font-display text-lg">Exportar Respostas</CardTitle>
            <CardDescription className="font-body text-sm">
              Selecione o formulário e filtros para exportar em CSV
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Form Selection */}
          <div className="space-y-2">
            <Label className="font-body text-sm font-medium flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Formulário
            </Label>
            <Select
              value={selectedFormId?.toString() || ""}
              onValueChange={(val) => setSelectedFormId(Number(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um formulário" />
              </SelectTrigger>
              <SelectContent>
                {formsList.map((form: any) => (
                  <SelectItem key={form.id} value={form.id.toString()}>
                    {form.title} ({form.responseCount || 0} respostas)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="font-body text-sm font-medium flex items-center gap-2">
              <Filter className="h-3.5 w-3.5" />
              Status de Validação
            </Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={!selectedFormId || isFetching}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white font-body text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download size={16} />
                Exportar CSV
              </>
            )}
          </button>

          {/* Last export info */}
          {csvData && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-sm font-body text-green-600 dark:text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Última exportação: {csvData.totalResponses} respostas em "{csvData.filename}"
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
