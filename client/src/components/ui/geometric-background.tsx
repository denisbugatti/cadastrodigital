/**
 * GeometricBackground — Animated geometric shapes background
 * Based on the ElegantShape pattern from shape-landing-hero.tsx
 * Supports multiple color themes and intensity control.
 */

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

// ─── Theme Definitions ───

export type GeometricTheme =
  | "indigo-rose"
  | "ocean-blue"
  | "emerald-gold"
  | "sunset-purple"
  | "midnight-cyan"
  | "warm-amber";

export interface GeometricThemeConfig {
  id: GeometricTheme;
  label: string;
  description: string;
  bgGradient: string;
  shapes: Array<{
    gradient: string;
    width: number;
    height: number;
    rotate: number;
    delay: number;
    position: string;
  }>;
  overlayGradient: string;
}

export const GEOMETRIC_THEMES: GeometricThemeConfig[] = [
  {
    id: "indigo-rose",
    label: "Índigo & Rosa",
    description: "Elegante e moderno",
    bgGradient: "from-indigo-500/[0.05] via-transparent to-rose-500/[0.05]",
    shapes: [
      { gradient: "from-indigo-500", width: 600, height: 140, rotate: 12, delay: 0.3, position: "left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]" },
      { gradient: "from-rose-500", width: 500, height: 120, rotate: -15, delay: 0.5, position: "right-[-5%] md:right-[0%] top-[70%] md:top-[75%]" },
      { gradient: "from-violet-500", width: 300, height: 80, rotate: -8, delay: 0.4, position: "left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]" },
      { gradient: "from-amber-500", width: 200, height: 60, rotate: 20, delay: 0.6, position: "right-[15%] md:right-[20%] top-[10%] md:top-[15%]" },
      { gradient: "from-cyan-500", width: 150, height: 40, rotate: -25, delay: 0.7, position: "left-[20%] md:left-[25%] top-[5%] md:top-[10%]" },
    ],
    overlayGradient: "from-[#030303] via-transparent to-[#030303]/80",
  },
  {
    id: "ocean-blue",
    label: "Oceano Azul",
    description: "Profundo e sereno",
    bgGradient: "from-blue-500/[0.05] via-transparent to-cyan-500/[0.05]",
    shapes: [
      { gradient: "from-blue-600", width: 550, height: 130, rotate: 8, delay: 0.3, position: "left-[-8%] md:left-[-3%] top-[20%] md:top-[25%]" },
      { gradient: "from-cyan-500", width: 480, height: 110, rotate: -12, delay: 0.5, position: "right-[-3%] md:right-[2%] top-[65%] md:top-[70%]" },
      { gradient: "from-sky-400", width: 320, height: 85, rotate: -5, delay: 0.4, position: "left-[8%] md:left-[12%] bottom-[8%] md:bottom-[12%]" },
      { gradient: "from-teal-500", width: 220, height: 55, rotate: 18, delay: 0.6, position: "right-[12%] md:right-[18%] top-[8%] md:top-[12%]" },
      { gradient: "from-blue-400", width: 180, height: 45, rotate: -20, delay: 0.7, position: "left-[25%] md:left-[30%] top-[3%] md:top-[8%]" },
    ],
    overlayGradient: "from-[#020a18] via-transparent to-[#020a18]/80",
  },
  {
    id: "emerald-gold",
    label: "Esmeralda & Ouro",
    description: "Sofisticado e luxuoso",
    bgGradient: "from-emerald-500/[0.05] via-transparent to-amber-500/[0.05]",
    shapes: [
      { gradient: "from-emerald-500", width: 580, height: 135, rotate: 10, delay: 0.3, position: "left-[-7%] md:left-[-2%] top-[18%] md:top-[22%]" },
      { gradient: "from-amber-500", width: 460, height: 115, rotate: -14, delay: 0.5, position: "right-[-4%] md:right-[1%] top-[68%] md:top-[72%]" },
      { gradient: "from-lime-500", width: 280, height: 75, rotate: -6, delay: 0.4, position: "left-[6%] md:left-[11%] bottom-[6%] md:bottom-[11%]" },
      { gradient: "from-yellow-500", width: 210, height: 58, rotate: 22, delay: 0.6, position: "right-[14%] md:right-[19%] top-[9%] md:top-[14%]" },
      { gradient: "from-green-400", width: 160, height: 42, rotate: -22, delay: 0.7, position: "left-[22%] md:left-[27%] top-[4%] md:top-[9%]" },
    ],
    overlayGradient: "from-[#030803] via-transparent to-[#030803]/80",
  },
  {
    id: "sunset-purple",
    label: "Pôr do Sol Roxo",
    description: "Vibrante e dramático",
    bgGradient: "from-purple-500/[0.05] via-transparent to-orange-500/[0.05]",
    shapes: [
      { gradient: "from-purple-600", width: 570, height: 138, rotate: 14, delay: 0.3, position: "left-[-9%] md:left-[-4%] top-[16%] md:top-[21%]" },
      { gradient: "from-orange-500", width: 490, height: 118, rotate: -13, delay: 0.5, position: "right-[-4%] md:right-[1%] top-[72%] md:top-[76%]" },
      { gradient: "from-fuchsia-500", width: 310, height: 82, rotate: -7, delay: 0.4, position: "left-[4%] md:left-[9%] bottom-[4%] md:bottom-[9%]" },
      { gradient: "from-pink-500", width: 230, height: 62, rotate: 19, delay: 0.6, position: "right-[13%] md:right-[18%] top-[7%] md:top-[13%]" },
      { gradient: "from-red-400", width: 170, height: 44, rotate: -28, delay: 0.7, position: "left-[18%] md:left-[23%] top-[6%] md:top-[11%]" },
    ],
    overlayGradient: "from-[#080308] via-transparent to-[#080308]/80",
  },
  {
    id: "midnight-cyan",
    label: "Meia-noite Ciano",
    description: "Futurista e tech",
    bgGradient: "from-cyan-500/[0.05] via-transparent to-slate-500/[0.05]",
    shapes: [
      { gradient: "from-cyan-400", width: 540, height: 132, rotate: 6, delay: 0.3, position: "left-[-6%] md:left-[-1%] top-[22%] md:top-[26%]" },
      { gradient: "from-slate-400", width: 470, height: 112, rotate: -10, delay: 0.5, position: "right-[-6%] md:right-[-1%] top-[66%] md:top-[71%]" },
      { gradient: "from-teal-400", width: 290, height: 78, rotate: -4, delay: 0.4, position: "left-[7%] md:left-[12%] bottom-[7%] md:bottom-[12%]" },
      { gradient: "from-cyan-300", width: 240, height: 65, rotate: 16, delay: 0.6, position: "right-[16%] md:right-[21%] top-[6%] md:top-[11%]" },
      { gradient: "from-sky-300", width: 140, height: 38, rotate: -18, delay: 0.7, position: "left-[28%] md:left-[33%] top-[2%] md:top-[7%]" },
    ],
    overlayGradient: "from-[#030308] via-transparent to-[#030308]/80",
  },
  {
    id: "warm-amber",
    label: "Âmbar Quente",
    description: "Acolhedor e convidativo",
    bgGradient: "from-amber-500/[0.05] via-transparent to-red-500/[0.05]",
    shapes: [
      { gradient: "from-amber-500", width: 560, height: 136, rotate: 11, delay: 0.3, position: "left-[-8%] md:left-[-3%] top-[17%] md:top-[22%]" },
      { gradient: "from-red-500", width: 450, height: 108, rotate: -16, delay: 0.5, position: "right-[-5%] md:right-[0%] top-[69%] md:top-[74%]" },
      { gradient: "from-orange-400", width: 330, height: 88, rotate: -9, delay: 0.4, position: "left-[3%] md:left-[8%] bottom-[3%] md:bottom-[8%]" },
      { gradient: "from-yellow-400", width: 190, height: 52, rotate: 24, delay: 0.6, position: "right-[11%] md:right-[16%] top-[11%] md:top-[16%]" },
      { gradient: "from-amber-300", width: 155, height: 41, rotate: -23, delay: 0.7, position: "left-[24%] md:left-[29%] top-[5%] md:top-[10%]" },
    ],
    overlayGradient: "from-[#080503] via-transparent to-[#080503]/80",
  },
];

