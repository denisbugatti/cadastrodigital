"use client";

import { Warp } from "@paper-design/shaders-react";

interface BackgroundShadersProps {
  className?: string;
  colors?: string[];
}

const DEFAULT_SHADER_COLORS = [
  "hsl(203, 100%, 62%)",
  "hsl(255, 100%, 72%)",
  "hsl(158, 99%, 59%)",
  "hsl(264, 100%, 61%)",
];

export function BackgroundShaders({ className = "", colors = [] }: BackgroundShadersProps) {
  const activeColors = colors.length >= 2 ? colors : DEFAULT_SHADER_COLORS;
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <Warp
        style={{ width: "100%", height: "100%" }}
        proportion={0.45}
        softness={1}
        distortion={0.25}
        swirl={0.8}
        swirlIterations={10}
        shape="checks"
        shapeScale={0.1}
        scale={1}
        rotation={0}
        speed={1}
        colors={activeColors}
      />
    </div>
  );
}

export default BackgroundShaders;
