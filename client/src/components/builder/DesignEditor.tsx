/**
 * FormFlow Design Editor (Light Theme)
 * Allows customizing colors, fonts, logo, background, and OG meta.
 * Supports file upload for logo, background image, and OG image via tRPC.
 */

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Palette, Type, Image, Globe, Upload, X, Loader2,
} from "lucide-react";
import type { FormDesignSettings } from "@/lib/builderTypes";
import { trpc } from "@/lib/trpc";

interface DesignEditorProps {
  design: FormDesignSettings;
  onUpdate: (updates: Partial<FormDesignSettings>) => void;
}

const fontOptions = [
  "Inter",
  "Plus Jakarta Sans",
  "Poppins",
  "DM Sans",
  "Roboto",
  "Montserrat",
  "Nunito",
  "Lato",
  "Open Sans",
  "Space Grotesk",
];

const presetPalettes = [
  { name: "Azul Moderno", buttonColor: "#3B82F6", buttonTextColor: "#FFFFFF", questionColor: "#1E293B", answerColor: "#3B82F6", backgroundColor: "#FFFFFF" },
  { name: "Esmeralda", buttonColor: "#10B981", buttonTextColor: "#FFFFFF", questionColor: "#1E293B", answerColor: "#10B981", backgroundColor: "#F0FDF4" },
  { name: "Sunset", buttonColor: "#F59E0B", buttonTextColor: "#FFFFFF", questionColor: "#292524", answerColor: "#D97706", backgroundColor: "#FFFBEB" },
  { name: "Rosa", buttonColor: "#F43F5E", buttonTextColor: "#FFFFFF", questionColor: "#1E293B", answerColor: "#F43F5E", backgroundColor: "#FFF1F2" },
  { name: "Roxo", buttonColor: "#8B5CF6", buttonTextColor: "#FFFFFF", questionColor: "#1E293B", answerColor: "#7C3AED", backgroundColor: "#FAF5FF" },
  { name: "Oceano", buttonColor: "#06B6D4", buttonTextColor: "#FFFFFF", questionColor: "#1E293B", answerColor: "#0891B2", backgroundColor: "#ECFEFF" },
  { name: "Dark Elegante", buttonColor: "#3B82F6", buttonTextColor: "#FFFFFF", questionColor: "#FFFFFF", answerColor: "#60A5FA", backgroundColor: "#0F172A" },
  { name: "Dark Neon", buttonColor: "#06B6D4", buttonTextColor: "#FFFFFF", questionColor: "#E2E8F0", answerColor: "#22D3EE", backgroundColor: "#0A0E1A" },
];

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm font-body text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 rounded-xl border border-border cursor-pointer appearance-none bg-transparent"
            style={{ padding: 0 }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-24 px-3 py-2 rounded-xl text-sm font-mono bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
        />
      </div>
    </div>
  );
}

/**
 * Reusable image upload field with drag-and-drop, file picker, and URL fallback.
 */
