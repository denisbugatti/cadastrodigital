/**
 * BuilderLivePreview — Central panel showing a live preview of the selected question
 * Inline-editable title and subtitle, styled like the actual form.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
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
}

export function BuilderLivePreview({
  question,
  design,
  questionNumber,
  totalQuestions,
  onUpdateTitle,
  onUpdateSubtitle,
}: BuilderLivePreviewProps) {
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

  return (
    <div className="h-full flex flex-col bg-secondary/30">
      {/* Preview container */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl"
        >
          {/* Preview card */}
          <div
            className="rounded-2xl overflow-hidden shadow-xl border border-border"
            style={{
              background: design.backgroundColor,
              minHeight: "400px",
            }}
          >
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
              <div className="pt-8 px-8">
                <img
                  src={design.logoUrl}
                  alt="Logo"
                  className="h-10 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}

            <div className={`p-8 ${isSpecial ? "text-center flex flex-col items-center justify-center min-h-[300px]" : ""}`}>
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

              {/* Button for welcome/thank-you/statement */}
              {(isSpecial || isStatement) && question.showButton && (
                <button
                  className="mt-6 px-8 py-3 rounded-lg text-sm font-semibold text-white transition-all inline-flex items-center gap-2"
                  style={{
                    backgroundColor: design.buttonColor,
                    fontFamily: design.fontFamily,
                  }}
                >
                  {question.buttonText || "Continuar"}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Footer hint */}
          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground/50 font-body">
              {typeInfo?.label} {!isSpecial && `· Pergunta ${questionNumber} de ${totalQuestions}`}
            </p>
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
          className="border-2 border-dashed rounded-xl p-8 text-center"
          style={{ borderColor: `${design.answerColor}30` }}
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
