/**
 * FormFlow Responses Panel
 * Design: Dark futuristic with glassmorphism.
 * Shows form responses (empty state for now, since no backend).
 */

import { motion } from "framer-motion";
import { ClipboardList, Share2 } from "lucide-react";

interface ResponsesPanelProps {
  formTitle: string;
  responseCount: number;
}

export function ResponsesPanel({ formTitle, responseCount }: ResponsesPanelProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-sm"
      >
        {/* Illustration */}
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{
            background: "oklch(0.15 0.02 250)",
            border: "1px solid oklch(0.25 0.03 250 / 0.3)",
          }}
        >
          <ClipboardList size={36} className="text-neon-blue/40" />
        </div>

        <h3 className="text-base font-display font-bold text-foreground mb-2">
          {responseCount === 0
            ? "Este formulário ainda não tem respostas."
            : `${responseCount} respostas recebidas`}
        </h3>

        {responseCount === 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-6">
              Compartilhe para começar a receber respostas.
            </p>

            <button
              onClick={() => {
                // This would switch to sharing tab in real implementation
                const event = new CustomEvent("switch-tab", { detail: "compartilhar" });
                window.dispatchEvent(event);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-body font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.55 0.25 270))",
                boxShadow: "0 0 20px oklch(0.65 0.2 250 / 0.3)",
              }}
            >
              <Share2 size={14} />
              Compartilhar
            </button>
          </>
        )}

        {responseCount > 0 && (
          <p className="text-xs text-muted-foreground">
            A visualização detalhada de respostas estará disponível em breve.
          </p>
        )}
      </motion.div>
    </div>
  );
}
