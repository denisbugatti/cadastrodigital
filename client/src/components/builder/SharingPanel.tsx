/**
 * FormFlow Sharing Panel
 * Design: Dark futuristic with glassmorphism.
 * Link sharing, social media, embed code generation.
 */

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Copy, Check, ExternalLink, Facebook, Twitter, Linkedin,
  Code, Monitor, Maximize, MousePointer, Layers,
} from "lucide-react";
import { toast } from "sonner";
import type { SharingSettings, EmbedMode } from "@/lib/builderTypes";

interface SharingPanelProps {
  sharing: SharingSettings;
  formTitle: string;
  workspaceDomain?: string;
  onUpdate: (updates: Partial<SharingSettings>) => void;
}

const embedModes: { id: EmbedMode; label: string; icon: typeof Monitor; description: string }[] = [
  { id: "normal", label: "Normal", icon: Monitor, description: "Iframe embutido na página" },
  { id: "fullscreen", label: "Tela cheia", icon: Maximize, description: "Ocupa toda a tela" },
  { id: "button-link", label: "Botão com link", icon: MousePointer, description: "Botão que abre o formulário" },
  { id: "button-popup", label: "Botão para janela", icon: Layers, description: "Botão que abre popup" },
];

export function SharingPanel({ sharing, formTitle, workspaceDomain, onUpdate }: SharingPanelProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const baseUrl = workspaceDomain
    ? `https://${workspaceDomain}`
    : "https://formflow.app";

  const formUrl = `${baseUrl}/${sharing.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const embedCode = useMemo(() => {
    switch (sharing.embedMode) {
      case "normal":
        return `<iframe
  src="${formUrl}"
  width="${sharing.embedWidth}%"
  height="${sharing.embedHeight}px"
  frameborder="0"
  style="border: none; border-radius: 8px;"
  allow="camera; microphone"
></iframe>`;
      case "fullscreen":
        return `<div style="position:fixed;inset:0;z-index:9999;">
  <iframe
    src="${formUrl}"
    width="100%"
    height="100%"
    frameborder="0"
    style="border:none;"
    allow="camera; microphone"
  ></iframe>
</div>`;
      case "button-link":
        return `<a
  href="${formUrl}"
  target="_blank"
  rel="noopener noreferrer"
  style="display:inline-block;padding:12px 24px;background:${sharing.embedButtonColor};color:#fff;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;font-weight:600;"
>${sharing.embedButtonText}</a>`;
      case "button-popup":
        return `<button
  onclick="window.open('${formUrl}','FormFlow','width=700,height=600,scrollbars=yes')"
  style="padding:12px 24px;background:${sharing.embedButtonColor};color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:sans-serif;font-size:14px;font-weight:600;"
>${sharing.embedButtonText}</button>`;
    }
  }, [sharing, formUrl]);

  const copyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCodeCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent(formTitle || "Responda nosso formulário");
    const url = encodeURIComponent(formUrl);
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}%20${url}`;
        break;
    }
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Link
          </h4>
          <p className="text-[10px] text-muted-foreground/60 mb-3">
            Envie esse link por e-mail, ou compartilhe nas suas redes sociais.
          </p>

          {!sharing.isPublished && (
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-body mb-3"
              style={{
                background: "oklch(0.4 0.15 80 / 0.15)",
                color: "oklch(0.8 0.15 80)",
                border: "1px solid oklch(0.5 0.15 80 / 0.2)",
              }}
            >
              <span>⚠</span>
              Existe um rascunho não publicado
            </div>
          )}

          {/* URL slug editor */}
          <div className="mb-3">
            <label className="text-[10px] font-body text-muted-foreground mb-1 block">
              Slug da URL
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground/50 shrink-0">
                {baseUrl}/
              </span>
              <input
                type="text"
                value={sharing.slug}
                onChange={(e) =>
                  onUpdate({
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-/]/g, "")
                      .replace(/\/+/g, "/"),
                  })
                }
                className="flex-1 px-2 py-1.5 rounded-lg text-xs bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40 transition-colors"
                placeholder="meu-formulario"
              />
            </div>
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-3 py-2.5 rounded-lg text-xs font-mono truncate border border-glass-border"
              style={{ background: "oklch(0.14 0.015 260)" }}
            >
              {formUrl}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 px-4 py-2.5 rounded-lg text-xs font-body font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.55 0.25 270))",
                boxShadow: "0 0 12px oklch(0.65 0.2 250 / 0.3)",
              }}
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <Check size={12} /> Copiado
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Copy size={12} /> Copiar
                </span>
              )}
            </button>
          </div>

          {/* Social share buttons */}
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => shareOnSocial("facebook")}
              className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground hover:text-[#1877F2] transition-colors"
            >
              <Facebook size={13} /> Facebook
            </button>
            <button
              onClick={() => shareOnSocial("twitter")}
              className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground hover:text-[#1DA1F2] transition-colors"
            >
              <Twitter size={13} /> Twitter
            </button>
            <button
              onClick={() => shareOnSocial("linkedin")}
              className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground hover:text-[#0A66C2] transition-colors"
            >
              <Linkedin size={13} /> LinkedIn
            </button>
            <button
              onClick={() => shareOnSocial("whatsapp")}
              className="flex items-center gap-1.5 text-[10px] font-body text-muted-foreground hover:text-[#25D366] transition-colors"
            >
              <ExternalLink size={13} /> WhatsApp
            </button>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-glass-border" />

        {/* Embed Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-[11px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Código de incorporação
          </h4>
          <p className="text-[10px] text-muted-foreground/60 mb-3">
            Adicionar o formulário no seu site.
          </p>

          {/* Embed mode selector */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {embedModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = sharing.embedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onUpdate({ embedMode: mode.id })}
                  className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-all border ${
                    isActive
                      ? "border-neon-blue/40 text-foreground"
                      : "border-glass-border text-muted-foreground hover:border-glass-hover"
                  }`}
                  style={{
                    background: isActive
                      ? "oklch(0.18 0.03 250 / 0.3)"
                      : "oklch(0.14 0.015 260)",
                  }}
                >
                  <Icon size={14} className={isActive ? "text-neon-blue" : ""} />
                  <div>
                    <span className="text-[10px] font-semibold block">{mode.label}</span>
                    <span className="text-[8px] opacity-50">{mode.description}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Embed config based on mode */}
          {(sharing.embedMode === "normal") && (
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-body text-muted-foreground w-14">Largura</label>
                <input
                  type="text"
                  value={sharing.embedWidth}
                  onChange={(e) => onUpdate({ embedWidth: e.target.value })}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40"
                />
                <span className="text-[10px] text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-body text-muted-foreground w-14">Altura</label>
                <input
                  type="text"
                  value={sharing.embedHeight}
                  onChange={(e) => onUpdate({ embedHeight: e.target.value })}
                  className="flex-1 px-2 py-1.5 rounded-lg text-xs bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40"
                />
                <span className="text-[10px] text-muted-foreground">px</span>
              </div>
            </div>
          )}

          {(sharing.embedMode === "button-link" || sharing.embedMode === "button-popup") && (
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-[10px] font-body text-muted-foreground mb-1 block">Texto</label>
                <input
                  type="text"
                  value={sharing.embedButtonText}
                  onChange={(e) => onUpdate({ embedButtonText: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-xs bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40"
                />
              </div>
              <div>
                <label className="text-[10px] font-body text-muted-foreground mb-1 block">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sharing.embedButtonColor}
                    onChange={(e) => onUpdate({ embedButtonColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-glass-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sharing.embedButtonColor}
                    onChange={(e) => onUpdate({ embedButtonColor: e.target.value })}
                    className="flex-1 px-2 py-1.5 rounded-lg text-xs font-mono bg-transparent border border-glass-border text-foreground focus:outline-none focus:border-neon-blue/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview of embed */}
          <div className="mb-4">
            <p className="text-[10px] text-neon-cyan text-center mb-2">
              Exemplo de como ficará no seu site
            </p>
            <div
              className="rounded-xl p-4 border border-glass-border flex items-center justify-center min-h-[100px]"
              style={{ background: "oklch(0.95 0.005 260)" }}
            >
              {sharing.embedMode === "normal" && (
                <div
                  className="w-full rounded-lg flex items-center justify-center text-[10px]"
                  style={{
                    height: `${Math.min(parseInt(sharing.embedHeight) || 100, 120)}px`,
                    background: "oklch(0.2 0.02 260)",
                    color: "oklch(0.7 0.02 260)",
                  }}
                >
                  Seu formulário aqui
                </div>
              )}
              {sharing.embedMode === "fullscreen" && (
                <div
                  className="w-full h-[100px] rounded-lg flex items-center justify-center text-[10px]"
                  style={{
                    background: "oklch(0.2 0.02 260)",
                    color: "oklch(0.7 0.02 260)",
                  }}
                >
                  Seu formulário aqui (tela cheia)
                </div>
              )}
              {(sharing.embedMode === "button-link" || sharing.embedMode === "button-popup") && (
                <div className="space-y-2 text-center">
                  <div className="h-2 w-32 rounded bg-gray-300 mx-auto" />
                  <div className="h-2 w-24 rounded bg-gray-200 mx-auto" />
                  <button
                    className="px-4 py-2 rounded-lg text-[10px] font-semibold text-white"
                    style={{ backgroundColor: sharing.embedButtonColor }}
                  >
                    {sharing.embedButtonText}
                  </button>
                  <div className="h-2 w-28 rounded bg-gray-200 mx-auto" />
                </div>
              )}
            </div>
          </div>

          {/* Generate code button */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-body font-semibold text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.55 0.25 270))",
              boxShadow: "0 0 15px oklch(0.65 0.2 250 / 0.3)",
            }}
          >
            <Code size={13} />
            {showCode ? "Esconder código" : "Gerar código"}
          </button>

          {showCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <div className="relative">
                <pre
                  className="p-3 rounded-lg text-[10px] font-mono overflow-x-auto custom-scrollbar border border-glass-border"
                  style={{ background: "oklch(0.08 0.01 260)" }}
                >
                  <code className="text-neon-cyan/80">{embedCode}</code>
                </pre>
                <button
                  onClick={copyCode}
                  className="absolute top-2 right-2 p-1.5 rounded-md border border-glass-border hover:border-neon-blue/30 transition-all"
                  style={{ background: "oklch(0.14 0.015 260)" }}
                >
                  {codeCopied ? (
                    <Check size={11} className="text-green-400" />
                  ) : (
                    <Copy size={11} className="text-muted-foreground" />
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
