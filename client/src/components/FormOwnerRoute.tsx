/**
 * FormOwnerRoute — Route guard that only allows master/diretor to access form editing pages.
 * Gerentes can view forms but cannot edit them.
 * If the user is a gerente, they get redirected to /dashboard.
 * If the user is a corretor, they get redirected to /corretor/respostas.
 * If not authenticated, they get redirected to /login.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Loader2 } from "lucide-react";

const FORM_OWNER_ROLES = ["master", "diretor"];

interface FormOwnerRouteProps {
  children: React.ReactNode;
}

export default function FormOwnerRoute({ children }: FormOwnerRouteProps) {
  const [, navigate] = useLocation();
  const { user, loading, isStaff, isAuthenticated } = useCustomAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isStaff) {
      navigate("/portal", { replace: true });
      return;
    }

    const staffUser = user as { type: "staff"; role: string };
    if (!FORM_OWNER_ROLES.includes(staffUser.role)) {
      // Gerentes and corretores cannot edit forms — redirect to dashboard
      if (staffUser.role === "corretor") {
        navigate("/corretor/respostas", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [loading, isAuthenticated, isStaff, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-brand animate-spin" />
          <p className="text-sm text-muted-foreground font-body">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isStaff) return null;

  const staffUser = user as { type: "staff"; role: string };
  if (!FORM_OWNER_ROLES.includes(staffUser.role)) return null;

  return <>{children}</>;
}
