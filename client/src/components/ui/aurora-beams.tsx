"use client";

import { useState, useEffect, memo, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const BEAM_COUNT = 60;

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex.startsWith("#") || hex.length !== 7) return null;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export const AuroraBeams = memo(({
  beamCount = BEAM_COUNT,
  className,
  color = "#00ffcc",
}: {
  beamCount?: number;
  className?: string;
  color?: string;
}) => {
  const [beams, setBeams] = useState<Array<{ id: number; style: CSSProperties }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: beamCount }).map((_, i) => {
      const riseDur = Math.random() * 2 + 4;
      const fadeDur = riseDur;
      const dropDur = Math.random() * 3 + 3;
      // Derive a secondary color (slightly shifted hue) from the primary
      const rgb = hexToRgb(color);
      const beamGradient = rgb
        ? `linear-gradient(to top, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.6), rgba(${Math.min(rgb.r + 50, 255)}, ${Math.min(rgb.g + 20, 255)}, ${Math.min(rgb.b + 80, 255)}, 0.3), transparent)`
        : undefined;
      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: `${Math.floor(Math.random() * 3) + 1}px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${riseDur}s, ${fadeDur}s, ${dropDur}s`,
          ...(beamGradient ? { background: beamGradient } : {}),
        } as CSSProperties,
      };
    });
    setBeams(generated);
  }, [beamCount, color]);

  const rgb = hexToRgb(color);
  const floorStyle: CSSProperties | undefined = rgb ? {
    background: `radial-gradient(ellipse at center bottom, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3), transparent 70%)`,
  } : undefined;
  const columnStyle: CSSProperties | undefined = rgb ? {
    background: `linear-gradient(to top, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15), transparent 80%)`,
  } : undefined;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Scene container */}
      <div className="aurora-beams-scene absolute inset-0">
        {/* Floor glow */}
        <div className="aurora-beams-floor" style={floorStyle} />
        {/* Main column */}
        <div className="aurora-beams-column" style={columnStyle} />
        {/* Light beams */}
        <div className="aurora-beams-container">
          {beams.map((beam) => (
            <div key={beam.id} className="aurora-beam" style={beam.style} />
          ))}
        </div>
      </div>
    </div>
  );
});
