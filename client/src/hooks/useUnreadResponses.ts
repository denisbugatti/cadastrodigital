import { trpc } from "@/lib/trpc";
import { useCustomAuth } from "./useCustomAuth";

/**
 * Hook for real-time unread response count polling.
 * Polls every 20 seconds for admin/gerente, or corretor-specific endpoint.
 * Returns totalUnread count and per-form breakdown.
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

  return {
    totalUnread: data?.totalUnread ?? 0,
    forms: data?.forms ?? [],
    isLoading: isCorretor ? corretorQuery.isLoading : adminQuery.isLoading,
  };
}