function ImageUploadField({
  label,
  description,
  value,
  onChange,
  previewClassName = "max-h-16 object-contain",
  previewContainerClassName = "mt-3 p-4 rounded-xl border border-border flex items-center justify-center bg-secondary/50",
}: {
  label: string;
  description: string;
  value: string;
  onChange: (url: string) => void;
  previewClassName?: string;
  previewContainerClassName?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = trpc.files.upload.useMutation();

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo: 5MB");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/xxx;base64, prefix
          const base64Data = result.split(",")[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadMutation.mutateAsync({
        filename: file.name,
        contentBase64: base64,
        mimeType: file.type,
        context: "design",
      });

      onChange(result.url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Erro ao fazer upload. Tente novamente.");
    } finally {
      setUploading(false);
    }
  }, [uploadMutation, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  return (
    <div>
      <h4 className="text-sm font-body font-semibold text-foreground mb-1">
        {label}
      </h4>
      <p className="text-sm text-muted-foreground mb-3">
        {description}
      </p>

      {/* Upload area */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {!value ? (
        <div
          className={`rounded-xl border-2 border-dashed p-6 flex flex-col items-center gap-3 cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-brand bg-brand/5"
              : "border-border hover:border-brand/40 hover:bg-secondary/50"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 size={24} className="animate-spin text-brand" />
              <span className="text-sm text-muted-foreground">Enviando...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary border border-border">
                <Upload size={18} className="text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm text-foreground">
                  <span className="font-medium text-brand cursor-pointer">Escolher arquivo</span>
                  {" "}ou arraste aqui
                </p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, SVG, WebP (máx. 5MB)</p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className={previewContainerClassName}>
          <div className="flex-1 flex items-center justify-center">
            <img
              src={value}
              alt={`${label} preview`}
              className={previewClassName}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-brand hover:text-brand/80 font-medium transition-colors"
            >
              Trocar
            </button>
            <button
              onClick={() => onChange("")}
              className="p-1 rounded-md hover:bg-secondary transition-colors"
              title="Remover"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {/* URL fallback input */}
      <div className="mt-2">
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ou cole a URL da imagem..."
          className="w-full px-4 py-2 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
        />
      </div>
    </div>
  );
}

export function DesignEditor({ design, onUpdate }: DesignEditorProps) {
  const [activeSection, setActiveSection] = useState<string>("colors");

  const sections = [
    { id: "colors", label: "Cores", icon: Palette },
    { id: "typography", label: "Tipografia", icon: Type },
    { id: "media", label: "Mídia", icon: Image },
    { id: "social", label: "Social", icon: Globe },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      {/* Section tabs */}
      <div className="flex border-b border-border shrink-0">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-body font-medium transition-all border-b-2 ${
                isActive
                  ? "text-brand border-brand"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {activeSection === "colors" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Preset palettes */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-3">
                Paletas prontas
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {presetPalettes.map((p) => (
                  <button
                    key={p.name}
                    onClick={() =>
                      onUpdate({
                        buttonColor: p.buttonColor,
                        buttonTextColor: p.buttonTextColor,
                        questionColor: p.questionColor,
                        answerColor: p.answerColor,
                        backgroundColor: p.backgroundColor,
                      })
                    }
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-brand/30 hover:shadow-sm transition-all group bg-secondary/50"
                  >
                    <div className="flex gap-1">
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: p.buttonColor }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: p.answerColor }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-border/50"
                        style={{ backgroundColor: p.backgroundColor }}
                      />
                    </div>
                    <span className="text-sm font-body text-muted-foreground group-hover:text-foreground transition-colors">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom colors */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-3">
                Cores personalizadas
              </h4>
              <div className="space-y-1 bg-secondary/50 rounded-xl p-4 border border-border">
                <ColorInput
                  label="Cor do botão"
                  value={design.buttonColor}
                  onChange={(v) => onUpdate({ buttonColor: v })}
                />
                <ColorInput
                  label="Texto do botão"
                  value={design.buttonTextColor}
                  onChange={(v) => onUpdate({ buttonTextColor: v })}
                />
                <ColorInput
                  label="Cor da pergunta"
                  value={design.questionColor}
                  onChange={(v) => onUpdate({ questionColor: v })}
                />
                <ColorInput
                  label="Cor da resposta"
                  value={design.answerColor}
                  onChange={(v) => onUpdate({ answerColor: v })}
                />
                <ColorInput
                  label="Cor de fundo"
                  value={design.backgroundColor}
                  onChange={(v) => onUpdate({ backgroundColor: v })}
                />
              </div>
            </div>

            {/* Live preview mini */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-3">
                Pré-visualização
              </h4>
              <div
                className="rounded-2xl p-6 border border-border shadow-sm"
                style={{ backgroundColor: design.backgroundColor }}
              >
                {design.logoUrl && (
                  <img
                    src={design.logoUrl}
                    alt="Logo"
                    className="h-8 mb-4 object-contain"
                  />
                )}
                <p
                  className="text-base font-display font-bold mb-2"
                  style={{ color: design.questionColor }}
                >
                  Como você avalia nosso serviço?
                </p>
                <p
                  className="text-sm mb-4"
                  style={{ color: design.answerColor }}
                >
                  Selecione uma opção abaixo
                </p>
                <div className="flex gap-2">
                  <div
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: design.buttonColor }}
                  >
                    Excelente
                  </div>
                  <div
                    className="px-4 py-2 rounded-xl text-sm border"
                    style={{
                      borderColor: design.buttonColor + "40",
                      color: design.answerColor,
                    }}
                  >
                    Bom
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "typography" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-3">
                Fonte do formulário
              </h4>
              <div className="space-y-1.5">
                {fontOptions.map((font) => (
                  <button
                    key={font}
                    onClick={() => onUpdate({ fontFamily: font })}
                    className={`w-full text-left px-4 py-3 rounded-xl text-base transition-all border ${
                      design.fontFamily === font
                        ? "border-brand bg-brand-lighter text-foreground shadow-sm"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary hover:border-border"
                    }`}
                    style={{ fontFamily: font }}
                  >
                    {font}
                    <span className="block text-sm mt-1 opacity-50">
                      ABCDEFGHIJ abcdefghij 0123456789
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "media" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Logo */}
            <ImageUploadField
              label="Logotipo"
              description="Aparece no topo do formulário. Recomendado: PNG transparente."
              value={design.logoUrl ?? ""}
              onChange={(url) => onUpdate({ logoUrl: url })}
              previewClassName="max-h-16 object-contain"
              previewContainerClassName="mt-3 p-4 rounded-xl border border-border flex flex-col items-center bg-secondary/50"
            />

            {/* Background image */}
            <ImageUploadField
              label="Imagem de fundo"
              description="Imagem que aparece no fundo do formulário. Cuidado com o contraste."
              value={design.backgroundImage ?? ""}
              onChange={(url) => onUpdate({ backgroundImage: url })}
              previewClassName="w-full h-28 object-cover rounded-lg"
              previewContainerClassName="mt-3 rounded-xl overflow-hidden border border-border flex flex-col items-center"
            />
          </motion.div>
        )}

        {activeSection === "social" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-1">
                Ao compartilhar...
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Essas informações aparecem quando o link é compartilhado em redes sociais.
              </p>

              {/* OG Preview card */}
              <div className="rounded-2xl overflow-hidden border border-border mb-5 shadow-sm bg-white">
                <div className="w-full h-32 flex items-center justify-center bg-secondary">
                  {design.ogImage ? (
                    <img
                      src={design.ogImage}
                      alt="OG preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                      <Image size={24} />
                      <span className="text-sm">Imagem de capa</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-base font-semibold text-brand truncate">
                    {design.ogTitle || "Título da página"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {design.ogDescription || "Descrição da página..."}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-body font-medium text-foreground mb-1.5 block">
                    Título da página
                  </label>
                  <input
                    type="text"
                    value={design.ogTitle ?? ""}
                    onChange={(e) => onUpdate({ ogTitle: e.target.value })}
                    placeholder="Título exibido ao compartilhar..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-body font-medium text-foreground mb-1.5 block">
                    Descrição da página
                  </label>
                  <textarea
                    value={design.ogDescription ?? ""}
                    onChange={(e) => onUpdate({ ogDescription: e.target.value })}
                    placeholder="Descrição exibida ao compartilhar..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all resize-none"
                  />
                </div>

                {/* OG Image upload */}
                <ImageUploadField
                  label="Imagem de capa"
                  description="Imagem exibida ao compartilhar o link em redes sociais."
                  value={design.ogImage ?? ""}
                  onChange={(url) => onUpdate({ ogImage: url })}
                  previewClassName="w-full h-28 object-cover rounded-lg"
                  previewContainerClassName="mt-3 rounded-xl overflow-hidden border border-border flex flex-col items-center"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
