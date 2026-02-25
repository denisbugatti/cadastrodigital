/**
 * FormFlow Landing Page — Dark Elegant Design
 * Inspired by the published site: dark navy bg, gold/amber accents, serif display font
 */

import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import {
  Zap, ArrowRight, MessageSquare, Sparkles, Palette,
  CheckCircle2, Keyboard, Smartphone, BarChart3, Shield,
  ChevronDown, Play,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Uma pergunta por vez",
    description: "Sem sobrecarga cognitiva. O usuário foca em uma resposta de cada vez, tornando o preenchimento mais natural.",
  },
  {
    icon: Sparkles,
    title: "Transições fluidas",
    description: "Animações suaves com fade e escala criam uma sensação de conversa real, não de formulário burocrático.",
  },
  {
    icon: Palette,
    title: "Múltiplos tipos de campo",
    description: "Texto, e-mail, múltipla escolha, avaliação NPS, textarea e mais — tudo com a mesma elegância visual.",
  },
];

const benefits = [
  { icon: BarChart3, label: "Maior taxa de conclusão" },
  { icon: MessageSquare, label: "Experiência conversacional" },
  { icon: Sparkles, label: "Design imersivo e premium" },
  { icon: Keyboard, label: "Navegação por teclado" },
  { icon: Shield, label: "Validação em tempo real" },
  { icon: Smartphone, label: "Responsivo para mobile" },
];

function FadeInSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white overflow-x-hidden">
      {/* ─── Navbar ─── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0a0a12]/90 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <Zap size={16} className="text-[#0a0a12]" />
              </div>
              <span className="text-base font-semibold tracking-tight">FormFlow</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button className="text-sm text-white/50 hover:text-white/90 transition-colors">
              Recursos
            </button>
            <button className="text-sm text-white/50 hover:text-white/90 transition-colors">
              Exemplos
            </button>
            <button className="text-sm text-white/50 hover:text-white/90 transition-colors">
              Preços
            </button>
          </div>

          <Link href="/editor">
            <motion.button
              className="px-5 py-2 bg-amber-400 text-[#0a0a12] text-sm font-bold tracking-wider rounded-lg hover:bg-amber-300 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              CRIAR FORMULÁRIO <ArrowRight size={14} className="inline ml-1" />
            </motion.button>
          </Link>
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Subtle gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-400/30 bg-amber-400/5 mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-semibold tracking-widest text-amber-400 uppercase">
                Formulários do futuro
              </span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold leading-[0.95] tracking-tight mb-8 max-w-4xl">
              Formulários que{" "}
              <span className="italic text-amber-400 font-normal">conversam</span>{" "}
              com você.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-white/40 max-w-xl mb-10 leading-relaxed font-body">
              Uma interface conversacional que exibe uma pergunta por vez.
              Mais engajamento, menos abandono. Design imersivo que
              transforma dados em diálogo.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-5 flex-wrap">
              <Link href="/editor">
                <motion.button
                  className="px-7 py-3.5 bg-amber-400 text-[#0a0a12] text-sm font-bold tracking-wider rounded-lg hover:bg-amber-300 transition-colors inline-flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  CRIAR MEU FORMULÁRIO <ArrowRight size={16} />
                </motion.button>
              </Link>

              <Link href="/form-preview">
                <button className="text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-2">
                  <Play size={14} />
                  Ver demo
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ChevronDown size={20} className="text-white/20" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <FadeInSection>
            <p className="text-xs font-semibold tracking-widest text-amber-400 uppercase mb-4">
              Por que FormFlow
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight mb-6 max-w-lg">
              Projetado para quem se importa com experiência.
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {features.map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.15}>
                <div className="group p-8 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-amber-400/10 transition-colors">
                    <feature.icon size={22} className="text-white/60 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h3 className="text-lg font-display font-semibold mb-3">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed font-body">{feature.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Benefits Section ─── */}
      <section className="py-24 sm:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeInSection>
              <p className="text-xs font-semibold tracking-widest text-amber-400 uppercase mb-4">
                Benefícios
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
                Tudo que você precisa para coletar dados com elegância.
              </h2>
              <p className="text-base text-white/40 leading-relaxed mb-8 font-body">
                O FormFlow combina design premium com funcionalidade robusta para
                criar experiências de formulário memoráveis.
              </p>

              <Link href="/editor">
                <motion.button
                  className="px-7 py-3.5 bg-amber-400 text-[#0a0a12] text-sm font-bold tracking-wider rounded-lg hover:bg-amber-300 transition-colors inline-flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  CRIAR MEU FORMULÁRIO <ArrowRight size={16} />
                </motion.button>
              </Link>
            </FadeInSection>

            <FadeInSection delay={0.2}>
              <div className="grid grid-cols-2 gap-3">
                {benefits.map((benefit, i) => (
                  <motion.div
                    key={benefit.label}
                    className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-amber-400/20 transition-all"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <benefit.icon size={18} className="text-amber-400/60 shrink-0" />
                    <span className="text-sm text-white/70 font-body">{benefit.label}</span>
                  </motion.div>
                ))}
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 sm:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <FadeInSection>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6">
              Pronto para experimentar?
            </h2>
            <p className="text-base text-white/40 mb-10 font-body max-w-lg mx-auto">
              Veja o formulário conversacional em ação. Uma demonstração completa com todos os tipos de campo disponíveis.
            </p>

            <Link href="/editor">
              <motion.button
                className="px-8 py-4 bg-amber-400 text-[#0a0a12] text-sm font-bold tracking-wider rounded-lg hover:bg-amber-300 transition-colors inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                CRIAR FORMULÁRIO AGORA <ArrowRight size={16} />
              </motion.button>
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Zap size={12} className="text-[#0a0a12]" />
            </div>
            <span className="text-sm text-white/40">FormFlow</span>
          </div>
          <p className="text-xs text-white/20 font-body">
            Formulários conversacionais com design premium
          </p>
        </div>
      </footer>
    </div>
  );
}
