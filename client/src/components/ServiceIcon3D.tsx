/**
 * ServiceIcon3D — Refined 3D metallic icons.
 * Smaller, more elegant, premium feel — not toy-like.
 * Each card gets its own Canvas with subtle parallax and warm/cool lighting.
 */

import { useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/* ─── Refined material configs (darker, subtler) ─── */
const CONTAINER_MAT = {
  color: "#0c0c12",
  metalness: 0.92,
  roughness: 0.18,
  clearcoat: 0.7,
  clearcoatRoughness: 0.12,
};

const DETAIL_MAT = {
  color: "#18182a",
  metalness: 0.85,
  roughness: 0.25,
  clearcoat: 0.5,
};

const ACCENT_MAT = {
  color: "#5ba8f5",
  metalness: 0.75,
  roughness: 0.35,
  emissive: "#4a9eff",
  emissiveIntensity: 0.2,
};

/* ─── Subtle orbital rotation + mouse parallax ─── */
function useOrbitalParallax(mouse: React.RefObject<{ x: number; y: number }>, hovered: boolean) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const parallaxStrength = hovered ? 0.15 : 0.05;
    const mx = (mouse.current?.x ?? 0) * parallaxStrength;
    const my = (mouse.current?.y ?? 0) * parallaxStrength;

    groupRef.current.rotation.y = Math.sin(t * 0.12) * 0.2 + mx;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1 + my;

    const targetScale = hovered ? 1.05 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.06
    );
  });

  return groupRef;
}

/* ─── Document Icon (Cadastro Digital) ─── */
function DocumentIcon({ mouse, hovered }: { mouse: React.RefObject<{ x: number; y: number }>; hovered: boolean }) {
  const groupRef = useOrbitalParallax(mouse, hovered);

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef} scale={0.85}>
        {/* Container */}
        <RoundedBox args={[1.6, 1.6, 0.3]} radius={0.25} smoothness={6}>
          <meshPhysicalMaterial {...CONTAINER_MAT} />
        </RoundedBox>

        {/* Document body */}
        <RoundedBox args={[0.8, 1.05, 0.06]} radius={0.04} smoothness={4} position={[0, 0, 0.18]}>
          <meshPhysicalMaterial {...DETAIL_MAT} />
        </RoundedBox>

        {/* Folded corner */}
        <mesh position={[0.25, 0.35, 0.22]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.22, 0.22, 0.03]} />
          <meshPhysicalMaterial {...ACCENT_MAT} />
        </mesh>

        {/* Text lines */}
        {[-0.12, 0.02, 0.16].map((y, i) => (
          <RoundedBox key={i} args={[0.45 - i * 0.08, 0.04, 0.015]} radius={0.01} smoothness={2} position={[-0.04, y - 0.12, 0.22]}>
            <meshPhysicalMaterial
              color={i === 0 ? "#5ba8f5" : "#252535"}
              emissive={i === 0 ? "#4a9eff" : "#000000"}
              emissiveIntensity={i === 0 ? 0.12 : 0}
              metalness={0.8}
              roughness={0.3}
            />
          </RoundedBox>
        ))}
      </group>
    </Float>
  );
}

