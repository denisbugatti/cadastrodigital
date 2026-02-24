/**
 * FormFlow Thank You Screen (Light Theme)
 * Clean celebration screen with checkmark animation, custom media, and redirect support.
 */

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import {
  CheckCircle2, ExternalLink,
  User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
  Minus, AlignLeft, MessageSquare, Hash, DollarSign, Link,
  CircleDot, ChevronDown, Image, ToggleLeft, CheckSquare,
  Smile, Star, Gauge, ArrowUpDown, Grid3X3,
  Calendar, Upload, Hand, Heart, ShieldCheck, Sparkles,
} from "lucide-react";

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

interface ThankYouScreenProps {
  question: Question;
}

export function ThankYouScreen({ question }: ThankYouScreenProps) {
  const hasImage = !!question.imageUrl;
  const hasMotionIcon = !!question.motionIconUrl;
  const hasSystemIcon = !!question.iconName;
  const showButton = question.showButton === true;
  const buttonText = question.buttonText || "Enviar outra resposta";
  const redirectUrl = question.redirectUrl;

  // Auto-redirect if URL is set
  useEffect(() => {
    if (redirectUrl) {
      const timer = setTimeout(() => {
        window.open(redirectUrl, "_blank");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [redirectUrl]);

  return (
    <div className={`flex ${hasImage ? "flex-row items-stretch" : "flex-col items-center text-center"} w-full max-w-4xl mx-auto gap-8`}>
      {/* Image side (if set) */}
      {hasImage && (
        <motion.div
          className="w-1/2 rounded-2xl overflow-hidden shrink-0"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <img
            src={question.imageUrl}
            alt=""
            className="w-full h-full object-cover min-h-[400px]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </motion.div>
      )}

      {/* Content side */}
      <div className={`flex flex-col ${hasImage ? "w-1/2 justify-center" : "items-center"}`}>
        {/* Animated icon area */}
        {hasMotionIcon ? (
          <motion.div
            className="mb-8 w-24 h-24 rounded-full flex items-center justify-center bg-emerald-50 border-2 border-emerald-200 overflow-hidden"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          >
            <img
              src={question.motionIconUrl}
              alt=""
              className="w-16 h-16 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </motion.div>
        ) : hasSystemIcon ? (
          <motion.div
            className="mb-8 w-24 h-24 rounded-full flex items-center justify-center bg-emerald-50 border-2 border-emerald-200"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
            >
              {(() => {
                const IconComp = iconMap[question.iconName!] || CheckCircle2;
                return <IconComp size={44} className="text-emerald-500" />;
              })()}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="mb-8 w-24 h-24 rounded-full flex items-center justify-center bg-emerald-50 border-2 border-emerald-200"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 400, damping: 15 }}
            >
              <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          className={`font-display ${hasImage ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"} font-bold text-foreground tracking-tight`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          {question.title}
        </motion.h1>

        {/* Subtitle */}
        {question.subtitle && (
          <motion.p
            className={`mt-5 ${hasImage ? "text-base sm:text-lg" : "text-lg sm:text-xl"} text-muted-foreground font-body leading-relaxed ${hasImage ? "" : "max-w-lg"}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {question.subtitle}
          </motion.p>
        )}

        {/* Action buttons */}
        <motion.div
          className="mt-8 flex flex-col gap-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          {showButton && (
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-xl bg-brand text-white font-body font-semibold text-lg hover:bg-brand-dark transition-all duration-300 shadow-lg shadow-brand/20"
            >
              {buttonText}
            </button>
          )}

          {redirectUrl && (
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-body font-medium text-brand hover:text-brand-dark border border-brand/20 hover:border-brand/40 hover:bg-brand-lighter/30 transition-all"
            >
              <ExternalLink size={15} />
              Visitar link
            </a>
          )}
        </motion.div>

        {/* Redirect notice */}
        {redirectUrl && (
          <motion.p
            className="mt-4 text-xs text-muted-foreground/60 font-body"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            Você será redirecionado em 3 segundos...
          </motion.p>
        )}

        {/* Decorative dots */}
        {!redirectUrl && (
          <motion.div
            className={`mt-10 flex gap-2 ${hasImage ? "" : "justify-center"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            {["bg-brand", "bg-emerald-400", "bg-amber-400"].map((color, i) => (
              <motion.div
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${color}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1, type: "spring", stiffness: 400, damping: 15 }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
