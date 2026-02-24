/**
 * FormFlow — Dark Futuristic Design
 * Neon progress bar with glow effect at the bottom of the screen.
 */

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  answeredCount: number;
  totalQuestions: number;
}

export function ProgressBar({
  progress,
  answeredCount,
  totalQuestions,
}: ProgressBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Progress info */}
      <div className="flex items-center justify-between px-6 sm:px-8 pb-2">
        <span className="text-[11px] font-body text-muted-foreground tracking-wide">
          {progress > 0 && progress < 100
            ? `${answeredCount} de ${totalQuestions} respondidas`
            : ""}
        </span>
        <span className="text-[11px] font-body text-neon-blue tabular-nums font-medium">
          {progress > 0 && progress < 100 ? `${progress}%` : ""}
        </span>
      </div>

      {/* Progress track */}
      <div className="h-[3px] w-full overflow-hidden" style={{ background: "oklch(0.2 0.02 260 / 0.5)" }}>
        <motion.div
          className="h-full origin-left relative"
          style={{
            background: "linear-gradient(90deg, oklch(0.65 0.2 250), oklch(0.75 0.15 195))",
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
            mass: 0.8,
          }}
        >
          {/* Glow effect on the leading edge */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-4"
            style={{
              background: "radial-gradient(ellipse at right, oklch(0.75 0.15 195 / 0.8), transparent)",
              filter: "blur(4px)",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}
