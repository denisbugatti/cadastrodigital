/**
 * FormFlow Design Editor
 * Design: Dark futuristic with glassmorphism.
 * Allows customizing colors, fonts, logo, background, and OG meta.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Palette, Type, Image, Upload, Eye, Globe,
} from "lucide-react";
import type { FormDesignSettings } from "@/lib/builderTypes";

interface DesignEditorProps {
  design: FormDesignSettings;
  onUpdate: (updates: Partial<FormDesignSettings>) => void;
}

const fontOptions = [
  "Space Grotesk",
  "Syne",
  "Inter",
  "Poppins",
  "DM Sans",
  "Roboto",
  "Montserrat",
  "Nunito",
  "Lato",
  "Open Sans",
];

const presetPalettes = [
  { name: "Neon Blue", buttonColor: "#3B82F6", questionColor: "#FFFFFF", answerColor: "#60A5FA", backgroundColor: "#0A0E1A" },
  { name: "Emerald", buttonColor: "#10B981", questionColor: "#FFFFFF", answerColor: "#34D399", backgroundColor: "#0F1A15" },
  { name: "Sunset", buttonColor: "#F59E0B", questionColor: "#FFFFFF", answerColor: "#FBBF24", backgroundColor: "#1A150A" },
  { name: "Rose", buttonColor: "#F43F5E", questionColor: "#FFFFFF", answerColor: "#FB7185", backgroundColor: "#1A0A0F" },
  { name: "Purple", buttonColor: "#8B5CF6", questionColor: "#FFFFFF", answerColor: "#A78BFA", backgroundColor: "#0F0A1A" },
  { name: "Light Clean", buttonColor: "#2563EB", questionColor: "#1E293B", answerColor: "#3B82F6", backgroundColor: "#FFFFFF" },
  { name: "Light Warm", buttonColor: "#D97706", questionColor: "#292524", answerColor: "#F59E0B", backgroundColor: "#FFFBEB" },
  { name: "Dark Slate", buttonColor: "#06B6D4", questionColor: "#E2E8F0", answerColor: "#22D3EE", backgroundColor: "#0F172A" },
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-body text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg border border-glass-border cursor-pointer appearance-none bg-transparent"
            style={{ padding: 0 }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-[85px] px-2 py-1.5 rounded-lg text-xs font-mono bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40 transition-colors"
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Section tabs */}
      <div className="flex border-b border-glass-border shrink-0">
        {sections.map((s) => {
          const Icon = s.icon;
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-body font-medium transition-all border-b-2 ${
                isActive
                  ? "text-neon-blue border-neon-blue"
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon size={12} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {activeSection === "colors" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Preset palettes */}
            <div>
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Paletas prontas
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {presetPalettes.map((p) => (
                  <button
                    key={p.name}
                    onClick={() =>
                      onUpdate({
                        buttonColor: p.buttonColor,
                        questionColor: p.questionColor,
                        answerColor: p.answerColor,
                        backgroundColor: p.backgroundColor,
                      })
                    }
                    className="flex items-center gap-2 p-2 rounded-lg border border-glass-border hover:border-neon-blue/30 transition-all group"
                    style={{ background: "oklch(0.14 0.015 260)" }}
                  >
                    <div className="flex gap-0.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.buttonColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: p.answerColor }}
                      />
                      <div
                        className="w-3 h-3 rounded-full border border-glass-border"
                        style={{ backgroundColor: p.backgroundColor }}
                      />
                    </div>
                    <span className="text-[10px] font-body text-muted-foreground group-hover:text-foreground transition-colors">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom colors */}
            <div>
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Cores personalizadas
              </h4>
              <div className="space-y-3">
                <ColorInput
                  label="Cor do botão"
                  value={design.buttonColor}
                  onChange={(v) => onUpdate({ buttonColor: v })}
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
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Pré-visualização
              </h4>
              <div
                className="rounded-xl p-5 border border-glass-border"
                style={{ backgroundColor: design.backgroundColor }}
              >
                {design.logoUrl && (
                  <img
                    src={design.logoUrl}
                    alt="Logo"
                    className="h-6 mb-3 object-contain"
                  />
                )}
                <p
                  className="text-sm font-display font-bold mb-2"
                  style={{ color: design.questionColor }}
                >
                  Como você avalia nosso serviço?
                </p>
                <p
                  className="text-xs mb-3"
                  style={{ color: design.answerColor }}
                >
                  Selecione uma opção abaixo
                </p>
                <div className="flex gap-2">
                  <div
                    className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-white"
                    style={{ backgroundColor: design.buttonColor }}
                  >
                    Excelente
                  </div>
                  <div
                    className="px-3 py-1.5 rounded-lg text-[10px] border"
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
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Fonte do formulário
              </h4>
              <div className="space-y-1.5">
                {fontOptions.map((font) => (
                  <button
                    key={font}
                    onClick={() => onUpdate({ fontFamily: font })}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all border ${
                      design.fontFamily === font
                        ? "border-neon-blue/40 text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-glass-border"
                    }`}
                    style={{
                      fontFamily: font,
                      background:
                        design.fontFamily === font
                          ? "oklch(0.18 0.03 250 / 0.3)"
                          : "transparent",
                    }}
                  >
                    {font}
                    <span className="block text-[10px] mt-0.5 opacity-50">
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
            className="space-y-5"
          >
            {/* Logo */}
            <div>
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Logotipo
              </h4>
              <p className="text-[10px] text-muted-foreground/60 mb-3">
                Aparece no topo do formulário. Recomendado: PNG transparente.
              </p>
              <input
                type="text"
                value={design.logoUrl}
                onChange={(e) => onUpdate({ logoUrl: e.target.value })}
                placeholder="URL da imagem do logo..."
                className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors"
              />
              {design.logoUrl && (
                <div className="mt-3 p-3 rounded-lg border border-glass-border flex items-center justify-center" style={{ background: "oklch(0.12 0.01 260)" }}>
                  <img
                    src={design.logoUrl}
                    alt="Logo preview"
                    className="max-h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Background image */}
            <div>
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Imagem de fundo
              </h4>
              <p className="text-[10px] text-muted-foreground/60 mb-3">
                Imagem que aparece no fundo do formulário. Cuidado com o contraste.
              </p>
              <input
                type="text"
                value={design.backgroundImage}
                onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
                placeholder="URL da imagem de fundo..."
                className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors"
              />
              {design.backgroundImage && (
                <div className="mt-3 rounded-lg overflow-hidden border border-glass-border">
                  <img
                    src={design.backgroundImage}
                    alt="Background preview"
                    className="w-full h-24 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeSection === "social" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div>
              <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Ao compartilhar...
              </h4>
              <p className="text-[10px] text-muted-foreground/60 mb-4">
                Essas informações aparecem quando o link é compartilhado em redes sociais.
              </p>

              {/* OG Preview card */}
              <div className="rounded-xl overflow-hidden border border-glass-border mb-4" style={{ background: "oklch(0.2 0.01 260)" }}>
                <div
                  className="w-full h-28 flex items-center justify-center"
                  style={{ background: "oklch(0.25 0.01 260)" }}
                >
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
                    <div className="flex flex-col items-center gap-1 text-muted-foreground/30">
                      <Image size={20} />
                      <span className="text-[9px]">Imagem de capa</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-neon-blue truncate">
                    {design.ogTitle || "Título da página"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {design.ogDescription || "Descrição da página..."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-body text-muted-foreground mb-1 block">
                    Título da página
                  </label>
                  <input
                    type="text"
                    value={design.ogTitle}
                    onChange={(e) => onUpdate({ ogTitle: e.target.value })}
                    placeholder="Título exibido ao compartilhar..."
                    className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-body text-muted-foreground mb-1 block">
                    Descrição da página
                  </label>
                  <textarea
                    value={design.ogDescription}
                    onChange={(e) => onUpdate({ ogDescription: e.target.value })}
                    placeholder="Descrição exibida ao compartilhar..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-body text-muted-foreground mb-1 block">
                    Imagem de capa
                  </label>
                  <input
                    type="text"
                    value={design.ogImage}
                    onChange={(e) => onUpdate({ ogImage: e.target.value })}
                    placeholder="URL da imagem de capa..."
                    className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
