"use client";

import { useState, useEffect, memo, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const BEAM_COUNT = 60;

export const AuroraBeams = memo(({
  beamCount = BEAM_COUNT,
  className,
}: {
  beamCount?: number;
  className?: string;
}) => {
  const [beams, setBeams] = useState<Array<{ id: number; style: CSSProperties }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: beamCount }).map((_, i) => {
      const riseDur = Math.random() * 2 + 4;
      const fadeDur = riseDur;
      const dropDur = Math.random() * 3 + 3;
      return {
        id: i,
        style: {
          left: `${Math.random() * 100}%`,
          width: `${Math.floor(Math.random() * 3) + 1}px`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${riseDur}s, ${fadeDur}s, ${dropDur}s`,
        } as CSSProperties,
      };
    });
    setBeams(generated);
  }, [beamCount]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {/* Scene container */}
      <div className="aurora-beams-scene absolute inset-0">
        {/* Floor glow */}
        <div className="aurora-beams-floor" />
        {/* Main column */}
        <div className="aurora-beams-column" />
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
