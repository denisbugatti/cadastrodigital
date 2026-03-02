/**
 * FormFlow File Upload Input — Real S3 upload via tRPC
 * Uploads file to S3 and stores { url, filename, mimeType } as the answer value
 */

import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2, Image as ImageIcon, FileIcon } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FileUploadInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

interface FileValue {
  url: string;
  filename: string;
  mimeType: string;
}

function parseFileValue(value: string): FileValue | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object" && parsed.url) {
      return parsed as FileValue;
    }
  } catch {
    // Not JSON — might be a legacy filename-only value
    if (value && !value.startsWith("{")) {
      return { url: "", filename: value, mimeType: "" };
    }
  }
  return null;
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

export function FileUploadInput({ value, onChange, error }: FileUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.files.upload.useMutation();

  const fileValue = parseFileValue(value);

  const handleFile = useCallback(async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 10MB");
      return;
    }

    setUploading(true);
    setUploadProgress("Enviando...");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setUploadProgress("Salvando...");

      const result = await uploadMutation.mutateAsync({
        filename: file.name,
        contentBase64: base64,
        mimeType: file.type,
        context: "form-response",
      });

      // Save as JSON object with url, filename, mimeType
      const fileData: FileValue = {
        url: result.url,
        filename: file.name,
        mimeType: file.type,
      };
      onChange(JSON.stringify(fileData));
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Erro ao fazer upload. Tente novamente.");
    } finally {
      setUploading(false);
      setUploadProgress("");
    }
  }, [uploadMutation, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  }, [handleFile]);

  const clearFile = useCallback(() => {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }, [onChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-4"
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        id="file-upload"
        disabled={uploading}
      />

      {uploading ? (
        /* Upload in progress */
        <motion.div
          className="rounded-xl border p-8 flex flex-col items-center gap-4"
          style={{
            borderColor: "rgba(59,130,246,0.4)",
            backgroundColor: "rgba(59,130,246,0.06)",
          }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <Loader2 size={32} className="animate-spin opacity-60" />
          <p className="text-sm opacity-70">{uploadProgress}</p>
        </motion.div>
      ) : !fileValue ? (
        /* No file selected — show drop zone */
        <motion.label
          htmlFor="file-upload"
          className="rounded-xl border-dashed p-8 flex flex-col items-center gap-4 cursor-pointer transition-all duration-300"
          style={{
            borderWidth: "7px",
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
        /* File uploaded — show preview */
        <motion.div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: "#34d399",
            backgroundColor: "rgba(52,211,153,0.08)",
          }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          {/* Image preview */}
          {fileValue.url && isImageMime(fileValue.mimeType) && (
            <div className="w-full max-h-48 overflow-hidden flex items-center justify-center bg-black/5">
              <img
                src={fileValue.url}
                alt={fileValue.filename}
                className="max-w-full max-h-48 object-contain"
              />
            </div>
          )}

          <div className="p-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "rgba(52,211,153,0.15)" }}
            >
              {isImageMime(fileValue.mimeType) ? (
                <ImageIcon size={18} className="text-emerald-400" />
              ) : (
                <FileText size={18} className="text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{fileValue.filename}</p>
              <p className="text-xs opacity-50">
                {fileValue.url ? "Arquivo enviado com sucesso" : "Arquivo selecionado"}
              </p>
            </div>
            <button
              onClick={clearFile}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <X size={16} className="opacity-50" />
            </button>
          </div>
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
