/**
 * FormFlow Workspace Manager (Light Theme)
 * Manage workspaces (folders) with custom domains.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Globe, Plus, Trash2, Edit3, Check, X, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Workspace } from "@/lib/builderTypes";
import { defaultDesignSettings, sampleWorkspaces } from "@/lib/builderTypes";

interface WorkspaceManagerProps {
  currentWorkspaceId: string | null;
  onSelectWorkspace: (id: string | null) => void;
}

export function WorkspaceManager({
  currentWorkspaceId,
  onSelectWorkspace,
}: WorkspaceManagerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(sampleWorkspaces);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const createWorkspace = () => {
    if (!newName.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!newDomain.trim()) {
      toast.error("Domínio é obrigatório");
      return;
    }

    const ws: Workspace = {
      id: `ws_${Date.now()}`,
      name: newName.trim(),
      domain: newDomain.trim().replace(/^https?:\/\//, ""),
      description: "",
      designDefaults: { ...defaultDesignSettings },
      formIds: [],
      createdAt: new Date().toISOString(),
    };

    setWorkspaces((prev) => [...prev, ws]);
    setNewName("");
    setNewDomain("");
    setShowCreate(false);
    toast.success(`Workspace "${ws.name}" criado!`);
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaces((prev) => prev.filter((w) => w.id !== id));
    if (currentWorkspaceId === id) {
      onSelectWorkspace(null);
    }
    toast.success("Workspace removido");
  };

  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-brand" />
          <h4 className="text-sm font-body font-semibold text-foreground">
            Workspaces
          </h4>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-dark transition-colors font-medium"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      <p className="text-sm text-muted-foreground">
        Agrupe formulários por domínio. Cada workspace define o domínio base e o design padrão dos formulários.
      </p>

      {/* Create new workspace form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl border border-brand/20 bg-brand-lighter space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do workspace (ex: Denis Bugatti)"
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
              />
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="dominio.com.br"
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-mono bg-input border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createWorkspace}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-all"
                >
                  <Check size={16} /> Criar
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewName("");
                    setNewDomain("");
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground border border-border hover:bg-secondary transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "No workspace" option */}
      <button
        onClick={() => onSelectWorkspace(null)}
        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all border ${
          currentWorkspaceId === null
            ? "border-brand bg-brand-lighter"
            : "border-border bg-secondary/50 hover:border-brand/30"
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          currentWorkspaceId === null ? "bg-brand/10" : "bg-secondary"
        }`}>
          <Globe size={18} className={currentWorkspaceId === null ? "text-brand" : "text-muted-foreground"} />
        </div>
        <div className="flex-1 text-left">
          <span className="text-sm font-body font-semibold text-foreground block">
            Sem workspace
          </span>
          <span className="text-sm text-muted-foreground">
            formflow.app/slug-do-formulario
          </span>
        </div>
        {currentWorkspaceId === null && (
          <Check size={16} className="text-brand" />
        )}
      </button>

      {/* Workspace list */}
      <div className="space-y-2">
        {workspaces.map((ws) => {
          const isSelected = currentWorkspaceId === ws.id;
          const isEditing = editingId === ws.id;

          return (
            <motion.div
              key={ws.id}
              layout
              className={`rounded-xl transition-all border ${
                isSelected
                  ? "border-brand bg-brand-lighter"
                  : "border-border bg-secondary/50 hover:border-brand/30"
              }`}
            >
              <button
                onClick={() => onSelectWorkspace(ws.id)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isSelected ? "bg-brand/10" : "bg-secondary"
                }`}>
                  <FolderOpen
                    size={18}
                    className={isSelected ? "text-brand" : "text-muted-foreground"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={ws.name}
                        onChange={(e) =>
                          updateWorkspace(ws.id, { name: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg text-sm bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={ws.domain}
                        onChange={(e) =>
                          updateWorkspace(ws.id, { domain: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-body font-semibold text-foreground block truncate">
                        {ws.name}
                      </span>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Globe size={12} />
                        {ws.domain}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingId(isEditing ? null : ws.id)}
                    className="p-2 text-muted-foreground hover:text-brand transition-colors"
                  >
                    {isEditing ? <Check size={16} /> : <Edit3 size={16} />}
                  </button>
                  <button
                    onClick={() => deleteWorkspace(ws.id)}
                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {isSelected && !isEditing && (
                  <Check size={16} className="text-brand shrink-0" />
                )}
              </button>

              {/* Show URL structure when selected */}
              {isSelected && !isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-4 pb-4 overflow-hidden"
                >
                  <div className="p-3 rounded-xl text-sm font-mono space-y-1.5 bg-secondary border border-border">
                    <p className="text-muted-foreground text-xs mb-2">Estrutura de URLs:</p>
                    <p className="text-brand flex items-center gap-1.5">
                      <ChevronRight size={12} />
                      {ws.domain}/formulario-1
                    </p>
                    <p className="text-brand flex items-center gap-1.5">
                      <ChevronRight size={12} />
                      {ws.domain}/formulario-2
                    </p>
                    <p className="text-brand flex items-center gap-1.5">
                      <ChevronRight size={12} />
                      {ws.domain}/pasta/sub-formulario
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
