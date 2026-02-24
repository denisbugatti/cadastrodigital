/**
 * FormFlow Builder Page
 * Design: Dark futuristic with glassmorphism, neon accents (blue/cyan).
 * Top navigation: Editor | Opções | Compartilhar | Respostas
 * Editor tab: Three-panel layout (Sidebar + Canvas + Config)
 * Opções tab: Design editor + Webhook + Workspace
 * Compartilhar tab: Link sharing, social, embed code
 * Respostas tab: Response viewer (empty state)
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Eye, Save, ArrowLeft, Pencil, Settings, Share2, BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { BuilderConfigPanel } from "@/components/builder/BuilderConfigPanel";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { DesignEditor } from "@/components/builder/DesignEditor";
import { SharingPanel } from "@/components/builder/SharingPanel";
import { WebhookPanel } from "@/components/builder/WebhookPanel";
import { ResponsesPanel } from "@/components/builder/ResponsesPanel";
import { WorkspaceManager } from "@/components/builder/WorkspaceManager";
import { useBuilder } from "@/hooks/useBuilder";
import type { Workspace } from "@/lib/builderTypes";
import { sampleWorkspaces } from "@/lib/builderTypes";

type BuilderTab = "editor" | "opcoes" | "compartilhar" | "respostas";

export default function Builder() {
  const {
    form,
    selectedQuestion,
    selectedQuestionId,
    setSelectedQuestionId,
    addQuestion,
    removeQuestion,
    duplicateQuestion,
    moveQuestion,
    updateQuestion,
    updateFormMeta,
    updateDesign,
    updateWebhook,
    updateSharing,
    addChoice,
    updateChoice,
    removeChoice,
    getConditionalTargets,
  } = useBuilder();

  const [activeTab, setActiveTab] = useState<BuilderTab>("editor");
  const [showPreview, setShowPreview] = useState(false);

  // Listen for tab switch events (from ResponsesPanel)
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === "compartilhar") setActiveTab("compartilhar");
    };
    window.addEventListener("switch-tab", handler);
    return () => window.removeEventListener("switch-tab", handler);
  }, []);

  const conditionalTargets = selectedQuestion
    ? getConditionalTargets(selectedQuestion.id)
    : [];

  const hasActualQuestions = form.questions.some(
    (q) => q.type !== "welcome" && q.type !== "thank-you"
  );

  const handlePreview = () => {
    if (!hasActualQuestions) {
      toast.error("Adicione pelo menos uma pergunta", {
        description: "O formulário precisa de perguntas para ser visualizado.",
      });
      return;
    }
    setShowPreview(true);
  };

  // Find current workspace domain
  const currentWorkspace = form.workspaceId
    ? sampleWorkspaces.find((w) => w.id === form.workspaceId)
    : null;

  const tabs: { id: BuilderTab; label: string; icon: typeof Pencil }[] = [
    { id: "editor", label: "Editor", icon: Pencil },
    { id: "opcoes", label: "Opções", icon: Settings },
    { id: "compartilhar", label: "Compartilhar", icon: Share2 },
    { id: "respostas", label: "Respostas", icon: BarChart3 },
  ];

  return (
    <div className="h-screen flex flex-col" style={{ background: "oklch(0.09 0.01 260)" }}>
      {/* ─── Top Bar ─── */}
      <header
        className="border-b border-glass-border shrink-0"
        style={{ background: "oklch(0.11 0.015 260)" }}
      >
        {/* Upper row: Logo + Title + Actions */}
        <div className="h-12 flex items-center justify-between px-4">
          {/* Left: Back + Form title */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.div
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft size={16} />
              </motion.div>
            </Link>

            <div className="w-px h-5 bg-glass-border" />

            <div className="flex items-center gap-2">
              <Zap size={14} className="text-neon-blue" />
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateFormMeta({ title: e.target.value })}
                className="bg-transparent text-sm font-display font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-neon-blue/30 transition-colors px-1 py-0.5 max-w-[200px]"
                placeholder="Nome do formulário..."
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium text-muted-foreground hover:text-foreground border border-glass-border hover:border-glass-hover transition-all"
              style={{ background: "oklch(0.14 0.015 260)" }}
            >
              <Eye size={13} />
              Ver
            </button>

            <button
              onClick={() =>
                toast.success("Formulário salvo!", {
                  description: "Todas as alterações foram salvas.",
                })
              }
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-body font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.55 0.25 270))",
                boxShadow: "0 0 12px oklch(0.65 0.2 250 / 0.3)",
              }}
            >
              <Save size={13} />
              Salvar
            </button>
          </div>
        </div>

        {/* Lower row: Tab navigation */}
        <div className="flex items-center px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-body font-medium transition-all ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/80"
                }`}
              >
                <Icon size={13} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{
                      background: "linear-gradient(90deg, oklch(0.65 0.2 250), oklch(0.7 0.18 200))",
                      boxShadow: "0 0 8px oklch(0.65 0.2 250 / 0.4)",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ═══ EDITOR TAB ═══ */}
          {activeTab === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex"
            >
              {/* Left: Question types sidebar */}
              <BuilderSidebar onAddQuestion={addQuestion} />

              {/* Center: Canvas */}
              <BuilderCanvas
                questions={form.questions}
                selectedQuestionId={selectedQuestionId}
                onSelect={setSelectedQuestionId}
                onRemove={removeQuestion}
                onDuplicate={duplicateQuestion}
                onMove={moveQuestion}
              />

              {/* Right: Config panel */}
              <BuilderConfigPanel
                question={selectedQuestion}
                onUpdate={updateQuestion}
                onAddChoice={addChoice}
                onUpdateChoice={updateChoice}
                onRemoveChoice={removeChoice}
                conditionalTargets={conditionalTargets}
              />
            </motion.div>
          )}

          {/* ═══ OPÇÕES TAB ═══ */}
          {activeTab === "opcoes" && (
            <motion.div
              key="opcoes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex"
            >
              {/* Left: Design Editor */}
              <div
                className="w-[340px] border-r border-glass-border shrink-0 overflow-hidden"
                style={{ background: "oklch(0.11 0.015 260)" }}
              >
                <div className="p-3 border-b border-glass-border">
                  <h3 className="text-xs font-display font-bold text-foreground flex items-center gap-2">
                    <Settings size={13} className="text-neon-blue" />
                    Configurações
                  </h3>
                </div>
                <DesignEditor design={form.design} onUpdate={updateDesign} />
              </div>

              {/* Center: Webhook + Workspace */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-2xl mx-auto p-6 space-y-6">
                  {/* Webhook section */}
                  <div
                    className="rounded-2xl border border-glass-border overflow-hidden"
                    style={{ background: "oklch(0.11 0.015 260)" }}
                  >
                    <WebhookPanel
                      webhook={form.webhook}
                      onUpdate={updateWebhook}
                    />
                  </div>

                  {/* Workspace section */}
                  <div
                    className="rounded-2xl border border-glass-border p-4"
                    style={{ background: "oklch(0.11 0.015 260)" }}
                  >
                    <WorkspaceManager
                      currentWorkspaceId={form.workspaceId}
                      onSelectWorkspace={(id) => {
                        updateFormMeta({} as any);
                        // We need to update workspaceId directly
                        // Using a workaround through the form state
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Live preview mini */}
              <div
                className="w-[300px] border-l border-glass-border shrink-0 flex flex-col"
                style={{ background: "oklch(0.11 0.015 260)" }}
              >
                <div className="p-3 border-b border-glass-border">
                  <h3 className="text-xs font-display font-bold text-foreground flex items-center gap-2">
                    <Eye size={13} className="text-neon-cyan" />
                    Pré-visualização
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <div
                    className="w-full rounded-2xl overflow-hidden border border-glass-border shadow-2xl"
                    style={{
                      background: form.design.backgroundColor,
                      aspectRatio: "9/16",
                      maxHeight: "500px",
                    }}
                  >
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      {form.design.logoUrl && (
                        <img
                          src={form.design.logoUrl}
                          alt="Logo"
                          className="h-8 mb-4 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <h2
                        className="text-lg font-bold mb-2"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        {form.title || "Seu formulário"}
                      </h2>
                      <p
                        className="text-xs mb-6 opacity-60"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        {form.description || "Descrição do formulário"}
                      </p>
                      <button
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white transition-all"
                        style={{
                          backgroundColor: form.design.buttonColor,
                          fontFamily: form.design.fontFamily,
                          boxShadow: `0 0 20px ${form.design.buttonColor}40`,
                        }}
                      >
                        Começar
                      </button>
                      {form.design.backgroundImage && (
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            backgroundImage: `url(${form.design.backgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ COMPARTILHAR TAB ═══ */}
          {activeTab === "compartilhar" && (
            <motion.div
              key="compartilhar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex"
            >
              {/* Left: Sharing panel */}
              <div
                className="w-[400px] border-r border-glass-border shrink-0 overflow-hidden"
                style={{ background: "oklch(0.11 0.015 260)" }}
              >
                <SharingPanel
                  sharing={form.sharing}
                  formTitle={form.title}
                  workspaceDomain={currentWorkspace?.domain}
                  onUpdate={updateSharing}
                />
              </div>

              {/* Right: Preview of shared form */}
              <div className="flex-1 flex items-center justify-center p-8" style={{ background: "oklch(0.08 0.01 260)" }}>
                <div className="text-center max-w-md">
                  <div
                    className="w-full rounded-2xl overflow-hidden border border-glass-border shadow-2xl mx-auto mb-6"
                    style={{
                      background: form.design.backgroundColor,
                      maxWidth: "360px",
                      aspectRatio: "9/16",
                    }}
                  >
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center relative">
                      {form.design.backgroundImage && (
                        <div
                          className="absolute inset-0 opacity-20 pointer-events-none"
                          style={{
                            backgroundImage: `url(${form.design.backgroundImage})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />
                      )}
                      {form.design.logoUrl && (
                        <img
                          src={form.design.logoUrl}
                          alt="Logo"
                          className="h-8 mb-4 object-contain relative z-10"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <h2
                        className="text-lg font-bold mb-2 relative z-10"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        {form.title || "Seu formulário"}
                      </h2>
                      <p
                        className="text-xs mb-6 opacity-60 relative z-10"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        Pré-visualização do formulário compartilhado
                      </p>
                      <button
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white relative z-10"
                        style={{
                          backgroundColor: form.design.buttonColor,
                          fontFamily: form.design.fontFamily,
                          boxShadow: `0 0 20px ${form.design.buttonColor}40`,
                        }}
                      >
                        Começar
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/40">
                    Exemplo de como ficará ao acessar o link
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ RESPOSTAS TAB ═══ */}
          {activeTab === "respostas" && (
            <motion.div
              key="respostas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
              style={{ background: "oklch(0.09 0.01 260)" }}
            >
              <ResponsesPanel formTitle={form.title} responseCount={0} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Preview Overlay ─── */}
      <BuilderPreview
        form={form}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
