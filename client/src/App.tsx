import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
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

      {/* Staff dashboard */}
      <Route path={"/dashboard"} component={Dashboard} />

      {/* Editor (master only) */}
      <Route path={"/editor/:id"} component={Editor} />

      {/* Responses */}
      <Route path={"/responses/:formId"} component={Responses} />

      {/* Staff management */}
      <Route path={"/equipe"} component={StaffManagement} />

      {/* Cadence management */}
      <Route path={"/cadencias"} component={CadenceManagement} />

      {/* Settings (permissions, users, export) */}
      <Route path={"/configuracoes"} component={Settings} />

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
