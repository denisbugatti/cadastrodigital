/**
 * Client Portal — Clients view their submissions, track status,
 * and continue incomplete forms.
 * Login by CPF/CNPJ, see if approved/rejected/pending.
 */

import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Button } from "@/components/ui/button";
import {
  Loader2, LogOut, CheckCircle2, XCircle, Clock, AlertTriangle,
  FileText, PlayCircle, Eye, RefreshCw
} from "lucide-react";

type StatusKey = "pending" | "in_review" | "approved" | "rejected";

const statusConfig: Record<StatusKey, { icon: React.ReactNode; label: string; color: string; bg: string; border: string }> = {
  pending: {
    icon: <Clock className="w-5 h-5" />,
    label: "Aguardando análise",
    color: "text-amber-500 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  in_review: {
    icon: <AlertTriangle className="w-5 h-5" />,
    label: "Em análise",
    color: "text-blue-500 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  approved: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    label: "Aprovado",
    color: "text-green-500 dark:text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  rejected: {
    icon: <XCircle className="w-5 h-5" />,
    label: "Revisão necessária",
    color: "text-red-500 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

export default function ClientPortal() {
  const [, navigate] = useLocation();
  const { user, loading, isClient, logout } = useCustomAuth();
  const [filter, setFilter] = useState<"all" | "incomplete" | "complete">("all");

  // Get responses for this client
  const responsesQuery = trpc.responses.myResponses.useQuery(undefined, {
    enabled: isClient,
  });

  // Redirect to login if not authenticated — must be in useEffect to avoid setState during render
  useEffect(() => {
    if (!loading && (!user || !isClient)) {
      navigate("/login");
    }
  }, [loading, user, isClient, navigate]);

  if (loading || !user || !isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-muted-foreground text-sm">{loading ? "Carregando..." : "Redirecionando..."}</p>
        </div>
      </div>
    );
  }

  const clientUser = user as { type: "client"; id: number; cpfCnpj: string; name: string; email?: string | null };

  const responses = responsesQuery.data ?? [];
  const incompleteResponses = responses.filter((r: any) => !r.isComplete);
  const completeResponses = responses.filter((r: any) => r.isComplete);

  const filteredResponses = filter === "all"
    ? responses
    : filter === "incomplete"
      ? incompleteResponses
      : completeResponses;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleContinueForm = (response: any) => {
    if (response.formSlug) {
      // Navigate to form with response ID to continue
      navigate(`/${response.formSlug}?continue=${response.id}`);
    }
  };

  const handleViewResponse = (response: any) => {
    if (response.formSlug) {
      navigate(`/${response.formSlug}?view=${response.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/app-icon-3d-full-128_5d7552e4.png" alt="Cadastro Digital" className="w-9 h-9 sm:w-10 sm:h-10" />
            <div>
              <h1 className="text-foreground font-semibold text-sm">Cadastro Digital</h1>
              <p className="text-muted-foreground text-xs truncate max-w-[150px] sm:max-w-none">{clientUser.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Title + Stats */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Meus Cadastros</h2>
          <p className="text-muted-foreground text-sm mt-1">Acompanhe o status dos seus formulários</p>
        </div>

        {/* Quick Stats */}
        {responses.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl border p-3 sm:p-4 text-left transition-all ${
                filter === "all" ? "ring-2 ring-brand border-brand/30 bg-brand/5" : "border-border bg-card hover:bg-accent/50"
              }`}
            >
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg sm:text-2xl font-bold text-foreground">{responses.length}</p>
            </button>
            <button
              onClick={() => setFilter("incomplete")}
              className={`rounded-xl border p-3 sm:p-4 text-left transition-all ${
                filter === "incomplete" ? "ring-2 ring-amber-500 border-amber-500/30 bg-amber-500/5" : "border-border bg-card hover:bg-accent/50"
              }`}
            >
              <p className="text-xs text-muted-foreground">Incompletos</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-500">{incompleteResponses.length}</p>
            </button>
            <button
              onClick={() => setFilter("complete")}
              className={`rounded-xl border p-3 sm:p-4 text-left transition-all ${
                filter === "complete" ? "ring-2 ring-green-500 border-green-500/30 bg-green-500/5" : "border-border bg-card hover:bg-accent/50"
              }`}
            >
              <p className="text-xs text-muted-foreground">Completos</p>
              <p className="text-lg sm:text-2xl font-bold text-green-500">{completeResponses.length}</p>
            </button>
          </div>
        )}

        {/* Incomplete Forms Alert */}
        {incompleteResponses.length > 0 && filter !== "complete" && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <PlayCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-foreground font-medium text-sm">
                  Você tem {incompleteResponses.length} formulário{incompleteResponses.length > 1 ? "s" : ""} incompleto{incompleteResponses.length > 1 ? "s" : ""}
                </h3>
                <p className="text-muted-foreground text-xs mt-1">
                  Continue de onde parou clicando no botão "Continuar" abaixo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {responsesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : filteredResponses.length === 0 ? (
          /* Empty State */
          <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {filter === "all" ? "Nenhum cadastro encontrado" : filter === "incomplete" ? "Nenhum formulário incompleto" : "Nenhum formulário completo"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {filter === "all"
                ? "Quando você preencher um formulário, ele aparecerá aqui."
                : "Tente mudar o filtro para ver outros cadastros."}
            </p>
            {filter !== "all" && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setFilter("all")}>
                Ver todos
              </Button>
            )}
          </div>
        ) : (
          /* Response Cards */
          <div className="space-y-3">
            {filteredResponses.map((response: any) => {
              const statusKey = (response.validationStatus || "pending") as StatusKey;
              const status = statusConfig[statusKey];
              const isIncomplete = !response.isComplete;

              return (
                <div
                  key={response.id}
                  className={`bg-card border rounded-xl overflow-hidden transition-all hover:shadow-md ${
                    isIncomplete ? "border-amber-500/30" : status.border
                  }`}
                >
                  {/* Incomplete badge */}
                  {isIncomplete && (
                    <div className="bg-amber-500/10 px-4 py-1.5 flex items-center gap-2 border-b border-amber-500/20">
                      <RefreshCw className="w-3 h-3 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">Formulário incompleto — continue de onde parou</span>
                    </div>
                  )}

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className={`${isIncomplete ? "text-amber-500" : status.color} mt-0.5 shrink-0`}>
                          {isIncomplete ? <PlayCircle className="w-5 h-5" /> : status.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-foreground font-medium text-sm sm:text-base truncate">
                            {response.formTitle || "Formulário"}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                            <span className={`text-xs font-medium ${isIncomplete ? "text-amber-500" : status.color}`}>
                              {isIncomplete ? "Incompleto" : status.label}
                            </span>
                            {response.protocolCode && (
                              <span className="text-xs text-muted-foreground">
                                Protocolo: <span className="text-foreground/70 font-mono">{response.protocolCode}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs mt-1.5">
                            {isIncomplete ? "Iniciado" : "Enviado"} em {new Date(response.createdAt).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="shrink-0">
                        {isIncomplete ? (
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
                            onClick={() => handleContinueForm(response)}
                          >
                            <PlayCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">Continuar</span>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => handleViewResponse(response)}
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Refresh button */}
        {responses.length > 0 && (
          <div className="flex justify-center mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => responsesQuery.refetch()}
              disabled={responsesQuery.isFetching}
              className="text-muted-foreground"
            >
              {responsesQuery.isFetching ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Atualizar
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
