/**
 * Permissions Management Page — Editable permissions matrix.
 * Visual hierarchy: Master > Diretor > Gerente > Corretor
 * Based on the user's reference image.
 */

import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ArrowLeft, Crown, Star, Building2, Briefcase,
  CheckCircle2, Circle, Loader2, Shield, Info,
} from "lucide-react";

const roles = [
  { key: "master", label: "Master", icon: Crown, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200", description: "Acesso irrestrito a toda a árvore hierárquica" },
  { key: "diretor", label: "Diretor", icon: Star, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", description: "Visão global de todas as gerências e equipes. Filtra por Gerente ou Corretor" },
  { key: "gerente", label: "Gerente", icon: Building2, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", description: "Acesso aos perfis e funis dos corretores da sua equipe" },
  { key: "corretor", label: "Corretor", icon: Briefcase, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200", description: "Visualiza apenas o próprio perfil e funil. Sem botão 'Responsável'" },
];

const permissionLabels: Record<string, string> = {
  "view_all_leads": "Ver todos os leads",
  "view_team_leads": "Ver leads da equipe",
  "view_own_leads": "Ver próprios leads",
  "filter_responsible": "Filtro 'Responsável'",
  "edit_leads": "Editar leads",
  "delete_leads": "Excluir leads",
  "bulk_send": "Envios em massa",
  "view_team_profiles": "Ver perfis da equipe",
  "manage_staff": "Gerenciar equipe",
  "manage_permissions": "Gerenciar permissões",
  "view_all_responses": "Ver todas as respostas",
  "view_team_responses": "Ver respostas da equipe",
  "view_own_responses": "Ver próprias respostas",
  "validate_responses": "Validar respostas",
  "create_forms": "Criar formulários",
  "edit_forms": "Editar formulários",
  "delete_forms": "Excluir formulários",
  "send_invites": "Enviar convites",
};

const defaultPermissions = [
  "view_all_leads", "view_team_leads", "view_own_leads",
  "filter_responsible", "edit_leads", "delete_leads",
  "bulk_send", "view_team_profiles", "manage_staff",
  "manage_permissions", "view_all_responses", "view_team_responses",
  "view_own_responses", "validate_responses", "create_forms",
  "edit_forms", "delete_forms", "send_invites",
];

export default function PermissionsPage() {
  const [, navigate] = useLocation();
  const [editMode, setEditMode] = useState(false);

  const permissionsQuery = trpc.permissions.list.useQuery();
  const updateMutation = trpc.permissions.update.useMutation({
    onSuccess: () => {
      toast.success("Permissão atualizada!");
      permissionsQuery.refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Build permissions map from query data
  const permissionsMap = useMemo(() => {
    const map: Record<string, Record<string, boolean>> = {};
    for (const role of roles) {
      map[role.key] = {};
      for (const perm of defaultPermissions) {
        // Master always has all permissions
        if (role.key === "master") {
          map[role.key][perm] = true;
        } else {
          map[role.key][perm] = false;
        }
      }
    }
    // Override with DB values
    if (permissionsQuery.data) {
      for (const p of permissionsQuery.data as any[]) {
        if (map[p.role]) {
          map[p.role][p.permission] = p.granted;
        }
      }
    }
    return map;
  }, [permissionsQuery.data]);

  const togglePermission = (role: string, permission: string) => {
    if (role === "master") return; // Master always has all
    if (!editMode) return;
    const current = permissionsMap[role]?.[permission] ?? false;
    updateMutation.mutate({ role, permission, granted: !current });
  };

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
              <h1 className="text-xl font-bold text-foreground font-display">Permissões por Nível</h1>
              <p className="text-sm text-muted-foreground">Configure o que cada cargo pode acessar</p>
            </div>
          </div>
          <Button
            variant={editMode ? "default" : "outline"}
            onClick={() => setEditMode(!editMode)}
          >
            {editMode ? "Concluir Edição" : "Editar Permissões"}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hierarchy Cards */}
        <div className="bg-card rounded-xl border border-border p-6 mb-8">
          <h2 className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">
            Hierarquia de Acesso
          </h2>
          <div className="space-y-3">
            {roles.map((role, i) => {
              const Icon = role.icon;
              return (
                <div
                  key={role.key}
                  className={`p-4 rounded-xl border ${role.borderColor} ${role.bgColor} transition-all`}
                  style={{ marginLeft: `${i * 24}px` }}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${role.color}`} />
                    <div>
                      <span className={`font-semibold ${role.color}`}>{role.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <Info className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700">
              Modo edição ativo — clique nos checkboxes para alterar permissões
            </p>
          </div>
        )}

        {/* Permissions Matrix */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {permissionsQuery.isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-4 text-sm font-medium text-muted-foreground">Recurso</th>
                    {roles.map((role) => {
                      const Icon = role.icon;
                      return (
                        <th key={role.key} className="px-4 py-4 text-center w-28">
                          <div className="flex flex-col items-center gap-1">
                            <Icon className={`w-5 h-5 ${role.color}`} />
                            <span className={`text-xs font-semibold ${role.color}`}>{role.label}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {defaultPermissions.map((perm) => (
                    <tr key={perm} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                      <td className="px-6 py-3.5 text-sm text-foreground">
                        {permissionLabels[perm] || perm}
                      </td>
                      {roles.map((role) => {
                        const granted = permissionsMap[role.key]?.[perm] ?? false;
                        const isMaster = role.key === "master";
                        return (
                          <td key={role.key} className="px-4 py-3.5 text-center">
                            <button
                              onClick={() => togglePermission(role.key, perm)}
                              disabled={isMaster || !editMode || updateMutation.isPending}
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
                                granted
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : editMode && !isMaster
                                    ? "bg-secondary text-muted-foreground/40 hover:bg-secondary/80 cursor-pointer"
                                    : "bg-secondary/50 text-muted-foreground/30"
                              } ${isMaster ? "cursor-default" : editMode ? "cursor-pointer" : "cursor-default"}`}
                            >
                              {granted ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
