/**
 * FormFlow Sharing Panel
 * Link sharing, social media, embed code generation, and OG tag configuration.
 * Uses window.location.origin as the base URL so it automatically
 * reflects the real domain (e.g., one.cadastrodigital.com.br).
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Copy, Check, ExternalLink, Facebook, Twitter, Linkedin,
  Code, Monitor, Maximize, MousePointer, Layers,
  CheckCircle2, XCircle, Loader2, Globe, ImageIcon, Upload, X,
  ShieldCheck, Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { SharingSettings, EmbedMode, FormDesignSettings, FormSettings } from "@/lib/builderTypes";
import { BRANDS, BRAND_LIST, brandFromValue } from "@shared/brands";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SharingPanelProps {
  sharing: SharingSettings;
  formTitle: string;
  formId?: number;
  onUpdate: (updates: Partial<SharingSettings>) => void;
  design: FormDesignSettings;
  onUpdateDesign: (updates: Partial<FormDesignSettings>) => void;
  settings?: FormSettings;
  onUpdateSettings?: (updates: Partial<FormSettings>) => void;
}

const embedModes: { id: EmbedMode; label: string; icon: typeof Monitor; description: string }[] = [
  { id: "normal", label: "Normal", icon: Monitor, description: "Iframe embutido na página" },
  { id: "fullscreen", label: "Tela cheia", icon: Maximize, description: "Ocupa toda a tela" },
  { id: "button-link", label: "Botão com link", icon: MousePointer, description: "Botão que abre o formulário" },
  { id: "button-popup", label: "Botão para janela", icon: Layers, description: "Botão que abre popup" },
];

export function SharingPanel({ sharing, formTitle, formId, onUpdate, design, onUpdateDesign, settings, onUpdateSettings }: SharingPanelProps) {
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [slugInput, setSlugInput] = useState(sharing.slug ?? "");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const slugCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // OG image upload state
  const [isUploadingOgImage, setIsUploadingOgImage] = useState(false);
  const ogImageInputRef = useRef<HTMLInputElement>(null);

  // Brand/domain of this form (One ou Vitacon) → defines the subdomain of the link
  const brand = brandFromValue(sharing.brand);
  const baseHost = BRANDS[brand].host;
  const baseUrl = `https://${baseHost}`;

  const formUrl = `${baseUrl}/${sharing.slug}`;

  // Upload image mutation (reuse siteSettings.uploadImage)
  const uploadImageMutation = trpc.siteSettings.uploadImage.useMutation();

  // Sync slugInput when sharing.slug changes externally
  useEffect(() => {
    setSlugInput(sharing.slug ?? "");
  }, [sharing.slug]);

  // Check slug availability with debounce
  const checkSlugQuery = trpc.forms.checkSlugAvailable.useQuery(
    { slug: slugInput, excludeFormId: formId },
    {
      enabled: slugStatus === "checking" && slugInput.length >= 2,
      retry: 1,
    }
  );

  useEffect(() => {
    if (checkSlugQuery.data && slugStatus === "checking") {
      setSlugStatus(checkSlugQuery.data.available ? "available" : "taken");
    }
  }, [checkSlugQuery.data, slugStatus]);

  const handleSlugChange = (value: string) => {
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-");
    
    setSlugInput(sanitized);
    setSlugStatus("idle");

    // Clear previous timeout
    if (slugCheckTimeout.current) {
      clearTimeout(slugCheckTimeout.current);
    }

    if (sanitized.length < 2) {
      return;
    }

    // Debounce the slug check
    slugCheckTimeout.current = setTimeout(() => {
      setSlugStatus("checking");
    }, 500);
  };

  const applySlug = () => {
    if (slugStatus === "available" || slugInput === sharing.slug) {
      onUpdate({ slug: slugInput });
      if (slugInput !== sharing.slug) {
        toast.success("Slug atualizado!");
      }
    }
  };

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
        return `<button\n  onclick="window.open('${formUrl}','CadastroDigital','width=700,height=600,scrollbars=yes')"\n  style="padding:14px 28px;background:${sharing.embedButtonColor};color:#fff;border:none;border-radius:12px;cursor:pointer;font-family:sans-serif;font-size:16px;font-weight:600;"\n>${sharing.embedButtonText}</button>`;
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

  // OG image upload handler
  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB.");
      return;
    }

    setIsUploadingOgImage(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data:image/xxx;base64, prefix
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadImageMutation.mutateAsync({
        base64,
        filename: file.name,
        mimeType: file.type,
      });

      onUpdateDesign({ ogImage: result.url });
      toast.success("Imagem de compartilhamento atualizada!");
    } catch (err) {
      toast.error("Erro ao enviar imagem. Tente novamente.");
      console.error("[OG Image Upload]", err);
    } finally {
      setIsUploadingOgImage(false);
      // Reset input
      if (ogImageInputRef.current) {
        ogImageInputRef.current.value = "";
      }
    }
  };

  // Computed OG values (with fallbacks)
  const ogTitle = design.ogTitle || formTitle || "Cadastro Digital";
  const ogDescription = design.ogDescription || "Preencha o formulário de forma segura e digital.";
  const ogImage = design.ogImage || design.logoUrl || "";

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
        {/* Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-lg font-display font-bold text-foreground mb-1">
            Link do formulário
          </h4>
          <p className="text-sm text-muted-foreground mb-4">
            Cada formulário tem um link fixo e permanente. Edite o slug abaixo para personalizar.
          </p>

          {!sharing.isPublished && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-body mb-4 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <span>⚠</span>
              Existe um rascunho não publicado
            </div>
          )}

          {/* Brand / domain selector */}
          <div className="mb-4">
            <label className="text-sm font-body font-medium text-foreground mb-2 block">
              Marca / Domínio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BRAND_LIST.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => onUpdate({ brand: b.key })}
                  className={`px-4 py-2.5 rounded-xl text-sm font-body font-medium border transition-all ${
                    brand === b.key
                      ? "bg-brand text-white border-brand shadow-sm"
                      : "bg-secondary text-foreground border-border hover:border-brand/50"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 ml-1">
              Define em qual subdomínio o formulário fica: <span className="font-mono">{baseHost}</span>
            </p>
          </div>

          {/* URL slug editor */}
          <div className="mb-4">
            <label className="text-sm font-body font-medium text-foreground mb-2 block">
              Endpoint do formulário
            </label>
            <div className="flex items-center gap-0 bg-secondary rounded-xl border border-border overflow-hidden">
              <span className="text-xs text-muted-foreground shrink-0 px-3 py-2.5 bg-muted/50 border-r border-border font-mono">
                {baseHost}/
              </span>
              <div className="flex-1 flex items-center">
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  onBlur={applySlug}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applySlug();
                  }}
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent text-foreground focus:outline-none"
                  placeholder="nome-do-formulario"
                />
                <div className="pr-3 flex items-center">
                  {slugStatus === "checking" && (
                    <Loader2 size={16} className="text-muted-foreground animate-spin" />
                  )}
                  {slugStatus === "available" && (
                    <CheckCircle2 size={16} className="text-green-500" />
                  )}
                  {slugStatus === "taken" && (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
              </div>
            </div>
            {slugStatus === "taken" && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">
                Este slug já está em uso. Escolha outro.
              </p>
            )}
            {slugStatus === "available" && slugInput !== sharing.slug && (
              <p className="text-xs text-green-600 mt-1.5 ml-1">
                Slug disponível! Clique fora ou pressione Enter para aplicar.
              </p>
            )}
          </div>

          {/* Final URL display + Copy */}
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

        {/* ═══ Social Sharing / OG Tags Section ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Globe size={18} className="text-brand" />
            <h4 className="text-lg font-display font-bold text-foreground">
              Compartilhamento social
            </h4>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Configure como o link aparece ao compartilhar no WhatsApp, Facebook e outras redes.
          </p>

          {/* WhatsApp Preview Card */}
          <div className="mb-6">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Preview do WhatsApp
            </p>
            <div className="rounded-xl border border-border overflow-hidden bg-secondary/50 max-w-sm">
              {/* Image preview */}
              {ogImage ? (
                <div className="w-full h-[180px] bg-muted relative">
                  <img
                    src={ogImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-[180px] bg-muted flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon size={32} className="text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground/60">Sem imagem de capa</p>
                  </div>
                </div>
              )}
              {/* Text preview */}
              <div className="p-3">
                <p className="text-xs text-muted-foreground mb-0.5 truncate">
                  {baseHost}
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {ogTitle}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {ogDescription}
                </p>
              </div>
            </div>
          </div>

          {/* OG Title */}
          <div className="mb-4">
            <label className="text-sm font-body font-medium text-foreground mb-1.5 block">
              Título da página
            </label>
            <input
              type="text"
              value={design.ogTitle ?? ""}
              onChange={(e) => onUpdateDesign({ ogTitle: e.target.value })}
              placeholder={formTitle || "Título do formulário"}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
            />
            <p className="text-xs text-muted-foreground mt-1 ml-1">
              Se vazio, usa o nome do formulário.
            </p>
          </div>

          {/* OG Description */}
          <div className="mb-4">
            <label className="text-sm font-body font-medium text-foreground mb-1.5 block">
              Descrição da página
            </label>
            <textarea
              value={design.ogDescription ?? ""}
              onChange={(e) => onUpdateDesign({ ogDescription: e.target.value })}
              placeholder="Preencha o formulário de forma segura e digital."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 resize-none"
            />
          </div>

          {/* OG Image */}
          <div className="mb-4">
            <label className="text-sm font-body font-medium text-foreground mb-1.5 block">
              Imagem de capa
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Imagem exibida ao compartilhar o link em redes sociais. Recomendado: 1200x630px.
            </p>

            {design.ogImage ? (
              <div className="relative rounded-xl border border-border overflow-hidden bg-muted">
                <img
                  src={design.ogImage}
                  alt="Imagem de capa"
                  className="w-full h-[160px] object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="absolute bottom-2 right-2 flex gap-2">
                  <button
                    onClick={() => ogImageInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-brand bg-background/90 backdrop-blur-sm border border-border hover:bg-background transition-all"
                  >
                    Trocar
                  </button>
                  <button
                    onClick={() => onUpdateDesign({ ogImage: "" })}
                    className="p-1.5 rounded-lg text-destructive bg-background/90 backdrop-blur-sm border border-border hover:bg-background transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => ogImageInputRef.current?.click()}
                disabled={isUploadingOgImage}
                className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl border-2 border-dashed border-border hover:border-brand/40 bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
              >
                {isUploadingOgImage ? (
                  <Loader2 size={24} className="text-brand animate-spin" />
                ) : (
                  <Upload size={24} className="text-muted-foreground/60" />
                )}
                <span className="text-sm text-muted-foreground">
                  {isUploadingOgImage ? "Enviando..." : "Clique para enviar imagem"}
                </span>
              </button>
            )}

            {/* OG Image URL input */}
            <div className="mt-2">
              <input
                type="text"
                value={design.ogImage ?? ""}
                onChange={(e) => onUpdateDesign({ ogImage: e.target.value })}
                placeholder="https://exemplo.com/imagem.jpg"
                className="w-full px-4 py-2 rounded-xl text-xs font-mono bg-secondary border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
              />
            </div>

            {/* Hidden file input */}
            <input
              ref={ogImageInputRef}
              type="file"
              accept="image/*"
              onChange={handleOgImageUpload}
              className="hidden"
            />
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
                  className="w-full rounded-xl flex items-center justify-center text-sm text-muted-foreground bg-card border border-border"
                  style={{
                    height: `${Math.min(parseInt(sharing.embedHeight) || 100, 120)}px`,
                  }}
                >
                  Seu formulário aqui
                </div>
              )}
              {sharing.embedMode === "fullscreen" && (
                <div className="w-full h-[120px] rounded-xl flex items-center justify-center text-sm text-muted-foreground bg-card border border-border">
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

        {/* ── Segurança ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border rounded-2xl p-5 bg-card"
        >
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-brand" />
            <h3 className="text-sm font-semibold text-foreground">Segurança</h3>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Smartphone size={16} className="text-emerald-500" />
              </div>
              <div>
                <Label htmlFor="sms-verification" className="text-sm font-medium text-foreground cursor-pointer">
                  Validação por SMS
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Envia código de verificação para confirmar o telefone
                </p>
              </div>
            </div>
            <Switch
              id="sms-verification"
              checked={settings?.smsVerification ?? false}
              onCheckedChange={(checked) => onUpdateSettings?.({ smsVerification: checked })}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
