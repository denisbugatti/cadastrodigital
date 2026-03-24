/**
 * FormFlow Navigation Controls (Light Theme)
 * Clean navigation buttons with subtle shadows.
 */

import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, ArrowDown, Check } from "lucide-react";

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
      className="fixed right-6 sm:right-8 bottom-12 z-20 flex flex-col gap-2"
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
            group flex items-center gap-2 rounded-xl px-5 py-3
            font-body text-sm font-semibold
            transition-all duration-300 shadow-sm
            ${
              canGoNext
                ? isBeforeThankYou
                  ? "bg-brand text-white hover:bg-brand-dark hover:scale-105"
                  : "bg-white text-foreground border border-border hover:border-brand/40 hover:scale-105 hover:shadow-md"
                : "bg-secondary text-muted-foreground cursor-not-allowed opacity-40"
            }
          `}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          whileTap={canGoNext ? { scale: 0.95 } : {}}
        >
          {isBeforeThankYou ? (
            <>
              Enviar <Check size={16} className="transition-transform group-hover:scale-110" />
            </>
          ) : (
            <>
              OK{" "}
              <ArrowDown
                size={14}
                className="transition-transform group-hover:translate-y-0.5 text-brand"
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
              flex items-center justify-center rounded-xl p-2.5
              bg-white border border-border text-muted-foreground shadow-sm
              hover:text-foreground hover:border-brand/30 hover:shadow-md
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
