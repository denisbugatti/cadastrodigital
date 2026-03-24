/**
 * FormFlow Builder — Config Panel (Light Theme)
 * Right panel for editing the selected question's properties.
 * Includes: image/video, system icons, Motion icons, and special screen configs.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Type, AlignLeft, ToggleLeft, Plus, Trash2, X,
  GitBranch, ArrowRight, Sparkles, ImagePlus, Smile, Trophy,
  MousePointerClick, ExternalLink, RotateCcw,
  User, Mail, Phone, Fingerprint, Building2, MapPin, MessageSquare, Hash, DollarSign, Link, Image,
  Star, Gauge,
  Calendar, Upload, Hand, Heart, ShieldCheck,
} from "lucide-react";
import type { BuilderQuestion, BuilderChoice, ConditionOperator, ConditionalRule, ScoreRule } from "@/lib/builderTypes";
import { questionTypes } from "@/lib/builderTypes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// System icons available for selection
const systemIcons = [
  { name: "user", Icon: User, label: "Usuário" },
  { name: "mail", Icon: Mail, label: "E-mail" },
  { name: "phone", Icon: Phone, label: "Telefone" },
  { name: "heart", Icon: Heart, label: "Coração" },
  { name: "star", Icon: Star, label: "Estrela" },
  { name: "smile", Icon: Smile, label: "Sorriso" },
  { name: "hand", Icon: Hand, label: "Mão" },
  { name: "shield-check", Icon: ShieldCheck, label: "Escudo" },
  { name: "sparkles", Icon: Sparkles, label: "Brilho" },
  { name: "fingerprint", Icon: Fingerprint, label: "Digital" },
  { name: "building-2", Icon: Building2, label: "Empresa" },
  { name: "map-pin", Icon: MapPin, label: "Local" },
  { name: "calendar", Icon: Calendar, label: "Data" },
  { name: "hash", Icon: Hash, label: "Número" },
  { name: "dollar-sign", Icon: DollarSign, label: "Moeda" },
  { name: "link", Icon: Link, label: "Link" },
  { name: "image", Icon: Image, label: "Imagem" },
  { name: "upload", Icon: Upload, label: "Upload" },
  { name: "message-square", Icon: MessageSquare, label: "Mensagem" },
  { name: "gauge", Icon: Gauge, label: "Medidor" },
];

interface BuilderConfigPanelProps {
  question: BuilderQuestion | null;
  onUpdate: (id: string, updates: Partial<BuilderQuestion>) => void;
  onAddChoice: (id: string) => void;
  onUpdateChoice: (questionId: string, choiceId: string, updates: Partial<BuilderChoice>) => void;
  onRemoveChoice: (questionId: string, choiceId: string) => void;
  conditionalTargets: { id: string; label: string; type: string }[];
}

export function BuilderConfigPanel({
  question,
  onUpdate,
  onAddChoice,
  onUpdateChoice,
  onRemoveChoice,
  conditionalTargets,
}: BuilderConfigPanelProps) {
  const [activeTab, setActiveTab] = useState<"general" | "media" | "logic">("general");
  const [showIconPicker, setShowIconPicker] = useState(false);

  if (!question) {
    return (
      <div className="w-80 h-full border-l border-border flex items-center justify-center bg-card">
        <div className="text-center px-8">
          <Settings size={36} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-base text-muted-foreground/60 font-body">
            Selecione uma pergunta para editar suas configurações
          </p>
        </div>
      </div>
    );
  }

  const typeInfo = questionTypes.find((t) => t.type === question.type);
  const hasChoices = typeInfo?.hasChoices || false;
  const hasConditionalLogic = typeInfo?.hasConditionalLogic || false;
  const isWelcome = question.type === "welcome";
  const isThankYou = question.type === "thank-you";
  const isSpecialScreen = isWelcome || isThankYou;
  const isStatement = question.type === "statement";
  const isSpecial = isSpecialScreen || isStatement;

  // Determine available tabs
  const tabs: { id: "general" | "media" | "logic"; label: string; icon: typeof Settings }[] = [
    { id: "general", label: (isSpecialScreen || isStatement) ? "Conteúdo" : "Geral", icon: Settings },
    { id: "media", label: "Mídia", icon: ImagePlus },
  ];
  if (hasConditionalLogic) {
    tabs.push({ id: "logic", label: "Lógica", icon: GitBranch });
  }

  return (
    <div className="w-80 h-full border-l border-border flex flex-col bg-card">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand" />
          <h3 className="font-display text-base font-bold text-foreground">
            Configurações
          </h3>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          {typeInfo?.label || question.type}
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mt-4 p-1 rounded-xl bg-secondary">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-body font-medium transition-all ${
                  activeTab === tab.id
                    ? "bg-card text-brand shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <TabIcon size={13} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        <AnimatePresence mode="wait">
          {/* ─── GENERAL TAB ─── */}
          {activeTab === "general" && (
            <motion.div
              key="general"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {/* Title */}
              <FieldGroup label="Título da pergunta" icon={<Type size={14} />}>
                <input
                  type="text"
                  value={question.title ?? ""}
                  onChange={(e) => onUpdate(question.id, { title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  placeholder="Digite o título..."
                />
              </FieldGroup>

              {/* Subtitle */}
              <FieldGroup label="Subtítulo (opcional)" icon={<AlignLeft size={14} />}>
                <input
                  type="text"
                  value={question.subtitle ?? ""}
                  onChange={(e) => onUpdate(question.id, { subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  placeholder="Texto auxiliar..."
                />
              </FieldGroup>

              {/* Placeholder */}
              {!isSpecial && question.type !== "yes-no" && question.type !== "rating" && question.type !== "satisfaction" && question.type !== "nps" && question.type !== "ranking" && question.type !== "matrix" && question.type !== "file-upload" && question.type !== "legal" && !hasChoices && (
                <FieldGroup label="Placeholder" icon={<Type size={14} />}>
                  <input
                    type="text"
                    value={question.placeholder ?? ""}
                    onChange={(e) => onUpdate(question.id, { placeholder: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                    placeholder="Texto do placeholder..."
                  />
                </FieldGroup>
              )}

              {/* Required toggle */}
              {!isSpecial && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary">
                  <Label className="text-sm font-body text-foreground flex items-center gap-2">
                    <ToggleLeft size={16} className="text-muted-foreground" />
                    Obrigatório
                  </Label>
                  <Switch
                    checked={question.required}
                    onCheckedChange={(checked) => onUpdate(question.id, { required: checked })}
                  />
                </div>
              )}

              {/* ─── Statement specific ─── */}
              {isStatement && (
                <>
                  {/* Button text */}
                  <FieldGroup label="Texto do botão" icon={<MousePointerClick size={14} />}>
                    <input
                      type="text"
                      value={question.buttonText ?? "Continuar"}
                      onChange={(e) => onUpdate(question.id, { buttonText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                      placeholder="Continuar"
                    />
                  </FieldGroup>

                  {/* Show button toggle */}
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary">
                    <Label className="text-sm font-body text-foreground flex items-center gap-2">
                      <MousePointerClick size={16} className="text-muted-foreground" />
                      Mostrar botão
                    </Label>
                    <Switch
                      checked={question.showButton}
                      onCheckedChange={(checked) => onUpdate(question.id, { showButton: checked })}
                    />
                  </div>
                </>
              )}

              {/* ─── Welcome / Thank-you specific ─── */}
              {isSpecialScreen && (
                <>
                  {/* Button text */}
                  <FieldGroup label="Texto do botão" icon={<MousePointerClick size={14} />}>
                    <input
                      type="text"
                      value={question.buttonText ?? ""}
                      onChange={(e) => onUpdate(question.id, { buttonText: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                      placeholder={isWelcome ? "Começar" : "Enviar outra resposta"}
                    />
                  </FieldGroup>

                  {/* Show button toggle */}
                  <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary">
                    <Label className="text-sm font-body text-foreground flex items-center gap-2">
                      <MousePointerClick size={16} className="text-muted-foreground" />
                      Mostrar botão
                    </Label>
                    <Switch
                      checked={question.showButton}
                      onCheckedChange={(checked) => onUpdate(question.id, { showButton: checked })}
                    />
                  </div>

                  {/* Thank-you: redirect URL */}
                  {isThankYou && (
                    <FieldGroup label="Redirecionar após envio" icon={<ExternalLink size={14} />}>
                      <input
                        type="url"
                        value={question.redirectUrl ?? ""}
                        onChange={(e) => onUpdate(question.id, { redirectUrl: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                        placeholder="https://seusite.com/obrigado"
                      />
                      <p className="text-xs text-muted-foreground/60 font-body mt-1">
                        Deixe vazio para mostrar a tela de agradecimento
                      </p>
                    </FieldGroup>
                  )}
                </>
              )}

              {/* Choices editor */}
              {hasChoices && (
                <FieldGroup label="Opções" icon={<Plus size={14} />}>
                  <div className="space-y-2">
                    {question.choices.map((choice, idx) => (
                      <div key={choice.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-body w-5 text-center shrink-0 font-semibold">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <input
                            type="text"
                            value={choice.label}
                            onChange={(e) =>
                              onUpdateChoice(question.id, choice.id, { label: e.target.value })
                            }
                            className="flex-1 px-3 py-2 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                            placeholder={`Opção ${idx + 1}`}
                          />
                          {question.scoringEnabled && (
                            <input
                              type="number"
                              value={choice.score ?? 0}
                              onChange={(e) =>
                                onUpdateChoice(question.id, choice.id, { score: Number(e.target.value) })
                              }
                              className="w-16 px-2 py-2 rounded-xl text-sm font-body text-foreground bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/30 focus:border-amber-300 transition-all text-center"
                              placeholder="0"
                              title="Pontuação desta opção"
                            />
                          )}
                          {question.choices.length > 2 && (
                            <button
                              onClick={() => onRemoveChoice(question.id, choice.id)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => onAddChoice(question.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-body text-muted-foreground hover:text-brand hover:border-brand/30 hover:bg-brand-lighter/20 transition-all"
                    >
                      <Plus size={14} />
                      Adicionar opção
                    </button>
                  </div>
                </FieldGroup>
              )}

              {/* Scoring toggle for ALL question types */}
              {!isSpecial && (
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-amber-50 border border-amber-200">
                  <Label className="text-sm font-body text-foreground flex items-center gap-2">
                    <Hash size={16} className="text-amber-600" />
                    Pontuação
                  </Label>
                  <Switch
                    checked={question.scoringEnabled}
                    onCheckedChange={(checked) => onUpdate(question.id, { scoringEnabled: checked })}
                  />
                </div>
              )}
              {/* Scoring hint for choice-based questions */}
              {hasChoices && question.scoringEnabled && (
                <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs font-body text-amber-700 leading-relaxed">
                  <Hash size={12} className="inline mr-1.5" />
                  Atribua uma pontuação a cada opção. A pontuação total será calculada e exibida ao final do formulário.
                </div>
              )}
              {/* Fixed score input for non-choice questions */}
              {!hasChoices && !isSpecial && question.scoringEnabled && (
                <FieldGroup label="Pontos ao responder" icon={<Hash size={14} className="text-amber-600" />}>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={question.questionScore ?? 0}
                      onChange={(e) => onUpdate(question.id, { questionScore: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300/30 focus:border-amber-300 transition-all"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-amber-600/70 font-body mt-2">
                    Pontos atribuídos quando o respondente responder esta pergunta.
                  </p>
                </FieldGroup>
              )}

              {/* Rating config */}
              {(question.type === "rating" || question.type === "satisfaction") && (
                <FieldGroup label="Escala máxima" icon={<Type size={14} />}>
                  <div className="flex items-center gap-3">
                    {[3, 4, 5, 7, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => onUpdate(question.id, { maxRating: n })}
                        className={`w-10 h-10 rounded-xl text-sm font-body font-medium transition-all ${
                          question.maxRating === n
                            ? "bg-brand text-white shadow-sm"
                            : "bg-secondary border border-border text-muted-foreground hover:text-foreground hover:border-brand/30"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </FieldGroup>
              )}

              {/* Ranking items */}
              {question.type === "ranking" && (
                <FieldGroup label="Itens para ordenar" icon={<Plus size={14} />}>
                  <div className="space-y-2">
                    {question.rankItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body w-5 text-center shrink-0 font-semibold">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const newItems = [...question.rankItems];
                            newItems[idx] = e.target.value;
                            onUpdate(question.id, { rankItems: newItems });
                          }}
                          className="flex-1 px-3 py-2 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                          placeholder={`Item ${idx + 1}`}
                        />
                        {question.rankItems.length > 2 && (
                          <button
                            onClick={() => {
                              const newItems = question.rankItems.filter((_, i) => i !== idx);
                              onUpdate(question.id, { rankItems: newItems });
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => onUpdate(question.id, { rankItems: [...question.rankItems, `Item ${question.rankItems.length + 1}`] })}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-body text-muted-foreground hover:text-brand hover:border-brand/30 hover:bg-brand-lighter/20 transition-all"
                    >
                      <Plus size={14} />
                      Adicionar item
                    </button>
                  </div>
                </FieldGroup>
              )}

              {/* Legal text */}
              {question.type === "legal" && (
                <FieldGroup label="Texto dos termos" icon={<AlignLeft size={14} />}>
                  <textarea
                    value={question.legalText ?? ""}
                    onChange={(e) => onUpdate(question.id, { legalText: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all resize-none h-28"
                    placeholder="Texto dos termos de uso..."
                  />
                </FieldGroup>
              )}
            </motion.div>
          )}

          {/* ─── MEDIA TAB ─── */}
          {activeTab === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Image URL */}
              <FieldGroup label="Imagem ou vídeo" icon={<ImagePlus size={14} />}>
                <input
                  type="url"
                  value={question.imageUrl ?? ""}
                  onChange={(e) => onUpdate(question.id, { imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  placeholder="Cole a URL da imagem..."
                />
                {question.imageUrl && (
                  <div className="mt-3 relative rounded-xl overflow-hidden border border-border">
                    <img
                      src={question.imageUrl}
                      alt="Preview"
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <button
                      onClick={() => onUpdate(question.id, { imageUrl: "" })}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground/60 font-body mt-1.5">
                  A imagem aparecerá ao lado da pergunta no formulário
                </p>
              </FieldGroup>

              {/* System Icon Picker */}
              <FieldGroup label="Ícone do sistema" icon={<Smile size={14} />}>
                <div className="space-y-3">
                  {question.iconName && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                      <div className="w-10 h-10 rounded-xl bg-brand-lighter flex items-center justify-center">
                        {(() => {
                          const found = systemIcons.find(i => i.name === question.iconName);
                          if (found) {
                            const IconComp = found.Icon;
                            return <IconComp size={20} className="text-brand" />;
                          }
                          return <Smile size={20} className="text-brand" />;
                        })()}
                      </div>
                      <span className="text-sm font-body text-foreground flex-1">
                        {systemIcons.find(i => i.name === question.iconName)?.label || question.iconName}
                      </span>
                      <button
                        onClick={() => onUpdate(question.id, { iconName: "" })}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-body text-muted-foreground hover:text-brand hover:border-brand/30 hover:bg-brand-lighter/20 transition-all"
                  >
                    <Plus size={14} />
                    {question.iconName ? "Trocar ícone" : "Escolher ícone"}
                  </button>

                  <AnimatePresence>
                    {showIconPicker && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-5 gap-2 p-3 rounded-xl bg-secondary border border-border">
                          {systemIcons.map((iconInfo) => {
                            const IconComp = iconInfo.Icon;
                            const isActive = question.iconName === iconInfo.name;
                            return (
                              <button
                                key={iconInfo.name}
                                onClick={() => {
                                  onUpdate(question.id, { iconName: iconInfo.name });
                                  setShowIconPicker(false);
                                }}
                                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                                  isActive
                                    ? "bg-brand text-white shadow-sm"
                                    : "bg-card border border-border text-muted-foreground hover:text-brand hover:border-brand/30"
                                }`}
                                title={iconInfo.label}
                              >
                                <IconComp size={16} />
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FieldGroup>

              {/* Motion Icon URL */}
              <FieldGroup label="Motion Icon (animado)" icon={<RotateCcw size={14} />}>
                <input
                  type="url"
                  value={question.motionIconUrl ?? ""}
                  onChange={(e) => onUpdate(question.id, { motionIconUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-body text-foreground bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                  placeholder="URL do ícone animado..."
                />
                {question.motionIconUrl && (
                  <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-secondary border border-border">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden">
                      <img
                        src={question.motionIconUrl}
                        alt="Motion icon"
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "";
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground/60 font-body truncate">
                        {question.motionIconUrl}
                      </p>
                    </div>
                    <button
                      onClick={() => onUpdate(question.id, { motionIconUrl: "" })}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground/60 font-body mt-1.5">
                  Use ícones de <a href="https://icons8.com/animated-icons" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Icons8</a>, <a href="https://lordicon.com" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">Lordicon</a> ou qualquer URL de GIF/SVG animado
                </p>
              </FieldGroup>
            </motion.div>
          )}

          {/* ─── LOGIC TAB ─── */}
          {activeTab === "logic" && hasConditionalLogic && (
            <motion.div
              key="logic"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-5"
            >
              <ConditionalLogicEditor
                question={question}
                onUpdate={onUpdate}
                targets={conditionalTargets}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Conditional Logic Editor ───

// Operator labels for condition-based rules
const OPERATOR_LABELS: Record<string, string> = {
  is_answered: "Foi respondida",
  is_empty: "Não foi respondida",
  equals: "É igual a",
  not_equals: "Não é igual a",
  contains: "Contém",
  not_contains: "Não contém",
  greater_than: "Maior que",
  less_than: "Menor que",
  greater_equal: "Maior ou igual a",
  less_equal: "Menor ou igual a",
};

// Operators that don't need a value input
const NO_VALUE_OPERATORS = new Set(["is_answered", "is_empty"]);

// Operators available per question category
function getOperatorsForType(type: string): string[] {
  const base = ["is_answered", "is_empty"];
  const text = ["equals", "not_equals", "contains", "not_contains"];
  const numeric = ["equals", "not_equals", "greater_than", "less_than", "greater_equal", "less_equal"];

  switch (type) {
    case "number":
    case "currency":
    case "nps":
    case "rating":
    case "satisfaction":
      return [...base, ...numeric];
    case "date":
      return [...base, "equals", "not_equals"];
    case "file-upload":
    case "address":
    case "matrix":
    case "ranking":
      return base;
    default:
      return [...base, ...text];
  }
}

function ConditionalLogicEditor({
  question,
  onUpdate,
  targets,
}: {
  question: BuilderQuestion;
  onUpdate: (id: string, updates: Partial<BuilderQuestion>) => void;
  targets: { id: string; label: string; type: string }[];
}) {
  const logic = question.conditionalLogic ?? { enabled: false, branches: [], rules: [], scoreRules: [], defaultGoTo: "next" };
  const isYesNo = question.type === "yes-no";
  const typeInfo = questionTypes.find((t) => t.type === question.type);
  const hasChoices = typeInfo?.hasChoices || isYesNo;

  const choices = isYesNo
    ? [
        { id: "yes", label: "Sim" },
        { id: "no", label: "Não" },
      ]
    : question.choices;

  const toggleLogic = (enabled: boolean) => {
    if (hasChoices) {
      onUpdate(question.id, {
        conditionalLogic: {
          ...logic,
          enabled,
          branches: enabled
            ? choices.map((c) => ({
                choiceId: c.id,
                goToQuestionId: "next",
              }))
            : [],
          rules: logic.rules ?? [],
        },
      });
    } else {
      onUpdate(question.id, {
        conditionalLogic: {
          ...logic,
          enabled,
          branches: logic.branches ?? [],
          rules: enabled && (logic.rules ?? []).length === 0
            ? [{ id: `rule_${Date.now()}`, operator: "is_answered" as ConditionOperator, value: "", goToQuestionId: "next" }]
            : logic.rules ?? [],
        },
      });
    }
  };

  // Choice-based branch update
  const updateBranch = (choiceId: string, goToQuestionId: string) => {
    const newBranches = (logic.branches ?? []).map((b) =>
      b.choiceId === choiceId ? { ...b, goToQuestionId } : b
    );
    if (!newBranches.find((b) => b.choiceId === choiceId)) {
      newBranches.push({ choiceId, goToQuestionId });
    }
    onUpdate(question.id, {
      conditionalLogic: { ...logic, branches: newBranches },
    });
  };

  // Condition-based rule CRUD
  const addRule = () => {
    const newRule: ConditionalRule = { id: `rule_${Date.now()}`, operator: "is_answered", value: "", goToQuestionId: "next" };
    const newRules: ConditionalRule[] = [...(logic.rules ?? []), newRule];
    onUpdate(question.id, {
      conditionalLogic: { ...logic, rules: newRules },
    });
  };

  const updateRule = (ruleId: string, updates: Partial<{ operator: ConditionOperator; value: string; goToQuestionId: string }>) => {
    const newRules: ConditionalRule[] = (logic.rules ?? []).map((r) =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    onUpdate(question.id, {
      conditionalLogic: { ...logic, rules: newRules },
    });
  };

  const removeRule = (ruleId: string) => {
    const newRules = (logic.rules ?? []).filter((r) => r.id !== ruleId);
    onUpdate(question.id, {
      conditionalLogic: { ...logic, rules: newRules },
    });
  };

  const updateDefaultGoTo = (goTo: string) => {
    onUpdate(question.id, {
      conditionalLogic: { ...logic, defaultGoTo: goTo },
    });
  };

  // Score-based rule CRUD
  const addScoreRule = () => {
    const newRule: ScoreRule = { id: `sr_${Date.now()}`, scoreMin: 0, scoreMax: null, goToQuestionId: "next" };
    const newScoreRules: ScoreRule[] = [...(logic.scoreRules ?? []), newRule];
    onUpdate(question.id, {
      conditionalLogic: { ...logic, scoreRules: newScoreRules },
    });
  };

  const updateScoreRule = (ruleId: string, updates: Partial<{ scoreMin: number | null; scoreMax: number | null; goToQuestionId: string }>) => {
    const newScoreRules: ScoreRule[] = (logic.scoreRules ?? []).map((r) =>
      r.id === ruleId ? { ...r, ...updates } : r
    );
    onUpdate(question.id, {
      conditionalLogic: { ...logic, scoreRules: newScoreRules },
    });
  };

  const removeScoreRule = (ruleId: string) => {
    const newScoreRules = (logic.scoreRules ?? []).filter((r) => r.id !== ruleId);
    onUpdate(question.id, {
      conditionalLogic: { ...logic, scoreRules: newScoreRules },
    });
  };

  const availableOperators = getOperatorsForType(question.type);

  return (
    <div className="space-y-5">
      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-secondary">
        <Label className="text-sm font-body text-foreground flex items-center gap-2">
          <GitBranch size={16} className="text-brand" />
          Lógica condicional
        </Label>
        <Switch
          checked={logic.enabled}
          onCheckedChange={toggleLogic}
        />
      </div>

      {logic.enabled && hasChoices && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-body">
            Defina para onde o formulário vai após cada resposta:
          </p>

          {choices.map((choice) => {
            const branch = (logic.branches ?? []).find((b) => b.choiceId === choice.id);
            const currentTarget = branch?.goToQuestionId || "next";

            return (
              <div
                key={choice.id}
                className="rounded-xl border border-border p-4 space-y-3 bg-secondary/50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-body font-bold bg-brand-lighter text-brand">
                    {isYesNo ? (choice.id === "yes" ? "S" : "N") : String.fromCharCode(65 + choices.indexOf(choice))}
                  </div>
                  <span className="text-sm font-body text-foreground flex-1 truncate font-medium">
                    {choice.label}
                  </span>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                </div>

                <select
                  value={currentTarget}
                  onChange={(e) => updateBranch(choice.id, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all appearance-none"
                >
                  <option value="next">Próxima pergunta (padrão)</option>
                  <option value="end">Ir para agradecimento</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}

          {/* Info box */}
          <div className="mt-3 p-4 rounded-xl border border-brand/10 bg-brand-lighter/30 text-sm font-body text-brand-dark leading-relaxed">
            <GitBranch size={14} className="inline mr-2" />
            Cada opção pode direcionar o respondente para uma pergunta diferente, criando fluxos personalizados.
          </div>
        </div>
      )}

      {/* Score-based rules section — available for ALL question types when logic is enabled */}
      {logic.enabled && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 py-2">
            <Trophy size={16} className="text-amber-500" />
            <p className="text-sm font-body font-semibold text-foreground">
              Regras por pontuação total
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-body">
            Direcione o fluxo com base na pontuação acumulada até esta pergunta.
          </p>

          {(logic.scoreRules ?? []).map((sr, idx) => (
            <div
              key={sr.id}
              className="rounded-xl border border-amber-200 p-4 space-y-3 bg-amber-50/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-body font-semibold text-amber-700 uppercase tracking-wide">
                  Regra de pontuação {idx + 1}
                </span>
                <button
                  onClick={() => removeScoreRule(sr.id)}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-body text-muted-foreground mb-1 block">Pontuação mínima</label>
                  <input
                    type="number"
                    value={sr.scoreMin ?? ""}
                    onChange={(e) => updateScoreRule(sr.id, { scoreMin: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="Sem mínimo"
                    className="w-full px-3 py-2 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-body text-muted-foreground mb-1 block">Pontuação máxima</label>
                  <input
                    type="number"
                    value={sr.scoreMax ?? ""}
                    onChange={(e) => updateScoreRule(sr.id, { scoreMax: e.target.value === "" ? null : Number(e.target.value) })}
                    placeholder="Sem máximo"
                    className="w-full px-3 py-2 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400/40 transition-all"
                  />
                </div>
              </div>

              {/* Target select */}
              <div className="flex items-center gap-2">
                <ArrowRight size={14} className="text-amber-600 shrink-0" />
                <select
                  value={sr.goToQuestionId}
                  onChange={(e) => updateScoreRule(sr.id, { goToQuestionId: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:border-amber-400/40 transition-all appearance-none"
                >
                  <option value="next">Próxima pergunta (padrão)</option>
                  <option value="end">Ir para agradecimento</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {/* Add score rule button */}
          <button
            onClick={addScoreRule}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-amber-300 text-sm font-body text-amber-600 hover:border-amber-400 hover:text-amber-700 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            Adicionar regra de pontuação
          </button>

          {(logic.scoreRules ?? []).length > 0 && (
            <div className="p-4 rounded-xl border border-amber-200/50 bg-amber-50/30 text-sm font-body text-amber-700 leading-relaxed">
              <Trophy size={14} className="inline mr-2" />
              As regras de pontuação avaliam a pontuação total acumulada até esta pergunta. A primeira regra que corresponder será usada.
            </div>
          )}
        </div>
      )}

      {logic.enabled && !hasChoices && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-body">
            Defina regras condicionais baseadas na resposta:
          </p>

          {(logic.rules ?? []).map((rule, idx) => (
            <div
              key={rule.id}
              className="rounded-xl border border-border p-4 space-y-3 bg-secondary/50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
                  Regra {idx + 1}
                </span>
                <button
                  onClick={() => removeRule(rule.id)}
                  className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Operator select */}
              <select
                value={rule.operator}
                onChange={(e) => updateRule(rule.id, { operator: e.target.value as ConditionOperator, value: NO_VALUE_OPERATORS.has(e.target.value) ? "" : rule.value })}
                className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all appearance-none"
              >
                {availableOperators.map((op) => (
                  <option key={op} value={op}>
                    {OPERATOR_LABELS[op] || op}
                  </option>
                ))}
              </select>

              {/* Value input (hidden for is_answered/is_empty) */}
              {!NO_VALUE_OPERATORS.has(rule.operator) && (
                <input
                  type={["number", "currency", "nps", "rating", "satisfaction"].includes(question.type) ? "number" : "text"}
                  value={rule.value}
                  onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                  placeholder="Valor para comparação..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all"
                />
              )}

              {/* Target select */}
              <div className="flex items-center gap-2">
                <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                <select
                  value={rule.goToQuestionId}
                  onChange={(e) => updateRule(rule.id, { goToQuestionId: e.target.value })}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all appearance-none"
                >
                  <option value="next">Próxima pergunta (padrão)</option>
                  <option value="end">Ir para agradecimento</option>
                  {targets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {/* Add rule button */}
          <button
            onClick={addRule}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-body text-muted-foreground hover:border-brand/40 hover:text-brand transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            Adicionar regra
          </button>

          {/* Default destination */}
          <div className="rounded-xl border border-border p-4 space-y-3 bg-secondary/30">
            <span className="text-xs font-body font-semibold text-muted-foreground uppercase tracking-wide">
              Se nenhuma regra corresponder
            </span>
            <select
              value={logic.defaultGoTo || "next"}
              onChange={(e) => updateDefaultGoTo(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm font-body text-foreground bg-input border border-border focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all appearance-none"
            >
              <option value="next">Próxima pergunta (padrão)</option>
              <option value="end">Ir para agradecimento</option>
              {targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Info box */}
          <div className="mt-3 p-4 rounded-xl border border-brand/10 bg-brand-lighter/30 text-sm font-body text-brand-dark leading-relaxed">
            <GitBranch size={14} className="inline mr-2" />
            As regras são avaliadas de cima para baixo. A primeira regra que corresponder à resposta será usada para direcionar o fluxo.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Field Group ───

function FieldGroup({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="text-sm font-body font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}
