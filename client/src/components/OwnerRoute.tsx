/**
 * OwnerRoute — Route guard that only allows master/diretor access.
 * Blocks gerentes and corretores from restricted pages like Settings, Audit, Template Gallery.
 * Gerentes get redirected to /dashboard, corretores to /corretor/respostas.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Loader2 } from "lucide-react";

const OWNER_ROLES = ["master", "diretor"];

interface OwnerRouteProps {
  children: React.ReactNode;
}

export default function OwnerRoute({ children }: OwnerRouteProps) {
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
    if (!OWNER_ROLES.includes(staffUser.role)) {
      // Gerentes go to dashboard, corretores go to their responses page
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
  if (!OWNER_ROLES.includes(staffUser.role)) return null;

  return <>{children}</>;
}