/* ─── People Icon (Gestão de Corretores) ─── */
function PeopleIcon({ mouse, hovered }: { mouse: React.RefObject<{ x: number; y: number }>; hovered: boolean }) {
  const groupRef = useOrbitalParallax(mouse, hovered);

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef} scale={0.85}>
        {/* Container */}
        <RoundedBox args={[1.6, 1.6, 0.3]} radius={0.25} smoothness={6}>
          <meshPhysicalMaterial {...CONTAINER_MAT} />
        </RoundedBox>

        {/* Center person (highlighted) */}
        <group position={[0, 0.1, 0.18]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshPhysicalMaterial {...ACCENT_MAT} />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <capsuleGeometry args={[0.12, 0.2, 8, 16]} />
            <meshPhysicalMaterial {...ACCENT_MAT} />
          </mesh>
        </group>

        {/* Left person */}
        <group position={[-0.4, 0.02, 0.18]}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.09, 0.15, 8, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
        </group>

        {/* Right person */}
        <group position={[0.4, 0.02, 0.18]}>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.11, 16, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
          <mesh position={[0, -0.06, 0]}>
            <capsuleGeometry args={[0.09, 0.15, 8, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/* ─── Checkmark Icon (Aprovação Rápida) ─── */
function CheckmarkIcon({ mouse, hovered }: { mouse: React.RefObject<{ x: number; y: number }>; hovered: boolean }) {
  const groupRef = useOrbitalParallax(mouse, hovered);

  return (
    <Float speed={1.2} rotationIntensity={0.05} floatIntensity={0.2}>
      <group ref={groupRef} scale={0.85}>
        {/* Container */}
        <RoundedBox args={[1.6, 1.6, 0.3]} radius={0.25} smoothness={6}>
          <meshPhysicalMaterial {...CONTAINER_MAT} />
        </RoundedBox>

        {/* Circle ring */}
        <mesh position={[0, 0, 0.18]}>
          <torusGeometry args={[0.4, 0.055, 16, 32]} />
          <meshPhysicalMaterial {...DETAIL_MAT} />
        </mesh>

        {/* Checkmark - short stroke */}
        <RoundedBox args={[0.2, 0.07, 0.06]} radius={0.02} smoothness={2} position={[-0.08, -0.04, 0.22]} rotation={[0, 0, Math.PI / 4]}>
          <meshPhysicalMaterial {...ACCENT_MAT} />
        </RoundedBox>

        {/* Checkmark - long stroke */}
        <RoundedBox args={[0.35, 0.07, 0.06]} radius={0.02} smoothness={2} position={[0.1, 0.06, 0.22]} rotation={[0, 0, -Math.PI / 4]}>
          <meshPhysicalMaterial {...ACCENT_MAT} />
        </RoundedBox>
      </group>
    </Float>
  );
}

/* ─── Scene wrapper with lighting ─── */
function Scene({
  icon,
  mouse,
  hovered,
}: {
  icon: "document" | "people" | "checkmark";
  mouse: React.RefObject<{ x: number; y: number }>;
  hovered: boolean;
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const targetIntensity = hovered ? 4.5 : 2;
    lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * 0.08;
  });

  const IconComponent = {
    document: DocumentIcon,
    people: PeopleIcon,
    checkmark: CheckmarkIcon,
  }[icon];

  return (
    <>
      {/* Main warm light - subtler */}
      <directionalLight position={[-3, 4, 2]} intensity={0.9} color="#d4a843" />
      {/* Fill light - blue accent */}
      <directionalLight position={[3, -1, 3]} intensity={0.6} color="#4a9eff" />
      {/* Rim light */}
      <directionalLight position={[0, 0, -3]} intensity={0.35} color="#8b7340" />
      {/* Interactive point light */}
      <pointLight ref={lightRef} position={[0, 2, 3]} intensity={2} color="#4a9eff" distance={8} />
      {/* Ambient - very subtle */}
      <ambientLight intensity={0.1} />

      <IconComponent mouse={mouse} hovered={hovered} />

      <ContactShadows
        position={[0, -1, 0]}
        opacity={0.3}
        scale={3}
        blur={2}
        far={3}
        color="#000000"
      />

      <Environment preset="city" />
      <fog attach="fog" args={["#000000", 5, 15]} />
    </>
  );
}

/* ─── Exported Card Component ─── */
export function ServiceCard3D({
  icon,
  title,
  description,
}: {
  icon: "document" | "people" | "checkmark";
  title: string;
  description: string;
}) {
  const [hovered, setHovered] = useState(false);
  const mouse = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouse.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: -((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        mouse.current = { x: 0, y: 0 };
      }}
      onMouseMove={handleMouseMove}
      className="group relative rounded-2xl border border-white/[0.06] overflow-hidden transition-all duration-500"
      style={{
        background: "#0a0a0f",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(74,158,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(74,158,255,0.15)",
        }}
      />

      {/* 3D Canvas — smaller, more compact */}
      <div className="w-full" style={{ aspectRatio: "4/3" }}>
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-white/[0.04] animate-pulse" />
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 4.5], fov: 30 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.1,
            }}
            style={{ background: "transparent" }}
          >
            <Scene icon={icon} mouse={mouse} hovered={hovered} />
          </Canvas>
        </Suspense>
      </div>

      {/* Text content */}
      <div className="px-6 pb-6 -mt-4">
        <h3 className="text-lg font-semibold text-white mb-1.5 tracking-[-0.02em]">
          {title}
        </h3>
        <p className="text-white/40 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
