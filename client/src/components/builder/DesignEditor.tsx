/**
 * FormFlow Design Editor (Light Theme)
 * Allows customizing colors, fonts, logo, background, and OG meta.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Palette, Type, Image, Globe,
} from "lucide-react";
import type { FormDesignSettings } from "@/lib/builderTypes";

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
  { name: "Azul Moderno", buttonColor: "#3B82F6", questionColor: "#1E293B", answerColor: "#3B82F6", backgroundColor: "#FFFFFF" },
  { name: "Esmeralda", buttonColor: "#10B981", questionColor: "#1E293B", answerColor: "#10B981", backgroundColor: "#F0FDF4" },
  { name: "Sunset", buttonColor: "#F59E0B", questionColor: "#292524", answerColor: "#D97706", backgroundColor: "#FFFBEB" },
  { name: "Rosa", buttonColor: "#F43F5E", questionColor: "#1E293B", answerColor: "#F43F5E", backgroundColor: "#FFF1F2" },
  { name: "Roxo", buttonColor: "#8B5CF6", questionColor: "#1E293B", answerColor: "#7C3AED", backgroundColor: "#FAF5FF" },
  { name: "Oceano", buttonColor: "#06B6D4", questionColor: "#1E293B", answerColor: "#0891B2", backgroundColor: "#ECFEFF" },
  { name: "Dark Elegante", buttonColor: "#3B82F6", questionColor: "#FFFFFF", answerColor: "#60A5FA", backgroundColor: "#0F172A" },
  { name: "Dark Neon", buttonColor: "#06B6D4", questionColor: "#E2E8F0", answerColor: "#22D3EE", backgroundColor: "#0A0E1A" },
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
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-1">
                Logotipo
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Aparece no topo do formulário. Recomendado: PNG transparente.
              </p>
              <input
                type="text"
                value={design.logoUrl}
                onChange={(e) => onUpdate({ logoUrl: e.target.value })}
                placeholder="URL da imagem do logo..."
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
              />
              {design.logoUrl && (
                <div className="mt-3 p-4 rounded-xl border border-border flex items-center justify-center bg-secondary/50">
                  <img
                    src={design.logoUrl}
                    alt="Logo preview"
                    className="max-h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Background image */}
            <div>
              <h4 className="text-sm font-body font-semibold text-foreground mb-1">
                Imagem de fundo
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Imagem que aparece no fundo do formulário. Cuidado com o contraste.
              </p>
              <input
                type="text"
                value={design.backgroundImage}
                onChange={(e) => onUpdate({ backgroundImage: e.target.value })}
                placeholder="URL da imagem de fundo..."
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
              />
              {design.backgroundImage && (
                <div className="mt-3 rounded-xl overflow-hidden border border-border">
                  <img
                    src={design.backgroundImage}
                    alt="Background preview"
                    className="w-full h-28 object-cover"
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
                    value={design.ogTitle}
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
                    value={design.ogDescription}
                    onChange={(e) => onUpdate({ ogDescription: e.target.value })}
                    placeholder="Descrição exibida ao compartilhar..."
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-body font-medium text-foreground mb-1.5 block">
                    Imagem de capa
                  </label>
                  <input
                    type="text"
                    value={design.ogImage}
                    onChange={(e) => onUpdate({ ogImage: e.target.value })}
                    placeholder="URL da imagem de capa..."
                    className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
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
