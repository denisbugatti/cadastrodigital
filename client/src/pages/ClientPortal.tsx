/**
 * Client Portal — Clients view their submissions and track status.
 * Login by CPF/CNPJ, see if approved/rejected/pending.
 * Uses semantic theme colors for dark/light mode compatibility.
 */

import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Button } from "@/components/ui/button";
import {
  Shield, Loader2, LogOut, CheckCircle2, XCircle, Clock, AlertTriangle,
  FileText, ChevronRight
} from "lucide-react";

export default function ClientPortal() {
  const [, navigate] = useLocation();
  const { user, loading, isClient, logout } = useCustomAuth();

  // Get responses for this client
  const responsesQuery = trpc.responses.myResponses.useQuery(undefined, {
    enabled: isClient,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!user || !isClient) {
    navigate("/login");
    return null;
  }

  const clientUser = user as { type: "client"; id: number; cpfCnpj: string; name: string; email?: string | null };

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
    pending: {
      icon: <Clock className="w-5 h-5" />,
      label: "Aguardando análise",
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    in_review: {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Em análise",
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    approved: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Aprovado",
      color: "text-green-500 dark:text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    rejected: {
      icon: <XCircle className="w-5 h-5" />,
      label: "Revisão necessária",
      color: "text-red-500 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-foreground font-semibold text-sm">Cadastro Digital</h1>
              <p className="text-muted-foreground text-xs">{clientUser.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground">Meus Cadastros</h2>
          <p className="text-muted-foreground mt-1">Acompanhe o status dos seus formulários</p>
        </div>

        {responsesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand animate-spin" />
          </div>
        ) : !responsesQuery.data || responsesQuery.data.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum cadastro encontrado</h3>
            <p className="text-muted-foreground text-sm">
              Quando você preencher um formulário, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {responsesQuery.data.map((response: any) => {
              const status = statusConfig[response.validationStatus || "pending"];
              return (
                <div
                  key={response.id}
                  className={`bg-card border rounded-xl p-5 transition-all hover:bg-accent/50 cursor-pointer ${status.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${status.color}`}>{status.icon}</div>
                      <div>
                        <h3 className="text-foreground font-medium">{response.formTitle || "Formulário"}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                          {response.protocolCode && (
                            <span className="text-xs text-muted-foreground">
                              Protocolo: <span className="text-foreground/70 font-mono">{response.protocolCode}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs mt-1">
                          Enviado em {new Date(response.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
