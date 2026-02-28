/**
 * FormFlow File Upload Input — Adaptive colors for any background
 */

import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function FileUploadInput({ value, onChange, error }: FileUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState(value || "");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => { setFileName(file.name); onChange(file.name); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]); };
  const clearFile = () => { setFileName(""); onChange(""); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <input ref={inputRef} type="file" onChange={handleChange} className="hidden" id="file-upload" />
      {!fileName ? (
        <motion.label
          htmlFor="file-upload"
          className="rounded-xl border-2 border-dashed p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300"
          style={{
            borderColor: isDragging ? "currentColor" : "rgba(128,128,128,0.3)",
            backgroundColor: isDragging ? "rgba(128,128,128,0.06)" : "transparent",
          }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center border"
            style={{
              borderColor: "rgba(128,128,128,0.2)",
              backgroundColor: "rgba(128,128,128,0.06)",
            }}
          >
            <Upload size={24} className="opacity-60" />
          </div>
          <div className="text-center">
            <p className="text-base opacity-80">
              Arraste um arquivo ou <span className="font-medium underline underline-offset-2">clique para selecionar</span>
            </p>
            <p className="mt-2 text-sm opacity-40">PDF, DOC, PNG, JPG até 10MB</p>
          </div>
        </motion.label>
      ) : (
        <motion.div
          className="rounded-xl border p-4 flex items-center gap-4"
          style={{
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.08)",
          }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "rgba(52,211,153,0.15)" }}
          >
            <FileText size={18} className="text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName}</p>
            <p className="text-xs opacity-50">Arquivo selecionado</p>
          </div>
          <button
            onClick={clearFile}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          >
            <X size={16} className="opacity-50" />
          </button>
        </motion.div>
      )}
      {error && (
        <motion.p className="text-sm font-medium" style={{ color: "#fca5a5" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
