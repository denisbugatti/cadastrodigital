/**
 * ServiceIcon3D — 3D metallic icons in the Resend style.
 * Each card gets its own Canvas with interactive parallax, orbital rotation,
 * warm/cool lighting, and emissive blue accents.
 */

import { useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/* ─── Shared material configs ─── */
const CONTAINER_MAT = {
  color: "#0a0a0f",
  metalness: 0.95,
  roughness: 0.15,
  clearcoat: 0.8,
  clearcoatRoughness: 0.1,
};

const DETAIL_MAT = {
  color: "#151520",
  metalness: 0.9,
  roughness: 0.2,
  clearcoat: 0.6,
};

const ACCENT_MAT = {
  color: "#4a9eff",
  metalness: 0.8,
  roughness: 0.3,
  emissive: "#4a9eff",
  emissiveIntensity: 0.25,
};

/* ─── Orbital rotation + mouse parallax ─── */
function useOrbitalParallax(mouse: React.RefObject<{ x: number; y: number }>, hovered: boolean) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    const parallaxStrength = hovered ? 0.2 : 0.08;
    const mx = (mouse.current?.x ?? 0) * parallaxStrength;
    const my = (mouse.current?.y ?? 0) * parallaxStrength;

    groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.3 + mx;
    groupRef.current.rotation.x = Math.sin(t * 0.12) * 0.15 + my;

    const targetScale = hovered ? 1.08 : 1.0;
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.08
    );
  });

  return groupRef;
}

/* ─── Document Icon (Cadastro Digital) ─── */
function DocumentIcon({ mouse, hovered }: { mouse: React.RefObject<{ x: number; y: number }>; hovered: boolean }) {
  const groupRef = useOrbitalParallax(mouse, hovered);

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Container squircle */}
        <RoundedBox args={[2.2, 2.2, 0.4]} radius={0.3} smoothness={6}>
          <meshPhysicalMaterial {...CONTAINER_MAT} />
        </RoundedBox>

        {/* Document body */}
        <RoundedBox args={[1.2, 1.5, 0.08]} radius={0.06} smoothness={4} position={[0, 0, 0.22]}>
          <meshPhysicalMaterial {...DETAIL_MAT} />
        </RoundedBox>

        {/* Folded corner */}
        <mesh position={[0.35, 0.5, 0.28]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.35, 0.35, 0.04]} />
          <meshPhysicalMaterial {...ACCENT_MAT} />
        </mesh>

        {/* Text lines */}
        {[-0.2, 0, 0.2].map((y, i) => (
          <RoundedBox key={i} args={[0.7 - i * 0.1, 0.06, 0.02]} radius={0.02} smoothness={2} position={[-0.05, y - 0.15, 0.28]}>
            <meshPhysicalMaterial
              color={i === 0 ? "#4a9eff" : "#252530"}
              emissive={i === 0 ? "#4a9eff" : "#000000"}
              emissiveIntensity={i === 0 ? 0.15 : 0}
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
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Container squircle */}
        <RoundedBox args={[2.2, 2.2, 0.4]} radius={0.3} smoothness={6}>
          <meshPhysicalMaterial {...CONTAINER_MAT} />
        </RoundedBox>

        {/* Center person (highlighted) */}
        <group position={[0, 0.15, 0.22]}>
          <mesh position={[0, 0.25, 0]}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshPhysicalMaterial {...ACCENT_MAT} />
          </mesh>
          <mesh position={[0, -0.15, 0]}>
            <capsuleGeometry args={[0.18, 0.3, 8, 16]} />
            <meshPhysicalMaterial {...ACCENT_MAT} />
          </mesh>
        </group>

        {/* Left person */}
        <group position={[-0.55, 0.05, 0.22]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <capsuleGeometry args={[0.14, 0.22, 8, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
        </group>

        {/* Right person */}
        <group position={[0.55, 0.05, 0.22]}>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshPhysicalMaterial {...DETAIL_MAT} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <capsuleGeometry args={[0.14, 0.22, 8, 16]} />
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
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group ref={groupRef}>
        {/* Container squircle */}
        <RoundedBox args={[2.2, 2.2, 0.4]} radius={0.3} smoothness={6}>
          <meshPhysicalMaterial {...CONTAINER_MAT} />
        </RoundedBox>

        {/* Circle ring */}
        <mesh position={[0, 0, 0.22]}>
          <torusGeometry args={[0.55, 0.08, 16, 32]} />
          <meshPhysicalMaterial {...DETAIL_MAT} />
        </mesh>

        {/* Checkmark - short stroke */}
        <RoundedBox args={[0.3, 0.1, 0.08]} radius={0.03} smoothness={2} position={[-0.12, -0.05, 0.28]} rotation={[0, 0, Math.PI / 4]}>
          <meshPhysicalMaterial {...ACCENT_MAT} />
        </RoundedBox>

        {/* Checkmark - long stroke */}
        <RoundedBox args={[0.5, 0.1, 0.08]} radius={0.03} smoothness={2} position={[0.15, 0.1, 0.28]} rotation={[0, 0, -Math.PI / 4]}>
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
    const targetIntensity = hovered ? 6 : 3;
    lightRef.current.intensity += (targetIntensity - lightRef.current.intensity) * 0.1;
  });

  const IconComponent = {
    document: DocumentIcon,
    people: PeopleIcon,
    checkmark: CheckmarkIcon,
  }[icon];

  return (
    <>
      {/* Main warm light */}
      <directionalLight position={[-3, 4, 2]} intensity={1.2} color="#d4a843" />
      {/* Fill light - blue accent */}
      <directionalLight position={[3, -1, 3]} intensity={0.8} color="#4a9eff" />
      {/* Rim light */}
      <directionalLight position={[0, 0, -3]} intensity={0.5} color="#8b7340" />
      {/* Interactive point light */}
      <pointLight ref={lightRef} position={[0, 2, 3]} intensity={3} color="#4a9eff" distance={8} />
      {/* Ambient */}
      <ambientLight intensity={0.15} />

      <IconComponent mouse={mouse} hovered={hovered} />

      <ContactShadows
        position={[0, -1.3, 0]}
        opacity={0.4}
        scale={4}
        blur={2.5}
        far={4}
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
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(74,158,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(74,158,255,0.2)",
        }}
      />

      {/* 3D Canvas */}
      <div className="w-full aspect-square relative">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] animate-pulse" />
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0, 5], fov: 35 }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              toneMapping: THREE.ACESFilmicToneMapping,
              toneMappingExposure: 1.2,
            }}
            style={{ background: "transparent" }}
          >
            <Scene icon={icon} mouse={mouse} hovered={hovered} />
          </Canvas>
        </Suspense>
      </div>

      {/* Text content */}
      <div className="px-6 pb-6 -mt-2">
        <h3 className="text-xl font-semibold text-white mb-2 tracking-[-0.02em]">
          {title}
        </h3>
        <p className="text-white/45 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
