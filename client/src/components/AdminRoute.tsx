/**
 * AdminRoute — Route guard that blocks corretores from admin-only pages.
 * If the user is a corretor, they get redirected to /corretor/respostas.
 * If not authenticated, they get redirected to /login.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Loader2 } from "lucide-react";

const ADMIN_ROLES = ["master", "diretor", "gerente"];

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const [, navigate] = useLocation();
  const { user, loading, isStaff, isAuthenticated } = useCustomAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }

    if (!isStaff) {
      // Client users go to portal
      navigate("/portal", { replace: true });
      return;
    }

    const staffUser = user as { type: "staff"; role: string };
    if (!ADMIN_ROLES.includes(staffUser.role)) {
      // Corretores go to their responses page
      navigate("/corretor/respostas", { replace: true });
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
  if (!ADMIN_ROLES.includes(staffUser.role)) return null;

  return <>{children}</>;
}
