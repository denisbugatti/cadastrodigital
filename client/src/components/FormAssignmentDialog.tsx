/**
 * FormAssignmentDialog — Dialog to assign/unassign staff members to a form.
 * Only master/diretor can open this dialog.
 * Shows a list of all staff (gerentes + corretores) with checkboxes.
 */

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Search, Users, Loader2, UserCheck, Shield, Briefcase, User } from "lucide-react";

interface FormAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: number;
  formTitle: string;
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield }> = {
  master: { label: "Master", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: Shield },
  diretor: { label: "Diretor", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Shield },
  gerente: { label: "Gerente", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Briefcase },
  corretor: { label: "Corretor", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: User },
};

export function FormAssignmentDialog({ open, onOpenChange, formId, formTitle }: FormAssignmentDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  const utils = trpc.useUtils();

  // Fetch all staff users
  const staffQuery = trpc.staff.list.useQuery(undefined, { enabled: open });

  // Fetch current assignments for this form
  const assignmentsQuery = trpc.forms.getAssignments.useQuery(
    { formId },
    { enabled: open }
  );

  // Set assignments mutation
  const setAssignmentsMutation = trpc.forms.setAssignments.useMutation({
    onSuccess: () => {
      utils.forms.getAssignments.invalidate({ formId });
      utils.forms.getAssignmentsBatch.invalidate();
      utils.forms.list.invalidate();
    },
  });

  // Initialize selected IDs from current assignments
  useEffect(() => {
    if (assignmentsQuery.data) {
      setSelectedIds(new Set(assignmentsQuery.data.map((a: any) => a.staffUserId)));
    }
  }, [assignmentsQuery.data]);

  // Reset search when dialog opens
  useEffect(() => {
    if (open) setSearch("");
  }, [open]);

  // Filter staff to only show gerentes and corretores (assignable roles)
  const assignableStaff = useMemo(() => {
    const staff = (staffQuery.data ?? []) as any[];
    return staff
      .filter((s: any) => ["gerente", "corretor"].includes(s.role) && s.active)
      .filter((s: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          s.name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.role?.toLowerCase().includes(q)
        );
      })
      .sort((a: any, b: any) => {
        // Sort by role (gerentes first), then by name
        const roleOrder: Record<string, number> = { gerente: 0, corretor: 1 };
        const ra = roleOrder[a.role] ?? 2;
        const rb = roleOrder[b.role] ?? 2;
        if (ra !== rb) return ra - rb;
        return (a.name ?? "").localeCompare(b.name ?? "");
      });
  }, [staffQuery.data, search]);

  const handleToggle = (staffId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(staffId)) {
        next.delete(staffId);
      } else {
        next.add(staffId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const allIds = assignableStaff.map((s: any) => s.id);
    const allSelected = allIds.every((id: number) => selectedIds.has(id));
    if (allSelected) {
      // Deselect all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allIds.forEach((id: number) => next.delete(id));
        return next;
      });
    } else {
      // Select all visible
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allIds.forEach((id: number) => next.add(id));
        return next;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setAssignmentsMutation.mutateAsync({
        formId,
        staffUserIds: Array.from(selectedIds),
      });
      toast.success("Vínculos atualizados!", {
        description: `${selectedIds.size} membro(s) vinculado(s) a "${formTitle}"`,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error("Erro ao salvar vínculos");
    } finally {
      setSaving(false);
    }
  };

  const isLoading = staffQuery.isLoading || assignmentsQuery.isLoading;
  const allVisibleSelected = assignableStaff.length > 0 && assignableStaff.every((s: any) => selectedIds.has(s.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border shadow-2xl max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Users size={20} className="text-brand" />
            Vincular Equipe
          </DialogTitle>
          <DialogDescription className="font-body text-sm">
            Selecione os membros da equipe que terão acesso ao formulário <strong>"{formTitle}"</strong>.
            Gerentes e corretores vinculados verão apenas os formulários atribuídos a eles.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="pl-9 font-body"
          />
        </div>

        {/* Staff list */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[400px] -mx-1 px-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-brand" />
            </div>
          ) : assignableStaff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground font-body text-sm">
              {search ? (
                <p>Nenhum membro encontrado para "{search}"</p>
              ) : (
                <p>Nenhum gerente ou corretor cadastrado. Convide membros na aba Equipe.</p>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Select all */}
              <button
                onClick={handleSelectAll}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-body font-medium text-muted-foreground hover:bg-secondary/80 transition-colors"
              >
                <Checkbox
                  checked={allVisibleSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                />
                <span>{allVisibleSelected ? "Desmarcar todos" : "Selecionar todos"}</span>
                <span className="ml-auto text-xs text-muted-foreground/70">
                  {selectedIds.size} selecionado(s)
                </span>
              </button>

              <div className="h-px bg-border my-1" />

              {assignableStaff.map((staff: any) => {
                const isSelected = selectedIds.has(staff.id);
                const roleConfig = ROLE_CONFIG[staff.role] ?? ROLE_CONFIG.corretor;
                const RoleIcon = roleConfig.icon;

                return (
                  <button
                    key={staff.id}
                    onClick={() => handleToggle(staff.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 ${
                      isSelected
                        ? "bg-brand/5 border border-brand/20"
                        : "hover:bg-secondary/80 border border-transparent"
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggle(staff.id)}
                      className="data-[state=checked]:bg-brand data-[state=checked]:border-brand"
                    />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-body font-medium text-sm text-foreground truncate">
                          {staff.name}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 font-body ${roleConfig.color}`}>
                          <RoleIcon size={10} className="mr-0.5" />
                          {roleConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-body truncate">{staff.email}</p>
                    </div>
                    {isSelected && (
                      <UserCheck size={16} className="text-brand shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 font-body"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-brand hover:bg-brand-dark text-white font-body"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <UserCheck size={16} className="mr-2" />
                Salvar vínculos ({selectedIds.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
