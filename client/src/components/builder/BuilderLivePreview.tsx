/**
 * BuilderLivePreview — Central panel showing a live preview of the selected question
 * Inline-editable title and subtitle, styled like the actual form.
 */

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
  Minus, AlignLeft, MessageSquare, Hash, DollarSign, Link,
  CircleDot, ChevronDown, Image, ToggleLeft, CheckSquare,
  Smile, Star, Gauge, ArrowUpDown, Grid3X3,
  Calendar, Upload, Hand, Heart, ShieldCheck, Sparkles,
  ArrowRight,
} from "lucide-react";
import type { BuilderQuestion, FormDesignSettings } from "@/lib/builderTypes";
import { questionTypes } from "@/lib/builderTypes";
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
import { getButtonStyleClasses } from "@/hooks/useInputStyle";
import type { InputStyleType } from "@/hooks/useInputStyle";

const _iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  user: User, mail: Mail, phone: Phone, fingerprint: Fingerprint,
  "building-2": Building2, "id-card": IdCard, "map-pin": MapPin,
  minus: Minus, "align-left": AlignLeft, "message-square": MessageSquare,
  hash: Hash, "dollar-sign": DollarSign, link: Link,
  "circle-dot": CircleDot, "chevron-down": ChevronDown, image: Image,
  "toggle-left": ToggleLeft, "check-square": CheckSquare,
  smile: Smile, star: Star, gauge: Gauge, "arrow-up-down": ArrowUpDown,
  "grid-3x3": Grid3X3, calendar: Calendar, upload: Upload,
  hand: Hand, heart: Heart, "shield-check": ShieldCheck,
  sparkles: Sparkles,
};

interface BuilderLivePreviewProps {
  question: BuilderQuestion | null;
  design: FormDesignSettings;
  questionNumber: number;
  totalQuestions: number;
  onUpdateTitle: (title: string) => void;
  onUpdateSubtitle: (subtitle: string) => void;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  allQuestions?: BuilderQuestion[];
}

