/**
 * MobileBottomNav — Shared mobile bottom navigation bar.
 * Used by Dashboard and AppLayout for consistent mobile navigation.
 * 
 * Per design spec: Formulários, Equipe, Cadências + "Mais" (3 dots) 
 * that opens a slide-up sheet with additional options.
 */

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  Mail,
  MoreHorizontal,
  Settings,
  X,
  LogOut,
  Copy,
} from "lucide-react";

/* ─── Main Nav Items (shown in bottom bar) ─── */
const MAIN_NAV = [
  { id: "forms", label: "Formulários", icon: FileText, path: "/dashboard", adminOnly: true },
  { id: "team", label: "Equipe", icon: Users, path: "/equipe", adminOnly: true },
  { id: "cadences", label: "Cadências", icon: Mail, path: "/cadencias", adminOnly: true },
];

/* ─── More Menu Items (shown in slide-up sheet) ─── */
const MORE_ITEMS: { id: string; label: string; icon: any; path: string; adminOnly: boolean; hiddenForRoles?: string[] }[] = [
  { id: "templates", label: "Galeria de Templates", icon: Copy, path: "/formularios-copias", adminOnly: true },
  { id: "settings", label: "Configurações", icon: Settings, path: "/configuracoes", adminOnly: true, hiddenForRoles: ["gerente", "corretor"] },
];

interface MobileBottomNavProps {
  onLogout?: () => void;
  isAdmin?: boolean;
  unreadCount?: number;
  staffRole?: string | null;
}

export default function MobileBottomNav({ onLogout, isAdmin = true, unreadCount = 0, staffRole = null }: MobileBottomNavProps) {
  const [location, navigate] = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  // Filter nav items based on role
  const visibleMainNav = MAIN_NAV.filter(item => !item.adminOnly || isAdmin);
  const visibleMoreItems = MORE_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.hiddenForRoles && staffRole && item.hiddenForRoles.includes(staffRole)) return false;
    return true;
  });

  // Determine active nav item
  const activeNavId = visibleMainNav.find((item) => location.startsWith(item.path))?.id || 
    (location.startsWith("/responses") ? "forms" : "");

  return (
    <>
      {/* ─── Bottom Navigation Bar ─── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
        <div className="flex items-center justify-around px-1 py-1 safe-area-bottom">
          {visibleMainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeNavId === item.id;
            return (
              <Link key={item.id} href={item.path}>
                <button
                  className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
                    isActive ? "text-brand" : "text-muted-foreground active:text-foreground"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className="absolute -top-1 w-8 h-[3px] bg-brand rounded-full"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className="relative">
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                    {item.id === "forms" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-body leading-tight ${isActive ? "font-bold" : "font-medium"}`}>
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`relative flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${
              moreOpen ? "text-brand" : "text-muted-foreground active:text-foreground"
            }`}
          >
            <MoreHorizontal size={20} strokeWidth={2} />
            <span className="text-[10px] font-body font-medium leading-tight">Mais</span>
          </button>
        </div>
      </nav>

      {/* ─── More Menu Overlay ─── */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setMoreOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-[61] bg-card rounded-t-2xl border-t border-border shadow-2xl safe-area-bottom"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border/50">
                <h3 className="font-display text-base font-bold text-foreground">Mais opções</h3>
                <button
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Menu Items */}
              <div className="px-4 py-3 space-y-1">
                {visibleMoreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.path ? location.startsWith(item.path) : false;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        if (item.path) {
                          navigate(item.path);
                        }
                        setMoreOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-brand/10 text-brand font-semibold"
                          : "text-foreground hover:bg-secondary active:bg-secondary/80"
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? "bg-brand/10" : "bg-secondary"
                      }`}>
                        <Icon size={18} className={isActive ? "text-brand" : "text-muted-foreground"} />
                      </div>
                      <span className="text-sm font-body font-medium">{item.label}</span>
                    </button>
                  );
                })}

                {/* Logout */}
                {onLogout && (
                  <>
                    <div className="border-t border-border/50 my-2" />
                    <button
                      onClick={() => {
                        onLogout();
                        setMoreOpen(false);
                      }}
                      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-500/10">
                        <LogOut size={18} />
                      </div>
                      <span className="text-sm font-body font-medium">Sair</span>
                    </button>
                  </>
                )}
              </div>

              {/* Bottom padding for safe area */}
              <div className="h-4" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
