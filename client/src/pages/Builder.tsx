/**
 * FormFlow Builder Page — Light Clean Design
 * Fontes: Plus Jakarta Sans (display) + Inter (body)
 * Top navigation: Editor | Opções | Compartilhar | Respostas
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
    <div className="h-screen flex flex-col bg-background">
      {/* ─── Top Bar ─── */}
      <header className="border-b border-border shrink-0 bg-white">
        {/* Upper row: Logo + Title + Actions */}
        <div className="h-14 flex items-center justify-between px-5">
          {/* Left: Back + Form title */}
          <div className="flex items-center gap-3">
            <Link href="/">
              <motion.div
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft size={18} />
              </motion.div>
            </Link>

            <div className="w-px h-6 bg-border" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateFormMeta({ title: e.target.value })}
                className="bg-transparent text-base font-display font-bold text-foreground focus:outline-none border-b-2 border-transparent focus:border-brand/30 transition-colors px-1 py-0.5 max-w-[250px]"
                placeholder="Nome do formulário..."
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium text-muted-foreground hover:text-foreground border border-border hover:border-brand/30 hover:bg-brand-lighter/30 transition-all"
            >
              <Eye size={15} />
              Visualizar
            </button>

            <button
              onClick={() =>
                toast.success("Formulário salvo!", {
                  description: "Todas as alterações foram salvas.",
                })
              }
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-body font-semibold text-white bg-brand brand-shadow brand-shadow-hover hover:bg-brand-dark active:scale-[0.98] transition-all"
            >
              <Save size={15} />
              Salvar
            </button>
          </div>
        </div>

        {/* Lower row: Tab navigation */}
        <div className="flex items-center px-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-sm font-body font-medium transition-all ${
                  isActive
                    ? "text-brand"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon size={15} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full bg-brand"
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
          {/* EDITOR TAB */}
          {activeTab === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex"
            >
              <BuilderSidebar
                questions={form.questions}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={setSelectedQuestionId}
                onAddQuestion={addQuestion}
              />
              <BuilderCanvas
                questions={form.questions}
                selectedQuestionId={selectedQuestionId}
                onSelect={setSelectedQuestionId}
                onRemove={removeQuestion}
                onDuplicate={duplicateQuestion}
                onMove={moveQuestion}
              />
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

          {/* OPÇÕES TAB */}
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
              <div className="w-[360px] border-r border-border shrink-0 overflow-hidden bg-white">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                    <Settings size={15} className="text-brand" />
                    Configurações
                  </h3>
                </div>
                <DesignEditor design={form.design} onUpdate={updateDesign} />
              </div>

              {/* Center: Webhook + Workspace */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                <div className="max-w-2xl mx-auto p-8 space-y-6">
                  <div className="clean-card rounded-2xl overflow-hidden">
                    <WebhookPanel
                      webhook={form.webhook}
                      onUpdate={updateWebhook}
                    />
                  </div>

                  <div className="clean-card rounded-2xl p-5">
                    <WorkspaceManager
                      currentWorkspaceId={form.workspaceId}
                      onSelectWorkspace={(id) => {
                        updateFormMeta({ workspaceId: id });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Live preview mini */}
              <div className="w-[320px] border-l border-border shrink-0 flex flex-col bg-white">
                <div className="p-4 border-b border-border">
                  <h3 className="text-sm font-display font-bold text-foreground flex items-center gap-2">
                    <Eye size={15} className="text-brand" />
                    Pré-visualização
                  </h3>
                </div>
                <div className="flex-1 flex items-center justify-center p-5">
                  <div
                    className="w-full rounded-2xl overflow-hidden border border-border shadow-lg relative"
                    style={{
                      background: form.design.backgroundColor,
                      aspectRatio: "9/16",
                      maxHeight: "500px",
                    }}
                  >
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
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center relative z-10">
                      {form.design.logoUrl && (
                        <img
                          src={form.design.logoUrl}
                          alt="Logo"
                          className="h-10 mb-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <h2
                        className="text-xl font-bold mb-2"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        {form.title || "Seu formulário"}
                      </h2>
                      <p
                        className="text-sm mb-8 opacity-60"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        {form.description || "Descrição do formulário"}
                      </p>
                      <button
                        className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{
                          backgroundColor: form.design.buttonColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        Começar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* COMPARTILHAR TAB */}
          {activeTab === "compartilhar" && (
            <motion.div
              key="compartilhar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full flex"
            >
              <div className="w-[420px] border-r border-border shrink-0 overflow-hidden bg-white">
                <SharingPanel
                  sharing={form.sharing}
                  formTitle={form.title}
                  workspaceDomain={currentWorkspace?.domain}
                  onUpdate={updateSharing}
                />
              </div>

              <div className="flex-1 flex items-center justify-center p-8 bg-secondary/30">
                <div className="text-center max-w-md">
                  <div
                    className="w-full rounded-2xl overflow-hidden border border-border shadow-xl mx-auto mb-6 relative"
                    style={{
                      background: form.design.backgroundColor,
                      maxWidth: "360px",
                      aspectRatio: "9/16",
                    }}
                  >
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
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center relative z-10">
                      {form.design.logoUrl && (
                        <img
                          src={form.design.logoUrl}
                          alt="Logo"
                          className="h-10 mb-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      <h2
                        className="text-xl font-bold mb-2"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        {form.title || "Seu formulário"}
                      </h2>
                      <p
                        className="text-sm mb-8 opacity-60"
                        style={{
                          color: form.design.questionColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        Pré-visualização do formulário compartilhado
                      </p>
                      <button
                        className="px-8 py-3 rounded-xl text-sm font-semibold text-white"
                        style={{
                          backgroundColor: form.design.buttonColor,
                          fontFamily: form.design.fontFamily,
                        }}
                      >
                        Começar
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Exemplo de como ficará ao acessar o link
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* RESPOSTAS TAB */}
          {activeTab === "respostas" && (
            <motion.div
              key="respostas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full bg-background"
            >
              <ResponsesPanel formTitle={form.title} responseCount={0} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preview Overlay */}
      <BuilderPreview
        form={form}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  );
}
