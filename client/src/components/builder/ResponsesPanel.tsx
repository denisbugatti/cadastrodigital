/**
 * FormFlow Responses Panel (Light Theme)
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
    <div className="h-full flex flex-col items-center justify-center p-8 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Illustration */}
        <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-brand-lighter flex items-center justify-center">
          <ClipboardList size={44} className="text-brand/50" />
        </div>

        <h3 className="text-xl font-display font-bold text-foreground mb-3">
          {responseCount === 0
            ? "Este formulário ainda não tem respostas."
            : `${responseCount} respostas recebidas`}
        </h3>

        {responseCount === 0 && (
          <>
            <p className="text-base text-muted-foreground mb-8">
              Compartilhe para começar a receber respostas.
            </p>

            <button
              onClick={() => {
                const event = new CustomEvent("switch-tab", { detail: "compartilhar" });
                window.dispatchEvent(event);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-body font-semibold text-white bg-brand hover:bg-brand-dark transition-all shadow-sm"
            >
              <Share2 size={18} />
              Compartilhar
            </button>
          </>
        )}

        {responseCount > 0 && (
          <p className="text-base text-muted-foreground">
            A visualização detalhada de respostas estará disponível em breve.
          </p>
        )}
      </motion.div>
    </div>
  );
}
