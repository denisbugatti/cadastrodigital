/**
 * FormFlow — Dark Futuristic Design
 * Dashboard page: search forms, browse templates, create new forms.
 * Layout: top nav with logo + search, hero section, user forms grid, template gallery.
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Plus,
  Search,
  FileText,
  Users,
  BarChart3,
  Clock,
  ArrowRight,
  Sparkles,
  Star,
  Mail,
  Brain,
  MessageSquare,
  Calendar,
  Award,
  Target,
  BookOpen,
  TrendingUp,
  Flame,
  Zap,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Copy,
} from "lucide-react";
import {
  userForms,
  formTemplates,
  templateCategories,
  type UserForm,
  type FormTemplate,
  type TemplateCategory,
} from "@/lib/dashboardData";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  star: Star,
  mail: Mail,
  brain: Brain,
  users: Users,
  "message-square": MessageSquare,
  "bar-chart": BarChart3,
  calendar: Calendar,
  award: Award,
  target: Target,
  "book-open": BookOpen,
};

function getStatusConfig(status: UserForm["status"]) {
  switch (status) {
    case "published":
      return { label: "Publicado", dotColor: "oklch(0.7 0.2 150)", textColor: "text-neon-teal" };
    case "draft":
      return { label: "Rascunho", dotColor: "oklch(0.65 0.18 80)", textColor: "text-yellow-400" };
    case "closed":
      return { label: "Encerrado", dotColor: "oklch(0.5 0.02 260)", textColor: "text-muted-foreground" };
  }
}

function getPopularityBadge(popularity: FormTemplate["popularity"]) {
  switch (popularity) {
    case "trending":
      return { label: "Em alta", icon: Flame, color: "oklch(0.7 0.2 30)" };
    case "popular":
      return { label: "Popular", icon: TrendingUp, color: "oklch(0.65 0.2 250)" };
    case "new":
      return { label: "Novo", icon: Zap, color: "oklch(0.75 0.15 195)" };
  }
}

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>("all");

  const filteredForms = useMemo(() => {
    if (!searchQuery.trim()) return userForms;
    const q = searchQuery.toLowerCase();
    return userForms.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredTemplates = useMemo(() => {
    let filtered = formTemplates;
    if (activeCategory !== "all") {
      filtered = filtered.filter((t) => t.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [searchQuery, activeCategory]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[700px] h-[700px] rounded-full animate-float"
          style={{
            top: "-15%",
            right: "-15%",
            background: "radial-gradient(circle, oklch(0.65 0.2 250 / 0.06), transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            bottom: "10%",
            left: "-10%",
            background: "radial-gradient(circle, oklch(0.55 0.2 290 / 0.05), transparent 70%)",
            filter: "blur(80px)",
            animation: "float 8s ease-in-out infinite reverse",
          }}
        />
      </div>

      {/* Grain overlay */}
      <div className="grain-overlay fixed inset-0 pointer-events-none" />

      {/* Header / Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-glass-border" style={{ background: "oklch(0.1 0.015 260 / 0.8)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl glass-card flex items-center justify-center glow-blue animate-border-glow">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 5C3 3.89543 3.89543 3 5 3H13C14.1046 3 15 3.89543 15 5V13C15 14.1046 14.1046 15 13 15H5C3.89543 15 3 14.1046 3 13V5Z"
                  stroke="oklch(0.65 0.2 250)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M6 7.5H12M6 10.5H9.5"
                  stroke="oklch(0.75 0.15 195)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-display text-lg font-semibold text-foreground/90 tracking-tight">
              FormFlow
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-xl relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar formulários e templates..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl font-body text-sm text-foreground placeholder:text-muted-foreground/40 glass-card border border-glass-border focus:outline-none focus:border-neon-blue/40 transition-colors duration-300"
              style={{ caretColor: "oklch(0.75 0.15 195)" }}
            />
          </div>

          {/* Create new button */}
          <Link href="/builder">
            <motion.button
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-blue text-white font-body text-sm font-semibold glow-blue hover:scale-105 active:scale-95 transition-all duration-300 shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              Criar formulário
            </motion.button>
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">

        {/* Section: My Forms */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                Meus formulários
              </h2>
              <p className="mt-1 text-sm text-muted-foreground font-body">
                {filteredForms.length} formulário{filteredForms.length !== 1 ? "s" : ""} encontrado{filteredForms.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Create new card */}
            <Link href="/builder">
              <motion.div
                className="group relative h-full min-h-[200px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300"
                style={{
                  borderColor: "oklch(0.35 0.05 250 / 0.4)",
                }}
                whileHover={{
                  borderColor: "oklch(0.65 0.2 250 / 0.6)",
                  scale: 1.01,
                }}
                whileTap={{ scale: 0.99 }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:glow-blue"
                  style={{
                    background: "oklch(0.65 0.2 250 / 0.1)",
                    border: "1px solid oklch(0.65 0.2 250 / 0.2)",
                  }}
                >
                  <Plus size={24} className="text-neon-blue" />
                </div>
                <div className="text-center">
                  <p className="font-body text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                    Criar novo formulário
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    Comece do zero
                  </p>
                </div>
              </motion.div>
            </Link>

            {/* User form cards */}
            <AnimatePresence mode="popLayout">
              {filteredForms.map((form, i) => (
                <FormCard key={form.id} form={form} index={i} />
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* Section: Template Gallery */}
        <section>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <Sparkles size={20} className="text-neon-cyan" />
              <h2 className="font-display text-2xl font-bold text-foreground tracking-tight">
                Galeria de Templates
              </h2>
            </div>
            <p className="text-sm text-muted-foreground font-body mt-1">
              Comece rapidamente com um template pronto e personalize como quiser
            </p>
          </div>

          {/* Category filter tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
            {templateCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`
                  px-4 py-2 rounded-full font-body text-sm font-medium whitespace-nowrap
                  transition-all duration-300
                  ${
                    activeCategory === cat.id
                      ? "text-white"
                      : "glass-card text-muted-foreground hover:text-foreground glass-card-hover"
                  }
                `}
                style={
                  activeCategory === cat.id
                    ? {
                        background: "oklch(0.65 0.2 250)",
                        boxShadow: "0 0 15px oklch(0.65 0.2 250 / 0.3)",
                      }
                    : {}
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Templates grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((template, i) => (
                <TemplateCard key={template.id} template={template} index={i} />
              ))}
            </AnimatePresence>
          </div>

          {filteredTemplates.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Search size={40} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-body">
                Nenhum template encontrado para essa busca
              </p>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ─── Form Card Component ─── */

function FormCard({ form, index }: { form: UserForm; index: number }) {
  const statusConfig = getStatusConfig(form.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 25 }}
      className="group relative glass-card rounded-2xl p-5 transition-all duration-300 hover:border-glass-hover glass-card-hover"
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${form.color}, transparent)`,
        }}
      />

      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: `${form.color.replace(")", " / 0.12)")}`,
            border: `1px solid ${form.color.replace(")", " / 0.2)")}`,
          }}
        >
          <FileText size={18} style={{ color: form.color }} />
        </div>

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card border-glass-border">
            <DropdownMenuItem onClick={() => toast("Funcionalidade em breve", { description: "Visualizar respostas" })}>
              <Eye size={14} className="mr-2" /> Ver respostas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Funcionalidade em breve", { description: "Editar formulário" })}>
              <Pencil size={14} className="mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast("Funcionalidade em breve", { description: "Duplicar formulário" })}>
              <Copy size={14} className="mr-2" /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => toast("Funcionalidade em breve", { description: "Excluir formulário" })}>
              <Trash2 size={14} className="mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Title & description */}
      <h3 className="font-display text-base font-semibold text-foreground mb-1 line-clamp-1">
        {form.title}
      </h3>
      <p className="text-xs text-muted-foreground font-body line-clamp-2 mb-4 leading-relaxed">
        {form.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
        <span className="flex items-center gap-1.5">
          <FileText size={12} />
          {form.questionsCount} perguntas
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {form.responsesCount} respostas
        </span>
      </div>

      {/* Footer: status + date */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-glass-border">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: statusConfig.dotColor }}
          />
          <span className={`text-xs font-body font-medium ${statusConfig.textColor}`}>
            {statusConfig.label}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground/50 font-body">
          {new Date(form.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Template Card Component ─── */

function TemplateCard({ template, index }: { template: FormTemplate; index: number }) {
  const Icon = iconMap[template.icon] || FileText;
  const popularityBadge = getPopularityBadge(template.popularity);
  const PopIcon = popularityBadge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 300, damping: 25 }}
      className="group relative glass-card rounded-2xl p-5 transition-all duration-300 glass-card-hover cursor-pointer"
      onClick={() => toast("Funcionalidade em breve", { description: `Usar template "${template.title}"` })}
    >
      {/* Popularity badge */}
      <div className="absolute top-4 right-4">
        <Badge
          variant="outline"
          className="text-[10px] font-body gap-1 border-glass-border"
          style={{ color: popularityBadge.color }}
        >
          <PopIcon size={10} />
          {popularityBadge.label}
        </Badge>
      </div>

      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
        style={{
          background: `${template.color.replace(")", " / 0.1)")}`,
          border: `1px solid ${template.color.replace(")", " / 0.2)")}`,
        }}
      >
        <Icon size={20} style={{ color: template.color }} />
      </div>

      {/* Title */}
      <h3 className="font-display text-sm font-semibold text-foreground mb-1.5 line-clamp-1">
        {template.title}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground font-body line-clamp-2 leading-relaxed mb-4">
        {template.description}
      </p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 font-body">
        <span className="flex items-center gap-1">
          <FileText size={11} />
          {template.questionsCount} perguntas
        </span>
        <span className="flex items-center gap-1">
          <Clock size={11} />
          {template.estimatedTime}
        </span>
      </div>

      {/* Hover CTA */}
      <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: template.color,
            boxShadow: `0 0 12px ${template.color.replace(")", " / 0.4)")}`,
          }}
        >
          <ArrowRight size={14} className="text-white" />
        </div>
      </div>
    </motion.div>
  );
}
