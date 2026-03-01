/**
 * Cadastro Digital — Landing Page
 * Halo-inspired dark premium design with blue glow effects.
 * Adapted for One Innovation real estate digital registration platform.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
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

/* ─── Counter Animation Hook ─── */
function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startOnView || !isInView || hasStarted.current) return;
    hasStarted.current = true;
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (progress >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, end, duration, startOnView]);

  return { count, ref };
}

/* ─── Fade In Section ─── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Glow Blob ─── */
function GlowBlob({ className }: { className?: string }) {
  return (
    <div className={`absolute rounded-full blur-[120px] pointer-events-none ${className}`} />
  );
}

/* ─── Stat Card ─── */
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

/* ─── Service Card ─── */
function ServiceCard({ icon: Icon, title, description, delay = 0 }: { icon: any; title: string; description: string; delay?: number }) {
  return (
    <FadeIn delay={delay}>
      <div className="group relative p-6 sm:p-8 rounded-2xl border border-[#222] bg-[#161616] hover:border-[#333] transition-all duration-500 h-full">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-blue-500/10 transition-colors duration-300">
            <Icon size={22} className="text-[#9c9c9c] group-hover:text-blue-400 transition-colors duration-300" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-white mb-3">{title}</h3>
          <p className="text-sm text-[#9c9c9c] leading-relaxed font-body">{description}</p>
        </div>
      </div>
    </FadeIn>
  );
}

