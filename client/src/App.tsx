import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AppLayout from "./components/AppLayout";
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

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path={"/login"} component={Login} />
      <Route path={"/aceitar-convite"} component={AcceptInvite} />
      <Route path={"/cadastro-cliente"} component={ClientRegister} />

      {/* Landing page as home */}
      <Route path={"/"} component={Landing} />

      {/* Client portal */}
      <Route path={"/portal"} component={ClientPortal} />

      {/* Dashboard (forms list) - has its own sidebar with folders */}
      <Route path={"/dashboard"} component={Dashboard} />

      {/* Form editor - full screen */}
      <Route path={"/editor/:id"} component={Editor} />

      {/* Responses/Analytics for a specific form */}
      <Route path={"/responses/:formId"}>
        {(params: any) => (
          <AppLayout><Responses /></AppLayout>
        )}
      </Route>

      {/* Staff pages wrapped in AppLayout */}
      <Route path={"/equipe"}>
        <AppLayout><StaffManagement /></AppLayout>
      </Route>

      <Route path={"/cadencias"}>
        <AppLayout><CadenceManagement /></AppLayout>
      </Route>

      <Route path={"/configuracoes"}>
        <AppLayout><Settings /></AppLayout>
      </Route>

      {/* Response validation */}
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
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
