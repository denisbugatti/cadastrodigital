/**
 * AppLayout — Shared layout for authenticated app pages.
 * Desktop: Collapsible sidebar with navigation.
 * Mobile: Shared MobileBottomNav component.
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  FileText,
  Users,
  Mail,
  Settings,
  LogOut,
  Loader2,
  PanelLeftClose,
  PanelLeft,
  Bell,
  BellOff,
  BellRing,
  BarChart3,
  ShieldCheck,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useUnreadResponses } from "@/hooks/useUnreadResponses";
import { StaffNotificationsPanel } from "./StaffNotificationsPanel";
import MobileBottomNav from "./MobileBottomNav";

/* ─── Navigation Items ─── */
type NavItem = { id: string; label: string; icon: any; path: string; adminOnly?: boolean; hiddenForRoles?: string[] };
const NAV_ITEMS: NavItem[] = [
  { id: "forms", label: "Formulários", icon: FileText, path: "/dashboard", adminOnly: true },
  { id: "templates", label: "Galeria de Templates", icon: Copy, path: "/formularios-copias", adminOnly: true },
  { id: "team", label: "Equipe", icon: Users, path: "/equipe", adminOnly: true },
  { id: "performance", label: "Performance", icon: BarChart3, path: "/performance" },
  { id: "cadences", label: "Cadências", icon: Mail, path: "/cadencias", adminOnly: true },
  { id: "settings", label: "Configurações", icon: Settings, path: "/configuracoes", adminOnly: true, hiddenForRoles: ["gerente", "corretor"] },
  { id: "audit", label: "Auditoria", icon: ShieldCheck, path: "/auditoria", adminOnly: true, hiddenForRoles: ["gerente", "corretor"] },
];

/** Admin roles that can see admin-only nav items */
const ADMIN_ROLES = ["master", "diretor", "gerente"];

/* ─── Notification Bell ─── */
function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { isSupported, permission, isSubscribed, isLoading, toggle } = usePushNotifications();

  if (!isSupported) return null;

  const handleClick = async () => {
    if (permission === "denied") {
      toast.error("Notificações bloqueadas", {
        description: "Ative nas configurações do navegador.",
      });
      return;
    }
    const success = await toggle();
    if (success) {
      toast[!isSubscribed ? "success" : "info"](
        !isSubscribed ? "Notificações ativadas!" : "Notificações desativadas"
      );
    }
  };

  const BellIcon = permission === "denied" ? BellOff : isSubscribed ? BellRing : Bell;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      title={
        permission === "denied"
          ? "Bloqueadas pelo navegador"
          : isSubscribed
          ? "Desativar notificações"
          : "Ativar notificações"
      }
      className={`relative rounded-xl transition-all duration-200 shrink-0 ${
        compact ? "p-2" : "p-2.5"
      } ${
        isSubscribed
          ? "bg-brand/10 text-brand hover:bg-brand/20"
          : permission === "denied"
          ? "text-muted-foreground/50 cursor-not-allowed"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
      }`}
    >
      <BellIcon size={compact ? 16 : 18} className={isLoading ? "animate-pulse" : ""} />
      {isSubscribed && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
      )}
    </button>
  );
}

/* ─── Sidebar Width ─── */
const SIDEBAR_COLLAPSED_WIDTH = 72;
const SIDEBAR_EXPANDED_WIDTH = 240;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, loading, isStaff, isCorretor, logout } = useCustomAuth();
  const { totalUnread } = useUnreadResponses();

  // Filter nav items based on role — corretores only see non-admin items
  const staffRole = user?.type === "staff" ? (user as any).role : null;
  const isAdmin = staffRole ? ADMIN_ROLES.includes(staffRole) : false;
  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.hiddenForRoles && staffRole && item.hiddenForRoles.includes(staffRole)) return false;
    return true;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Track if we're on desktop for sidebar margin
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH;

  // Determine active nav item
  const activeNavId = NAV_ITEMS.find((item) => location.startsWith(item.path))?.id || 
    (location.startsWith("/responses") ? "forms" : "forms");

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

  if (!user || !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground font-body">Acesso restrito</p>
          <Link href="/login">
            <button className="px-6 py-2.5 rounded-xl bg-brand text-white font-body font-semibold text-sm hover:bg-brand-dark transition-colors">
              Fazer login
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const staffUser = user as { type: "staff"; name: string; email: string; role: string };

  return (
    <div className="min-h-screen bg-background flex">
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen bg-card border-r border-border z-40 transition-all duration-300 ease-in-out"
        style={{ width: sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-border shrink-0">
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/app-icon-3d-full-128_5d7552e4.png"
              alt="Cadastro Digital"
              className="w-9 h-9 shrink-0"
            />
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="font-display text-lg font-bold text-foreground tracking-tight truncate"
              >
                Cadastro Digital
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavId === item.id;
            const unreadBadge = item.id === "forms" ? totalUnread : 0;
            return (
              <Link key={item.id} href={item.path}>
                <button
                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                    sidebarCollapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
                  } ${
                    isActive
                      ? "bg-brand/10 text-brand font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="relative shrink-0">
                    <Icon size={20} className={isActive ? "text-brand" : ""} />
                    {unreadBadge > 0 && sidebarCollapsed && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-in fade-in zoom-in duration-300">
                        {unreadBadge > 99 ? "99+" : unreadBadge}
                      </span>
                    )}
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <span className="text-sm font-body truncate flex-1 text-left">{item.label}</span>
                      {unreadBadge > 0 && (
                        <span className="min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-bold px-1.5 animate-in fade-in zoom-in duration-300 shrink-0">
                          {unreadBadge > 99 ? "99+" : unreadBadge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 space-y-2 shrink-0">
          {/* Notification bells: push + in-app */}
          <div className={`flex items-center ${sidebarCollapsed ? "flex-col gap-2 justify-center" : "gap-2 px-1"}`}>
            <StaffNotificationsPanel />
            <NotificationBell compact={sidebarCollapsed} />
          </div>

          {/* User info */}
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl bg-secondary/50">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-display font-bold text-sm shrink-0">
                {staffUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-body font-medium text-foreground truncate">{staffUser.name}</p>
                <p className="text-[10px] text-muted-foreground font-body truncate capitalize">{staffUser.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors shrink-0"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-brand font-display font-bold text-sm">
                {staffUser.name.charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                title="Sair"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title={sidebarCollapsed ? "Expandir" : "Recolher"}
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main
        className="flex-1 min-w-0 pb-20 lg:pb-0 transition-all duration-300"
        style={{ marginLeft: isDesktop ? sidebarWidth : 0 }}
      >
        {/* Mobile top bar with notifications */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <span className="font-display text-base font-bold text-foreground tracking-tight">Cadastro Digital</span>
          <div className="flex items-center gap-1">
            <StaffNotificationsPanel />
            <NotificationBell compact />
          </div>
        </div>
        {children}
      </main>

      {/* ─── Mobile Bottom Navigation (shared component) ─── */}
      <MobileBottomNav onLogout={logout} isAdmin={isAdmin} unreadCount={totalUnread} staffRole={staffRole} />
    </div>
  );
}
