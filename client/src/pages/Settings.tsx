import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Download, Settings as SettingsIcon } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Settings() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SettingsIcon className="h-7 w-7 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações</h1>
            <p className="text-sm text-gray-400">Gerencie permissões, usuários e exportações</p>
          </div>
        </div>

        <Tabs defaultValue="permissoes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-gray-700/50">
            <TabsTrigger value="permissoes" className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <Shield className="h-4 w-4" />
              Permissões
            </TabsTrigger>
            <TabsTrigger value="usuarios" className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <Users className="h-4 w-4" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="exportacao" className="flex items-center gap-2 data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400">
              <Download className="h-4 w-4" />
              Exportação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permissoes" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Permissões de Acesso</CardTitle>
                <CardDescription>Configure o que cada nível de acesso pode ver e editar</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Em breve — configuração de permissões por papel (Gerente, Corretor)</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Gerenciamento de Usuários</CardTitle>
                <CardDescription>Convide novos usuários, desative ou reative contas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Em breve — convites, ativação/desativação de usuários</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exportacao" className="mt-6">
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-white">Exportação de Respostas</CardTitle>
                <CardDescription>Exporte respostas com filtros avançados</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">Em breve — exportação com filtros por status, formulário, gerente e corretor</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
