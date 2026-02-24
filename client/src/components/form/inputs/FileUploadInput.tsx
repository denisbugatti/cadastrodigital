/**
 * FormFlow — Dark Futuristic Design
 * File upload input with drag & drop and glassmorphism.
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

  const handleFile = (file: File) => {
    setFileName(file.name);
    onChange(file.name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setFileName("");
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        id="file-upload"
      />

      {!fileName ? (
        <motion.label
          htmlFor="file-upload"
          className="glass-card rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300"
          style={isDragging ? {
            borderColor: "oklch(0.65 0.2 250 / 0.5)",
            boxShadow: "0 0 30px oklch(0.65 0.2 250 / 0.15)",
          } : {}}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "oklch(0.65 0.2 250 / 0.1)",
              border: "1.5px solid oklch(0.65 0.2 250 / 0.2)",
            }}
          >
            <Upload size={24} className="text-neon-blue" />
          </div>
          <div className="text-center">
            <p className="text-base font-body text-foreground/80">
              Arraste um arquivo ou <span className="text-neon-blue font-medium">clique para selecionar</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground/40 font-body">
              PDF, DOC, PNG, JPG até 10MB
            </p>
          </div>
        </motion.label>
      ) : (
        <motion.div
          className="glass-card rounded-2xl p-4 flex items-center gap-4"
          style={{ borderColor: "oklch(0.65 0.18 150 / 0.3)" }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "oklch(0.65 0.18 150 / 0.1)", border: "1px solid oklch(0.65 0.18 150 / 0.2)" }}
          >
            <FileText size={18} style={{ color: "oklch(0.65 0.18 150)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body text-foreground truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground/40 font-body">Arquivo selecionado</p>
          </div>
          <button
            onClick={clearFile}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} className="text-muted-foreground/50" />
          </button>
        </motion.div>
      )}

      {error && (
        <motion.p className="mt-3 text-sm font-body" style={{ color: "oklch(0.6 0.22 25)" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
