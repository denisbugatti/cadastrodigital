/**
 * FormFlow Progress Bar (Light Theme)
 * Clean progress indicator at the bottom of the form.
 */

import { motion } from "framer-motion";

interface ProgressBarProps {
  progress: number;
  answeredCount: number;
  totalQuestions: number;
}

export function ProgressBar({ progress, answeredCount, totalQuestions }: ProgressBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20">
      {/* Progress info */}
      <div className="flex items-center justify-between px-6 sm:px-8 pb-2">
        <span className="text-xs font-body text-muted-foreground">
          {progress > 0 && progress < 100
            ? `${answeredCount} de ${totalQuestions} respondidas`
            : ""}
        </span>
        <span className="text-xs font-body font-semibold text-brand">
          {progress > 0 && progress < 100 ? `${Math.round(progress)}%` : ""}
        </span>
      </div>

      {/* Progress track */}
      <div className="h-1.5 bg-border/30">
        <motion.div
          className="h-full bg-brand rounded-r-full origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          transition={{ type: "spring", stiffness: 200, damping: 30 }}
        />
      </div>
    </div>
  );
}
