/**
 * FormFlow Workspace Manager
 * Design: Dark futuristic with glassmorphism.
 * Manage workspaces (folders) with custom domains.
 * Each workspace groups forms under the same domain and design.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen, Globe, Plus, Trash2, Edit3, Check, X, ExternalLink, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { Workspace, FormDesignSettings } from "@/lib/builderTypes";
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
          <FolderOpen size={14} className="text-neon-blue" />
          <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
            Workspaces
          </h4>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 text-[10px] text-neon-blue hover:text-neon-cyan transition-colors"
        >
          <Plus size={11} /> Novo
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/60">
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
            <div
              className="p-3 rounded-xl border border-neon-blue/20 space-y-2.5"
              style={{ background: "oklch(0.14 0.02 250 / 0.3)" }}
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome do workspace (ex: Denis Bugatti)"
                className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors"
              />
              <div className="flex items-center gap-1">
                <Globe size={11} className="text-muted-foreground/40 shrink-0" />
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="dominio.com.br"
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-mono bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={createWorkspace}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold text-white transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.55 0.25 270))",
                  }}
                >
                  <Check size={11} /> Criar
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setNewName("");
                    setNewDomain("");
                  }}
                  className="px-3 py-2 rounded-lg text-[10px] font-semibold text-muted-foreground border border-glass-border hover:border-glass-hover transition-all"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* "No workspace" option */}
      <button
        onClick={() => onSelectWorkspace(null)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
          currentWorkspaceId === null
            ? "border-neon-blue/30"
            : "border-glass-border hover:border-glass-hover"
        }`}
        style={{
          background:
            currentWorkspaceId === null
              ? "oklch(0.16 0.025 250 / 0.3)"
              : "oklch(0.14 0.015 260)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.2 0.02 260)" }}
        >
          <Globe size={14} className="text-muted-foreground" />
        </div>
        <div className="flex-1 text-left">
          <span className="text-[10px] font-body font-semibold text-foreground block">
            Sem workspace
          </span>
          <span className="text-[9px] text-muted-foreground/50">
            formflow.app/slug-do-formulario
          </span>
        </div>
        {currentWorkspaceId === null && (
          <Check size={12} className="text-neon-blue" />
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
                  ? "border-neon-blue/30"
                  : "border-glass-border hover:border-glass-hover"
              }`}
              style={{
                background: isSelected
                  ? "oklch(0.16 0.025 250 / 0.3)"
                  : "oklch(0.14 0.015 260)",
              }}
            >
              <button
                onClick={() => onSelectWorkspace(ws.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: isSelected
                      ? "oklch(0.25 0.05 250 / 0.4)"
                      : "oklch(0.2 0.02 260)",
                  }}
                >
                  <FolderOpen
                    size={14}
                    className={isSelected ? "text-neon-blue" : "text-muted-foreground"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={ws.name}
                        onChange={(e) =>
                          updateWorkspace(ws.id, { name: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded text-[10px] bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={ws.domain}
                        onChange={(e) =>
                          updateWorkspace(ws.id, { domain: e.target.value })
                        }
                        className="w-full px-2 py-1 rounded text-[9px] font-mono bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="text-[10px] font-body font-semibold text-foreground block truncate">
                        {ws.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1">
                        <Globe size={8} />
                        {ws.domain}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setEditingId(isEditing ? null : ws.id)}
                    className="p-1 text-muted-foreground hover:text-neon-blue transition-colors"
                  >
                    {isEditing ? <Check size={11} /> : <Edit3 size={11} />}
                  </button>
                  <button
                    onClick={() => deleteWorkspace(ws.id)}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
                {isSelected && !isEditing && (
                  <Check size={12} className="text-neon-blue shrink-0" />
                )}
              </button>

              {/* Show URL structure when selected */}
              {isSelected && !isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="px-3 pb-3 overflow-hidden"
                >
                  <div
                    className="p-2.5 rounded-lg text-[9px] font-mono space-y-1"
                    style={{ background: "oklch(0.1 0.01 260)" }}
                  >
                    <p className="text-muted-foreground/40 mb-1.5">Estrutura de URLs:</p>
                    <p className="text-neon-cyan/60 flex items-center gap-1">
                      <ChevronRight size={8} />
                      {ws.domain}/formulario-1
                    </p>
                    <p className="text-neon-cyan/60 flex items-center gap-1">
                      <ChevronRight size={8} />
                      {ws.domain}/formulario-2
                    </p>
                    <p className="text-neon-cyan/60 flex items-center gap-1">
                      <ChevronRight size={8} />
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
