/**
 * FormFlow Builder — Preview Overlay
 * Design: Dark futuristic, glassmorphism, neon accents.
 * Renders the conversational form in a phone-like frame overlay.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Smartphone, Monitor } from "lucide-react";
import type { BuilderForm } from "@/lib/builderTypes";
import { builderToFormData } from "@/lib/builderToForm";
import { FormContainer } from "@/components/form/FormContainer";

interface BuilderPreviewProps {
  form: BuilderForm;
  isOpen: boolean;
  onClose: () => void;
}

export function BuilderPreview({ form, isOpen, onClose }: BuilderPreviewProps) {
  const formData = useMemo(() => builderToFormData(form), [form]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "oklch(0.05 0.01 260 / 0.9)", backdropFilter: "blur(20px)" }}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Preview container */}
          <motion.div
            className="relative w-full h-full flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Top bar */}
            <div
              className="h-12 flex items-center justify-between px-6 shrink-0 border-b"
              style={{
                background: "oklch(0.11 0.015 260)",
                borderColor: "oklch(1 0 0 / 0.06)",
              }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.7 0.2 30)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.8 0.15 90)" }} />
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: "oklch(0.7 0.2 150)" }} />
                </div>
                <span className="text-xs font-body text-muted-foreground/60 ml-2">
                  Preview — {form.title || "Formulário sem título"}
                </span>
              </div>

              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: "oklch(0.15 0.015 260)" }}
              >
                <X size={14} />
                Fechar
              </button>
            </div>

            {/* Form preview area — full screen */}
            <div className="flex-1 overflow-hidden">
              <FormContainer form={formData} key={JSON.stringify(formData)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
