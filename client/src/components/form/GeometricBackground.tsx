/**
 * Geometric Background Component
 * Renders animated floating geometric shapes using Framer Motion.
 * Replaces WebGL backgrounds that had compatibility issues.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShapeProps {
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  className?: string;
}

function FloatingShape({
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  className,
}: ShapeProps) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2 },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{
          y: [0, 15, 0],
        }}
        transition={{
          duration: 12,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "backdrop-blur-[2px] border-2 border-white/[0.15]",
            "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}

// Preset color themes that match common form color schemes
export type GeometricTheme = "indigo-rose" | "blue-cyan" | "emerald-teal" | "amber-orange" | "purple-pink" | "neutral";

const THEMES: Record<GeometricTheme, { shapes: ShapeProps[]; overlay: string }> = {
  "indigo-rose": {
    overlay: "from-indigo-500/[0.05] via-transparent to-rose-500/[0.05]",
    shapes: [
      { delay: 0.3, width: 600, height: 140, rotate: 12, gradient: "from-indigo-500/[0.15]", className: "left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" },
      { delay: 0.5, width: 500, height: 120, rotate: -15, gradient: "from-rose-500/[0.15]", className: "right-[-5%] md:right-[0%] top-[70%] md:top-[75%]" },
      { delay: 0.4, width: 300, height: 80, rotate: -8, gradient: "from-violet-500/[0.15]", className: "left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" },
      { delay: 0.6, width: 200, height: 60, rotate: 20, gradient: "from-amber-500/[0.15]", className: "right-[15%] md:right-[20%] top-[10%] md:top-[15%]" },
      { delay: 0.7, width: 150, height: 40, rotate: -25, gradient: "from-cyan-500/[0.15]", className: "left-[20%] md:left-[25%] top-[5%] md:top-[10%]" },
    ],
  },
  "blue-cyan": {
    overlay: "from-blue-500/[0.05] via-transparent to-cyan-500/[0.05]",
    shapes: [
      { delay: 0.3, width: 550, height: 130, rotate: 8, gradient: "from-blue-500/[0.15]", className: "left-[-8%] top-[20%]" },
      { delay: 0.5, width: 450, height: 110, rotate: -12, gradient: "from-cyan-500/[0.15]", className: "right-[-3%] top-[65%]" },
      { delay: 0.4, width: 350, height: 90, rotate: -5, gradient: "from-sky-500/[0.12]", className: "left-[8%] bottom-[8%]" },
      { delay: 0.6, width: 250, height: 70, rotate: 18, gradient: "from-blue-400/[0.12]", className: "right-[12%] top-[8%]" },
      { delay: 0.7, width: 180, height: 50, rotate: -20, gradient: "from-teal-500/[0.10]", className: "left-[25%] top-[3%]" },
    ],
  },
  "emerald-teal": {
    overlay: "from-emerald-500/[0.05] via-transparent to-teal-500/[0.05]",
    shapes: [
      { delay: 0.3, width: 500, height: 120, rotate: 10, gradient: "from-emerald-500/[0.15]", className: "left-[-6%] top-[18%]" },
      { delay: 0.5, width: 400, height: 100, rotate: -14, gradient: "from-teal-500/[0.15]", className: "right-[-2%] top-[68%]" },
      { delay: 0.4, width: 280, height: 75, rotate: -6, gradient: "from-green-500/[0.12]", className: "left-[10%] bottom-[12%]" },
      { delay: 0.6, width: 220, height: 55, rotate: 22, gradient: "from-emerald-400/[0.12]", className: "right-[18%] top-[5%]" },
      { delay: 0.7, width: 160, height: 45, rotate: -18, gradient: "from-lime-500/[0.10]", className: "left-[22%] top-[8%]" },
    ],
  },
  "amber-orange": {
    overlay: "from-amber-500/[0.05] via-transparent to-orange-500/[0.05]",
    shapes: [
      { delay: 0.3, width: 520, height: 125, rotate: 14, gradient: "from-amber-500/[0.15]", className: "left-[-7%] top-[22%]" },
      { delay: 0.5, width: 420, height: 105, rotate: -10, gradient: "from-orange-500/[0.15]", className: "right-[-4%] top-[72%]" },
      { delay: 0.4, width: 320, height: 85, rotate: -9, gradient: "from-yellow-500/[0.12]", className: "left-[6%] bottom-[6%]" },
      { delay: 0.6, width: 180, height: 50, rotate: 25, gradient: "from-red-400/[0.12]", className: "right-[14%] top-[12%]" },
      { delay: 0.7, width: 140, height: 38, rotate: -22, gradient: "from-amber-400/[0.10]", className: "left-[18%] top-[6%]" },
    ],
  },
  "purple-pink": {
    overlay: "from-purple-500/[0.05] via-transparent to-pink-500/[0.05]",
    shapes: [
      { delay: 0.3, width: 580, height: 135, rotate: 11, gradient: "from-purple-500/[0.15]", className: "left-[-9%] top-[16%]" },
      { delay: 0.5, width: 480, height: 115, rotate: -13, gradient: "from-pink-500/[0.15]", className: "right-[-3%] top-[66%]" },
      { delay: 0.4, width: 340, height: 88, rotate: -7, gradient: "from-fuchsia-500/[0.12]", className: "left-[7%] bottom-[7%]" },
      { delay: 0.6, width: 230, height: 65, rotate: 19, gradient: "from-violet-400/[0.12]", className: "right-[16%] top-[9%]" },
      { delay: 0.7, width: 170, height: 48, rotate: -23, gradient: "from-pink-400/[0.10]", className: "left-[23%] top-[4%]" },
    ],
  },
  neutral: {
    overlay: "from-white/[0.03] via-transparent to-white/[0.03]",
    shapes: [
      { delay: 0.3, width: 560, height: 130, rotate: 9, gradient: "from-white/[0.08]", className: "left-[-8%] top-[19%]" },
      { delay: 0.5, width: 460, height: 110, rotate: -11, gradient: "from-white/[0.06]", className: "right-[-4%] top-[69%]" },
      { delay: 0.4, width: 310, height: 82, rotate: -7, gradient: "from-white/[0.05]", className: "left-[9%] bottom-[9%]" },
      { delay: 0.6, width: 210, height: 58, rotate: 21, gradient: "from-white/[0.06]", className: "right-[17%] top-[11%]" },
      { delay: 0.7, width: 155, height: 42, rotate: -19, gradient: "from-white/[0.04]", className: "left-[21%] top-[7%]" },
    ],
  },
};

export const GEOMETRIC_THEMES: { id: GeometricTheme; label: string; description: string }[] = [
  { id: "indigo-rose", label: "Índigo & Rosa", description: "Elegante e moderno" },
  { id: "blue-cyan", label: "Azul & Ciano", description: "Profissional e confiável" },
  { id: "emerald-teal", label: "Esmeralda & Teal", description: "Natural e fresco" },
  { id: "amber-orange", label: "Âmbar & Laranja", description: "Quente e energético" },
  { id: "purple-pink", label: "Roxo & Rosa", description: "Criativo e vibrante" },
  { id: "neutral", label: "Neutro", description: "Sutil e discreto" },
];

interface GeometricBackgroundProps {
  theme?: GeometricTheme;
  className?: string;
  intensity?: number; // 0-100
}

export function GeometricBackground({
  theme = "indigo-rose",
  className = "",
  intensity = 50,
}: GeometricBackgroundProps) {
  const themeData = THEMES[theme] || THEMES["indigo-rose"];
  const opacityScale = intensity / 50; // 0 to 2

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={{ opacity: Math.min(opacityScale, 1) }}>
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br blur-3xl", themeData.overlay)} />

      {/* Floating shapes */}
      {themeData.shapes.map((shape, i) => (
        <FloatingShape key={i} {...shape} />
      ))}
    </div>
  );
}
