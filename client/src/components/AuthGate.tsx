/**
 * AuthGate — Smart home page router.
 * If the user is logged in, redirects to the appropriate dashboard.
 * If not logged in on a brand subdomain root, opens that brand's default form.
 * Otherwise shows the landing page.
 */

import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { brandFromHost } from "@shared/brands";
import Landing from "@/pages/Landing";

export default function AuthGate() {
  const [, navigate] = useLocation();
  const hostBrand =
    typeof window !== "undefined" ? brandFromHost(window.location.hostname) : null;

  // Check auth silently — don't show loading, just show landing by default
  const { data: me, isLoading } = trpc.customAuth.me.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: false,
    staleTime: 60000, // Cache for 1 minute
  });

  // On a brand subdomain (one./vitacon.), an anonymous visitor at the root
  // is sent to that brand's default form instead of the marketing landing.
  const { data: brandDefault } = trpc.forms.getBrandDefault.useQuery(
    { brand: (hostBrand ?? "one") as "one" | "vitacon" },
    { enabled: !!hostBrand && !isLoading && !me, retry: 1, staleTime: 60000 }
  );

  useEffect(() => {
    if (isLoading) return;

    if (me) {
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
      return;
    }

    // Not logged in, on a brand subdomain root → open the brand's default form
    if (hostBrand && brandDefault?.slug && window.location.pathname === "/") {
      navigate("/" + brandDefault.slug, { replace: true });
    }
  }, [me, isLoading, navigate, hostBrand, brandDefault]);

  // Default: render Landing (also the fallback when no brand default exists)
  return <Landing />;
}
