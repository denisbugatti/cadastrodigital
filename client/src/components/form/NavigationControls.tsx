/**
 * FormFlow — Dark Futuristic Design
 * Navigation controls with glassmorphism and neon glow effects.
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Check, Sparkles } from "lucide-react";

interface NavigationControlsProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  isFirst: boolean;
  isLast: boolean;
  isWelcome: boolean;
  isThankYou: boolean;
  isBeforeThankYou: boolean;
}

export function NavigationControls({
  onNext,
  onPrev,
  canGoNext,
  isFirst,
  isWelcome,
  isThankYou,
  isBeforeThankYou,
}: NavigationControlsProps) {
  if (isThankYou || isWelcome) return null;

  return (
    <motion.div
      className="fixed right-6 sm:right-8 bottom-12 z-40 flex flex-col gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      {/* Next / Submit button */}
      <AnimatePresence mode="wait">
        <motion.button
          key={isBeforeThankYou ? "submit" : "next"}
          onClick={onNext}
          disabled={!canGoNext}
          className={`
            group flex items-center gap-2 rounded-full px-5 py-3
            font-body text-sm font-medium
            transition-all duration-300
            ${
              canGoNext
                ? isBeforeThankYou
                  ? "bg-neon-blue text-white glow-blue hover:scale-105"
                  : "glass-card text-foreground border border-glass-border hover:border-neon-blue/40 hover:scale-105 hover:glow-blue"
                : "glass-card text-muted-foreground cursor-not-allowed opacity-40"
            }
          `}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileTap={canGoNext ? { scale: 0.95 } : {}}
        >
          {isWelcome ? (
            <>
              Começar <Sparkles size={14} className="text-neon-cyan" />
            </>
          ) : isBeforeThankYou ? (
            <>
              Enviar <Check size={16} className="transition-transform group-hover:scale-110" />
            </>
          ) : (
            <>
              OK{" "}
              <ArrowDown
                size={14}
                className="transition-transform group-hover:translate-y-0.5 text-neon-cyan"
              />
            </>
          )}
        </motion.button>
      </AnimatePresence>

      {/* Back button */}
      <AnimatePresence>
        {!isFirst && (
          <motion.button
            onClick={onPrev}
            className="
              flex items-center justify-center rounded-full p-2.5
              glass-card border border-glass-border text-muted-foreground
              hover:text-foreground hover:border-neon-blue/30
              transition-all duration-300 hover:scale-105
            "
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
            title="Voltar"
          >
            <ArrowUp size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
