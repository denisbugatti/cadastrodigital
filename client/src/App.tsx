import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
import AuthGate from "./components/AuthGate";
import AdminRoute from "./components/AdminRoute";
import FormOwnerRoute from "./components/FormOwnerRoute";
import OwnerRoute from "./components/OwnerRoute";
import Landing from "./pages/Landing";
import Editor from "./pages/Editor";
import Dashboard from "./pages/Dashboard";
import Responses from "./pages/Responses";
import SlugResolver from "./pages/SlugResolver";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import StaffManagement from "./pages/StaffManagement";
import ResponseValidation from "./pages/ResponseValidation";
import Settings from "./pages/Settings";
import ClientPortal from "./pages/ClientPortal";
import ClientRegister from "./pages/ClientRegister";
import CadenceManagement from "./pages/CadenceManagement";
import CorretorResponses from "./pages/CorretorResponses";
import CorretorDashboard from "./pages/CorretorDashboard";
import CorretorSettings from "./pages/CorretorSettings";
import FormCopiesManagement from "./pages/FormCopiesManagement";
import AuditLog from "./pages/AuditLog";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path={"/login"} component={Login} />
      <Route path={"/aceitar-convite"} component={AcceptInvite} />
      <Route path={"/cadastro-cliente"} component={ClientRegister} />

      {/* Home: AuthGate checks if logged in → redirect to dashboard, else show landing */}
      <Route path={"/"} component={AuthGate} />

      {/* Explicit landing page route (for logout redirect) */}
      <Route path={"/inicio"} component={Landing} />

      {/* Client portal */}
      <Route path={"/portal"} component={ClientPortal} />

      {/* ─── Admin-only routes (master/diretor/gerente) ─── */}
      {/* Dashboard (forms list) - has its own sidebar with folders */}
      <Route path={"/dashboard"}>
        <AdminRoute><Dashboard /></AdminRoute>
      </Route>

      {/* Form editor - full screen (master/diretor/gerente) */}
      <Route path={"/editor"}>
        <AdminRoute><Editor /></AdminRoute>
      </Route>
      <Route path={"/editor/:id"}>
        <AdminRoute><Editor /></AdminRoute>
      </Route>

      {/* Responses/Analytics for a specific form */}
      <Route path={"/responses/:formId"}>
        {(params: any) => (
          <AdminRoute>
            <AppLayout><Responses /></AppLayout>
          </AdminRoute>
        )}
      </Route>

      {/* Staff management */}
      <Route path={"/equipe"}>
        <AdminRoute>
          <AppLayout><StaffManagement /></AppLayout>
        </AdminRoute>
      </Route>

      {/* Cadence management */}
      <Route path={"/cadencias"}>
        <AdminRoute>
          <AppLayout><CadenceManagement /></AppLayout>
        </AdminRoute>
      </Route>

      {/* Settings (master/diretor only) */}
      <Route path={"/configuracoes"}>
        <OwnerRoute>
          <AppLayout><Settings /></AppLayout>
        </OwnerRoute>
      </Route>

      {/* Galeria de Templates (master/diretor/gerente) */}
      <Route path={"/formularios-copias"}>
        <AdminRoute>
          <AppLayout><FormCopiesManagement /></AppLayout>
        </AdminRoute>
      </Route>

      {/* Audit log (master/diretor only) */}
      <Route path={"/auditoria"}>
        <OwnerRoute>
          <AppLayout><AuditLog /></AppLayout>
        </OwnerRoute>
      </Route>

      {/* ─── Corretor routes (accessible by all staff) ─── */}
      {/* Corretor-only responses page */}
      <Route path={"/corretor/respostas"} component={CorretorResponses} />

      {/* Corretor notification settings */}
      <Route path={"/corretor/configuracoes"} component={CorretorSettings} />

      {/* Performance dashboard (corretor + admin) */}
      <Route path={"/corretor/performance"} component={CorretorDashboard} />
      <Route path={"/performance"}>
        <AppLayout><CorretorDashboard /></AppLayout>
      </Route>

      {/* Response validation (accessible by all staff) */}
      <Route path={"/validar/:responseId"} component={ResponseValidation} />

      <Route path={"/404"} component={NotFound} />
      {/* Catch-all: try to resolve as a form slug (e.g., /vitoria) */}
      <Route path={"/:slug"} component={SlugResolver} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
