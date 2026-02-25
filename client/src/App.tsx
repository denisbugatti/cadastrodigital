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

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/form"} component={Dashboard} />
      <Route path={"/landing"} component={Landing} />
      <Route path={"/editor"} component={Editor} />
      <Route path={"/editor/:id"} component={Editor} />
      <Route path={"/form-preview"} component={FormPreviewPage} />
      <Route path={"/form/:id"} component={FormView} />
      <Route path={"/404"} component={NotFound} />
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
