/**
 * FormFlow — Dark Futuristic Design
 * Thank you screen with celebration animation and neon effects.
 */

import { motion } from "framer-motion";
import type { Question } from "@/lib/formTypes";
import { CheckCircle2 } from "lucide-react";

const THANKYOU_IMG =
  "https://private-us-east-1.manuscdn.com/sessionFile/9gKZyi1fSHW6VtpfkkY9Qq/sandbox/SlwprPg2iIoikVq55GWO65-img-3_1771958377000_na1fn_ZGFyay10aGFua3lvdS1pbGx1c3RyYXRpb24.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvOWdLWnlpMWZTSFc2VnRwZmtrWTlRcS9zYW5kYm94L1Nsd3ByUGcyaUlvaWtWcTU1R1dPNjUtaW1nLTNfMTc3MTk1ODM3NzAwMF9uYTFmbl9aR0Z5YXkxMGFHRnVhM2x2ZFMxcGJHeDFjM1J5WVhScGIyNC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=tBrQH4cZlpeRXbiYLqEQ7094pa38a~j3H3WYFw6MTid2b7lCxryv4gvHQ4Zb0RwCDW2Pd1BY~vhGDX6hIv8TvjuDhQ~KBPKZsqeEbKxHXTOHzeVDASUyilCfkcPcYhLuHzfB9U9HzJQOk~aKrk-lo0~Cgo~TcYDjoxX2UovdeO~yDOd2Fr5FU2NrN4SABXm3OZWsj~iBulSUTP~lEGPwD4FK4w0IAVK9HLTnSIeDD7pbeWpwu158-crMlPMoip43CGIO50xsFrHSBp0vdQn90viOdspJxb-FL4XATfl~P7T6qlh-T77szMjncrpwcAhp9tysHuhh93CAgmpMU~y3~w__";

interface ThankYouScreenProps {
  question: Question;
}

export function ThankYouScreen({ question }: ThankYouScreenProps) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Illustration with glow */}
      <motion.div
        className="mb-10 w-48 h-48 relative"
        initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 15,
          delay: 0.1,
        }}
      >
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "radial-gradient(circle, oklch(0.75 0.15 195 / 0.2), transparent 70%)",
            filter: "blur(30px)",
            transform: "scale(1.3)",
          }}
        />
        <img
          src={THANKYOU_IMG}
          alt="Thank you"
          className="w-full h-full object-contain rounded-3xl relative z-10"
        />
      </motion.div>

      {/* Animated checkmark with glow */}
      <motion.div
        className="mb-8 w-20 h-20 rounded-full flex items-center justify-center relative"
        style={{
          background: "oklch(0.65 0.2 250 / 0.1)",
          border: "2px solid oklch(0.65 0.2 250 / 0.3)",
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 15,
          delay: 0.3,
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute inset-0 rounded-full animate-pulse-glow"
          style={{ opacity: 0.5 }}
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 400, damping: 15 }}
        >
          <CheckCircle2 size={36} className="text-neon-blue" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-display text-4xl sm:text-5xl font-bold text-foreground tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
      >
        {question.title}
      </motion.h1>

      {/* Subtitle */}
      {question.subtitle && (
        <motion.p
          className="mt-5 text-lg text-muted-foreground font-body leading-relaxed max-w-lg"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {question.subtitle}
        </motion.p>
      )}

      {/* Decorative neon dots */}
      <motion.div
        className="mt-10 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        {[
          "oklch(0.65 0.2 250)",
          "oklch(0.75 0.15 195)",
          "oklch(0.55 0.2 290)",
        ].map((color, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${color.replace(")", " / 0.5)")}`,
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.9 + i * 0.1,
              type: "spring",
              stiffness: 400,
              damping: 15,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
