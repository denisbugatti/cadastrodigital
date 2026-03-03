"use client";

import { useEffect, useRef, useState, memo } from "react";
import { motion } from "framer-motion";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        className="w-full h-full"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.08 + path.id * 0.015}
            initial={{ pathLength: 0.3, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [0.2, 0.5, 0.2],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
      </svg>
    </div>
  );
}

/**
 * BackgroundPaths with parallax scroll effect.
 * Two layers of floating paths move at different speeds on scroll,
 * creating depth. Opacity is balanced for visibility while keeping text readable.
 * A radial gradient overlay darkens the center for maximum text contrast.
 */
export const BackgroundPaths = memo(({ className = "" }: { className?: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Layer 1 moves slower (0.15x), Layer 2 moves faster (0.35x) — creates depth
  const layer1Y = scrollY * 0.15;
  const layer2Y = scrollY * 0.35;

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Back layer — slower */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          color: "rgba(112, 190, 250, 0.55)",
          transform: `translate3d(0, ${layer1Y}px, 0)`,
        }}
      >
        <FloatingPaths position={1} />
      </div>
      {/* Front layer — faster, more visible */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          color: "rgba(112, 190, 250, 0.75)",
          transform: `translate3d(0, ${layer2Y}px, 0)`,
        }}
      >
        <FloatingPaths position={-1} />
      </div>

      {/* Radial gradient overlay — darkens center for text contrast, lines visible at edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.4) 50%, transparent 80%)",
        }}
      />
    </div>
  );
});
