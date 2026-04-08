"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SpotlightItem {
  id: number;
  x: string;
  y: string;
  size: string;
  duration: number;
  delay: number;
  color: string;
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const SpotlightBackground = memo(({
  className,
  spotlightCount = 5,
  colors: customColors = [],
}: {
  className?: string;
  spotlightCount?: number;
  colors?: string[];
}) => {
  const spotlights: SpotlightItem[] = useMemo(() => {
    const defaultColors = [
      "rgba(59, 130, 246, 0.3)",
      "rgba(147, 51, 234, 0.3)",
      "rgba(236, 72, 153, 0.3)",
      "rgba(34, 197, 94, 0.3)",
      "rgba(234, 179, 8, 0.3)",
      "rgba(6, 182, 212, 0.3)",
      "rgba(249, 115, 22, 0.3)",
    ];
    const colors = customColors.length >= 1
      ? customColors.map((c) => hexToRgba(c, 0.3))
      : defaultColors;
    return Array.from({ length: spotlightCount }, (_, i) => ({
      id: i,
      x: `${10 + Math.random() * 80}%`,
      y: `${10 + Math.random() * 80}%`,
      size: `${300 + Math.random() * 400}px`,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * 5,
      color: colors[i % colors.length],
    }));
  }, [spotlightCount, customColors]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-neutral-950", className)}>
      {spotlights.map((spot) => (
        <motion.div
          key={spot.id}
          className="absolute rounded-full"
          style={{
            width: spot.size,
            height: spot.size,
            left: spot.x,
            top: spot.y,
            background: `radial-gradient(circle, ${spot.color}, transparent 70%)`,
            filter: "blur(40px)",
            transform: "translate(-50%, -50%)",
          }}
          animate={{
            x: [0, 100, -50, 80, 0],
            y: [0, -80, 60, -40, 0],
            scale: [1, 1.2, 0.8, 1.1, 1],
            opacity: [0.6, 1, 0.7, 0.9, 0.6],
          }}
          transition={{
            duration: spot.duration,
            delay: spot.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
});
