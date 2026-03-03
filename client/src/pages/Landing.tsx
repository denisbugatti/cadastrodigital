/**
 * Landing Page — Cadastro Digital / One Innovation
 * Ultra-fluid performance: CSS-only background animations, GPU-accelerated,
 * minimal framer-motion (only for scroll-triggered reveals), no heavy blobs/blur.
 * Design: Halo-inspired dark premium with blue accents.
 */

import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLocation } from "wouter";
import { motion, useInView } from "framer-motion";
import {
  Shield, Lock, FileCheck, Users, Clock, CheckCircle,
  ArrowRight, ChevronDown, ChevronUp, Phone, Mail,
  Zap, Eye, FileText, Star, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

/* ─── Constants ─── */
const ACCENT = "#70BEFA";
const BG = "#0a0a0a";
const CARD_BG = "#141414";

/* ─── Reveal wrapper (no animation on public landing) ─── */
const Reveal = memo(({ children, className = "", delay: _delay = 0 }: {
  children: React.ReactNode; className?: string; delay?: number;
}) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
});

/* ─── Counter Animation ─── */
function AnimatedCounter({ target, suffix = "", duration = 2000 }: {
  target: number; suffix?: string; duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref as any, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ─── Marquee Ticker (pure CSS) ─── */
const MarqueeTicker = memo(() => {
  const items = ["ONE INNOVATION", "CADASTRO DIGITAL", "LGPD", "SEGURANÇA", "PROTEÇÃO DE DADOS", "LANÇAMENTOS EXCLUSIVOS"];
  const row = items.map((t, i) => (
    <span key={i} className="flex items-center gap-6 whitespace-nowrap">
      <span className="text-white/90 text-sm font-medium tracking-[0.2em] uppercase">{t}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-[#70BEFA]/60" />
    </span>
  ));
  return (
    <div className="relative overflow-hidden py-5 border-y border-white/[0.06]" style={{ background: "#0d0d0d" }}>
      <div className="flex gap-6 animate-[marquee_35s_linear_infinite]">
        {row}{row}{row}{row}
      </div>
    </div>
  );
});

/* ─── FAQ Item ─── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-white/[0.06] rounded-xl overflow-hidden transition-colors hover:border-white/[0.12]"
      style={{ background: CARD_BG }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <span className="text-white/90 font-medium pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-white/40 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "300px" : "0", opacity: open ? 1 : 0 }}
      >
        <p className="px-5 pb-5 text-white/50 text-sm leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ─── Glow Card (CSS-only hover glow) ─── */
const GlowCard = memo(({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      className={`relative group rounded-xl border border-white/[0.06] overflow-hidden transition-colors duration-300 hover:border-white/[0.12] ${className}`}
      style={{ background: CARD_BG }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(300px circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(112,190,250,0.06), transparent 60%)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
});

/* ─── Preencher Modal ─── */
function PreencherModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, navigate] = useLocation();
  const [corretorName, setCorretorName] = useState("");
  const [corretorPhone, setCorretorPhone] = useState("");

  const { data: corretoresList } = trpc.corretores.list.useQuery(undefined, { enabled: open });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const corretor = corretoresList?.find(
      (c: any) => c.name.toLowerCase().includes(corretorName.toLowerCase())
    );
    if (corretor?.formSlug) {
      navigate(`/${corretor.formSlug}`);
    } else {
      navigate("/vitoria");
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md rounded-2xl border border-white/[0.08] p-8"
        style={{ background: "#111" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#70BEFA]/20 to-[#3b82f6]/20 border border-[#70BEFA]/20 mb-4">
            <FileText className="w-7 h-7 text-[#70BEFA]" />
          </div>
          <h3 className="text-xl font-semibold text-white">Preencher Cadastro</h3>
          <p className="text-white/50 text-sm mt-1">Informe o corretor que está atendendo você</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Nome do Corretor</label>
            <Input
              value={corretorName}
              onChange={(e) => setCorretorName(e.target.value)}
              placeholder="Ex: João Silva"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#70BEFA]/50"
            />
          </div>
          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Telefone do Corretor</label>
            <Input
              value={corretorPhone}
              onChange={(e) => setCorretorPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#70BEFA]/50"
            />
          </div>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-[#70BEFA] to-[#3b82f6] hover:brightness-110 text-white border-0 transition-all duration-200"
          >
            Iniciar Cadastro
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

/* ─── Nav ─── */
const Nav = memo(({ onPreencher }: { onPreencher: () => void }) => {
  const [, navigate] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(10,10,10,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.04)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#70BEFA] to-[#3b82f6] flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm tracking-wide">CADASTRO DIGITAL</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#sobre" className="text-white/50 hover:text-white text-sm transition-colors">Sobre</a>
          <a href="#servicos" className="text-white/50 hover:text-white text-sm transition-colors">Serviços</a>
          <a href="#processo" className="text-white/50 hover:text-white text-sm transition-colors">Processo</a>
          <a href="#faq" className="text-white/50 hover:text-white text-sm transition-colors">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="text-white/60 hover:text-white text-sm font-medium transition-colors px-3 py-1.5"
          >
            Entrar
          </button>
          <button
            onClick={onPreencher}
            className="relative px-5 py-2 rounded-lg text-sm font-semibold text-white overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #70BEFA, #3b82f6)" }}
          >
            <span className="relative z-10">Preencher</span>
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </button>
        </div>
      </div>
    </nav>
  );
});

/* ═══════════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function Landing() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff" }}>
      {/* CSS Animations - all GPU-accelerated with transform3d */}
      <style>{`
        @keyframes marquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-25%, 0, 0); }
        }
        @keyframes float-a {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(30px, -20px, 0) scale(1.03); }
          66% { transform: translate3d(-15px, 10px, 0) scale(0.97); }
        }
        @keyframes float-b {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(-20px, 15px, 0) scale(1.05); }
          66% { transform: translate3d(25px, -10px, 0) scale(0.95); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .glow-btn {
          position: relative;
          overflow: hidden;
        }
        .glow-btn::after {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #70BEFA, #3b82f6, #70BEFA);
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
          border-radius: inherit;
          z-index: -1;
          opacity: 0.4;
          filter: blur(8px);
          transition: opacity 0.3s;
        }
        .glow-btn:hover::after {
          opacity: 0.7;
        }
        .orb {
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      `}</style>

      <Nav onPreencher={() => setModalOpen(true)} />
      <PreencherModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* ─── HERO ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background orbs - CSS only, GPU accelerated, NO blur */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="orb absolute w-[600px] h-[600px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(112,190,250,0.08) 0%, transparent 70%)",
              top: "5%", left: "10%",
              animation: "float-a 12s ease-in-out infinite",
            }}
          />
          <div
            className="orb absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)",
              bottom: "10%", right: "5%",
              animation: "float-b 15s ease-in-out infinite",
            }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-5 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#70BEFA] animate-pulse" />
              <span className="text-white/60 text-xs font-medium tracking-wider uppercase">One Innovation</span>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold leading-[0.95] tracking-[-0.03em] mb-6">
              Lançamentos{" "}
              <span
                className="italic"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT}, #3b82f6)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                exclusivos
              </span>
              <br />
              <span className="text-white/90">para clientes</span>
              <br />
              <span className="text-white/70">cadastrados</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-white/45 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Plataforma 100% segura e protegida pela LGPD para coleta de dados
              e documentos de forma digital, rápida e confidencial.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => setModalOpen(true)}
                className="glow-btn relative px-8 py-4 rounded-xl text-base font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #70BEFA, #3b82f6)" }}
              >
                <span className="flex items-center gap-2">
                  Preencher para Lançamento
                  <ArrowRight className="w-5 h-5" />
                </span>
              </button>
              <a
                href="#sobre"
                className="px-6 py-4 rounded-xl text-base font-medium text-white/60 hover:text-white border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200 hover:bg-white/[0.03]"
              >
                Saiba mais
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="flex items-center justify-center gap-2 mt-10 text-white/30 text-sm">
              <Lock className="w-4 h-4" />
              <span>Dados protegidos pela LGPD — Lei Geral de Proteção de Dados</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <MarqueeTicker />

      {/* ─── SOBRE ─── */}
      <section id="sobre" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="max-w-3xl mb-16">
              <p className="text-[#70BEFA] text-sm font-medium tracking-wider uppercase mb-4">Sobre a plataforma</p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] leading-[1.1]">
                Cadastro digital{" "}
                <span className="text-white/40">seguro e eficiente</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            <Reveal delay={0.1}>
              <GlowCard className="p-8 h-full">
                <Shield className="w-10 h-10 text-[#70BEFA] mb-5" />
                <h3 className="text-xl font-semibold text-white mb-3">Proteção Total LGPD</h3>
                <p className="text-white/45 leading-relaxed">
                  Todos os dados e documentos são coletados e armazenados em conformidade total com a
                  Lei Geral de Proteção de Dados. Nenhuma informação é compartilhada com terceiros.
                </p>
              </GlowCard>
            </Reveal>
            <Reveal delay={0.2}>
              <GlowCard className="p-8 h-full">
                <Eye className="w-10 h-10 text-[#70BEFA] mb-5" />
                <h3 className="text-xl font-semibold text-white mb-3">Confidencialidade Garantida</h3>
                <p className="text-white/45 leading-relaxed">
                  O cliente não precisa enviar documentos para corretores. Tudo é feito diretamente
                  na plataforma, com acesso restrito e rastreável.
                </p>
              </GlowCard>
            </Reveal>
            <Reveal delay={0.15}>
              <GlowCard className="p-8 h-full">
                <Zap className="w-10 h-10 text-[#70BEFA] mb-5" />
                <h3 className="text-xl font-semibold text-white mb-3">Processo 100% Digital</h3>
                <p className="text-white/45 leading-relaxed">
                  Sem papel, sem deslocamento. O cliente preenche o cadastro de qualquer lugar,
                  a qualquer hora, pelo celular ou computador.
                </p>
              </GlowCard>
            </Reveal>
            <Reveal delay={0.25}>
              <GlowCard className="p-8 h-full">
                <FileCheck className="w-10 h-10 text-[#70BEFA] mb-5" />
                <h3 className="text-xl font-semibold text-white mb-3">Validação Inteligente</h3>
                <p className="text-white/45 leading-relaxed">
                  Cada documento e informação é validado individualmente. Se algo estiver
                  ilegível ou incorreto, o cliente é notificado automaticamente.
                </p>
              </GlowCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── SERVIÇOS ─── */}
      <section id="servicos" className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[#70BEFA] text-sm font-medium tracking-wider uppercase mb-4">Serviços</p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em]">
                O que{" "}
                <span className="italic" style={{ color: ACCENT }}>oferecemos</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <FileText className="w-8 h-8" />,
                title: "Cadastro Digital",
                desc: "Formulários inteligentes que se adaptam ao perfil do cliente. Coleta segura de dados pessoais, documentos e comprovantes.",
              },
              {
                icon: <Users className="w-8 h-8" />,
                title: "Gestão de Corretores",
                desc: "Cada corretor tem seu link exclusivo. Acompanhe em tempo real os cadastros da sua equipe com painel completo de analytics.",
              },
              {
                icon: <CheckCircle className="w-8 h-8" />,
                title: "Aprovação Rápida",
                desc: "Validação individual de cada resposta e documento. O cliente recebe notificação automática do status.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <GlowCard className="p-8 text-center h-full">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#70BEFA]/10 text-[#70BEFA] mb-5">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{item.desc}</p>
                </GlowCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROCESSO ─── */}
      <section id="processo" className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[#70BEFA] text-sm font-medium tracking-wider uppercase mb-4">Como funciona</p>
              <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em]">
                O{" "}
                <span className="italic" style={{ color: ACCENT }}>processo</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Acesse o Link", desc: "Receba o link exclusivo do seu corretor e acesse pelo celular ou computador." },
              { step: "02", title: "Preencha os Dados", desc: "Complete o formulário com seus dados pessoais e envie os documentos solicitados." },
              { step: "03", title: "Aguarde a Validação", desc: "Nossa equipe valida cada informação. Se necessário, você será notificado para ajustes." },
              { step: "04", title: "Aprovação", desc: "Receba a confirmação de que seu cadastro foi aprovado e está apto para o lançamento." },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="font-heading text-5xl font-bold text-white/[0.06] mb-4">{item.step}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-20 border-t border-white/[0.04]" style={{ background: "#0d0d0d" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 100, suffix: "%", label: "Conformidade LGPD" },
              { value: 10, suffix: "min", label: "Tempo médio de cadastro" },
              { value: 24, suffix: "h", label: "Validação em até" },
              { value: 0, suffix: "", label: "Dados compartilhados", display: "Zero" },
            ].map((stat, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="font-heading text-4xl md:text-5xl font-semibold text-white mb-2">
                    {stat.display ?? <AnimatedCounter target={stat.value} suffix={stat.suffix} />}
                  </div>
                  <p className="text-white/40 text-sm">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MARQUEE 2 ─── */}
      <MarqueeTicker />

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-5">
          <Reveal>
            <div className="text-center mb-16">
              <p className="text-[#70BEFA] text-sm font-medium tracking-wider uppercase mb-4">Dúvidas frequentes</p>
              <h2 className="font-heading text-4xl md:text-5xl font-semibold tracking-[-0.02em]">
                Perguntas{" "}
                <span className="italic" style={{ color: ACCENT }}>frequentes</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { q: "Meus dados estão seguros?", a: "Sim. A plataforma é 100% protegida pela LGPD. Seus dados são criptografados e armazenados em servidores seguros. Nenhum corretor ou terceiro tem acesso direto às suas informações." },
              { q: "Preciso ir presencialmente?", a: "Não. Todo o processo é 100% digital. Você preenche o cadastro pelo celular ou computador, de qualquer lugar." },
              { q: "Quanto tempo leva a validação?", a: "A validação é feita em até 24 horas úteis. Se algum documento estiver ilegível, você será notificado por email para enviar novamente." },
              { q: "O corretor vê meus documentos?", a: "Não. O corretor apenas valida se os documentos estão legíveis e corretos. Ele não tem acesso ao conteúdo dos seus dados pessoais." },
              { q: "Posso continuar depois?", a: "Sim. Você pode salvar e continuar o preenchimento a qualquer momento. Basta acessar com seu CPF/CNPJ e senha." },
              { q: "O que acontece após a aprovação?", a: "Você receberá um email de confirmação informando que está apto para participar dos lançamentos exclusivos da One Innovation." },
            ].map((faq, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <FaqItem q={faq.q} a={faq.a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-24 md:py-32 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <Reveal>
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.02em] mb-6">
              Pronto para{" "}
              <span className="italic" style={{ color: ACCENT }}>começar</span>?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-white/40 text-lg mb-10 max-w-xl mx-auto">
              Faça seu cadastro agora e garanta acesso exclusivo aos próximos lançamentos da One Innovation.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <button
              onClick={() => setModalOpen(true)}
              className="glow-btn relative px-10 py-5 rounded-xl text-lg font-semibold text-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #70BEFA, #3b82f6)" }}
            >
              <span className="flex items-center gap-3">
                Preencher para Lançamento
                <ArrowRight className="w-5 h-5" />
              </span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* ─── CONTATO ─── */}
      <section className="py-20 border-t border-white/[0.04]" style={{ background: "#0d0d0d" }}>
        <div className="max-w-6xl mx-auto px-5">
          <div className="grid md:grid-cols-2 gap-12">
            <Reveal>
              <div>
                <p className="text-[#70BEFA] text-sm font-medium tracking-wider uppercase mb-4">Contato</p>
                <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-[-0.02em] mb-6">
                  Fale conosco
                </h2>
                <p className="text-white/40 mb-8 leading-relaxed">
                  Tem dúvidas sobre o processo de cadastro? Entre em contato com nossa equipe.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/50">
                    <Phone className="w-5 h-5 text-[#70BEFA]" />
                    <span>(11) 99999-9999</span>
                  </div>
                  <div className="flex items-center gap-3 text-white/50">
                    <Mail className="w-5 h-5 text-[#70BEFA]" />
                    <span>contato@cadastrodigital.com.br</span>
                  </div>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <GlowCard className="p-8">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <Input
                    placeholder="Seu nome"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#70BEFA]/50"
                  />
                  <Input
                    placeholder="Seu email"
                    type="email"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#70BEFA]/50"
                  />
                  <textarea
                    placeholder="Sua mensagem"
                    rows={4}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-[#70BEFA]/50 p-3 text-sm resize-none outline-none transition-colors"
                  />
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#70BEFA] to-[#3b82f6] hover:brightness-110 text-white font-semibold border-0"
                  >
                    Enviar Mensagem
                  </Button>
                </form>
              </GlowCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-10 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#70BEFA] to-[#3b82f6] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white/40 text-sm">Cadastro Digital © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-2 text-white/30 text-xs">
            <Lock className="w-3 h-3" />
            <span>Protegido pela LGPD — One Innovation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
