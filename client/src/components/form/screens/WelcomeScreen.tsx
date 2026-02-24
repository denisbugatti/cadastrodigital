/**
 * FormFlow — Dark Futuristic Design
 * Welcome screen with neon accents, glassmorphism, and dramatic entrance.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { Sparkles, ArrowRight } from "lucide-react";

const WELCOME_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/9gKZyi1fSHW6VtpfkkY9Qq/sandbox/SlwprPg2iIoikVq55GWO65-img-2_1771958382000_na1fn_ZGFyay13ZWxjb21lLWlsbHVzdHJhdGlvbg.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOWdLWnlpMWZTSFc2VnRwZmtrWTlRcS9zYW5kYm94L1Nsd3ByUGcyaUlvaWtWcTU1R1dPNjUtaW1nLTJfMTc3MTk1ODM4MjAwMF9uYTFmbl9aR0Z5YXkxM1pXeGpiMjFsTFdsc2JIVnpkSEpoZEdsdmJnLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=oCGcGQbBo9DWw5zIotv6ErR2jRp~-oMwaO9YgxnM6M-vo7G564CC4BKdq0JQOWRJM~122wICZ7j-tuQlrFnm81G-W7qLLr0G4NA7SMl0XFwgZtUVFu8OUObBl~qva5JmyjX~gHgmZmS6hpPev2ylIZ66F8-sO2VyrRHkYSpqf4aBh5N9o~Up9ii~rtzQl1otj7mnq4aoTP4fTQpMPDg9B-mq7hSQJ6HYhIhnmg9Db4dmilmPHpshbWNiat0QOdZ0TfZMRahpLErgLuHhqFOmvK683hdEm5tdcvpr36YljEP0v2gRIqo4ABuT103VJ7AzcZeyNHPlv1Fg4CX3hAR6yA__";

interface WelcomeScreenProps {
  question: Question;
  onStart: () => void;
}

export function WelcomeScreen({ question, onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Floating illustration with glow */}
      <motion.div
        className="mb-12 w-48 h-48 relative"
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 18,
          delay: 0.1,
        }}
      >
        {/* Glow behind image */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "radial-gradient(circle, oklch(0.65 0.2 250 / 0.2), transparent 70%)",
            filter: "blur(30px)",
            transform: "scale(1.3)",
          }}
        />
        <img
          src={WELCOME_IMG}
          alt="Welcome"
          className="w-full h-full object-contain rounded-3xl relative z-10"
        />
      </motion.div>

      {/* Title with glow */}
      <motion.h1
        className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.6 }}
      >
        {question.title}
      </motion.h1>

      {/* Subtitle */}
      {question.subtitle && (
        <motion.p
          className="mt-5 text-lg text-muted-foreground font-body leading-relaxed max-w-lg"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {/* CTA Button with neon glow */}
      <motion.button
        onClick={onStart}
        className="
          mt-10 px-8 py-4 rounded-full
          bg-neon-blue text-white font-body font-semibold text-lg
          glow-blue
          hover:scale-105 active:scale-95
          transition-all duration-300
          flex items-center gap-3
        "
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles size={18} className="text-neon-cyan" />
        Começar
        <ArrowRight size={18} />
      </motion.button>

      {/* Hint */}
      <motion.p
        className="mt-6 text-xs text-muted-foreground/40 font-body"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Pressione <kbd className="kbd-dark">Enter ↵</kbd> para começar
      </motion.p>
    </div>
  );
}
