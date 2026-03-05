/**
 * StaffNotificationsPanel — In-app notification dropdown for staff users.
 * Shows a bell icon with unread count badge, and a dropdown panel with notification list.
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Bell, Check, CheckCheck, Clock, FileText, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

function timeAgo(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "agora";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function StaffNotificationsPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  // Queries
  const { data: unreadCount = 0 } = trpc.staffNotifications.unreadCount.useQuery(undefined, {
    refetchInterval: 15000, // Poll every 15 seconds
  });
  const { data: notifications = [], isLoading } = trpc.staffNotifications.list.useQuery(
    { limit: 30 },
    { enabled: open }
  );

  // Mutations
  const markReadMutation = trpc.staffNotifications.markRead.useMutation({
    onSuccess: () => {
      utils.staffNotifications.unreadCount.invalidate();
      utils.staffNotifications.list.invalidate();
    },
  });
  const markAllReadMutation = trpc.staffNotifications.markAllRead.useMutation({
    onSuccess: () => {
      utils.staffNotifications.unreadCount.invalidate();
      utils.staffNotifications.list.invalidate();
    },
  });

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleNotificationClick = (notif: any) => {
    if (!notif.isRead) {
      markReadMutation.mutate({ id: notif.id });
    }
    if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 ${
          open
            ? "text-brand bg-brand/10"
            : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        onClick={() => setOpen(!open)}
        title="Notificações"
      >
        <Bell size={14} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center ring-2 ring-card px-0.5">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-xs font-display font-bold text-foreground">
                Notificações
                {unreadCount > 0 && (
                  <span className="ml-1.5 text-[10px] font-mono text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold text-brand bg-brand/10 hover:bg-brand/15 transition-all active:scale-95"
                    title="Marcar todas como lidas"
                  >
                    {markAllReadMutation.isPending ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : (
                      <CheckCheck size={10} />
                    )}
                    Ler todas
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={18} className="animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-2">
                    <Bell size={18} className="text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground font-body">
                    Nenhuma notificação
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notif: any) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`w-full text-left px-4 py-3 transition-all hover:bg-secondary/50 active:bg-secondary ${
                        !notif.isRead ? "bg-brand/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Unread indicator */}
                        <div className="mt-1.5 shrink-0">
                          {!notif.isRead ? (
                            <span className="w-2 h-2 rounded-full bg-brand block" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-transparent block" />
                          )}
                        </div>

                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === "new_response"
                            ? "bg-blue-500/10 text-blue-500"
                            : notif.type === "form_assigned"
                            ? "bg-green-500/10 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <FileText size={14} />
                        </div>

                        {/* Content */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-[11px] leading-tight ${
                            !notif.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                          }`}>
                            {notif.title}
                          </p>
                          {notif.body && (
                            <p className="text-[10px] text-muted-foreground font-body mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.body}
                            </p>
                          )}
                          <p className="text-[9px] text-muted-foreground/60 font-body mt-1 flex items-center gap-1">
                            <Clock size={8} />
                            {timeAgo(notif.createdAt)}
                          </p>
                        </div>

                        {/* Mark as read */}
                        {!notif.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markReadMutation.mutate({ id: notif.id });
                            }}
                            className="mt-1 w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-brand hover:bg-brand/10 transition-all shrink-0"
                            title="Marcar como lida"
                          >
                            <Check size={10} />
                          </button>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
