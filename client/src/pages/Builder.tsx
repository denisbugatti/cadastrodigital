/**
 * FormFlow Builder — Typeform-style 3-Column Layout
 * Left: Question list sidebar
 * Center: Live preview of selected question (editable inline)
 * Right: Config panel (settings, media, logic)
 * Top: Tab bar (Content, Design, Share, Responses)
 * Features: Version history, export/import JSON
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Palette, Share2, BarChart3,
  FileText, Save, Cloud, Download, Upload, History,
  RotateCcw, Trash2, X, Clock, MoreVertical,
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
import { importFormFromJSON, type FormVersion } from "@/lib/formStorage";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BuilderTab = "content" | "design" | "compartilhar" | "respostas";

interface BuilderProps {
  initialForm?: import("@/lib/builderTypes").BuilderForm;
  dbFormId?: number;
}

export default function Builder({ initialForm, dbFormId }: BuilderProps) {
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    isSaved,
    lastSavedAt,
    saveNow,
    saveVersion,
    getHistory,
    restoreFromVersion,
    removeVersion,
    exportForm,
  } = useBuilder(initialForm, { dbFormId });

  const [activeTab, setActiveTab] = useState<BuilderTab>("content");
  const [showPreview, setShowPreview] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [versionHistory, setVersionHistory] = useState<FormVersion[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<FormVersion | null>(null);

  // Handle back navigation with unsaved changes guard
  const handleBack = useCallback(() => {
    if (!isSaved) {
      setShowUnsavedDialog(true);
    } else {
      navigate("/form");
    }
  }, [isSaved, navigate]);

  const handleDiscardAndLeave = useCallback(() => {
    setShowUnsavedDialog(false);
    navigate("/form");
  }, [navigate]);

  const handleSaveAndLeave = useCallback(() => {
    saveNow();
    setShowUnsavedDialog(false);
    navigate("/form");
  }, [saveNow, navigate]);

  // Version history
  const openHistory = useCallback(() => {
    setVersionHistory(getHistory());
    setShowHistoryPanel(true);
  }, [getHistory]);

  const handleSaveVersion = useCallback(() => {
    const label = `Versão manual — ${new Date().toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
    saveVersion(label);
    toast.success("Versão salva!", { description: "Um ponto de restauração foi criado." });
    setVersionHistory(getHistory());
  }, [saveVersion, getHistory]);

  const handleRestoreVersion = useCallback((version: FormVersion) => {
    setRestoreTarget(version);
  }, []);

  const confirmRestore = useCallback(() => {
    if (!restoreTarget) return;
    const restored = restoreFromVersion(restoreTarget.id);
    if (restored) {
      toast.success("Versão restaurada!", { description: `Restaurado para: ${restoreTarget.label}` });
      setVersionHistory(getHistory());
    } else {
      toast.error("Erro ao restaurar versão");
    }
    setRestoreTarget(null);
  }, [restoreTarget, restoreFromVersion, getHistory]);

  const handleDeleteVersion = useCallback((versionId: string) => {
    removeVersion(versionId);
    setVersionHistory(getHistory());
    toast.success("Versão removida");
  }, [removeVersion, getHistory]);

  // Import
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imported = await importFormFromJSON(file);
    if (imported) {
      toast.success("Formulário importado!", { description: `"${imported.title}" foi adicionado à sua lista.` });
    } else {
      toast.error("Erro ao importar", { description: "O arquivo não é um formulário FormFlow válido." });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

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
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* ─── Top Bar ─── */}
      <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left: Back + Form name */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
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

        {/* Right: Save + More menu + Preview + Publish */}
        <div className="flex items-center gap-2">
          {/* Save indicator */}
          <button
            onClick={() => {
              saveNow();
              toast.success("Formulário salvo!", { description: "Todas as alterações foram salvas." });
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              isSaved
                ? "text-green-600 bg-green-50 hover:bg-green-100"
                : "text-amber-600 bg-amber-50 hover:bg-amber-100 animate-pulse"
            }`}
          >
            {isSaved ? (
              <>
                <Cloud size={15} />
                Salvo
              </>
            ) : (
              <>
                <Save size={15} />
                Salvando...
              </>
            )}
          </button>

          {/* More actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-border shadow-lg w-56">
              <DropdownMenuItem onClick={handleSaveVersion}>
                <Save size={15} className="mr-2" />
                Criar ponto de restauração
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openHistory}>
                <History size={15} className="mr-2" />
                Histórico de versões
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportForm}>
                <Download size={15} className="mr-2" />
                Exportar como JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImportClick}>
                <Upload size={15} className="mr-2" />
                Importar formulário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

      {/* ─── Version History Side Panel ─── */}
      <AnimatePresence>
        {showHistoryPanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[60]"
              onClick={() => setShowHistoryPanel(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-[400px] bg-white border-l border-border shadow-2xl z-[61] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <History size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-foreground">Histórico de versões</h3>
                    <p className="text-xs text-muted-foreground">Últimas {versionHistory.length} versões salvas</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryPanel(false)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Save version button */}
              <div className="px-6 py-3 border-b border-border shrink-0">
                <button
                  onClick={handleSaveVersion}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-body font-semibold text-white bg-brand hover:bg-brand-dark transition-all brand-shadow"
                >
                  <Save size={15} />
                  Criar ponto de restauração
                </button>
              </div>

              {/* Version list */}
              <div className="flex-1 overflow-y-auto">
                {versionHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                      <Clock size={28} className="text-muted-foreground/40" />
                    </div>
                    <p className="text-base font-body font-medium text-foreground mb-1">Nenhuma versão salva</p>
                    <p className="text-sm text-muted-foreground">
                      Clique em "Criar ponto de restauração" para salvar o estado atual do formulário.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {versionHistory.map((version, index) => (
                      <div
                        key={version.id}
                        className="px-6 py-4 hover:bg-secondary/30 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${index === 0 ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                              <span className="text-sm font-body font-semibold text-foreground line-clamp-1">
                                {version.label}
                              </span>
                              {index === 0 && (
                                <span className="text-[10px] font-body font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md uppercase">
                                  Mais recente
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground ml-4.5">
                              {new Date(version.savedAt).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground/70 ml-4.5 mt-0.5">
                              {version.data.questions.length} perguntas
                            </p>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleRestoreVersion(version)}
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Restaurar esta versão"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteVersion(version.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Excluir esta versão"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer info */}
              <div className="px-6 py-3 border-t border-border bg-secondary/30 shrink-0">
                <p className="text-xs text-muted-foreground text-center">
                  Máximo de 5 versões. Versões mais antigas são removidas automaticamente.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterações não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações que ainda não foram salvas. O que deseja fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              Continuar editando
            </AlertDialogCancel>
            <button
              onClick={handleDiscardAndLeave}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Descartar e sair
            </button>
            <button
              onClick={handleSaveAndLeave}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-brand text-white hover:bg-brand-dark transition-colors"
            >
              Salvar e sair
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Version Confirmation Dialog */}
      <AlertDialog open={!!restoreTarget} onOpenChange={(open) => !open && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar versão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja restaurar o formulário para a versão{" "}
              <span className="font-semibold text-foreground">"{restoreTarget?.label}"</span>?
              <span className="block mt-2 text-sm">
                O estado atual será substituído. Considere criar um ponto de restauração antes.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <button
              onClick={confirmRestore}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-brand text-white hover:bg-brand-dark transition-colors gap-1.5"
            >
              <RotateCcw size={14} />
              Restaurar
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
