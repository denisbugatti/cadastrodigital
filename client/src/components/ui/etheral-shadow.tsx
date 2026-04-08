"use client";

import { useRef, useId, useEffect, memo } from "react";
import { animate, useMotionValue, type AnimationPlaybackControls } from "framer-motion";

function mapRange(value: number, fromLow: number, fromHigh: number, toLow: number, toHigh: number): number {
  if (fromLow === fromHigh) return toLow;
  const percentage = (value - fromLow) / (fromHigh - fromLow);
  return toLow + percentage * (toHigh - toLow);
}

export const EtheralShadow = memo(({
  color = "rgba(128, 128, 128, 1)",
  animationScale = 100,
  animationSpeed = 90,
  noiseOpacity = 1,
  noiseScale = 1.2,
  className,
}: {
  color?: string;
  animationScale?: number;
  animationSpeed?: number;
  noiseOpacity?: number;
  noiseScale?: number;
  className?: string;
}) => {
  const rawId = useId();
  const id = `shadowoverlay-${rawId.replace(/:/g, "")}`;
  const feColorMatrixRef = useRef<SVGFEColorMatrixElement>(null);
  const hueRotateMotionValue = useMotionValue(180);
  const hueRotateAnimation = useRef<AnimationPlaybackControls | null>(null);

  const animationEnabled = animationScale > 0;
  const displacementScale = mapRange(animationScale, 1, 100, 20, 100);
  const animationDuration = mapRange(animationSpeed, 1, 100, 1000, 50);

  useEffect(() => {
    if (feColorMatrixRef.current && animationEnabled) {
      if (hueRotateAnimation.current) hueRotateAnimation.current.stop();
      hueRotateMotionValue.set(0);
      hueRotateAnimation.current = animate(hueRotateMotionValue, 360, {
        duration: animationDuration / 25,
        repeat: Infinity,
        repeatType: "loop",
        repeatDelay: 0,
        ease: "linear",
        delay: 0,
        onUpdate: (value: number) => {
          if (feColorMatrixRef.current) {
            feColorMatrixRef.current.setAttribute("values", String(value));
          }
        },
      });
      return () => { if (hueRotateAnimation.current) hueRotateAnimation.current.stop(); };
    }
  }, [animationEnabled, animationDuration, hueRotateMotionValue]);

  return (
    <div className={className} style={{ overflow: "hidden", position: "absolute", inset: 0 }}>
      <div style={{ position: "absolute", inset: -displacementScale, filter: animationEnabled ? `url(#${id}) blur(4px)` : "none" }}>
        {animationEnabled && (
          <svg style={{ position: "absolute" }}>
            <defs>
              <filter id={id}>
                <feTurbulence result="undulation" numOctaves={2}
                  baseFrequency={`${mapRange(animationScale, 0, 100, 0.001, 0.0005)},${mapRange(animationScale, 0, 100, 0.004, 0.002)}`}
                  seed={0} type="turbulence" />
                <feColorMatrix ref={feColorMatrixRef} in="undulation" type="hueRotate" values="180" />
                <feColorMatrix in="dist" result="circulation" type="matrix" values="4 0 0 0 1  4 0 0 0 1  4 0 0 0 1  1 0 0 0 0" />
                <feDisplacementMap in="SourceGraphic" in2="circulation" scale={displacementScale} result="dist" />
                <feDisplacementMap in="dist" in2="undulation" scale={displacementScale} result="output" />
              </filter>
            </defs>
          </svg>
        )}
        <div style={{
          backgroundColor: color,
          maskImage: `url('https://framerusercontent.com/images/ceBGguIpUU8luwByxuQz79t7To.png')`,
          maskSize: "cover",
          maskRepeat: "no-repeat",
          maskPosition: "center",
          width: "100%",
          height: "100%",
        }} />
      </div>
      {noiseOpacity > 0 && (
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url("https://framerusercontent.com/images/g0QcWrxr87K0ufOxIUFBakwYA8.png")`,
          backgroundSize: noiseScale * 200,
          backgroundRepeat: "repeat",
          opacity: noiseOpacity / 2,
        }} />
      )}
    </div>
  );
});
