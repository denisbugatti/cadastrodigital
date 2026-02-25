/**
 * FormFlow Builder — Typeform-style 3-Column Layout
 * Left: Question list sidebar
 * Center: Live preview of selected question (editable inline)
 * Right: Config panel (settings, media, logic)
 * Top: Tab bar (Content, Design, Share, Responses)
 */

import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Palette, Share2, BarChart3,
  FileText,
} from "lucide-react";
import { useBuilder } from "@/hooks/useBuilder";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderConfigPanel } from "@/components/builder/BuilderConfigPanel";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { DesignEditor as DesignPanel } from "@/components/builder/DesignEditor";
import { SharingPanel } from "@/components/builder/SharingPanel";
import { ResponsesPanel } from "@/components/builder/ResponsesPanel";
import { BuilderLivePreview } from "@/components/builder/BuilderLivePreview";
import { WebhookPanel } from "@/components/builder/WebhookPanel";

import { toast } from "sonner";

type BuilderTab = "content" | "design" | "compartilhar" | "respostas";

interface BuilderProps {
  initialForm?: import("@/lib/builderTypes").BuilderForm;
}

export default function Builder({ initialForm }: BuilderProps) {
  const [, navigate] = useLocation();

  const {
    form,
    selectedQuestion,
    selectedQuestionId,
    setSelectedQuestionId,
    addQuestion,
    removeQuestion,
    duplicateQuestion,
    reorderQuestions,
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
  } = useBuilder(initialForm);

  const [activeTab, setActiveTab] = useState<BuilderTab>("content");
  const [showPreview, setShowPreview] = useState(false);


  const conditionalTargets = useMemo(
    () => (selectedQuestionId ? getConditionalTargets(selectedQuestionId) : []),
    [selectedQuestionId, getConditionalTargets]
  );

  const tabs: { id: BuilderTab; label: string; icon: typeof FileText }[] = [
    { id: "content", label: "Conteúdo", icon: FileText },
    { id: "design", label: "Design", icon: Palette },
    { id: "compartilhar", label: "Compartilhar", icon: Share2 },
    { id: "respostas", label: "Respostas", icon: BarChart3 },
  ];

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left: Back + Form name */}
        <div className="flex items-center gap-3">
          <Link href="/form">
            <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="h-5 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 7.5H12M6 10.5H9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
              </svg>
            </div>
            <span className="font-display text-sm font-bold text-foreground truncate max-w-[200px]">
              {form.title || "Novo formulário"}
            </span>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav className="flex items-center gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
                  isActive
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <TabIcon size={15} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Preview + Publish */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <Play size={15} />
            Visualizar
          </button>
          <button
            onClick={() => toast.info("Publicação", { description: "Use o botão Publish na interface de gerenciamento." })}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-body font-semibold text-white bg-brand hover:bg-brand-dark transition-all brand-shadow"
          >
            Publicar
          </button>
        </div>
      </header>

      {/* ─── Main Content Area ─── */}
      <div className="flex-1 flex overflow-hidden">
        <AnimatePresence mode="wait">
          {/* CONTENT TAB — 3 columns: sidebar | preview | config */}
          {activeTab === "content" && (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex h-full"
            >
              {/* Left: Question sidebar */}
              <BuilderSidebar
                questions={form.questions}
                selectedQuestionId={selectedQuestionId}
                onSelectQuestion={setSelectedQuestionId}
                onAddQuestion={addQuestion}
                onDuplicateQuestion={duplicateQuestion}
                onRemoveQuestion={removeQuestion}
                onReorderQuestions={reorderQuestions}
              />

              {/* Center: Live preview of selected question */}
              <div className="flex-1 h-full overflow-hidden">
                <BuilderLivePreview
                  question={selectedQuestion}
                  design={form.design}
                  questionNumber={(() => {
                    if (!selectedQuestion) return 0;
                    const actual = form.questions.filter(
                      (q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement" && q.type !== "legal"
                    );
                    const idx = actual.findIndex((q) => q.id === selectedQuestion.id);
                    return idx >= 0 ? idx + 1 : 0;
                  })()}
                  totalQuestions={form.questions.filter(
                    (q) => q.type !== "welcome" && q.type !== "thank-you" && q.type !== "statement" && q.type !== "legal"
                  ).length}
                  onUpdateTitle={(title: string) => {
                    if (selectedQuestion) updateQuestion(selectedQuestion.id, { title });
                  }}
                  onUpdateSubtitle={(subtitle: string) => {
                    if (selectedQuestion) updateQuestion(selectedQuestion.id, { subtitle });
                  }}
                />
              </div>

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

          {/* DESIGN TAB */}
          {activeTab === "design" && (
            <motion.div
              key="design"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex h-full"
            >
              <div className="w-[420px] border-r border-border shrink-0 overflow-hidden bg-white">
                <DesignPanel design={form.design} onUpdate={updateDesign} />
              </div>

              <div className="flex-1 flex items-center justify-center p-8 bg-secondary/30">
                <div
                  className="w-full rounded-2xl overflow-hidden border border-border shadow-xl mx-auto relative"
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
              className="flex-1 flex h-full"
            >
              <div className="w-[420px] border-r border-border shrink-0 overflow-hidden bg-white overflow-y-auto">
                <SharingPanel
                  sharing={form.sharing}
                  formTitle={form.title}
                  workspaceDomain={undefined}
                  onUpdate={updateSharing}
                />
                <div className="border-t border-border">
                  <WebhookPanel
                    webhook={form.webhook}
                    formTitle={form.title}
                    onUpdate={updateWebhook}
                  />
                </div>
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
              className="flex-1 h-full bg-background"
            >
              <ResponsesPanel formTitle={form.title} responseCount={0} questions={form.questions} />
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
