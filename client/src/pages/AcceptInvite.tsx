/**
 * Accept Invite Page — Staff user sets their password after receiving an invite.
 */

import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

export default function AcceptInvite() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const token = params.get("token") || "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const inviteQuery = trpc.customAuth.getInvite.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const acceptMutation = trpc.customAuth.acceptInvite.useMutation({
    onSuccess: (data) => {
      toast.success("Conta criada com sucesso! Bem-vindo(a)!");
      // Redirect corretores to their dedicated responses page
      if (data.user.role === "corretor") {
        navigate("/corretor/respostas");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    acceptMutation.mutate({ token, password, name: name || undefined });
  };

  const invite = inviteQuery.data;
  const roleLabels: Record<string, string> = {
    diretor: "Diretor",
    gerente: "Gerente",
    corretor: "Corretor",
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Link inválido</h2>
          <p className="text-slate-400">Este link de convite é inválido.</p>
          <Button onClick={() => navigate("/login")} className="mt-6" variant="outline">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  if (inviteQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!invite || invite.expired || invite.used) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {invite?.used ? "Convite já utilizado" : invite?.expired ? "Convite expirado" : "Convite não encontrado"}
          </h2>
          <p className="text-slate-400">
            {invite?.used
              ? "Este convite já foi aceito."
              : invite?.expired
              ? "Este convite expirou. Solicite um novo convite."
              : "O convite não foi encontrado."}
          </p>
          <Button onClick={() => navigate("/login")} className="mt-6" variant="outline">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Bem-vindo(a)!</h1>
            <p className="text-slate-400 text-sm mt-1">
              Você foi convidado(a) como <span className="text-blue-400 font-semibold">{roleLabels[invite.role] || invite.role}</span>
            </p>
          </div>

          {/* Invite info */}
          <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>Convite para: <strong>{invite.email}</strong></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-slate-300 text-sm">Seu nome</Label>
              <Input
                type="text"
                placeholder={invite.name || "Seu nome completo"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                disabled={acceptMutation.isPending}
              />
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Escolha uma senha</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 pr-10"
                  disabled={acceptMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-slate-300 text-sm">Confirme a senha</Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                disabled={acceptMutation.isPending}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-400 text-xs mt-1">As senhas não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5"
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Criando conta...</>
              ) : (
                "Criar minha conta"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
