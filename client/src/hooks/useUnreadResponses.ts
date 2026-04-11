import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "./useCustomAuth";

/**
 * Update the PWA app badge with the current unread count.
 * Uses navigator.setAppBadge() / clearAppBadge() (Badging API).
 * Silently fails on unsupported browsers.
 */
function updateAppBadge(count: number) {
  try {
    if ("setAppBadge" in navigator && "clearAppBadge" in navigator) {
      if (count > 0) {
        (navigator as any).setAppBadge(count);
      } else {
        (navigator as any).clearAppBadge();
      }
    }
  } catch {
    // Badging API not supported or failed — ignore
  }
}

/**
 * Hook for real-time unread response count polling.
 * Polls every 20 seconds for admin/gerente, or corretor-specific endpoint.
 * Returns totalUnread count and per-form breakdown.
 * Also syncs the PWA app badge with the unread count.
 */
export function useUnreadResponses() {
  const { user, isCorretor, isAuthenticated } = useCustomAuth();

  // Admin/gerente/diretor: poll all forms
  const adminQuery = trpc.notifications.unreadCount.useQuery(undefined, {
    enabled: isAuthenticated && !isCorretor && !!user,
    refetchInterval: 20_000, // 20 seconds
    refetchIntervalInBackground: true,
    staleTime: 10_000,
  });

  // Corretor: poll their assigned forms
  const corretorQuery = trpc.notifications.corretorUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated && isCorretor && !!user,
    refetchInterval: 20_000,
    refetchIntervalInBackground: true,
    staleTime: 10_000,
  });

  const data = isCorretor ? corretorQuery.data : adminQuery.data;
  const totalUnread = data?.totalUnread ?? 0;

  // Sync PWA badge whenever unread count changes
  useEffect(() => {
    if (isAuthenticated) {
      updateAppBadge(totalUnread);
    }
  }, [totalUnread, isAuthenticated]);

  // Clear badge when the app becomes visible (user opens the app from background or icon tap)
  useEffect(() => {
    const clearBadge = () => {
      updateAppBadge(0);
      // Also notify the service worker to clear the badge (needed for iOS PWA)
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "CLEAR_BADGE" });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        clearBadge();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", clearBadge);

    // Clear immediately on mount (covers the initial app open)
    clearBadge();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", clearBadge);
      updateAppBadge(0);
    };
  }, []);

  return {
    totalUnread,
    forms: data?.forms ?? [],
    isLoading: isCorretor ? corretorQuery.isLoading : adminQuery.isLoading,
  };
}
