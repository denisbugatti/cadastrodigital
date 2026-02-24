/**
 * FormFlow Builder — Preview Overlay (Light Theme)
 * Renders the conversational form in a full-screen preview.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
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
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Preview container */}
          <motion.div
            className="relative w-full h-full flex flex-col bg-white"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Top bar */}
            <div className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-border bg-white">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-sm font-body text-muted-foreground ml-2">
                  Preview — {form.title || "Formulário sem título"}
                </span>
              </div>

              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-body font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                <X size={16} />
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
