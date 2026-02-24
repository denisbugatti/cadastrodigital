/**
 * FormFlow — Dark Futuristic Design
 * Wrapper with dramatic slide transitions and blur effects.
 */

import { motion, AnimatePresence } from "framer-motion";
import type { Direction } from "@/hooks/useFormEngine";
import type { ReactNode } from "react";

interface QuestionWrapperProps {
  questionId: string;
  direction: Direction;
  children: ReactNode;
}

const variants = {
  enter: (direction: Direction) => ({
    y: direction === "forward" ? 80 : -80,
    opacity: 0,
    scale: 0.95,
    filter: "blur(8px)",
  }),
  center: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: Direction) => ({
    y: direction === "forward" ? -80 : 80,
    opacity: 0,
    scale: 0.95,
    filter: "blur(8px)",
  }),
};

export function QuestionWrapper({
  questionId,
  direction,
  children,
}: QuestionWrapperProps) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={questionId}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 28,
          mass: 0.9,
        }}
        className="w-full flex items-center justify-center min-h-screen px-6"
      >
        <div className="w-full max-w-2xl mx-auto">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
