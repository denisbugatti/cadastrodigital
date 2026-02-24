/**
 * FormFlow Builder Page
 * Design: Dark futuristic with glassmorphism, neon accents (blue/cyan).
 * Three-panel layout: Sidebar (types) | Canvas (flow) | Config (settings).
 * Includes preview overlay to test the conversational form.
 */

import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Zap, Eye, Save, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { BuilderConfigPanel } from "@/components/builder/BuilderConfigPanel";
import { BuilderPreview } from "@/components/builder/BuilderPreview";
import { useBuilder } from "@/hooks/useBuilder";

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
    addChoice,
    updateChoice,
    removeChoice,
    getConditionalTargets,
  } = useBuilder();

  const [showPreview, setShowPreview] = useState(false);

  const conditionalTargets = selectedQuestion
    ? getConditionalTargets(selectedQuestion.id)
    : [];

  // Check if form has at least one actual question (not welcome/thank-you)
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

  return (
    <div className="h-screen flex flex-col" style={{ background: "oklch(0.09 0.01 260)" }}>
      {/* ─── Top Bar ─── */}
      <header
        className="h-14 border-b border-glass-border flex items-center justify-between px-4 shrink-0"
        style={{ background: "oklch(0.11 0.015 260)" }}
      >
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

          <div className="w-px h-6 bg-glass-border" />

          <div className="flex items-center gap-2">
            <Zap size={16} className="text-neon-blue" />
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateFormMeta({ title: e.target.value })}
              className="bg-transparent text-sm font-display font-semibold text-foreground focus:outline-none border-b border-transparent focus:border-neon-blue/30 transition-colors px-1 py-0.5 max-w-[200px]"
              placeholder="Nome do formulário..."
            />
          </div>
        </div>

        {/* Center: Question count */}
        <div className="hidden md:flex items-center gap-4 text-[11px] font-body text-muted-foreground/50">
          <span>{form.questions.length} perguntas</span>
          <span>•</span>
          <span>Salvo automaticamente</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-body font-medium text-muted-foreground hover:text-foreground border border-glass-border hover:border-glass-hover transition-all"
            style={{ background: "oklch(0.14 0.015 260)" }}
          >
            <Eye size={13} />
            Preview
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
              boxShadow: "0 0 15px oklch(0.65 0.2 250 / 0.3)",
            }}
          >
            <Save size={13} />
            Salvar
          </button>
        </div>
      </header>

      {/* ─── Main Content: 3-panel layout ─── */}
      <div className="flex-1 flex overflow-hidden">
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
