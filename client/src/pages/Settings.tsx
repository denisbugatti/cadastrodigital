import { useAuth } from "@/_core/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Download, Upload, ArrowLeft, SlidersHorizontal, Moon, Sun, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-xl border bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all duration-200">
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
              <SlidersHorizontal className="h-5 w-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">Configurações</h1>
              <p className="text-xs text-muted-foreground font-body">Gerencie permissões, usuários e exportações</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="permissoes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary border border-border rounded-xl p-1 h-auto">
            <TabsTrigger
              value="permissoes"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
            <TabsTrigger
              value="usuarios"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger
              value="exportacao"
              className="flex items-center gap-2 py-2.5 rounded-lg text-sm font-body font-medium data-[state=active]:bg-background data-[state=active]:text-brand data-[state=active]:shadow-sm transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportação</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissoes" className="mt-6 space-y-4">
            <Card className="bg-background border border-border rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground font-display text-lg">Permissões de Acesso</CardTitle>
                <CardDescription className="font-body text-sm">Configure o que cada nível de acesso pode ver e editar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Gerente permissions */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-foreground text-sm">Gerente</h4>
                        <p className="text-xs text-muted-foreground font-body">Acesso intermediário</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Ver formulários da equipe", "Validar respostas", "Gerar relatórios", "Gerenciar corretores"].map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-sm font-body text-foreground cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border text-brand focus:ring-brand/20" />
                          {perm}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Corretor permissions */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-foreground text-sm">Corretor</h4>
                        <p className="text-xs text-muted-foreground font-body">Acesso básico</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {["Ver respostas atribuídas", "Validar respostas", "Gerar PDF aprovados", "Compartilhar formulários"].map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-sm font-body text-foreground cursor-pointer">
                          <input type="checkbox" defaultChecked className="rounded border-border text-brand focus:ring-brand/20" />
                          {perm}
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => toast.info("Funcionalidade em breve")}
                    className="w-full py-2.5 rounded-xl bg-brand text-white font-body text-sm font-semibold hover:bg-brand-dark active:scale-[0.98] transition-all duration-200"
                  >
                    Salvar Permissões
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="mt-6 space-y-4">
            <Card className="bg-background border border-border rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground font-display text-lg">Gerenciamento de Usuários</CardTitle>
                <CardDescription className="font-body text-sm">Convide novos usuários, desative ou reative contas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                        <span className="text-brand font-display font-bold text-sm">
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-body font-medium text-foreground text-sm">{user?.name || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground font-body">{user?.email || ""}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-brand/10 text-brand text-xs font-body font-semibold">Master</span>
                  </div>

                  <button
                    onClick={() => toast.info("Funcionalidade em breve")}
                    className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-muted-foreground font-body text-sm font-medium hover:border-brand/30 hover:text-brand transition-all duration-200"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <Users size={16} />
                      Convidar novo usuário
                    </span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exportacao" className="mt-6 space-y-4">
            <Card className="bg-background border border-border rounded-2xl shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground font-display text-lg">Exportação e Importação</CardTitle>
                <CardDescription className="font-body text-sm">Exporte respostas e importe leads com filtros avançados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Export */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                        <Download className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-foreground text-sm">Exportar Respostas</h4>
                        <p className="text-xs text-muted-foreground font-body">Baixe as respostas em formato CSV ou Excel</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.info("Funcionalidade em breve")}
                      className="w-full py-2 rounded-lg bg-green-600 text-white font-body text-sm font-medium hover:bg-green-700 active:scale-[0.98] transition-all duration-200"
                    >
                      Exportar CSV
                    </button>
                  </div>

                  {/* Import */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Upload className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-display font-semibold text-foreground text-sm">Importar Leads</h4>
                        <p className="text-xs text-muted-foreground font-body">Importe leads a partir de um arquivo CSV</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.info("Funcionalidade em breve")}
                      className="w-full py-2 rounded-lg border border-border bg-background text-foreground font-body text-sm font-medium hover:bg-secondary active:scale-[0.98] transition-all duration-200"
                    >
                      Importar CSV
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
