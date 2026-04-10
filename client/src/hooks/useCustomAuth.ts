/**
 * Custom Auth Hook — replaces useAuth for the new authentication system.
 * Supports staff (email+password) and client (CPF/CNPJ+password) users.
 */

import { trpc } from "@/lib/trpc";
import { clearStoredToken } from "@/lib/authToken";
import { useCallback, useMemo } from "react";

export type StaffUser = {
  type: "staff";
  id: number;
  email: string;
  name: string;
  phone?: string | null;
  role: "master" | "diretor" | "gerente" | "corretor";
  cpfCnpj?: string | null;
  avatarUrl?: string | null;
  permissions: Record<string, boolean>;
};

export type ClientUserType = {
  type: "client";
  id: number;
  cpfCnpj: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
};

export type AuthUser = StaffUser | ClientUserType | null;

export function useCustomAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.customAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.customAuth.logout.useMutation({
    onSuccess: () => {
      utils.customAuth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // Ignore errors
    } finally {
      // Clear localStorage token (used as fallback in iframe contexts)
      clearStoredToken();
      utils.customAuth.me.setData(undefined, null);
      await utils.customAuth.me.invalidate();
      // Redirect to landing page after logout
      window.location.href = "/";
    }
  }, [logoutMutation, utils]);

  const state = useMemo(() => {
    const user = meQuery.data as AuthUser;
    return {
      user,
      loading: meQuery.isLoading || logoutMutation.isPending,
      error: meQuery.error ?? logoutMutation.error ?? null,
      isAuthenticated: Boolean(user),
      isStaff: user?.type === "staff",
      isClient: user?.type === "client",
      isMaster: user?.type === "staff" && user.role === "master",
      isDiretor: user?.type === "staff" && user.role === "diretor",
      isGerente: user?.type === "staff" && user.role === "gerente",
      isCorretor: user?.type === "staff" && user.role === "corretor",
      canEditForms: user?.type === "staff" && (user.role === "master" || user.role === "diretor"),
    };
  }, [meQuery.data, meQuery.error, meQuery.isLoading, logoutMutation.error, logoutMutation.isPending]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    const user = meQuery.data as AuthUser;
    if (!user || user.type !== "staff") return false;
    if (user.role === "master") return true; // Master has all permissions
    return user.permissions?.[permission] === true;
  }, [meQuery.data]);

  return {
    ...state,
    hasPermission,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
