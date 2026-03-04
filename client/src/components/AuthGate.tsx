/**
 * AuthGate — Smart home page router.
 * If the user is logged in, redirects to the appropriate dashboard.
 * If not logged in, shows the landing page.
 * This ensures that after login, users go directly to their workspace.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import Landing from "@/pages/Landing";

export default function AuthGate() {
  const [, navigate] = useLocation();

  // Check auth silently — don't show loading, just show landing by default
  const { data: me, isLoading } = trpc.customAuth.me.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    staleTime: 60000, // Cache for 1 minute
  });

  useEffect(() => {
    if (isLoading) return;
    if (!me) return; // Not logged in → stay on landing

    // Logged in → redirect based on role
    if (me.type === "staff") {
      if (me.role === "corretor") {
        navigate("/corretor/respostas", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else if (me.type === "client") {
      navigate("/portal", { replace: true });
    }
  }, [me, isLoading, navigate]);

  // Always render Landing while checking auth (no flash of loading screen)
  return <Landing />;
}
