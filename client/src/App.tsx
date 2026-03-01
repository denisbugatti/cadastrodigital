import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Editor from "./pages/Editor";
import FormPreviewPage from "./pages/FormPreviewPage";
import Dashboard from "./pages/Dashboard";
import FormView from "./pages/FormView";
import Responses from "./pages/Responses";
import Corretores from "./pages/Corretores";
import SlugResolver from "./pages/SlugResolver";
import Login from "./pages/Login";
import AcceptInvite from "./pages/AcceptInvite";
import ClientRegister from "./pages/ClientRegister";
import ClientPortal from "./pages/ClientPortal";
import StaffManagement from "./pages/StaffManagement";
import PermissionsPage from "./pages/PermissionsPage";
import ResponseValidation from "./pages/ResponseValidation";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path={"/login"} component={Login} />
      <Route path={"/aceitar-convite"} component={AcceptInvite} />
      <Route path={"/cadastro-cliente"} component={ClientRegister} />
      <Route path={"/portal"} component={ClientPortal} />

      {/* Landing page as home */}
      <Route path={"/"} component={Landing} />

      {/* Staff dashboard routes */}
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/form"} component={Dashboard} />
      <Route path={"/landing"} component={Landing} />
      <Route path={"/editor"} component={Editor} />
      <Route path={"/editor/:id"} component={Editor} />
      <Route path={"/form-preview"} component={FormPreviewPage} />
      <Route path={"/form/:id"} component={FormView} />
      <Route path={"/f/:slug"} component={FormView} />
      <Route path={"/responses/:formId"} component={Responses} />
      <Route path={"/corretores"} component={Corretores} />

      {/* Staff management & permissions */}
      <Route path={"/equipe"} component={StaffManagement} />
      <Route path={"/permissoes"} component={PermissionsPage} />

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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