/* ─── FAQ Item ─── */
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#222] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base font-medium text-white group-hover:text-blue-400 transition-colors pr-4">{question}</span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#9c9c9c] shrink-0"
        >
          <Plus size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-[#9c9c9c] leading-relaxed pb-5 font-body">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Plus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

/* ─── Preencher Dialog ─── */
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
    // Navigate to the form with corretor info as query params
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-md bg-[#161616] border border-[#222] rounded-2xl p-8 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#9c9c9c] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 mb-4">
                <FileText className="w-7 h-7 text-blue-400" />
              </div>
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
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Iniciar Cadastro <ArrowRight size={16} className="ml-2" />
              </Button>
            </form>

            <p className="text-center text-[#555] text-xs mt-4 flex items-center justify-center gap-1.5">
              <Lock size={12} /> Dados protegidos pela LGPD
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Marquee / Ticker ─── */
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

/* ─── MAIN LANDING PAGE ─── */
export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [preencherOpen, setPreencherOpen] = useState(false);
  const [, navigate] = useLocation();

  // Scroll handler for sticky nav
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      // Scroll spy
      const sections = ["hero", "servicos", "processo", "estatisticas", "faq", "contato"];
      for (const id of sections.reverse()) {
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
    {
      icon: Shield,
      title: "100% LGPD",
      description: "Todos os dados coletados são protegidos pela Lei Geral de Proteção de Dados. Nenhum corretor ou terceiro tem acesso direto às informações.",
    },
    {
      icon: FileCheck,
      title: "Validação Digital",
      description: "Documentos e dados são validados digitalmente pelo responsável, sem exposição de informações sensíveis para terceiros.",
    },
    {
      icon: Users,
      title: "Gestão de Equipe",
      description: "Hierarquia completa com Master, Diretor, Gerente e Corretor. Cada nível com permissões configuráveis.",
    },
    {
      icon: Clock,
      title: "Processo Ágil",
      description: "O cliente preenche o formulário uma única vez. Sem reenvio de documentos, sem burocracia repetitiva.",
    },
    {
      icon: Eye,
      title: "Acompanhamento em Tempo Real",
      description: "O cliente acompanha o status do cadastro pelo portal. Aprovado, pendente ou necessita revisão — tudo transparente.",
    },
    {
      icon: Send,
      title: "Notificações Automáticas",
      description: "Emails automáticos em cada etapa: confirmação, aprovação, solicitação de correção. Ninguém fica sem informação.",
    },
  ];

  const processSteps = [
    {
      step: "01",
      title: "Preencher",
      description: "O cliente acessa o formulário conversacional e preenche seus dados e documentos de forma segura e intuitiva.",
      icon: FileText,
    },
    {
      step: "02",
      title: "Validar",
      description: "O corretor responsável revisa cada resposta e documento, aprovando ou solicitando correções com justificativa.",
      icon: UserCheck,
    },
    {
      step: "03",
      title: "Aprovar",
      description: "Com tudo validado, o cliente recebe a aprovação e está apto para prosseguir com a compra do imóvel.",
      icon: CheckCircle2,
    },
  ];

  const faqs = [
    {
      question: "Meus dados estão seguros?",
      answer: "Sim. Todos os dados são protegidos pela LGPD (Lei Geral de Proteção de Dados). Nenhum corretor ou terceiro tem acesso direto às suas informações pessoais. Apenas o responsável designado pode visualizar os dados para fins de validação.",
    },
    {
      question: "Preciso enviar documentos pelo WhatsApp?",
      answer: "Não! Esse é justamente o diferencial da plataforma. Você preenche tudo de forma digital, segura e organizada. Sem precisar enviar fotos de documentos por mensagem.",
    },
    {
      question: "Como acompanho o status do meu cadastro?",
      answer: "Após o preenchimento, você recebe um código de protocolo por email. Com seu CPF/CNPJ, pode acessar o portal do cliente a qualquer momento para verificar se foi aprovado ou se precisa corrigir algo.",
    },
    {
      question: "O que acontece se meu documento for reprovado?",
      answer: "Você receberá um email explicando o motivo e poderá reenviar o documento correto pelo portal. É um processo simples e rápido.",
    },
    {
      question: "Quem pode ver minhas informações?",
      answer: "Para o cliente, a informação é clara: ninguém além do sistema tem acesso. Na prática, apenas o responsável pelo formulário (corretor designado) pode validar os dados, mas o cliente não sabe quem é.",
    },
    {
      question: "Quanto tempo leva o processo?",
      answer: "O preenchimento leva em média 10 minutos. A validação depende do corretor responsável, mas geralmente é concluída em até 24 horas úteis.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* ─── Sticky Nav ─── */}
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-[#0f0f0f]/95 backdrop-blur-xl border-b border-[#222]"
            : "bg-transparent"
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-heading text-base font-semibold tracking-tight">Cadastro Digital</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-sm transition-colors duration-200 ${
                  activeSection === item.id
                    ? "text-white font-medium"
                    : "text-[#9c9c9c] hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="hidden sm:inline-flex text-sm text-[#9c9c9c] hover:text-white transition-colors"
            >
              Entrar
            </button>
            <motion.button
              onClick={() => setPreencherOpen(true)}
              className="px-4 sm:px-5 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="hidden sm:inline">Preencher para Lançamento</span>
              <span className="sm:hidden">Preencher</span>
              <ArrowRight size={14} />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero Section ─── */}
      <section id="hero" className="relative min-h-screen flex items-center pt-16">
        {/* Glow effects */}
        <GlowBlob className="w-[600px] h-[600px] bg-blue-500/8 top-1/4 -left-40" />
        <GlowBlob className="w-[500px] h-[500px] bg-cyan-500/5 bottom-1/4 right-0" />
        <GlowBlob className="w-[300px] h-[300px] bg-blue-600/6 top-20 right-1/4" />

        {/* Faded watermark text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span className="font-heading text-[20vw] font-bold text-white/[0.02] tracking-tighter select-none whitespace-nowrap">
            CADASTRO
          </span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-blue-400 uppercase">
                One Innovation
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[100px] font-medium leading-[0.95] tracking-[-2px] mb-8">
              Lançamentos{" "}
              <span className="italic text-blue-400">exclusivos</span>{" "}
              para clientes cadastrados.
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[#9c9c9c] max-w-xl mb-10 leading-relaxed font-body">
              Plataforma digital de cadastro 100% protegida pela LGPD.
              Seus dados seguros, seu imóvel mais perto.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-4 flex-wrap">
              <motion.button
                onClick={() => setPreencherOpen(true)}
                className="px-7 py-3.5 bg-blue-500 text-white text-sm font-bold tracking-wider rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                PREENCHER PARA LANÇAMENTO <ArrowRight size={16} />
              </motion.button>

              <button
                onClick={() => navigate("/login")}
                className="text-sm text-[#9c9c9c] hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <Users size={14} />
                Área do Corretor
              </button>
            </div>

            {/* LGPD badge */}
            <div className="mt-12 inline-flex items-center gap-2 text-[#555]">
              <Lock size={14} />
              <span className="text-xs font-medium tracking-wide">Dados confidenciais • LGPD</span>
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

      {/* ─── Services Section ─── */}
      <section id="servicos" className="py-24 sm:py-32 relative">
        <GlowBlob className="w-[400px] h-[400px] bg-blue-500/5 top-0 right-0" />

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
              <ServiceCard key={service.title} {...service} delay={i * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process Section ─── */}
      <section id="processo" className="py-24 sm:py-32 relative">
        <GlowBlob className="w-[500px] h-[500px] bg-cyan-500/5 -left-40 top-1/3" />

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
              <FadeIn key={step.step} delay={i * 0.15}>
                <div className="relative p-6 sm:p-8 rounded-2xl border border-[#222] bg-[#161616] h-full">
                  {/* Step number */}
                  <div className="font-heading text-6xl sm:text-7xl font-bold text-white/[0.04] absolute top-4 right-6">
                    {step.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                      <step.icon size={22} className="text-blue-400" />
                    </div>
                    <h3 className="font-heading text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-sm text-[#9c9c9c] leading-relaxed font-body">{step.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Statistics Section ─── */}
      <section id="estatisticas" className="py-24 sm:py-32 relative">
        <GlowBlob className="w-[400px] h-[400px] bg-blue-600/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

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
            <FadeIn delay={0}>
              <div className="rounded-2xl border border-[#222] bg-[#161616] overflow-hidden">
                <StatCard value={100} suffix="%" label="Conformidade LGPD" />
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-[#222] bg-[#161616] overflow-hidden">
                <StatCard value={10} suffix="min" label="Tempo médio de cadastro" />
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-[#222] bg-[#161616] overflow-hidden">
                <StatCard value={0} suffix="" label="Documentos por WhatsApp" />
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="rounded-2xl border border-[#222] bg-[#161616] overflow-hidden">
                <StatCard value={24} suffix="h" label="Validação em até" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Marquee / Trust Band ─── */}
      <section className="py-12 border-y border-[#222] overflow-hidden">
        <Marquee speed={25}>
          {["ONE INNOVATION", "CADASTRO DIGITAL", "LGPD", "SEGURANÇA", "LANÇAMENTOS EXCLUSIVOS", "ONE INNOVATION", "CADASTRO DIGITAL", "LGPD", "SEGURANÇA", "LANÇAMENTOS EXCLUSIVOS"].map((text, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-6">
              <span className="font-heading text-sm font-medium tracking-[0.3em] text-[#333] uppercase">{text}</span>
              <span className="text-[#333]">◆</span>
            </span>
          ))}
        </Marquee>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="py-24 sm:py-32 relative">
        <GlowBlob className="w-[400px] h-[400px] bg-blue-500/5 bottom-0 right-0" />

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
              {faqs.slice(0, 3).map((faq) => (
                <FadeIn key={faq.question}>
                  <FAQItem {...faq} />
                </FadeIn>
              ))}
            </div>
            <div>
              {faqs.slice(3).map((faq) => (
                <FadeIn key={faq.question}>
                  <FAQItem {...faq} />
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 sm:py-32 relative">
        <GlowBlob className="w-[600px] h-[600px] bg-blue-500/8 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

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
              <motion.button
                onClick={() => setPreencherOpen(true)}
                className="px-8 py-4 bg-blue-500 text-white text-sm font-bold tracking-wider rounded-lg hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                PREENCHER AGORA <ArrowRight size={16} />
              </motion.button>
              <button
                onClick={() => navigate("/portal")}
                className="px-6 py-4 border border-[#333] text-white text-sm font-medium rounded-lg hover:border-[#555] transition-colors"
              >
                Acompanhar meu cadastro
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Contact Section ─── */}
      <section id="contato" className="py-24 sm:py-32 border-t border-[#222] relative">
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
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center">
                    <Mail size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9c9c9c] mb-0.5">Email</p>
                    <a href="mailto:contato@denisbugatti.com.br" className="text-white hover:text-blue-400 transition-colors text-sm">
                      contato@denisbugatti.com.br
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center">
                    <Phone size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9c9c9c] mb-0.5">Telefone</p>
                    <span className="text-white text-sm">Fale com um dos nossos corretores</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#161616] border border-[#222] flex items-center justify-center">
                    <Building2 size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-[#9c9c9c] mb-0.5">Empresa</p>
                    <span className="text-white text-sm">One Innovation</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#222] bg-[#161616] inline-flex items-center gap-3">
                <Shield size={16} className="text-blue-400" />
                <span className="text-xs text-[#9c9c9c]">Dados protegidos pela Lei Geral de Proteção de Dados (LGPD)</span>
              </div>
            </FadeIn>

            {/* Right: Quick actions */}
            <FadeIn delay={0.2}>
              <div className="space-y-4">
                <motion.button
                  onClick={() => setPreencherOpen(true)}
                  className="w-full p-6 rounded-2xl border border-[#222] bg-[#161616] hover:border-blue-500/30 transition-all duration-300 text-left group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <FileText size={20} className="text-blue-400" />
                    </div>
                    <ArrowRight size={18} className="text-[#555] group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-1">Preencher para Lançamento</h3>
                  <p className="text-sm text-[#9c9c9c]">Inicie seu cadastro digital agora</p>
                </motion.button>

                <motion.button
                  onClick={() => navigate("/login")}
                  className="w-full p-6 rounded-2xl border border-[#222] bg-[#161616] hover:border-blue-500/30 transition-all duration-300 text-left group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Users size={20} className="text-blue-400" />
                    </div>
                    <ArrowRight size={18} className="text-[#555] group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-1">Área do Corretor</h3>
                  <p className="text-sm text-[#9c9c9c]">Acesse o painel de gestão</p>
                </motion.button>

                <motion.button
                  onClick={() => navigate("/portal")}
                  className="w-full p-6 rounded-2xl border border-[#222] bg-[#161616] hover:border-blue-500/30 transition-all duration-300 text-left group"
                  whileHover={{ y: -2 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Eye size={20} className="text-blue-400" />
                    </div>
                    <ArrowRight size={18} className="text-[#555] group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-white mb-1">Portal do Cliente</h3>
                  <p className="text-sm text-[#9c9c9c]">Acompanhe o status do seu cadastro</p>
                </motion.button>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[#222] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
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
