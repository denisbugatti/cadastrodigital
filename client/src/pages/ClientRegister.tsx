/**
 * Client Registration Page — Clients register with CPF/CNPJ + password.
 * Uses semantic theme colors for dark/light mode compatibility.
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function ClientRegister() {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = trpc.customAuth.clientRegister.useMutation({
    onSuccess: async () => {
      toast.success("Cadastro realizado com sucesso!");
      // Invalidate the cached auth state so route guards see the new session
      await utils.customAuth.me.invalidate();
      navigate("/portal");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const formatCpfCnpj = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 11) {
      return clean
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return clean
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 10) {
      return clean.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return clean.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpfCnpj || !password) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    registerMutation.mutate({
      name,
      cpfCnpj,
      password,
      email: email || undefined,
      phone: phone ? phone.replace(/\D/g, "") : undefined,
    });
  };

  const isLoading = registerMutation.isPending;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Voltar para login</span>
        </button>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/10 mb-4">
              <User className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-muted-foreground text-sm mt-1">Cadastre-se para acompanhar seu processo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-foreground/80 text-sm">Nome completo *</Label>
              <Input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 bg-secondary border-border"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="text-foreground/80 text-sm">CPF ou CNPJ *</Label>
              <Input
                type="text"
                placeholder="000.000.000-00"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(formatCpfCnpj(e.target.value))}
                maxLength={18}
                className="mt-1.5 bg-secondary border-border"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="text-foreground/80 text-sm">Email</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-secondary border-border"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="text-foreground/80 text-sm">Telefone</Label>
              <Input
                type="text"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                maxLength={15}
                className="mt-1.5 bg-secondary border-border"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label className="text-foreground/80 text-sm">Senha *</Label>
              <div className="relative mt-1.5">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label className="text-foreground/80 text-sm">Confirme a senha *</Label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1.5 bg-secondary border-border"
                disabled={isLoading}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 dark:text-red-400 text-xs mt-1">As senhas não coincidem</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-brand hover:bg-brand/90 text-white font-semibold py-2.5"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Cadastrando...</>
              ) : (
                "Criar minha conta"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6 px-4">
          Seus dados são protegidos pela Lei Geral de Proteção de Dados (LGPD).
        </p>
      </div>
    </div>
  );
}
