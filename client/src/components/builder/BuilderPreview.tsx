/**
 * FormFlow Builder — Preview Overlay
 * Full-screen preview with prominent close button, ESC support, mobile-friendly.
 */

import { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Smartphone } from "lucide-react";
import { useState } from "react";
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
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex flex-col bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Top bar */}
          <motion.div
            className="h-12 sm:h-14 flex items-center justify-between px-4 sm:px-6 shrink-0 bg-gray-900 text-white z-[102] relative"
            initial={{ y: -56 }}
            animate={{ y: 0 }}
            exit={{ y: -56 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>
              <span className="text-xs sm:text-sm font-body text-gray-400 sm:ml-2 truncate max-w-[200px] sm:max-w-none">
                Preview — {form.title || "Formulário sem título"}
              </span>
            </div>

            {/* View mode toggle (desktop only) */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "desktop" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "mobile" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
              >
                <Smartphone size={16} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-body font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-all"
            >
              <X size={16} />
              <span className="hidden sm:inline">Fechar</span>
              <kbd className="hidden sm:inline px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] font-mono text-gray-500 ml-1">
                ESC
              </kbd>
            </button>
          </motion.div>

          {/* Preview container */}
          <motion.div
            className="flex-1 overflow-hidden bg-gray-100 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div
              className={`h-full bg-white transition-all duration-300 overflow-hidden ${
                viewMode === "mobile"
                  ? "w-[375px] rounded-2xl shadow-2xl my-4 max-h-[calc(100vh-80px)]"
                  : "w-full"
              }`}
            >
              <FormContainer form={formData} key={JSON.stringify(formData) + viewMode} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
