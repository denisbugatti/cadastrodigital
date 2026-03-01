/**
 * Client Portal — Clients view their submissions and track status.
 * Login by CPF/CNPJ, see if approved/rejected/pending.
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
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
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    in_review: {
      icon: <AlertTriangle className="w-5 h-5" />,
      label: "Em análise",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    approved: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Aprovado",
      color: "text-green-400",
      bg: "bg-green-500/10 border-green-500/20",
    },
    rejected: {
      icon: <XCircle className="w-5 h-5" />,
      label: "Revisão necessária",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm">Cadastro Digital</h1>
              <p className="text-slate-400 text-xs">{clientUser.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-white hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white">Meus Cadastros</h2>
          <p className="text-slate-400 mt-1">Acompanhe o status dos seus formulários</p>
        </div>

        {responsesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : !responsesQuery.data || responsesQuery.data.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum cadastro encontrado</h3>
            <p className="text-slate-400 text-sm">
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
                  className={`bg-white/5 border rounded-xl p-5 transition-all hover:bg-white/[0.07] cursor-pointer ${status.bg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${status.color}`}>{status.icon}</div>
                      <div>
                        <h3 className="text-white font-medium">{response.formTitle || "Formulário"}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                          {response.protocolCode && (
                            <span className="text-xs text-slate-500">
                              Protocolo: <span className="text-slate-300 font-mono">{response.protocolCode}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-xs mt-1">
                          Enviado em {new Date(response.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500" />
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
