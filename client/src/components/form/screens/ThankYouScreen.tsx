/**
 * FormFlow Thank You Screen — Clean completion screen with protocol code.
 * Shows animated checkmark, protocol code prominently, and motivational message.
 * Adapts to design settings (colors, font, logo).
 */

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { CheckCircle2, ExternalLink, Copy, Check } from "lucide-react";

interface DesignProps {
  backgroundColor?: string;
  questionColor?: string;
  answerColor?: string;
  buttonColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  backgroundImage?: string;
  backgroundType?: string;
}

export interface ThankYouScreenProps {
  question: Question;
  design?: DesignProps;
  protocolCode?: string | null;
  totalScore?: number | null;
}

export function ThankYouScreen({ question, design, protocolCode, totalScore: _totalScore }: ThankYouScreenProps) {
  const bgColor = design?.backgroundColor || "#FFFFFF";
  const buttonColor = design?.buttonColor || "#3B82F6";
  const fontFamily = design?.fontFamily || "Plus Jakarta Sans, sans-serif";
  const showButton = question.showButton === true;
  const buttonText = question.buttonText || "Enviar outra resposta";
  const redirectUrl = question.redirectUrl;
  const logoUrl = design?.logoUrl;

  const isLightBg = isLightColor(bgColor);
  const textColor = isLightBg ? "#1E293B" : "#FFFFFF";
  const subtitleColor = isLightBg ? "rgba(30,41,59,0.6)" : "rgba(255,255,255,0.65)";
  const btnTextColor = isLightColor(buttonColor) ? "#1E293B" : "#FFFFFF";
  const checkColor = isLightBg ? "#10B981" : "#34D399";

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!protocolCode) return;
    navigator.clipboard.writeText(protocolCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = protocolCode;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silently fail
      }
      document.body.removeChild(textArea);
    });
  }, [protocolCode]);

  // Auto-redirect if URL is set
  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => {
        window.open(redirectUrl, "_blank");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [redirectUrl]);

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: design?.backgroundType ? 'transparent' : bgColor, fontFamily }}
    >
      {/* Logo top-left */}
      {logoUrl && (
        <motion.div
          className="absolute top-4 left-4 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-16 lg:h-28 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </motion.div>
      )}

      {/* Centered content */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-lg mx-auto">
        {/* Checkmark animation */}
        <motion.div
          className="mb-5 w-16 h-16 rounded-full flex items-center justify-center mx-auto"
          style={{
            backgroundColor: isLightBg ? "rgba(16,185,129,0.1)" : "rgba(52,211,153,0.15)",
            border: `2px solid ${isLightBg ? "rgba(16,185,129,0.25)" : "rgba(52,211,153,0.3)"}`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
          >
            <CheckCircle2 size={36} style={{ color: checkColor }} strokeWidth={1.5} />
          </motion.div>
        </motion.div>

        {/* Title — "Cadastro completo!" or custom */}
        <motion.h1
          className="leading-tight tracking-tight text-xl sm:text-2xl md:text-[28px]"
          style={{ color: textColor, fontFamily, fontWeight: 600 }}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {question.title}
        </motion.h1>

        {/* Total Score — kept in props for internal analytics, but NOT displayed to respondent */}

        {/* Protocol Code — prominently displayed */}
        {protocolCode && (
          <motion.div
            className="mt-5 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <p
              className="text-xs uppercase tracking-widest mb-2 font-medium"
              style={{ color: subtitleColor, fontFamily }}
            >
              Seu código de protocolo
            </p>
            <div
              className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl cursor-pointer transition-all duration-200"
              style={{
                backgroundColor: isLightBg ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.08)",
                border: `1.5px solid ${isLightBg ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)"}`,
              }}
              onClick={handleCopy}
              title="Clique para copiar"
            >
              <span
                className="font-mono tracking-wider"
                style={{
                  color: textColor,
                  fontSize: "clamp(18px, 4vw, 22px)",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                }}
              >
                {protocolCode}
              </span>
              <motion.div
                key={copied ? "check" : "copy"}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                {copied ? (
                  <Check size={18} style={{ color: checkColor }} />
                ) : (
                  <Copy size={18} style={{ color: subtitleColor }} />
                )}
              </motion.div>
            </div>
            {copied && (
              <motion.p
                className="text-xs mt-1.5"
                style={{ color: checkColor }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Copiado!
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Motivational message */}
        <motion.div
          className="mt-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Custom subtitle or default motivational message */}
          {question.subtitle ? (
            <p
              className="leading-relaxed"
              style={{ color: subtitleColor, fontFamily, fontSize: "16px", fontWeight: 400 }}
            >
              {question.subtitle}
            </p>
          ) : protocolCode ? (
            <div style={{ color: subtitleColor, fontFamily }}>
              <p
                className="leading-relaxed"
                style={{ fontSize: "15px", fontWeight: 400 }}
              >
                Envie para o seu corretor poder prosseguir com o seu atendimento.
              </p>
              <p
                className="mt-4 leading-relaxed"
                style={{
                  fontSize: "16px",
                  fontWeight: 500,
                  color: isLightBg ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.8)",
                }}
              >
                Você está quase lá.
                <br />
                Falta pouco para o seu próximo apartamento.
              </p>
            </div>
          ) : null}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          className="mt-7 flex flex-col items-center gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {showButton && (
            <motion.button
              onClick={() => window.location.reload()}
              className="px-5 sm:px-7 py-2.5 sm:py-3 rounded-lg font-medium shadow-lg transition-all text-sm sm:text-base"
              style={{
                backgroundColor: buttonColor,
                color: btnTextColor,
                fontFamily,
                fontSize: "16px",
                fontWeight: 400,
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              {buttonText}
            </motion.button>
          )}

          {redirectUrl && (
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
              style={{ color: isLightBg ? buttonColor : "rgba(255,255,255,0.8)" }}
            >
              <ExternalLink size={14} />
              Visitar link
            </a>
          )}
        </motion.div>

        {/* Redirect notice */}
        {redirectUrl && (
          <motion.p
            className="mt-4 text-xs"
            style={{ color: subtitleColor }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            Você será redirecionado em 5 segundos...
          </motion.p>
        )}
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return true;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}