// ─── ElegantShape (internal) ───

function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-white/[0.08]",
  intensity = 50,
}: {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
  intensity?: number;
}) {
  // Scale opacity based on intensity (10-100 → 0.3-1.0)
  const opacityScale = 0.3 + (intensity - 10) * (0.7 / 90);
  // Scale size based on intensity
  const sizeScale = 0.7 + (intensity - 10) * (0.6 / 90);
  const scaledWidth = Math.round(width * sizeScale);
  const scaledHeight = Math.round(height * sizeScale);

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: -150,
        rotate: rotate - 15,
      }}
      animate={{
        opacity: opacityScale,
        y: 0,
        rotate: rotate,
      }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96] as [number, number, number, number],
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
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
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

// ─── GeometricBackground Component ───

export function GeometricBackground({
  theme = "indigo-rose",
  intensity = 50,
  className,
}: {
  theme?: GeometricTheme | string;
  intensity?: number;
  className?: string;
}) {
  const themeConfig = useMemo(
    () => GEOMETRIC_THEMES.find((t) => t.id === theme) || GEOMETRIC_THEMES[0],
    [theme]
  );

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-[#030303]", className)}>
      {/* Background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br blur-3xl",
          themeConfig.bgGradient
        )}
      />

      {/* Animated shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {themeConfig.shapes.map((shape, i) => (
          <ElegantShape
            key={`${themeConfig.id}-${i}`}
            delay={shape.delay}
            width={shape.width}
            height={shape.height}
            rotate={shape.rotate}
            gradient={`${shape.gradient}/[0.15]`}
            className={shape.position}
            intensity={intensity}
          />
        ))}
      </div>

      {/* Overlay gradient for depth */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-t pointer-events-none",
          themeConfig.overlayGradient
        )}
      />
    </div>
  );
}

export default GeometricBackground;
