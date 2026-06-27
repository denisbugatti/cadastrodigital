/**
 * FormFlow Design Editor (Light Theme)
 * Allows customizing colors, fonts, logo, background, and OG meta.
 * Supports file upload for logo, background image, and OG image via tRPC.
 */

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Palette, Type, Image, Globe, Upload, X, Loader2, Sparkles, Waves, Zap,
  Droplets, Flame, CloudRain, CircleDot, Sun, Cpu, Star, Sunrise, Wind, Ban,
} from "lucide-react";
import type { FormDesignSettings, BackgroundType, InputStyle } from "@/lib/builderTypes";
import { BackgroundPaths } from "@/components/ui/background-paths";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BackgroundShaders } from "@/components/ui/background-shaders";
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation";
import { BeamsBackground } from "@/components/ui/beams-background";
import { EtheralShadow } from "@/components/ui/etheral-shadow";
import { FallingPattern } from "@/components/ui/falling-pattern";
import { GradientDots } from "@/components/ui/gradient-dots";
import { SpotlightBackground } from "@/components/ui/spotlight-background";
import { ShaderPlasma } from "@/components/ui/shader-plasma";
import { StarsBackground } from "@/components/ui/stars-background";
import { AuroraBeams } from "@/components/ui/aurora-beams";
import { FlowField } from "@/components/ui/flow-field";
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
    { id: "effects", label: "Efeitos", icon: Sparkles },
    { id: "social", label: "Social", icon: Globe },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
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

            {/* Background Type Selector */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-3">
                Tipo de fundo
              </h4>
              <div className="grid grid-cols-3 gap-2 mb-4 max-h-[320px] overflow-y-auto pr-1">
                {([
                  { id: "none" as BackgroundType, label: "Nenhum", icon: Ban },
                  { id: "paths" as BackgroundType, label: "Paths", icon: Waves },
                  { id: "aurora" as BackgroundType, label: "Aurora", icon: Sparkles },
                  { id: "shaders" as BackgroundType, label: "Shaders", icon: Zap },
                  { id: "gradient" as BackgroundType, label: "Gradiente", icon: Droplets },
                  { id: "beams" as BackgroundType, label: "Feixes", icon: Flame },
                  { id: "etheral" as BackgroundType, label: "Etéreo", icon: Wind },
                  { id: "falling" as BackgroundType, label: "Chuva", icon: CloudRain },
                  { id: "dots" as BackgroundType, label: "Pontos", icon: CircleDot },
                  { id: "spotlight" as BackgroundType, label: "Holofote", icon: Sun },
                  { id: "plasma" as BackgroundType, label: "Plasma", icon: Cpu },
                  { id: "stars" as BackgroundType, label: "Estrelas", icon: Star },
                  { id: "aurora-beams" as BackgroundType, label: "Feixes Luz", icon: Sunrise },
                  { id: "flow-field" as BackgroundType, label: "Partículas", icon: Wind },
                ]).map((bg) => {
                  const Icon = bg.icon;
                  const isActive = (design.backgroundType || "paths") === bg.id;
                  return (
                    <button
                      key={bg.id}
                      onClick={() => onUpdate({ backgroundType: bg.id })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        isActive
                          ? "border-brand bg-brand/5 text-brand shadow-sm"
                          : "border-border text-muted-foreground hover:border-brand/30 hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-xs font-medium">{bg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Color customization for selected background */}
              <BackgroundColorPicker
                backgroundType={design.backgroundType || "paths"}
                colors={design.backgroundColors || []}
                onChange={(colors) => onUpdate({ backgroundColors: colors })}
              />

              {/* Live preview for selected background */}
              <div>
                <label className="text-sm font-body font-medium text-foreground mb-2 block">
                  Pré-visualização
                </label>
                <div className="w-full h-40 rounded-xl overflow-hidden relative border border-border bg-[#030303]">
                  <BackgroundPreviewWithColors
                    backgroundType={design.backgroundType || "paths"}
                    colors={design.backgroundColors || []}
                  />
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <p className="text-white text-sm font-semibold drop-shadow-lg">
                      Preview do efeito
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeSection === "effects" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Input Style Selection */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-2">
                Estilo dos campos de resposta
              </h4>
              <p className="text-xs text-muted-foreground mb-4">
                Escolha o efeito visual aplicado aos campos de entrada e cards de opção do formulário.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "default" as InputStyle, label: "Padrão", desc: "Estilo limpo e minimalista", preview: "border-b-2 border-gray-400" },
                  { id: "glassmorphism" as InputStyle, label: "Glassmorfismo", desc: "Vidro translúcido com blur", preview: "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl" },
                  { id: "glass-liquid" as InputStyle, label: "Glass Liquid", desc: "Vidro líquido com reflexão", preview: "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/25 rounded-2xl shadow-lg" },
                  { id: "neon-glow" as InputStyle, label: "Neon Glow", desc: "Brilho neon vibrante", preview: "border-2 border-blue-400 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" },
                  { id: "frost" as InputStyle, label: "Frost", desc: "Efeito gelo fosco", preview: "bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl" },
                  { id: "neumorphism" as InputStyle, label: "Neumorfismo", desc: "Relevo suave 3D", preview: "bg-gray-800 rounded-xl shadow-[5px_5px_10px_rgba(0,0,0,0.3),-5px_-5px_10px_rgba(255,255,255,0.05)]" },
                  { id: "minimal-line" as InputStyle, label: "Linha Minimal", desc: "Apenas linha inferior sutil", preview: "border-b border-white/30" },
                  { id: "gradient-border" as InputStyle, label: "Borda Gradiente", desc: "Borda com gradiente animado", preview: "rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]" },
                ]).map((style) => {
                  const isActive = (design.inputStyle || "default") === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => onUpdate({ inputStyle: style.id })}
                      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 text-left p-0 ${
                        isActive
                          ? "border-brand ring-2 ring-brand/30 scale-[1.02]"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      {/* Preview area */}
                      <div className="h-16 bg-[#0a0a1a] flex items-center justify-center px-3">
                        <div className={`w-full h-8 ${style.preview}`}>
                          {style.id === "gradient-border" && (
                            <div className="w-full h-full bg-[#0a0a1a] rounded-[10px]" />
                          )}
                        </div>
                      </div>
                      {/* Label */}
                      <div className="p-2.5">
                        <p className="text-xs font-body font-semibold text-foreground leading-tight">{style.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{style.desc}</p>
                      </div>
                      {isActive && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live preview */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-3">
                Pré-visualização
              </h4>
              <div className="rounded-xl overflow-hidden border border-border">
                <div className="bg-[#0a0a1a] p-6 space-y-4">
                  <InputStylePreview style={design.inputStyle || "default"} />
                </div>
              </div>
            </div>
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
              <div className="rounded-2xl overflow-hidden border border-border mb-5 shadow-sm bg-card">
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

/** Reusable preview for all 13 background types */
function BackgroundPreview({ backgroundType }: { backgroundType: BackgroundType }) {
  switch (backgroundType) {
    case "paths":
      return (
        <div className="absolute inset-0" style={{ color: "rgba(112, 190, 250, 0.55)" }}>
          <BackgroundPaths />
        </div>
      );
    case "aurora":
      return <AuroraBackground className="!h-full !min-h-0 dark" showRadialGradient={true} />;
    case "shaders":
      return <BackgroundShaders />;
    case "gradient":
      return <BackgroundGradientAnimation interactive={false} />;
    case "beams":
      return <BeamsBackground />;
    case "etheral":
      return <EtheralShadow color="rgba(100, 100, 200, 1)" />;
    case "falling":
      return <FallingPattern color="#6366f1" />;
    case "dots":
      return <GradientDots duration={20} />;
    case "spotlight":
      return <SpotlightBackground />;
    case "plasma":
      return <ShaderPlasma />;
    case "stars":
      return <StarsBackground />;
    case "aurora-beams":
      return <AuroraBeams />;
    case "flow-field":
      return <FlowField />;
    default:
      return null;
  }
}


/** Preview component for input styles in the Effects tab */
function InputStylePreview({ style }: { style: string }) {
  const getInputClasses = () => {
    switch (style) {
      case "glassmorphism":
        return "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3";
      case "glass-liquid":
        return "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/25 rounded-2xl px-4 py-3 shadow-lg";
      case "neon-glow":
        return "bg-transparent border-2 border-blue-400 rounded-xl px-4 py-3 shadow-[0_0_15px_rgba(59,130,246,0.4)]";
      case "frost":
        return "bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl px-4 py-3";
      case "neumorphism":
        return "bg-[#1a1a2e] rounded-xl px-4 py-3 shadow-[5px_5px_10px_rgba(0,0,0,0.3),-5px_-5px_10px_rgba(255,255,255,0.05)]";
      case "minimal-line":
        return "bg-transparent border-0 border-b border-white/30 rounded-none px-0 py-3";
      case "gradient-border":
        return "";
      default:
        return "bg-transparent border-0 border-b-2 border-white/40 rounded-none px-0 py-3";
    }
  };

  const getChoiceClasses = () => {
    switch (style) {
      case "glassmorphism":
        return "bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3";
      case "glass-liquid":
        return "bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-lg border border-white/25 rounded-2xl px-4 py-3 shadow-lg";
      case "neon-glow":
        return "bg-transparent border-2 border-blue-400/60 rounded-xl px-4 py-3 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]";
      case "frost":
        return "bg-white/8 backdrop-blur-xl border border-white/15 rounded-xl px-4 py-3";
      case "neumorphism":
        return "bg-[#1a1a2e] rounded-xl px-4 py-3 shadow-[3px_3px_6px_rgba(0,0,0,0.3),-3px_-3px_6px_rgba(255,255,255,0.04)]";
      case "minimal-line":
        return "bg-transparent border border-white/20 rounded-lg px-4 py-3";
      case "gradient-border":
        return "rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]";
      default:
        return "bg-transparent border border-white/40 rounded-lg px-4 py-3";
    }
  };

  return (
    <div className="space-y-4">
      {/* Text input preview */}
      <div>
        <p className="text-white/60 text-xs mb-2">Campo de texto</p>
        {style === "gradient-border" ? (
          <div className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]">
            <div className="bg-[#0a0a1a] rounded-[10px] px-4 py-3">
              <span className="text-white/50 text-sm">Digite sua resposta...</span>
            </div>
          </div>
        ) : (
          <div className={getInputClasses()}>
            <span className="text-white/50 text-sm">Digite sua resposta...</span>
          </div>
        )}
      </div>

      {/* Choice cards preview */}
      <div>
        <p className="text-white/60 text-xs mb-2">Op\u00e7\u00f5es de escolha</p>
        <div className="space-y-2">
          {["Op\u00e7\u00e3o A", "Op\u00e7\u00e3o B"].map((opt, i) => (
            <div key={i}>
              {style === "gradient-border" ? (
                <div className="rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-[1px]">
                  <div className="bg-[#0a0a1a] rounded-[10px] px-4 py-2.5 flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md border border-white/30 flex items-center justify-center text-xs text-white/60 font-medium">{String.fromCharCode(65 + i)}</span>
                    <span className="text-white/80 text-sm">{opt}</span>
                  </div>
                </div>
              ) : (
                <div className={getChoiceClasses()}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md border border-white/30 flex items-center justify-center text-xs text-white/60 font-medium">{String.fromCharCode(65 + i)}</span>
                    <span className="text-white/80 text-sm">{opt}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Color configuration per background type */
const BACKGROUND_COLOR_CONFIG: Record<BackgroundType, { label: string; count: number; defaults: string[]; hints: string[] }> = {
  none: { label: "", count: 0, defaults: [], hints: [] },
  paths: { label: "Cor das linhas", count: 1, defaults: ["#7BBEFA"], hints: ["Cor das linhas SVG"] },
  aurora: { label: "Cores da aurora", count: 3, defaults: ["#3B82F6", "#8B5CF6", "#06B6D4"], hints: ["Cor 1", "Cor 2", "Cor 3"] },
  shaders: { label: "Cores do shader", count: 4, defaults: ["hsl(203, 100%, 62%)", "hsl(255, 100%, 72%)", "hsl(158, 99%, 59%)", "hsl(264, 100%, 61%)"], hints: ["Cor 1", "Cor 2", "Cor 3", "Cor 4"] },
  gradient: { label: "Cores do gradiente", count: 3, defaults: ["#6C00A2", "#1171FF", "#DD4AFF"], hints: ["Fundo início", "Bolha 1", "Bolha 2"] },
  beams: { label: "Matiz dos feixes", count: 1, defaults: ["#3B82F6"], hints: ["Cor base dos feixes"] },
  etheral: { label: "Cor da sombra", count: 1, defaults: ["rgba(128, 128, 128, 1)"], hints: ["Cor da sombra etérea"] },
  falling: { label: "Cor da chuva", count: 1, defaults: ["#6366f1"], hints: ["Cor dos elementos"] },
  dots: { label: "Cor de fundo", count: 1, defaults: ["#030303"], hints: ["Cor de fundo dos pontos"] },
  spotlight: { label: "Cores dos holofotes", count: 3, defaults: ["#3B82F6", "#8B5CF6", "#EC4899"], hints: ["Holofote 1", "Holofote 2", "Holofote 3"] },
  plasma: { label: "Cor do plasma", count: 1, defaults: ["#6633CC"], hints: ["Cor das linhas de plasma"] },
  stars: { label: "Cor das estrelas", count: 1, defaults: ["#ffffff"], hints: ["Cor das estrelas"] },
  "aurora-beams": { label: "Cor dos feixes", count: 1, defaults: ["#00ffcc"], hints: ["Cor dos feixes de luz"] },
  "flow-field": { label: "Cor das partículas", count: 1, defaults: ["#6366f1"], hints: ["Cor do campo de partículas"] },
};

/** Color picker section for the active background type */
function BackgroundColorPicker({
  backgroundType,
  colors,
  onChange,
}: {
  backgroundType: BackgroundType;
  colors: string[];
  onChange: (colors: string[]) => void;
}) {
  const config = BACKGROUND_COLOR_CONFIG[backgroundType];
  if (!config) return null;

  const activeColors = config.defaults.map((def, i) => colors[i] || def);

  const handleColorChange = (index: number, value: string) => {
    const updated = [...activeColors];
    updated[index] = value;
    onChange(updated);
  };

  const handleReset = () => onChange([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-body font-medium text-foreground">
          {config.label}
        </label>
        {colors.length > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Restaurar padrão
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {activeColors.map((color, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <input
                type="color"
                value={color.startsWith("hsl") || color.startsWith("rgba") ? "#6366f1" : color}
                onChange={(e) => handleColorChange(i, e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className="w-full h-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[40px]">
              {config.hints[i]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Preview component with custom colors applied */
function BackgroundPreviewWithColors({ backgroundType, colors }: { backgroundType: BackgroundType; colors: string[] }) {
  const config = BACKGROUND_COLOR_CONFIG[backgroundType];
  const activeColors = config ? config.defaults.map((def, i) => colors[i] || def) : [];

  switch (backgroundType) {
    case "paths":
      return (
        <div className="absolute inset-0" style={{ color: activeColors[0] || "rgba(112, 190, 250, 0.55)" }}>
          <BackgroundPaths />
        </div>
      );
    case "aurora":
      return <AuroraBackground className="!h-full !min-h-0 dark" showRadialGradient={true} />;
    case "shaders":
      return <BackgroundShaders colors={activeColors} />;
    case "gradient":
      return <BackgroundGradientAnimation interactive={false} />;
    case "beams":
      return <BeamsBackground />;
    case "etheral":
      return <EtheralShadow color={activeColors[0] || "rgba(100, 100, 200, 1)"} />;
    case "falling":
      return <FallingPattern color={activeColors[0] || "#6366f1"} />;
    case "dots":
      return <GradientDots duration={20} backgroundColor={activeColors[0] || "#030303"} />;
    case "spotlight":
      return <SpotlightBackground />;
    case "plasma":
      return <ShaderPlasma />;
    case "stars":
      return <StarsBackground colors={activeColors} />;
    case "aurora-beams":
      return <AuroraBeams />;
    case "flow-field":
      return <FlowField color={activeColors[0] || "#6366f1"} />;
    default:
      return null;
  }
}
