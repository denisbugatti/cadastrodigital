/**
 * Cadastro Digital — Landing Page
 * Halo-inspired dark premium design with extraordinary animations.
 * Features: Loading screen with animated blobs, cursor glow, parallax,
 * card border glow following cursor, scroll animations, marquee ticker,
 * counter animations, gradient mesh, micro-interactions.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight, Shield, FileCheck, Users, Clock, Lock,
  ChevronDown, CheckCircle2, X, Phone, Mail, Building2,
  Sparkles, Eye, FileText, UserCheck, Send, Star,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════
   ANIMATED BLOB BACKGROUND
   Multiple floating blobs with blur for the hero/loading
   ═══════════════════════════════════════════════════ */
function AnimatedBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main large blob */}
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full opacity-30"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.6) 0%, rgba(59,130,246,0) 70%)",
          filter: "blur(80px)",
          top: "10%",
          left: "20%",
        }}
        animate={{
          x: [0, 80, -40, 60, 0],
          y: [0, -60, 40, -30, 0],
          scale: [1, 1.15, 0.95, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Secondary blob */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(96,165,250,0) 70%)",
          filter: "blur(100px)",
          bottom: "15%",
          right: "10%",
        }}
        animate={{
          x: [0, -60, 40, -80, 0],
          y: [0, 50, -40, 60, 0],
          scale: [1, 0.9, 1.2, 0.95, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Tertiary blob */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(147,197,253,0.4) 0%, rgba(147,197,253,0) 70%)",
          filter: "blur(90px)",
          top: "40%",
          left: "50%",
        }}
        animate={{
          x: [0, 100, -60, 50, 0],
          y: [0, -80, 30, -50, 0],
          scale: [1, 1.1, 0.85, 1.15, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Small accent blob */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full opacity-15"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.5) 0%, rgba(56,189,248,0) 70%)",
          filter: "blur(70px)",
          top: "60%",
          left: "10%",
        }}
        animate={{
          x: [0, 50, -30, 70, 0],
          y: [0, 40, -60, 20, 0],
          scale: [1, 1.2, 0.9, 1.05, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LOADING SCREEN
   Full-screen with animated blobs and brand text
   ═══════════════════════════════════════════════════ */
function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-[#0a0a0a] flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatedBlobs />
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.h1
          className="font-heading text-6xl sm:text-8xl md:text-9xl font-medium tracking-[-4px] text-white/40"
          animate={{ opacity: [0.2, 0.5, 0.3, 0.5, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          Cadastro Digital
        </motion.h1>
        <motion.div
          className="mt-8 w-48 h-0.5 mx-auto bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   CURSOR GLOW
   A soft glow that follows the mouse cursor
   ═══════════════════════════════════════════════════ */
function CursorGlow() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 25, stiffness: 200 });
  const smoothY = useSpring(mouseY, { damping: 25, stiffness: 200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed pointer-events-none z-[60] w-[400px] h-[400px] rounded-full hidden lg:block"
      style={{
        x: smoothX,
        y: smoothY,
        translateX: "-50%",
        translateY: "-50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0) 70%)",
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   GLOW CARD
   Card with border glow that follows the cursor
   ═══════════════════════════════════════════════════ */
function GlowCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        ref={cardRef}
        className={`relative rounded-2xl overflow-hidden ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Glow border effect */}
        <div
          className="absolute inset-0 rounded-2xl transition-opacity duration-500 pointer-events-none"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59,130,246,0.15), transparent 70%)`,
          }}
        />
        {/* Border */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: "1px solid",
            borderColor: isHovered ? "rgba(59,130,246,0.3)" : "rgba(34,34,34,1)",
            transition: "border-color 0.5s ease",
          }}
        />
        {/* Inner glow on border */}
        <div
          className="absolute inset-[0px] rounded-2xl pointer-events-none transition-opacity duration-500"
          style={{
            opacity: isHovered ? 1 : 0,
            boxShadow: "inset 0 0 30px rgba(59,130,246,0.05)",
          }}
        />
        {/* Content */}
        <div className="relative z-10 bg-[#161616] rounded-2xl">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   COUNTER ANIMATION
   ═══════════════════════════════════════════════════ */
function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isInView || hasStarted.current) return;
    hasStarted.current = true;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration]);

  return { count, ref };
}

/* ═══════════════════════════════════════════════════
   FADE IN WITH SCROLL
   ═══════════════════════════════════════════════════ */
function FadeIn({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  direction?: "up" | "left" | "right" | "none";
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const initial: Record<string, number> = { opacity: 0 };
  if (direction === "up") initial.y = 50;
  if (direction === "left") initial.x = -50;
  if (direction === "right") initial.x = 50;

  const animate = isInView ? { opacity: 1, y: 0, x: 0 } : initial;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={animate}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════ */
function StatCard({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(value, 2000);
  return (
    <div ref={ref} className="text-center p-6 sm:p-8">
      <div className="font-heading text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight text-white mb-2">
        {count}{suffix}
      </div>
      <div className="text-sm sm:text-base text-[#9c9c9c] font-body">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SERVICE CARD (with glow border)
   ═══════════════════════════════════════════════════ */
function ServiceCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <GlowCard delay={delay}>
      <div className="p-6 sm:p-8 h-full group">
        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-blue-500/10 transition-colors duration-500">
          <Icon size={22} className="text-[#9c9c9c] group-hover:text-blue-400 transition-colors duration-500" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-sm text-[#9c9c9c] leading-relaxed font-body">{description}</p>
      </div>
    </GlowCard>
  );
}

/* ═══════════════════════════════════════════════════
   FAQ ITEM
   ═══════════════════════════════════════════════════ */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#222] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-white group-hover:text-blue-400 transition-colors duration-300 pr-4">
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-[#9c9c9c] shrink-0"
        >
          <PlusIcon size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#9c9c9c] leading-relaxed pb-5 font-body">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   PREENCHER DIALOG
   ═══════════════════════════════════════════════════ */
function PreencherDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [corretorName, setCorretorName] = useState("");
  const [corretorPhone, setCorretorPhone] = useState("");
  const [, navigate] = useLocation();

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return clean.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!corretorName.trim()) {
      toast.error("Informe o nome do corretor");
      return;
    }
    const params = new URLSearchParams();
    params.set("corretor", corretorName.trim());
    if (corretorPhone.trim()) params.set("telefone", corretorPhone.replace(/\D/g, ""));
    navigate(`/vitoria?${params.toString()}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow border */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/20 via-transparent to-blue-500/10 pointer-events-none" />
            <div className="relative bg-[#161616] border border-blue-500/20 rounded-2xl p-8">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[#9c9c9c] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <motion.div
                  className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 mb-4"
                  animate={{ boxShadow: ["0 0 0 0 rgba(59,130,246,0)", "0 0 20px 4px rgba(59,130,246,0.15)", "0 0 0 0 rgba(59,130,246,0)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <FileText className="w-7 h-7 text-blue-400" />
                </motion.div>
                <h3 className="font-heading text-xl font-semibold text-white mb-1">
                  Preencher para Lançamento
                </h3>
                <p className="text-sm text-[#9c9c9c]">
                  Informe os dados do corretor que está te atendendo
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-[#9c9c9c] text-sm mb-1.5 block">Nome do Corretor *</Label>
                  <Input
                    type="text"
                    placeholder="Nome do corretor"
                    value={corretorName}
                    onChange={(e) => setCorretorName(e.target.value)}
                    className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-[#555] focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <Label className="text-[#9c9c9c] text-sm mb-1.5 block">Telefone do Corretor</Label>
                  <Input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={corretorPhone}
                    onChange={(e) => setCorretorPhone(formatPhone(e.target.value))}
                    maxLength={15}
                    className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-[#555] focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]"
                  >
                    Iniciar Cadastro <ArrowRight size={16} className="ml-2" />
                  </Button>
                </motion.div>
              </form>

              <p className="text-center text-[#555] text-xs mt-4 flex items-center justify-center gap-1.5">
                <Lock size={12} /> Dados protegidos pela LGPD
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════
   MARQUEE TICKER
   ═══════════════════════════════════════════════════ */
function Marquee({ children, speed = 30 }: { children: React.ReactNode; speed?: number }) {
  return (
    <div className="overflow-hidden whitespace-nowrap">
      <div
        className="inline-flex animate-marquee"
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAGNETIC BUTTON
   Button that subtly follows the cursor on hover
   ═══════════════════════════════════════════════════ */
function MagneticButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 15, stiffness: 300 });
  const springY = useSpring(y, { damping: 15, stiffness: 300 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════
   GLOWING BUTTON
   Primary CTA with animated glow
   ═══════════════════════════════════════════════════ */
function GlowingButton({
  children,
  onClick,
  className = "",
  size = "default",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "default" | "large";
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative group inline-flex items-center gap-2 font-bold tracking-wider rounded-xl transition-all duration-300 ${
        size === "large" ? "px-8 py-4 text-sm" : "px-5 py-2.5 text-sm"
      } ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
    >
      {/* Animated glow behind button */}
      <div className="absolute inset-0 rounded-xl bg-blue-500 opacity-100 group-hover:opacity-90 transition-opacity" />
      <motion.div
        className="absolute -inset-1 rounded-xl bg-blue-500/30 blur-lg"
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative z-10 text-white flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

/* ═══════════════════════════════════════════════════
   PARALLAX SECTION
   ═══════════════════════════════════════════════════ */
function ParallaxWrapper({ children, offset = 50, className = "" }: { children: React.ReactNode; offset?: number; className?: string }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════ */
export default function Landing() {
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [preencherOpen, setPreencherOpen] = useState(false);
  const [, navigate] = useLocation();

  // Scroll handler for sticky nav + scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      const sections = ["hero", "servicos", "processo", "estatisticas", "faq", "contato"];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const navItems = [
    { id: "servicos", label: "Serviços" },
    { id: "processo", label: "Processo" },
    { id: "estatisticas", label: "Números" },
    { id: "faq", label: "FAQ" },
    { id: "contato", label: "Contato" },
  ];

  const services = [
    { icon: Shield, title: "100% LGPD", description: "Todos os dados coletados são protegidos pela Lei Geral de Proteção de Dados. Nenhum corretor ou terceiro tem acesso direto às informações." },
    { icon: FileCheck, title: "Validação Digital", description: "Documentos e dados são validados digitalmente pelo responsável, sem exposição de informações sensíveis para terceiros." },
    { icon: Users, title: "Gestão de Equipe", description: "Hierarquia completa com Master, Diretor, Gerente e Corretor. Cada nível com permissões configuráveis." },
    { icon: Clock, title: "Processo Ágil", description: "O cliente preenche o formulário uma única vez. Sem reenvio de documentos, sem burocracia repetitiva." },
    { icon: Eye, title: "Acompanhamento em Tempo Real", description: "O cliente acompanha o status do cadastro pelo portal. Aprovado, pendente ou necessita revisão — tudo transparente." },
    { icon: Send, title: "Notificações Automáticas", description: "Emails automáticos em cada etapa: confirmação, aprovação, solicitação de correção. Ninguém fica sem informação." },
  ];

  const processSteps = [
    { step: "01", title: "Preencher", description: "O cliente acessa o formulário conversacional e preenche seus dados e documentos de forma segura e intuitiva.", icon: FileText },
    { step: "02", title: "Validar", description: "O corretor responsável revisa cada resposta e documento, aprovando ou solicitando correções com justificativa.", icon: UserCheck },
    { step: "03", title: "Aprovar", description: "Com tudo validado, o cliente recebe a aprovação e está apto para prosseguir com a compra do imóvel.", icon: CheckCircle2 },
  ];

  const faqs = [
    { question: "Meus dados estão seguros?", answer: "Sim. Todos os dados são protegidos pela LGPD (Lei Geral de Proteção de Dados). Nenhum corretor ou terceiro tem acesso direto às suas informações pessoais. Apenas o responsável designado pode visualizar os dados para fins de validação." },
    { question: "Preciso enviar documentos pelo WhatsApp?", answer: "Não! Esse é justamente o diferencial da plataforma. Você preenche tudo de forma digital, segura e organizada. Sem precisar enviar fotos de documentos por mensagem." },
    { question: "Como acompanho o status do meu cadastro?", answer: "Após o preenchimento, você recebe um código de protocolo por email. Com seu CPF/CNPJ, pode acessar o portal do cliente a qualquer momento para verificar se foi aprovado ou se precisa corrigir algo." },
    { question: "O que acontece se meu documento for reprovado?", answer: "Você receberá um email explicando o motivo e poderá reenviar o documento correto pelo portal. É um processo simples e rápido." },
    { question: "Quem pode ver minhas informações?", answer: "Para o cliente, a informação é clara: ninguém além do sistema tem acesso. Na prática, apenas o responsável pelo formulário (corretor designado) pode validar os dados, mas o cliente não sabe quem é." },
    { question: "Quanto tempo leva o processo?", answer: "O preenchimento leva em média 10 minutos. A validação depende do corretor responsável, mas geralmente é concluída em até 24 horas úteis." },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* ─── Loading Screen ─── */}
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      {/* ─── Cursor Glow ─── */}
      <CursorGlow />

      {/* ─── Sticky Nav ─── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/[0.06]"
            : "bg-transparent"
        }`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: loading ? -80 : 0, opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2.5"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-heading text-base font-semibold tracking-tight">Cadastro Digital</span>
          </motion.div>

          {/* Nav links */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`relative px-3 py-1.5 text-sm transition-colors duration-300 rounded-lg ${
                  activeSection === item.id
                    ? "text-white"
                    : "text-[#9c9c9c] hover:text-white"
                }`}
              >
                {activeSection === item.id && (
                  <motion.div
                    className="absolute inset-0 bg-white/[0.06] rounded-lg"
                    layoutId="nav-active"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex text-sm text-[#9c9c9c] hover:text-white transition-colors duration-300"
            >
              Entrar
            </button>
            <GlowingButton onClick={() => setPreencherOpen(true)}>
              <span className="hidden sm:inline">Preencher para Lançamento</span>
              <span className="sm:hidden">Preencher</span>
              <ArrowRight size={14} />
            </GlowingButton>
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16">
        {/* Animated background blobs */}
        <AnimatedBlobs />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundSize: "128px 128px",
          }}
        />

        {/* Faded watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <motion.span
            className="font-heading text-[18vw] font-bold text-white/[0.015] tracking-tighter select-none whitespace-nowrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: loading ? 0 : 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          >
            CADASTRO
          </motion.span>
        </div>

        {/* Grid lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
          <div className="absolute top-0 left-2/4 w-px h-full bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />
          <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
          <motion.div
            className="max-w-4xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: loading ? 0 : 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? 20 : 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <motion.div
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
                One Innovation
              </span>
            </motion.div>

            {/* Headline */}
            <div className="overflow-hidden mb-8">
              <motion.h1
                className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[100px] font-medium leading-[0.95] tracking-[-2px]"
                initial={{ opacity: 0, y: 80 }}
                animate={{ opacity: loading ? 0 : 1, y: loading ? 80 : 0 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                Lançamentos{" "}
                <motion.span
                  className="italic text-blue-400"
                  animate={!loading ? {
                    textShadow: [
                      "0 0 20px rgba(59,130,246,0)",
                      "0 0 40px rgba(59,130,246,0.3)",
                      "0 0 20px rgba(59,130,246,0)",
                    ],
                  } : {}}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  exclusivos
                </motion.span>{" "}
                para clientes cadastrados.
              </motion.h1>
            </div>

            {/* Subtitle */}
            <motion.p
              className="text-lg sm:text-xl text-[#9c9c9c] max-w-xl mb-10 leading-relaxed font-body"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? 30 : 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              Plataforma digital de cadastro 100% protegida pela LGPD.
              Seus dados seguros, seu imóvel mais perto.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex items-center gap-4 flex-wrap"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: loading ? 0 : 1, y: loading ? 30 : 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <GlowingButton onClick={() => setPreencherOpen(true)} size="large">
                PREENCHER PARA LANÇAMENTO <ArrowRight size={16} />
              </GlowingButton>

              <MagneticButton
                onClick={() => navigate("/login")}
                className="text-sm text-[#9c9c9c] hover:text-white transition-colors duration-300 inline-flex items-center gap-2 px-4 py-3"
              >
                <Users size={14} />
                Área do Corretor
              </MagneticButton>
            </motion.div>

            {/* LGPD badge */}
            <motion.div
              className="mt-12 inline-flex items-center gap-2 text-[#555]"
              initial={{ opacity: 0 }}
              animate={{ opacity: loading ? 0 : 1 }}
              transition={{ delay: 1.3 }}
            >
              <Lock size={14} />
              <span className="text-xs font-medium tracking-wide">Dados confidenciais • LGPD</span>
            </motion.div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: loading ? 0 : 0.5 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={24} className="text-white/30" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SERVICES SECTION
          ═══════════════════════════════════════════ */}
      <section id="servicos" className="py-24 sm:py-32 relative">
        <ParallaxWrapper offset={30} className="absolute w-[500px] h-[500px] top-0 right-0 pointer-events-none">
          <div className="w-full h-full rounded-full bg-blue-500/5 blur-[120px]" />
        </ParallaxWrapper>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeIn>
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4">
              O que oferecemos
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-medium leading-[0.95] tracking-[-1.5px] mb-4 max-w-2xl">
              Cadastro <span className="italic text-blue-400">digital</span> seguro.
            </h2>
            <p className="text-base text-[#9c9c9c] max-w-lg mb-16 font-body">
              Uma plataforma completa para que o jurídico colete informações dos clientes de forma protegida, sem exposição de dados.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {services.map((service, i) => (
              <ServiceCard key={service.title} {...service} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PROCESS SECTION
          ═══════════════════════════════════════════ */}
      <section id="processo" className="py-24 sm:py-32 relative">
        <ParallaxWrapper offset={-20} className="absolute w-[600px] h-[600px] -left-40 top-1/3 pointer-events-none">
          <div className="w-full h-full rounded-full bg-cyan-500/5 blur-[120px]" />
        </ParallaxWrapper>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeIn>
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4">
              Como funciona
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-medium leading-[0.95] tracking-[-1.5px] mb-16 max-w-2xl">
              O <span className="italic text-blue-400">processo</span>.
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {processSteps.map((step, i) => (
              <GlowCard key={step.step} delay={i * 0.12}>
                <div className="relative p-6 sm:p-8 h-full">
                  {/* Step number watermark */}
                  <div className="font-heading text-7xl sm:text-8xl font-bold text-white/[0.03] absolute top-4 right-6 select-none">
                    {step.step}
                  </div>
                  <div className="relative z-10">
                    <motion.div
                      className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6"
                      whileHover={{
                        boxShadow: "0 0 20px rgba(59,130,246,0.2)",
                        scale: 1.05,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <step.icon size={22} className="text-blue-400" />
                    </motion.div>
                    <h3 className="font-heading text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-sm text-[#9c9c9c] leading-relaxed font-body">{step.description}</p>
                  </div>
                  {/* Connecting line */}
                  {i < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-[#333] to-transparent" />
                  )}
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATISTICS SECTION
          ═══════════════════════════════════════════ */}
      <section id="estatisticas" className="py-24 sm:py-32 relative">
        <ParallaxWrapper offset={40} className="absolute w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-full h-full rounded-full bg-blue-600/5 blur-[120px]" />
        </ParallaxWrapper>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeIn>
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4 text-center">
              Nossos números
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-medium leading-[0.95] tracking-[-1.5px] mb-16 text-center">
              Em <span className="italic text-blue-400">números</span>.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { value: 100, suffix: "%", label: "Conformidade LGPD" },
              { value: 10, suffix: "min", label: "Tempo médio de cadastro" },
              { value: 0, suffix: "", label: "Documentos por WhatsApp" },
              { value: 24, suffix: "h", label: "Validação em até" },
            ].map((stat, i) => (
              <GlowCard key={stat.label} delay={i * 0.1}>
                <StatCard {...stat} />
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MARQUEE / TRUST BAND
          ═══════════════════════════════════════════ */}
      <section className="py-10 border-y border-white/[0.04] overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-[#0a0a0a] z-10 pointer-events-none" />
        <Marquee speed={25}>
          {["ONE INNOVATION", "CADASTRO DIGITAL", "LGPD", "SEGURANÇA", "LANÇAMENTOS EXCLUSIVOS", "ONE INNOVATION", "CADASTRO DIGITAL", "LGPD", "SEGURANÇA", "LANÇAMENTOS EXCLUSIVOS"].map((text, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-6">
              <span className="font-heading text-sm font-medium tracking-[0.3em] text-white/[0.08] uppercase">{text}</span>
              <span className="text-white/[0.06]">◆</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* ═══════════════════════════════════════════
          FAQ SECTION
          ═══════════════════════════════════════════ */}
      <section id="faq" className="py-24 sm:py-32 relative">
        <ParallaxWrapper offset={-25} className="absolute w-[400px] h-[400px] bottom-0 right-0 pointer-events-none">
          <div className="w-full h-full rounded-full bg-blue-500/5 blur-[120px]" />
        </ParallaxWrapper>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <FadeIn>
            <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4">
              Dúvidas frequentes
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-medium leading-[0.95] tracking-[-1.5px] mb-16 max-w-lg">
              <span className="italic text-blue-400">Respostas</span>.
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-0">
            <div>
              {faqs.slice(0, 3).map((faq, i) => (
                <FadeIn key={faq.question} delay={i * 0.08}>
                  <FAQItem {...faq} />
                </FadeIn>
              ))}
            </div>
            <div>
              {faqs.slice(3).map((faq, i) => (
                <FadeIn key={faq.question} delay={i * 0.08}>
                  <FAQItem {...faq} />
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════════ */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-[800px] h-[800px] rounded-full opacity-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 60%)",
              filter: "blur(100px)",
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <FadeIn>
            <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-medium leading-[0.95] tracking-[-1.5px] mb-6">
              Pronto para o seu{" "}
              <span className="italic text-blue-400">próximo imóvel</span>?
            </h2>
            <p className="text-base text-[#9c9c9c] mb-10 font-body max-w-lg mx-auto">
              Faça seu cadastro digital agora e esteja preparado para os lançamentos exclusivos da One Innovation.
            </p>

            <div className="flex items-center justify-center gap-4 flex-wrap">
              <GlowingButton onClick={() => setPreencherOpen(true)} size="large">
                PREENCHER AGORA <ArrowRight size={16} />
              </GlowingButton>
              <MagneticButton
                onClick={() => navigate("/portal")}
                className="px-6 py-4 border border-[#333] text-white text-sm font-medium rounded-xl hover:border-blue-500/30 transition-all duration-300"
              >
                Acompanhar meu cadastro
              </MagneticButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CONTACT SECTION
          ═══════════════════════════════════════════ */}
      <section id="contato" className="py-24 sm:py-32 border-t border-white/[0.04] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left: Info */}
            <FadeIn>
              <p className="text-xs font-semibold tracking-widest text-blue-400 uppercase mb-4">
                Contato
              </p>
              <h2 className="font-heading text-4xl sm:text-5xl md:text-6xl font-medium leading-[0.95] tracking-[-1.5px] mb-8">
                Fale <span className="italic text-blue-400">conosco</span>.
              </h2>

              <div className="space-y-6 mb-8">
                <motion.div
                  className="flex items-center gap-4"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center">
                    <Mail size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9c9c9c] mb-0.5">Email</p>
                    <a href="mailto:contato@denisbugatti.com.br" className="text-white hover:text-blue-400 transition-colors duration-300 text-sm">
                      contato@denisbugatti.com.br
                    </a>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center gap-4"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center">
                    <Phone size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9c9c9c] mb-0.5">Telefone</p>
                    <span className="text-white text-sm">Fale com um dos nossos corretores</span>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center gap-4"
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center">
                    <Building2 size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9c9c9c] mb-0.5">Empresa</p>
                    <span className="text-white text-sm">One Innovation</span>
                  </div>
                </motion.div>
              </div>

              <div className="p-4 rounded-xl border border-[#222] bg-[#161616] inline-flex items-center gap-3">
                <Shield size={16} className="text-blue-400" />
                <span className="text-xs text-[#9c9c9c]">Dados protegidos pela Lei Geral de Proteção de Dados (LGPD)</span>
              </div>
            </FadeIn>

            {/* Right: Quick actions */}
            <FadeIn delay={0.2}>
              <div className="space-y-4">
                {[
                  { icon: FileText, title: "Preencher para Lançamento", desc: "Inicie seu cadastro digital agora", action: () => setPreencherOpen(true) },
                  { icon: Users, title: "Área do Corretor", desc: "Acesse o painel de gestão", action: () => navigate("/login") },
                  { icon: Eye, title: "Portal do Cliente", desc: "Acompanhe o status do seu cadastro", action: () => navigate("/portal") },
                ].map((item, i) => (
                  <motion.button
                    key={item.title}
                    onClick={item.action}
                    className="w-full p-6 rounded-2xl border border-[#222] bg-[#161616] hover:border-blue-500/30 transition-all duration-500 text-left group relative overflow-hidden"
                    whileHover={{ y: -3 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {/* Hover glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-shadow duration-500">
                          <item.icon size={20} className="text-blue-400" />
                        </div>
                        <ArrowRight size={18} className="text-[#555] group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <h3 className="font-heading text-lg font-semibold text-white mb-1">{item.title}</h3>
                      <p className="text-sm text-[#9c9c9c]">{item.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.04] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-[0_0_10px_rgba(59,130,246,0.2)]">
              <Shield size={12} className="text-white" />
            </div>
            <span className="text-sm text-[#9c9c9c]">Cadastro Digital</span>
          </div>
          <p className="text-xs text-[#555] font-body">
            One Innovation — Cadastro digital protegido pela LGPD
          </p>
        </div>
      </footer>

      {/* ─── Preencher Dialog ─── */}
      <PreencherDialog open={preencherOpen} onClose={() => setPreencherOpen(false)} />
    </div>
  );
}
