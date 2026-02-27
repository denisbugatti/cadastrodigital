/**
 * FormFlow Sharing Panel (Light Theme)
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
        return `<iframe\n  src="${formUrl}"\n  width="${sharing.embedWidth}%"\n  height="${sharing.embedHeight}px"\n  frameborder="0"\n  style="border: none; border-radius: 12px;"\n  allow="camera; microphone"\n></iframe>`;
      case "fullscreen":
        return `<div style="position:fixed;inset:0;z-index:9999;">\n  <iframe\n    src="${formUrl}"\n    width="100%"\n    height="100%"\n    frameborder="0"\n    style="border:none;"\n    allow="camera; microphone"\n  ></iframe>\n</div>`;
      case "button-link":
        return `<a\n  href="${formUrl}"\n  target="_blank"\n  rel="noopener noreferrer"\n  style="display:inline-block;padding:14px 28px;background:${sharing.embedButtonColor};color:#fff;border-radius:12px;text-decoration:none;font-family:sans-serif;font-size:16px;font-weight:600;"\n>${sharing.embedButtonText}</a>`;
      case "button-popup":
        return `<button\n  onclick="window.open('${formUrl}','FormFlow','width=700,height=600,scrollbars=yes')"\n  style="padding:14px 28px;background:${sharing.embedButtonColor};color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:sans-serif;font-size:16px;font-weight:600;"\n>${sharing.embedButtonText}</button>`;
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
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-lg font-display font-bold text-foreground mb-1">
            Link
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Envie esse link por e-mail, ou compartilhe nas suas redes sociais.
          </p>

          {!sharing.isPublished && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-body mb-4 bg-amber-50 text-amber-700 border border-amber-200">
              <span>⚠</span>
              Existe um rascunho não publicado
            </div>
          )}

          {/* URL slug editor */}
          <div className="mb-4">
            <label className="text-sm font-body font-medium text-foreground mb-2 block">
              Slug da URL
            </label>
            <div className="flex items-center gap-2 bg-secondary rounded-xl border border-border p-1">
              <span className="text-sm text-muted-foreground shrink-0 pl-3">
                {baseUrl}/
              </span>
              <input
                type="text"
                value={sharing.slug ?? ""}
                onChange={(e) =>
                  onUpdate({
                    slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-/]/g, "")
                      .replace(/\/+/g, "/"),
                  })
                }
                className="flex-1 px-2 py-2 rounded-lg text-sm bg-white border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                placeholder="meu-formulario"
              />
            </div>
          </div>

          {/* Copy link */}
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 rounded-xl text-sm font-mono truncate bg-secondary border border-border text-foreground">
              {formUrl}
            </div>
            <button
              onClick={copyLink}
              className="shrink-0 px-5 py-3 rounded-xl text-sm font-body font-semibold text-white bg-brand hover:bg-brand-dark transition-all shadow-sm"
            >
              {copied ? (
                <span className="flex items-center gap-2">
                  <Check size={16} /> Copiado
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Copy size={16} /> Copiar
                </span>
              )}
            </button>
          </div>

          {/* Social share buttons */}
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => shareOnSocial("facebook")}
              className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-[#1877F2] transition-colors"
            >
              <Facebook size={18} /> Facebook
            </button>
            <button
              onClick={() => shareOnSocial("twitter")}
              className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-[#1DA1F2] transition-colors"
            >
              <Twitter size={18} /> Twitter
            </button>
            <button
              onClick={() => shareOnSocial("linkedin")}
              className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-[#0A66C2] transition-colors"
            >
              <Linkedin size={18} /> LinkedIn
            </button>
            <button
              onClick={() => shareOnSocial("whatsapp")}
              className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-[#25D366] transition-colors"
            >
              <ExternalLink size={18} /> WhatsApp
            </button>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Embed Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-lg font-display font-bold text-foreground mb-1">
            Código de incorporação
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Adicionar o formulário no seu site.
          </p>

          {/* Embed mode selector */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {embedModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = sharing.embedMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => onUpdate({ embedMode: mode.id })}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all border ${
                    isActive
                      ? "border-brand bg-brand-lighter text-foreground shadow-sm"
                      : "border-border bg-secondary/50 text-muted-foreground hover:border-brand/30"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-brand" : ""} />
                  <div>
                    <span className="text-sm font-semibold block">{mode.label}</span>
                    <span className="text-xs opacity-60">{mode.description}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Embed config based on mode */}
          {(sharing.embedMode === "normal") && (
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3">
                <label className="text-sm font-body text-foreground w-16">Largura</label>
                <input
                  type="text"
                  value={sharing.embedWidth ?? ""}
                  onChange={(e) => onUpdate({ embedWidth: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-body text-foreground w-16">Altura</label>
                <input
                  type="text"
                  value={sharing.embedHeight ?? ""}
                  onChange={(e) => onUpdate({ embedHeight: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                />
                <span className="text-sm text-muted-foreground">px</span>
              </div>
            </div>
          )}

          {(sharing.embedMode === "button-link" || sharing.embedMode === "button-popup") && (
            <div className="space-y-4 mb-5">
              <div>
                <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Texto</label>
                <input
                  type="text"
                  value={sharing.embedButtonText ?? ""}
                  onChange={(e) => onUpdate({ embedButtonText: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                />
              </div>
              <div>
                <label className="text-sm font-body font-medium text-foreground mb-1.5 block">Cor</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sharing.embedButtonColor ?? "#3B82F6"}
                    onChange={(e) => onUpdate({ embedButtonColor: e.target.value })}
                    className="w-10 h-10 rounded-xl border border-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={sharing.embedButtonColor ?? ""}
                    onChange={(e) => onUpdate({ embedButtonColor: e.target.value })}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Preview of embed */}
          <div className="mb-5">
            <p className="text-sm text-brand text-center mb-3 font-medium">
              Exemplo de como ficará no seu site
            </p>
            <div className="rounded-2xl p-6 border border-border flex items-center justify-center min-h-[120px] bg-secondary/30">
              {sharing.embedMode === "normal" && (
                <div
                  className="w-full rounded-xl flex items-center justify-center text-sm text-muted-foreground bg-white border border-border"
                  style={{
                    height: `${Math.min(parseInt(sharing.embedHeight) || 100, 120)}px`,
                  }}
                >
                  Seu formulário aqui
                </div>
              )}
              {sharing.embedMode === "fullscreen" && (
                <div className="w-full h-[120px] rounded-xl flex items-center justify-center text-sm text-muted-foreground bg-white border border-border">
                  Seu formulário aqui (tela cheia)
                </div>
              )}
              {(sharing.embedMode === "button-link" || sharing.embedMode === "button-popup") && (
                <div className="space-y-3 text-center">
                  <div className="h-2.5 w-40 rounded-full bg-border mx-auto" />
                  <div className="h-2.5 w-32 rounded-full bg-border/60 mx-auto" />
                  <button
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: sharing.embedButtonColor }}
                  >
                    {sharing.embedButtonText}
                  </button>
                  <div className="h-2.5 w-36 rounded-full bg-border/60 mx-auto" />
                </div>
              )}
            </div>
          </div>

          {/* Generate code button */}
          <button
            onClick={() => setShowCode(!showCode)}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-body font-semibold text-white bg-brand hover:bg-brand-dark transition-all shadow-sm"
          >
            <Code size={16} />
            {showCode ? "Esconder código" : "Gerar código"}
          </button>

          {showCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-4"
            >
              <div className="relative">
                <pre className="p-4 rounded-xl text-sm font-mono overflow-x-auto custom-scrollbar bg-slate-900 border border-slate-700">
                  <code className="text-emerald-400">{embedCode}</code>
                </pre>
                <button
                  onClick={copyCode}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 border border-slate-600 hover:border-slate-500 transition-all"
                >
                  {codeCopied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} className="text-slate-400" />
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
