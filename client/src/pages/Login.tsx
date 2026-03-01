/**
 * Login Page — Dual login for staff (email+password) and clients (CPF/CNPJ+password).
 * Premium dark design with glassmorphism.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, User, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";

type LoginTab = "staff" | "client";

export default function Login() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<LoginTab>("staff");
  const [showPassword, setShowPassword] = useState(false);

  // Staff login
  const [email, setEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");

  // Client login
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [clientPassword, setClientPassword] = useState("");

  const staffLogin = trpc.customAuth.staffLogin.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const clientLogin = trpc.customAuth.clientLogin.useMutation({
    onSuccess: () => {
      toast.success("Login realizado com sucesso!");
      navigate("/portal");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !staffPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    staffLogin.mutate({ email, password: staffPassword });
  };

  const handleClientLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpfCnpj || !clientPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    clientLogin.mutate({ cpfCnpj, password: clientPassword });
  };

  // Format CPF/CNPJ as user types
  const formatCpfCnpj = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 11) {
      // CPF: 000.000.000-00
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    // CNPJ: 00.000.000/0000-00
    return clean
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const isLoading = staffLogin.isPending || clientLogin.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to landing */}
        <button
          onClick={() => navigate("/landing")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar</span>
        </button>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Cadastro Digital</h1>
            <p className="text-slate-400 text-sm mt-1">Plataforma segura protegida pela LGPD</p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              onClick={() => setTab("staff")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "staff"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Shield className="w-4 h-4" />
              Equipe
            </button>
            <button
              onClick={() => setTab("client")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === "client"
                  ? "bg-blue-500 text-white shadow-lg"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <User className="w-4 h-4" />
              Cliente
            </button>
          </div>

          {/* Staff Login Form */}
          {tab === "staff" && (
            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Senha</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                    disabled={isLoading}
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
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Entrando...</>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          )}

          {/* Client Login Form */}
          {tab === "client" && (
            <form onSubmit={handleClientLogin} className="space-y-4">
              <div>
                <Label className="text-slate-300 text-sm">CPF ou CNPJ</Label>
                <Input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                  maxLength={18}
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label className="text-slate-300 text-sm">Senha</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                    disabled={isLoading}
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
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2.5"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Entrando...</>
                ) : (
                  "Entrar"
                )}
              </Button>

              {/* Register link for clients */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/cadastro-cliente")}
                  className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Não tem conta? <span className="font-semibold">Cadastre-se</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* LGPD notice */}
        <p className="text-center text-slate-500 text-xs mt-6 px-4">
          Seus dados são protegidos pela Lei Geral de Proteção de Dados (LGPD).
          Nenhuma informação é compartilhada com terceiros.
        </p>
      </div>
    </div>
  );
}
