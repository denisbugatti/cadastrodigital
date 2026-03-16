/**
 * FormFlow File Upload Input — Real S3 upload via tRPC (public endpoint)
 * Supports multiple file uploads with persistent previews.
 * Stores JSON array of { url, filename, mimeType } as the answer value.
 */

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  X,
  Loader2,
  Image as ImageIcon,
  Plus,
  CheckCircle2,
} from "lucide-react";
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

/** Parse value — supports both single object (legacy) and array format */
function parseFileValues(value: string): FileValue[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (f: any) => f && typeof f === "object" && (f.url || f.filename)
      );
    }
    if (parsed && typeof parsed === "object" && (parsed.url || parsed.filename)) {
      return [parsed as FileValue];
    }
  } catch {
    // Legacy filename-only value
    if (value && !value.startsWith("{") && !value.startsWith("[")) {
      return [{ url: "", filename: value, mimeType: "" }];
    }
  }
  return [];
}

function isImageMime(mime: string): boolean {
  return mime.startsWith("image/");
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadInput({
  value,
  onChange,
  error,
}: FileUploadInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.files.publicUpload.useMutation();

  const files = parseFileValues(value);

  const updateFiles = useCallback(
    (newFiles: FileValue[]) => {
      if (newFiles.length === 0) {
        onChange("");
      } else if (newFiles.length === 1) {
        // Keep single-file backward compatibility
        onChange(JSON.stringify(newFiles[0]));
      } else {
        onChange(JSON.stringify(newFiles));
      }
    },
    [onChange]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (file.size > 10 * 1024 * 1024) {
        alert("Arquivo muito grande. Máximo: 10MB");
        return;
      }

      setUploading(true);
      setUploadProgress(`Enviando ${file.name}...`);

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

        const newFile: FileValue = {
          url: result.url,
          filename: file.name,
          mimeType: file.type,
        };

        // Add to existing files
        const currentFiles = parseFileValues(value);
        updateFiles([...currentFiles, newFile]);
      } catch (err) {
        console.error("Upload failed:", err);
        alert("Erro ao fazer upload. Tente novamente.");
      } finally {
        setUploading(false);
        setUploadProgress("");
        // Reset input so same file can be re-selected
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [uploadMutation, value, updateFiles]
  );

  const handleMultipleFiles = useCallback(
    async (fileList: FileList) => {
      for (let i = 0; i < fileList.length; i++) {
        await handleFile(fileList[i]);
      }
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleMultipleFiles(e.dataTransfer.files);
      }
    },
    [handleMultipleFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleMultipleFiles(e.target.files);
      }
    },
    [handleMultipleFiles]
  );

  const removeFile = useCallback(
    (index: number) => {
      const currentFiles = parseFileValues(value);
      const newFiles = currentFiles.filter((_, i) => i !== index);
      updateFiles(newFiles);
    },
    [value, updateFiles]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-3"
    >
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        className="hidden"
        id="file-upload"
        disabled={uploading}
        multiple
      />

      {/* ─── Uploaded files list with previews ─── */}
      <AnimatePresence>
        {files.map((file, index) => (
          <motion.div
            key={`${file.filename}-${index}`}
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: "rgba(52,211,153,0.4)",
              backgroundColor: "rgba(52,211,153,0.06)",
            }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {/* Image preview */}
            {file.url && isImageMime(file.mimeType) && (
              <div className="w-full max-h-40 overflow-hidden flex items-center justify-center bg-black/10">
                <img
                  src={file.url}
                  alt={file.filename}
                  className="max-w-full max-h-40 object-contain"
                />
              </div>
            )}

            {/* PDF preview indicator */}
            {file.url && file.mimeType === "application/pdf" && (
              <div className="w-full h-12 flex items-center justify-center bg-black/10">
                <FileText size={20} className="text-emerald-400 mr-2" />
                <span className="text-xs opacity-60">Documento PDF</span>
              </div>
            )}

            <div className="px-4 py-3 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "rgba(52,211,153,0.15)" }}
              >
                {isImageMime(file.mimeType) ? (
                  <ImageIcon size={16} className="text-emerald-400" />
                ) : (
                  <FileText size={16} className="text-emerald-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.filename}</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <p className="text-xs opacity-50">Enviado com sucesso</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                type="button"
              >
                <X size={16} className="opacity-50 hover:opacity-80" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ─── Upload zone (always visible) ─── */}
      {uploading ? (
        <motion.div
          className="rounded-xl border p-6 flex flex-col items-center gap-3"
          style={{
            borderColor: "rgba(59,130,246,0.4)",
            backgroundColor: "rgba(59,130,246,0.06)",
          }}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <Loader2 size={28} className="animate-spin opacity-60" />
          <p className="text-sm opacity-70">{uploadProgress}</p>
        </motion.div>
      ) : (
        <motion.label
          htmlFor="file-upload"
          className={`rounded-xl border-dashed flex items-center gap-4 cursor-pointer transition-all duration-300 ${
            files.length > 0 ? "p-4" : "p-8 flex-col"
          }`}
          style={{
            borderWidth: files.length > 0 ? "2px" : "7px",
            borderColor: isDragging
              ? "currentColor"
              : "rgba(128,128,128,0.3)",
            backgroundColor: isDragging
              ? "rgba(128,128,128,0.06)"
              : "transparent",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {files.length > 0 ? (
            /* Compact add-more button when files already exist */
            <>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                style={{
                  borderColor: "rgba(128,128,128,0.2)",
                  backgroundColor: "rgba(128,128,128,0.06)",
                }}
              >
                <Plus size={20} className="opacity-60" />
              </div>
              <div>
                <p className="text-sm opacity-80">
                  Adicionar mais arquivos
                </p>
                <p className="text-xs opacity-40">
                  PDF, DOC, PNG, JPG até 10MB cada
                </p>
              </div>
            </>
          ) : (
            /* Full drop zone when no files yet */
            <>
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
                  Arraste um arquivo ou{" "}
                  <span className="font-medium underline underline-offset-2">
                    clique para selecionar
                  </span>
                </p>
                <p className="mt-2 text-sm opacity-40">
                  PDF, DOC, PNG, JPG até 10MB
                </p>
              </div>
            </>
          )}
        </motion.label>
      )}

      {error && (
        <motion.p
          className="text-sm font-medium"
          style={{ color: "#fca5a5" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