export function BuilderLivePreview({
  question,
  design,
  questionNumber,
  totalQuestions,
  onUpdateTitle,
  onUpdateSubtitle,
  onNavigatePrev,
  onNavigateNext,
  hasPrev = false,
  hasNext = false,
}: BuilderLivePreviewProps) {
  const [isMobile, setIsMobile] = useState(false);

  if (!question) {
    return (
      <div className="h-full flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <MessageSquare size={40} className="mx-auto text-muted-foreground/20 mb-4" />
          <p className="text-muted-foreground/60 font-body text-lg">
            Selecione uma pergunta para editar
          </p>
        </div>
      </div>
    );
  }

  const typeInfo = questionTypes.find((t) => t.type === question.type);
  const isWelcome = question.type === "welcome";
  const isThankYou = question.type === "thank-you";
  const isStatement = question.type === "statement";
  const isSpecial = isWelcome || isThankYou;
  const inputStyleType = (design.inputStyle || "default") as InputStyleType;
  const btnStyle = getButtonStyleClasses(inputStyleType, design.buttonColor || "#3B82F6", design.buttonTextColor || "#FFFFFF");

  return (
    <div className="h-full flex flex-col bg-secondary/30">
      {/* Top toolbar: navigation + device toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm">
        {/* Navigation arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={onNavigatePrev}
            disabled={!hasPrev}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Pergunta anterior (↑)"
          >
            <ArrowRight size={15} className="rotate-180" />
          </button>
          <button
            onClick={onNavigateNext}
            disabled={!hasNext}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            title="Próxima pergunta (↓)"
          >
            <ArrowRight size={15} />
          </button>
          <span className="text-xs font-body text-muted-foreground/50 ml-1">
            {!isSpecial && !isStatement ? `${questionNumber} / ${totalQuestions}` : typeInfo?.label || ""}
          </span>
        </div>

        {/* Device toggle */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
          <button
            onClick={() => setIsMobile(false)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
              !isMobile
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
            Desktop
          </button>
          <button
            onClick={() => setIsMobile(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-body font-medium transition-all ${
              isMobile
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2"/>
              <path d="M12 18h.01"/>
            </svg>
            Mobile
          </button>
        </div>
      </div>

      {/* Preview container */}
      <div className="flex-1 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-auto">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={isMobile ? "w-[375px] max-w-full" : "w-full max-w-xl"}
        >
          {/* Mobile frame wrapper */}
          {isMobile && (
            <div className="relative">
              {/* Phone frame */}
              <div className="absolute -inset-3 rounded-[2.5rem] border-[8px] border-foreground/10 bg-foreground/5 pointer-events-none z-20" />
              {/* Notch */}
              <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 w-20 h-4 bg-foreground/10 rounded-b-xl z-30" />
            </div>
          )}
          {/* Preview card */}
          <div
            className={`overflow-hidden shadow-xl border border-border relative ${isMobile ? "rounded-[1.5rem]" : "rounded-2xl"}`}
            style={{
              background: design.backgroundColor,
              minHeight: isMobile ? "600px" : "400px",
            }}
          >
            {/* Animated backgrounds */}
            {(() => {
              const bgColors = design.backgroundColors || [];
              const c = (i: number, fallback: string) => bgColors[i] || fallback;
              const bgType = design.backgroundType || "paths";
              return (
                <div className="absolute inset-0 pointer-events-none z-0">
                  {bgType === "paths" && (
                    <div className="absolute inset-0" style={{ color: c(0, "rgba(112, 190, 250, 0.55)") }}>
                      <BackgroundPaths />
                    </div>
                  )}
                  {bgType === "aurora" && (
                    <AuroraBackground className="!h-full !min-h-0 dark" showRadialGradient={true} />
                  )}
                  {bgType === "shaders" && <BackgroundShaders colors={bgColors.length > 0 ? bgColors : undefined} />}
                  {bgType === "gradient" && <BackgroundGradientAnimation interactive={false} />}
                  {bgType === "beams" && <BeamsBackground />}
                  {bgType === "etheral" && <EtheralShadow color={c(0, "rgba(100, 100, 200, 1)")} />}
                  {bgType === "falling" && <FallingPattern color={c(0, "#6366f1")} />}
                  {bgType === "dots" && <GradientDots backgroundColor={c(0, "#030303")} />}
                  {bgType === "spotlight" && <SpotlightBackground colors={bgColors.length > 0 ? bgColors : undefined} />}
                  {bgType === "plasma" && <ShaderPlasma />}
                  {bgType === "stars" && <StarsBackground colors={bgColors.length > 0 ? bgColors : undefined} />}
                  {bgType === "aurora-beams" && <AuroraBeams color={c(0, "#00ffcc")} />}
                  {bgType === "flow-field" && <FlowField color={c(0, "#6366f1")} />}
                </div>
              );
            })()}
            {/* Image if set */}
            {question.imageUrl && (
              <div className="h-40 overflow-hidden">
                <img
                  src={question.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            {/* Logo for welcome/thank-you */}
            {isSpecial && design.logoUrl && (
              <div className="pt-4 px-4 sm:pt-6 sm:px-6 md:pt-8 md:px-8">
                <img
                  src={design.logoUrl}
                  alt="Logo"
                  className="h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            <div className={`p-4 sm:p-6 md:p-8 relative z-10 ${isSpecial ? "text-center flex flex-col items-center justify-center min-h-[300px]" : ""}`}>
              {/* Question number */}
              {!isSpecial && !isStatement && (
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="text-sm font-body font-bold"
                    style={{ color: design.answerColor }}
                  >
                    {questionNumber}
                  </span>
                  <ArrowRight size={14} style={{ color: design.answerColor }} />
                </div>
              )}

              {/* Editable title */}
              <EditableText
                value={question.title}
                onChange={onUpdateTitle}
                placeholder={isWelcome ? "Título de boas-vindas..." : isThankYou ? "Título de agradecimento..." : "Digite o título da pergunta..."}
                className={`font-display font-bold leading-tight ${isSpecial ? "text-2xl" : "text-xl"}`}
                style={{
                  color: design.questionColor,
                  fontFamily: design.fontFamily,
                }}
              />

              {/* Editable subtitle */}
              <EditableText
                value={question.subtitle}
                onChange={onUpdateSubtitle}
                placeholder="Descrição (opcional)"
                className="text-sm mt-2 opacity-60"
                style={{
                  color: design.questionColor,
                  fontFamily: design.fontFamily,
                }}
              />

              {/* Input preview */}
              <div className="mt-6">
                <InputPreview question={question} design={design} />
              </div>

              {/* Button for welcome/thank-you/statement — styled to match inputStyle */}
              {(isSpecial || isStatement) && question.showButton && (
                <div className="mt-6">
                  {btnStyle.needsGradientWrapper ? (
                    <div className={btnStyle.gradientWrapperClasses + " inline-flex"}>
                      <button
                        className={btnStyle.gradientInnerClasses + " text-sm font-semibold transition-all inline-flex items-center gap-2 px-8 py-3"}
                        style={{ fontFamily: design.fontFamily }}
                      >
                        {question.buttonText || "Continuar"}
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className={`text-sm font-semibold transition-all inline-flex items-center gap-2 ${btnStyle.buttonClasses}`}
                      style={{
                        ...btnStyle.buttonStyles,
                        fontFamily: design.fontFamily,
                        ...(inputStyleType === "default" ? { backgroundColor: design.buttonColor, color: design.buttonTextColor || "#FFFFFF" } : {}),
                      }}
                    >
                      {question.buttonText || "Continuar"}
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer hint */}
          <div className="mt-4 text-center flex items-center justify-center gap-3">
            <p className="text-xs text-muted-foreground/40 font-body">
              {typeInfo?.label}
            </p>
            {!isSpecial && !isStatement && (
              <>
                <span className="text-muted-foreground/20">·</span>
                <p className="text-xs text-muted-foreground/40 font-body">
                  Clique no título para editar
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Editable Text ─── */

function EditableText({
  value,
  onChange,
  placeholder,
  className = "",
  style,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setIsEditing(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            setIsEditing(false);
          }
        }}
        placeholder={placeholder}
        className={`w-full bg-transparent border-none outline-none resize-none ${className}`}
        style={style}
        rows={Math.max(1, Math.ceil(value.length / 40))}
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-text rounded-lg transition-all hover:bg-black/5 px-1 -mx-1 ${className}`}
      style={style}
    >
      {value || <span className="opacity-30">{placeholder}</span>}
    </div>
  );
}

/* ─── Input Preview ─── */

function InputPreview({
  question,
  design,
}: {
  question: BuilderQuestion;
  design: FormDesignSettings;
}) {
  const inputStyle: React.CSSProperties = {
    color: design.answerColor,
    borderColor: `${design.answerColor}40`,
    fontFamily: design.fontFamily,
  };

  switch (question.type) {
    case "name":
    case "email":
    case "phone":
    case "cpf":
    case "cnpj":
    case "identity-doc":
    case "short-text":
    case "number":
    case "currency":
    case "link":
      return (
        <div
          className="border-b-2 pb-2 text-lg opacity-40"
          style={inputStyle}
        >
          {question.placeholder || "Digite sua resposta..."}
        </div>
      );

    case "long-text":
      return (
        <div
          className="border-b-2 pb-2 text-lg opacity-40 min-h-[60px]"
          style={inputStyle}
        >
          {question.placeholder || "Escreva sua resposta..."}
        </div>
      );

    case "multiple-choice":
    case "checkbox":
      return (
        <div className="space-y-2">
          {question.choices.map((choice, idx) => (
            <div
              key={choice.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border transition-all hover:opacity-80"
              style={{
                borderColor: `${design.answerColor}30`,
                fontFamily: design.fontFamily,
              }}
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border"
                style={{
                  borderColor: design.answerColor,
                  color: design.answerColor,
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span style={{ color: design.questionColor }}>
                {choice.label}
              </span>
            </div>
          ))}
        </div>
      );

    case "dropdown":
      return (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-lg border"
          style={{
            borderColor: `${design.answerColor}30`,
            color: `${design.questionColor}60`,
            fontFamily: design.fontFamily,
          }}
        >
          <span>Selecione uma opção...</span>
          <ChevronDown size={16} />
        </div>
      );

    case "yes-no":
      return (
        <div className="flex gap-3">
          {["Sim", "Não"].map((label, idx) => (
            <div
              key={label}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all hover:opacity-80"
              style={{
                borderColor: `${design.answerColor}30`,
                color: design.questionColor,
                fontFamily: design.fontFamily,
              }}
            >
              <span
                className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold border"
                style={{
                  borderColor: design.answerColor,
                  color: design.answerColor,
                }}
              >
                {idx === 0 ? "S" : "N"}
              </span>
              {label}
            </div>
          ))}
        </div>
      );

    case "rating":
      return (
        <div className="flex gap-2">
          {Array.from({ length: question.maxRating }, (_, i) => (
            <Star
              key={i}
              size={28}
              className="transition-all"
              style={{ color: i < 2 ? design.answerColor : `${design.answerColor}30` }}
              fill={i < 2 ? design.answerColor : "transparent"}
            />
          ))}
        </div>
      );

    case "satisfaction":
      return (
        <div className="flex gap-3 justify-center">
          {["😡", "😕", "😐", "🙂", "😍"].slice(0, question.maxRating).map((emoji, i) => (
            <span key={i} className="text-3xl opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              {emoji}
            </span>
          ))}
        </div>
      );

    case "nps":
      return (
        <div className="flex gap-1">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="flex-1 h-10 rounded-md flex items-center justify-center text-xs font-bold border transition-all"
              style={{
                borderColor: `${design.answerColor}20`,
                color: design.questionColor,
                fontFamily: design.fontFamily,
              }}
            >
              {i}
            </div>
          ))}
        </div>
      );

    case "date":
      return (
        <div className="flex items-center gap-3">
          <Calendar size={20} style={{ color: design.answerColor }} />
          <div
            className="border-b-2 pb-2 text-lg opacity-40 flex-1"
            style={inputStyle}
          >
            DD/MM/AAAA
          </div>
        </div>
      );

    case "file-upload":
      return (
        <div
          className="border-dashed rounded-xl p-8 text-center"
          style={{ borderColor: `${design.answerColor}30`, borderWidth: '7px' }}
        >
          <Upload size={32} className="mx-auto mb-3 opacity-30" style={{ color: design.answerColor }} />
          <p className="text-sm opacity-40" style={{ color: design.questionColor, fontFamily: design.fontFamily }}>
            Arraste ou clique para enviar
          </p>
        </div>
      );

    case "address":
      return (
        <div className="space-y-3">
          <div className="border-b-2 pb-2 text-sm opacity-40" style={inputStyle}>
            <span className="text-xs uppercase tracking-wider opacity-60">CEP</span>
            <div>00000-000</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="border-b-2 pb-2 text-sm opacity-40" style={inputStyle}>
              <span className="text-xs uppercase tracking-wider opacity-60">Rua</span>
              <div>Nome da rua</div>
            </div>
            <div className="border-b-2 pb-2 text-sm opacity-40" style={inputStyle}>
              <span className="text-xs uppercase tracking-wider opacity-60">Número</span>
              <div>123</div>
            </div>
          </div>
        </div>
      );

    case "image-choice":
      return (
        <div className="grid grid-cols-2 gap-3">
          {question.choices.map((choice) => (
            <div
              key={choice.id}
              className="rounded-xl border overflow-hidden"
              style={{ borderColor: `${design.answerColor}30` }}
            >
              <div className="h-20 bg-secondary flex items-center justify-center">
                <Image size={24} className="opacity-20" />
              </div>
              <div className="p-2 text-center text-sm" style={{ color: design.questionColor, fontFamily: design.fontFamily }}>
                {choice.label}
              </div>
            </div>
          ))}
        </div>
      );

    case "welcome":
    case "thank-you":
    case "statement":
    case "legal":
      return null;

    default:
      return (
        <div
          className="border-b-2 pb-2 text-lg opacity-40"
          style={inputStyle}
        >
          {question.placeholder || "..."}
        </div>
      );
  }
}
