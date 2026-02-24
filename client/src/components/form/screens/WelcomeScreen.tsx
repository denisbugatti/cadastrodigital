/**
 * FormFlow Welcome Screen (Light Theme)
 * Clean welcome screen with brand accent, custom media, and smooth entrance.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import {
  ArrowRight, User, Mail, Phone, Fingerprint, Building2, IdCard, MapPin,
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

interface WelcomeScreenProps {
  question: Question;
  onStart: () => void;
}

export function WelcomeScreen({ question, onStart }: WelcomeScreenProps) {
  const hasImage = !!question.imageUrl;
  const hasMotionIcon = !!question.motionIconUrl;
  const hasSystemIcon = !!question.iconName;
  const buttonText = question.buttonText || "Começar";
  const showButton = question.showButton !== false;

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
        {/* Motion icon or system icon or default */}
        {hasMotionIcon ? (
          <motion.div
            className="mb-8 w-20 h-20 rounded-2xl bg-brand-lighter flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
          >
            <img
              src={question.motionIconUrl}
              alt=""
              className="w-14 h-14 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          </motion.div>
        ) : hasSystemIcon ? (
          <motion.div
            className="mb-8 w-20 h-20 rounded-2xl bg-brand-lighter flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
          >
            {(() => {
              const IconComp = iconMap[question.iconName!] || Sparkles;
              return <IconComp size={36} className="text-brand" />;
            })()}
          </motion.div>
        ) : !hasImage && (
          <motion.div
            className="mb-10 w-20 h-20 rounded-2xl bg-brand-lighter flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: 0.1 }}
          >
            <svg width="36" height="36" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z"
                className="stroke-brand"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M6 7.5H12M6 10.5H9.5"
                className="stroke-brand"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        )}

        {/* Title */}
        <motion.h1
          className={`font-display ${hasImage ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl"} font-bold text-foreground tracking-tight leading-tight`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          {question.title}
        </motion.h1>

        {/* Subtitle */}
        {question.subtitle && (
          <motion.p
            className={`mt-5 ${hasImage ? "text-base sm:text-lg" : "text-lg sm:text-xl"} text-muted-foreground font-body leading-relaxed ${hasImage ? "" : "max-w-lg"}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            {question.subtitle}
          </motion.p>
        )}

        {/* CTA Button */}
        {showButton && (
          <motion.button
            onClick={onStart}
            className="
              mt-10 px-8 py-4 rounded-xl
              bg-brand text-white font-body font-semibold text-lg
              hover:bg-brand-dark
              transition-all duration-300 shadow-lg shadow-brand/20
              flex items-center gap-3
            "
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {buttonText}
            <ArrowRight size={18} />
          </motion.button>
        )}

        {/* Hint */}
        <motion.p
          className="mt-6 text-sm text-muted-foreground font-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Pressione <kbd className="px-2 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono">Enter ↵</kbd> para começar
        </motion.p>
      </div>
    </div>
  );
}
