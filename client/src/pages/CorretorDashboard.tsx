/**
 * CorretorDashboard — Performance metrics dashboard for corretores.
 * Accessible by corretores (their own metrics) and admin (all corretores).
 */

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo } from "react";
import {
  BarChart3, CheckCircle, XCircle, Clock, FileText,
  TrendingUp, Users, ArrowLeft, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Award, Target, Timer,
} from "lucide-react";
import { Link } from "wouter";

/* ─── Helper: format ms to human readable ─── */
function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

/* ─── Metric Card Component ─── */
function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  color = "blue",
}: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  color?: "blue" | "green" | "red" | "amber" | "purple" | "slate";
}) {
  const colorMap = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-400",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-400",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-400",
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400",
    slate: "from-slate-500/10 to-slate-600/5 border-slate-500/20 text-slate-400",
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 ${colorMap[color]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
        <div className={`rounded-xl p-2.5 bg-gradient-to-br ${colorMap[color].split(" ").slice(0, 2).join(" ")}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

/* ─── Progress Bar ─── */
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-muted/30 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ─── Corretor Row (for admin view) ─── */
function CorretorRow({ corretor, rank }: { corretor: any; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  const rankColors = ["text-amber-400", "text-slate-300", "text-amber-600"];
  const rankColor = rank <= 3 ? rankColors[rank - 1] || "text-muted-foreground" : "text-muted-foreground";

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50 backdrop-blur-sm transition-all hover:border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/20 transition-colors"
      >
        {/* Rank */}
        <span className={`text-lg font-bold w-8 text-center ${rankColor}`}>
          {rank <= 3 ? <Award size={20} className="mx-auto" /> : `#${rank}`}
        </span>

        {/* Avatar + Name */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{corretor.name}</p>
          <p className="text-xs text-muted-foreground truncate">{corretor.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="text-center">
            <p className="font-bold text-foreground">{corretor.totalResponses}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-emerald-400">{corretor.approvalRate}%</p>
            <p className="text-[10px] text-muted-foreground">Aprovação</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">{formatDuration(corretor.avgValidationTimeMs)}</p>
            <p className="text-[10px] text-muted-foreground">Tempo Médio</p>
          </div>
        </div>

        {/* Status */}
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
          corretor.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
        }`}>
          {corretor.active ? "Ativo" : "Inativo"}
        </span>

        {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-xl font-bold text-foreground">{corretor.approvedResponses}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Aprovadas</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-xl font-bold text-foreground">{corretor.rejectedResponses}</p>
              <p className="text-[10px] text-red-400 font-medium">Rejeitadas</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-xl font-bold text-foreground">{corretor.pendingResponses}</p>
              <p className="text-[10px] text-amber-400 font-medium">Pendentes</p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3 text-center">
              <p className="text-xl font-bold text-foreground">{corretor.formCount}</p>
              <p className="text-[10px] text-blue-400 font-medium">Formulários</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16">Aprovação</span>
              <ProgressBar value={corretor.approvedResponses} max={corretor.totalResponses} color="bg-emerald-500" />
              <span className="text-xs font-medium text-foreground w-10 text-right">{corretor.approvalRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16">Rejeição</span>
              <ProgressBar value={corretor.rejectedResponses} max={corretor.totalResponses} color="bg-red-500" />
              <span className="text-xs font-medium text-foreground w-10 text-right">{corretor.rejectionRate}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function CorretorDashboard() {
  const { user } = useAuth();

  // Try to get staff session for corretor's own metrics
  const { data: myMetrics, isLoading: loadingMy } = trpc.corretorPerformance.me.useQuery();

  // Admin: get all corretores metrics
  const { data: allMetrics, isLoading: loadingAll } = trpc.corretorPerformance.all.useQuery(
    undefined,
    { enabled: !!user } // Only for admin
  );

  const isAdmin = !!user;
  const isCorretor = !!myMetrics;

  // Sort corretores by total responses (descending) for ranking
  const rankedCorretores = useMemo(() => {
    if (!allMetrics) return [];
    return [...allMetrics].sort((a, b) => b.completedResponses - a.completedResponses);
  }, [allMetrics]);

  // Aggregate metrics for admin overview
  const aggregate = useMemo(() => {
    if (!allMetrics || allMetrics.length === 0) return null;
    const total = allMetrics.reduce((sum, c) => sum + c.totalResponses, 0);
    const approved = allMetrics.reduce((sum, c) => sum + c.approvedResponses, 0);
    const rejected = allMetrics.reduce((sum, c) => sum + c.rejectedResponses, 0);
    const pending = allMetrics.reduce((sum, c) => sum + c.pendingResponses, 0);
    const avgTimes = allMetrics.filter(c => c.avgValidationTimeMs > 0).map(c => c.avgValidationTimeMs);
    const avgTime = avgTimes.length > 0 ? Math.round(avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length) : 0;
    const activeCount = allMetrics.filter(c => c.active).length;

    return {
      totalResponses: total,
      approvedResponses: approved,
      rejectedResponses: rejected,
      pendingResponses: pending,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      avgValidationTimeMs: avgTime,
      activeCorretores: activeCount,
      totalCorretores: allMetrics.length,
    };
  }, [allMetrics]);

  const isLoading = loadingMy || (isAdmin && loadingAll);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={32} />
          <p className="text-sm text-muted-foreground">Carregando métricas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href={isCorretor && !isAdmin ? "/corretor/respostas" : "/dashboard"}>
            <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <BarChart3 size={20} className="text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Performance</h1>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Visão geral dos corretores" : "Suas métricas de validação"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* ─── Corretor's Own Metrics ─── */}
        {isCorretor && myMetrics && (
          <section>
            {isAdmin && (
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Suas Métricas (Corretor)
              </h2>
            )}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={FileText}
                label="Total Respostas"
                value={myMetrics.totalResponses}
                subValue={`${myMetrics.completedResponses} processadas`}
                color="blue"
              />
              <MetricCard
                icon={CheckCircle}
                label="Aprovadas"
                value={myMetrics.approvedResponses}
                subValue={`${myMetrics.approvalRate}% taxa de aprovação`}
                color="green"
              />
              <MetricCard
                icon={XCircle}
                label="Rejeitadas"
                value={myMetrics.rejectedResponses}
                subValue={`${myMetrics.rejectionRate}% taxa de rejeição`}
                color="red"
              />
              <MetricCard
                icon={Timer}
                label="Tempo Médio"
                value={formatDuration(myMetrics.avgValidationTimeMs)}
                subValue="da criação à validação"
                color="purple"
              />
            </div>

            {/* Status breakdown */}
            <div className="mt-4 rounded-2xl border border-border/50 bg-card/50 p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição por Status</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">Aprovadas</span>
                  <ProgressBar value={myMetrics.approvedResponses} max={myMetrics.totalResponses} color="bg-emerald-500" />
                  <span className="text-xs font-bold text-foreground w-12 text-right">{myMetrics.approvedResponses}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">Rejeitadas</span>
                  <ProgressBar value={myMetrics.rejectedResponses} max={myMetrics.totalResponses} color="bg-red-500" />
                  <span className="text-xs font-bold text-foreground w-12 text-right">{myMetrics.rejectedResponses}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">Pendentes</span>
                  <ProgressBar value={myMetrics.pendingResponses} max={myMetrics.totalResponses} color="bg-amber-500" />
                  <span className="text-xs font-bold text-foreground w-12 text-right">{myMetrics.pendingResponses}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20">Em revisão</span>
                  <ProgressBar value={myMetrics.inReviewResponses} max={myMetrics.totalResponses} color="bg-blue-500" />
                  <span className="text-xs font-bold text-foreground w-12 text-right">{myMetrics.inReviewResponses}</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── Admin Overview ─── */}
        {isAdmin && aggregate && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Visão Geral — Todos os Corretores
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Corretores Ativos"
                value={aggregate.activeCorretores}
                subValue={`de ${aggregate.totalCorretores} total`}
                color="blue"
              />
              <MetricCard
                icon={Target}
                label="Total Respostas"
                value={aggregate.totalResponses}
                subValue={`${aggregate.pendingResponses} pendentes`}
                color="slate"
              />
              <MetricCard
                icon={TrendingUp}
                label="Taxa de Aprovação"
                value={`${aggregate.approvalRate}%`}
                subValue={`${aggregate.approvedResponses} aprovadas`}
                color="green"
              />
              <MetricCard
                icon={Clock}
                label="Tempo Médio"
                value={formatDuration(aggregate.avgValidationTimeMs)}
                subValue="média entre corretores"
                color="amber"
              />
            </div>
          </section>
        )}

        {/* ─── Corretores Ranking (Admin) ─── */}
        {isAdmin && rankedCorretores.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Ranking de Corretores
            </h2>
            <div className="space-y-2">
              {rankedCorretores.map((corretor, idx) => (
                <CorretorRow key={corretor.id} corretor={corretor} rank={idx + 1} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!isCorretor && !isAdmin && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle size={48} className="text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Sem dados disponíveis</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Faça login como corretor ou administrador para ver as métricas.
            </p>
          </div>
        )}

        {isAdmin && rankedCorretores.length === 0 && !loadingAll && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users size={48} className="text-muted-foreground/30 mb-4" />
            <h2 className="text-lg font-semibold text-foreground">Nenhum corretor cadastrado</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Convide corretores na página de Equipe para começar a ver métricas.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
