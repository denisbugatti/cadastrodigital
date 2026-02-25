/**
 * FormFlow Builder — Preview Overlay
 * Full-screen preview with desktop/mobile toggle, phone frame, ESC support.
 */

import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Monitor, Smartphone } from "lucide-react";
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

            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                  viewMode === "desktop"
                    ? "bg-gray-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Monitor size={14} />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
                  viewMode === "mobile"
                    ? "bg-gray-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                <Smartphone size={14} />
                <span className="hidden sm:inline">Mobile</span>
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
            className={`flex-1 overflow-hidden flex items-center justify-center transition-colors duration-300 ${
              viewMode === "mobile" ? "bg-gray-200" : "bg-gray-100"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence mode="wait">
              {viewMode === "desktop" ? (
                <motion.div
                  key="desktop"
                  className="w-full h-full bg-white overflow-hidden"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <FormContainer form={formData} key={JSON.stringify(formData) + "desktop"} />
                </motion.div>
              ) : (
                <motion.div
                  key="mobile"
                  className="relative"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                >
                  {/* Phone frame */}
                  <div className="relative w-[390px] h-[calc(100vh-120px)] max-h-[844px] bg-black rounded-[3rem] p-[12px] shadow-2xl">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-2xl z-10" />
                    {/* Side buttons */}
                    <div className="absolute -left-[3px] top-[120px] w-[3px] h-[30px] bg-gray-700 rounded-l-sm" />
                    <div className="absolute -left-[3px] top-[170px] w-[3px] h-[55px] bg-gray-700 rounded-l-sm" />
                    <div className="absolute -left-[3px] top-[235px] w-[3px] h-[55px] bg-gray-700 rounded-l-sm" />
                    <div className="absolute -right-[3px] top-[160px] w-[3px] h-[70px] bg-gray-700 rounded-r-sm" />
                    {/* Screen */}
                    <div className="w-full h-full bg-white rounded-[2.4rem] overflow-hidden">
                      <FormContainer form={formData} key={JSON.stringify(formData) + "mobile"} />
                    </div>
                    {/* Home indicator */}
                    <div className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-gray-600 rounded-full" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
