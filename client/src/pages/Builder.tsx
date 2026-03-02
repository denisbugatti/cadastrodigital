/**
 * FormFlow Builder — Typeform-style 3-Column Layout
 * Left: Question list sidebar
 * Center: Live preview of selected question (editable inline)
 * Right: Config panel (settings, media, logic)
 * Top: Tab bar (Content, Design, Share, Responses)
 * Features: Version history, export/import JSON
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, Palette, Share2, BarChart3,
  FileText, Save, Cloud, Download, Upload, History,
  RotateCcw, Trash2, X, Clock, MoreVertical, Loader2, CheckCircle, Hash,
  List, Settings2, PanelLeftClose,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBuilder } from "@/hooks/useBuilder";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderConfigPanel } from "@/components/builder/BuilderConfigPanel";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { DesignEditor as DesignPanel } from "@/components/builder/DesignEditor";
import { SharingPanel } from "@/components/builder/SharingPanel";
import { ResponsesPanel } from "@/components/builder/ResponsesPanel";
import { BuilderLivePreview } from "@/components/builder/BuilderLivePreview";
import { WebhookPanel } from "@/components/builder/WebhookPanel";
import { ScoringPanel } from "@/components/builder/ScoringPanel";
import { importFormFromJSON, type FormVersion } from "@/lib/formStorage";
import { trpc } from "@/lib/trpc";

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
    publishForm,
    unpublishForm,
    dbFormId: currentDbFormId,
  } = useBuilder(initialForm, { dbFormId });

  const [activeTab, setActiveTab] = useState<BuilderTab>("content");
  const [showPreview, setShowPreview] = useState(false);
  const [showScoringPanel, setShowScoringPanel] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [versionHistory, setVersionHistory] = useState<FormVersion[]>([]);
  const [restoreTarget, setRestoreTarget] = useState<FormVersion | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileConfigOpen, setMobileConfigOpen] = useState(false);

  // Check publish status from form data
  const formStatusQuery = trpc.forms.getById.useQuery(
    { id: currentDbFormId! },
    { enabled: !!currentDbFormId, staleTime: 10000 }
  );

  useEffect(() => {
    if (formStatusQuery.data) {
      setIsPublished(formStatusQuery.data.status === "published");
    }
  }, [formStatusQuery.data]);

  const handlePublish = useCallback(async () => {
    setIsPublishing(true);
    try {
      if (isPublished) {
        const success = await unpublishForm();
        if (success) {
          setIsPublished(false);
          toast.success("Formulário despublicado", { description: "O formulário voltou para rascunho." });
        } else {
          toast.error("Erro ao despublicar", { description: "Salve o formulário primeiro." });
        }
      } else {
        // Save first, then publish
        saveNow();
        const success = await publishForm();
        if (success) {
          setIsPublished(true);
          toast.success("Formulário publicado!", { description: "Seu formulário está ativo e recebendo respostas." });
        } else {
          toast.error("Erro ao publicar", { description: "Salve o formulário primeiro e tente novamente." });
        }
      }
    } finally {
      setIsPublishing(false);
    }
  }, [isPublished, publishForm, unpublishForm, saveNow]);

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
      toast.error("Erro ao importar", { description: "O arquivo não é um formulário Cadastro Digital válido." });
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
      <header className="h-12 sm:h-14 border-b border-border bg-background flex items-center justify-between px-2 sm:px-4 shrink-0 z-50">
        {/* Left: Back + Form name */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={handleBack}
            className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2 hidden sm:flex">
            <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M6 7.5H12M6 10.5H9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
              </svg>
            </div>
            <span className="font-display text-sm font-bold text-foreground truncate max-w-[120px] lg:max-w-[200px]">
              {form.title || "Novo formulário"}
            </span>
          </div>
        </div>

        {/* Center: Tabs */}
        <nav className="flex items-center gap-0.5 sm:gap-1">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-all ${
                  isActive
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <TabIcon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Save + More menu + Preview + Publish */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Save indicator */}
          <button
            onClick={() => {
              saveNow();
              toast.success("Formulário salvo!", { description: "Todas as alterações foram salvas." });
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-body font-medium transition-all ${
              isSaved
                ? "text-green-600 bg-green-500/10 hover:bg-green-500/20"
                : "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 animate-pulse"
            }`}
          >
            {isSaved ? (
              <>
                <Cloud size={15} />
                <span className="hidden sm:inline">Salvo</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span className="hidden sm:inline">Salvando...</span>
              </>
            )}
          </button>

          {/* More actions menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <MoreVertical size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border shadow-lg w-56">
              <DropdownMenuItem onClick={handleSaveVersion}>
                <Save size={15} className="mr-2" />
                Criar ponto de restauração
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openHistory}>
                <History size={15} className="mr-2" />
                Histórico de versões
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowScoringPanel(true)}>
                <Hash size={15} className="mr-2" />
                Pontuação
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
            className="flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            <Play size={15} />
            <span className="hidden md:inline">Visualizar</span>
          </button>
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-body font-semibold transition-all ${
              isPublished
                ? "text-green-600 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30"
                : "text-white bg-brand hover:bg-brand-dark brand-shadow"
            } ${isPublishing ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isPublishing ? (
              <><Loader2 size={15} className="animate-spin" /> <span className="hidden sm:inline">{isPublished ? "Despublicando..." : "Publicando..."}</span></>
            ) : isPublished ? (
              <><CheckCircle size={15} /> <span className="hidden sm:inline">Publicado</span></>
            ) : (
              <><span className="hidden sm:inline">Publicar</span><span className="sm:hidden">Pub.</span></>
            )}
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
              {/* Left: Question sidebar - hidden on mobile */}
              <div className="hidden md:block">
                <BuilderSidebar
                  questions={form.questions}
                  selectedQuestionId={selectedQuestionId}
                  onSelectQuestion={setSelectedQuestionId}
                  onAddQuestion={addQuestion}
                  onDuplicateQuestion={duplicateQuestion}
                  onRemoveQuestion={removeQuestion}
                  onReorderQuestions={reorderQuestions}
                />
              </div>

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

              {/* Right: Config panel - hidden on mobile */}
              <div className="hidden lg:block">
                <BuilderConfigPanel
                  question={selectedQuestion}
                  onUpdate={updateQuestion}
                  onAddChoice={addChoice}
                  onUpdateChoice={updateChoice}
                  onRemoveChoice={removeChoice}
                  conditionalTargets={conditionalTargets}
                />
              </div>
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
              className="flex-1 flex flex-col md:flex-row h-full"
            >
              <div className="w-full md:w-[420px] border-b md:border-b-0 md:border-r border-border shrink-0 overflow-y-auto bg-background max-h-[50vh] md:max-h-none">
                <DesignPanel design={form.design} onUpdate={updateDesign} />
              </div>

              <div className="hidden md:flex flex-1 items-center justify-center p-4 md:p-8 bg-secondary/30">
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
                        fontFamily: form.design.fontFamily, color: '#0d8bd9',
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
              className="flex-1 flex flex-col md:flex-row h-full"
            >
              <div className="w-full md:w-[420px] border-b md:border-b-0 md:border-r border-border shrink-0 overflow-y-auto bg-background max-h-[50vh] md:max-h-none">
                <SharingPanel
                  sharing={form.sharing}
                  formTitle={form.title}
                  formId={currentDbFormId}
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

              <div className="hidden md:flex flex-1 items-center justify-center p-4 md:p-8 bg-secondary/30">
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
              <ResponsesPanel formTitle={form.title} responseCount={0} questions={form.questions} formId={currentDbFormId} />
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
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background border-l border-border shadow-2xl z-[61] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 size={18} className="text-blue-600" />
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
                                <span className="text-[10px] font-body font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-md uppercase">
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
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-500/10 transition-colors"
                              title="Restaurar esta versão"
                            >
                              <RotateCcw size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteVersion(version.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
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

      {/* Scoring Panel */}
      <ScoringPanel
        open={showScoringPanel}
        onOpenChange={setShowScoringPanel}
        questions={form.questions}
        onUpdateQuestion={updateQuestion}
        onUpdateChoice={updateChoice}
      />

      {/* Mobile Bottom Bar - Content tab only */}
      {activeTab === "content" && (
        <div className="md:hidden flex items-center justify-around border-t border-border bg-background py-2 px-4 shrink-0 safe-area-bottom">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <List size={20} />
            <span className="text-[10px] font-body font-medium">Perguntas</span>
          </button>
          <button
            onClick={() => setMobileConfigOpen(true)}
            className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Settings2 size={20} />
            <span className="text-[10px] font-body font-medium">Configurar</span>
          </button>
        </div>
      )}

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[300px] sm:w-[340px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Perguntas</SheetTitle>
          </SheetHeader>
          <BuilderSidebar
            questions={form.questions}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={(id) => { setSelectedQuestionId(id); setMobileSidebarOpen(false); }}
            onAddQuestion={(type) => { addQuestion(type); setMobileSidebarOpen(false); }}
            onDuplicateQuestion={duplicateQuestion}
            onRemoveQuestion={removeQuestion}
            onReorderQuestions={reorderQuestions}
          />
        </SheetContent>
      </Sheet>

      {/* Mobile Config Sheet */}
      <Sheet open={mobileConfigOpen} onOpenChange={setMobileConfigOpen}>
        <SheetContent side="right" className="p-0 w-[340px] sm:w-[380px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Configurações</SheetTitle>
          </SheetHeader>
          <BuilderConfigPanel
            question={selectedQuestion}
            onUpdate={updateQuestion}
            onAddChoice={addChoice}
            onUpdateChoice={updateChoice}
            onRemoveChoice={removeChoice}
            conditionalTargets={conditionalTargets}
          />
        </SheetContent>
      </Sheet>

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
