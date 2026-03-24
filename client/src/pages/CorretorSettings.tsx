/**
 * Corretor Settings Page — Notification Preferences.
 * Allows corretores to configure which notification types they want to receive.
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Bell, Loader2, FileText,
  CheckCircle2, XCircle, Smartphone, Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  new_response: { icon: FileText, color: "text-blue-500" },
  response_approved: { icon: CheckCircle2, color: "text-emerald-500" },
  response_rejected: { icon: XCircle, color: "text-red-500" },
};

export default function CorretorSettings() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { data: preferences, isLoading, refetch } = trpc.notificationPreferences.get.useQuery();
  const updatePref = trpc.notificationPreferences.update.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (err) => {
      toast.error("Erro ao salvar preferência: " + err.message);
    },
  });

  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});

  const handleToggle = (
    notificationType: string,
    field: "inAppEnabled" | "pushEnabled",
    currentValue: boolean,
    otherField: "inAppEnabled" | "pushEnabled",
    otherValue: boolean,
  ) => {
    const key = `${notificationType}-${field}`;
    setPendingUpdates((prev) => ({ ...prev, [key]: true }));

    const newValue = !currentValue;
    updatePref.mutate(
      {
        notificationType,
        inAppEnabled: field === "inAppEnabled" ? newValue : otherValue,
        pushEnabled: field === "pushEnabled" ? newValue : otherValue,
      },
      {
        onSettled: () => {
          setPendingUpdates((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        },
        onSuccess: () => {
          toast.success("Preferência atualizada", { duration: 1500 });
        },
      }
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0a0a0f]" : "bg-gray-50"}`}>
      {/* Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
        isDark
          ? "bg-[#0a0a0f]/90 border-white/5"
          : "bg-white/90 border-gray-200"
      }`}>
        <div className="max-w-xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/corretor/respostas">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all active:scale-95">
              <ArrowLeft size={16} />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-brand" />
            <h1 className="text-sm font-semibold tracking-tight">Configurações de Notificação</h1>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-5 space-y-6">
        {/* Description */}
        <div className={`rounded-xl p-4 border ${
          isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200"
        }`}>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Escolha quais tipos de notificação você deseja receber. As notificações <strong>in-app</strong> aparecem no sino dentro da plataforma. As notificações <strong>push</strong> aparecem no seu navegador/dispositivo mesmo quando a plataforma está fechada.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-muted-foreground" size={24} />
          </div>
        )}

        {/* Preferences list */}
        {preferences && preferences.length > 0 && (
          <div className="space-y-3">
            {preferences.map((pref, index) => {
              const typeConfig = TYPE_ICONS[pref.notificationType] || { icon: Bell, color: "text-muted-foreground" };
              const Icon = typeConfig.icon;
              const inAppPending = pendingUpdates[`${pref.notificationType}-inAppEnabled`];
              const pushPending = pendingUpdates[`${pref.notificationType}-pushEnabled`];

              return (
                <motion.div
                  key={pref.notificationType}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`rounded-xl border overflow-hidden ${
                    isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200"
                  }`}
                >
                  {/* Type header */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDark ? "bg-white/5" : "bg-gray-100"
                    }`}>
                      <Icon size={16} className={typeConfig.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{pref.description}</p>
                    </div>
                  </div>

                  {/* Toggle rows */}
                  <div className={`border-t ${isDark ? "border-white/5" : "border-gray-100"}`}>
                    {/* In-app toggle */}
                    <div className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Monitor size={13} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">In-app (sino)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {inAppPending && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                        <Switch
                          checked={pref.inAppEnabled}
                          onCheckedChange={() =>
                            handleToggle(
                              pref.notificationType,
                              "inAppEnabled",
                              pref.inAppEnabled,
                              "pushEnabled",
                              pref.pushEnabled,
                            )
                          }
                          disabled={!!inAppPending}
                          className="data-[state=checked]:bg-brand"
                        />
                      </div>
                    </div>

                    {/* Push toggle */}
                    <div className={`px-4 py-2.5 flex items-center justify-between border-t ${
                      isDark ? "border-white/5" : "border-gray-100"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <Smartphone size={13} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Push (navegador)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {pushPending && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                        <Switch
                          checked={pref.pushEnabled}
                          onCheckedChange={() =>
                            handleToggle(
                              pref.notificationType,
                              "pushEnabled",
                              pref.pushEnabled,
                              "inAppEnabled",
                              pref.inAppEnabled,
                            )
                          }
                          disabled={!!pushPending}
                          className="data-[state=checked]:bg-brand"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info note */}
        <div className={`rounded-xl p-4 border ${
          isDark ? "bg-amber-500/5 border-amber-500/10" : "bg-amber-50 border-amber-200"
        }`}>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
            <strong>Nota:</strong> Para receber notificações push, você precisa ter as notificações push ativadas (ícone do sino verde no cabeçalho). Mesmo com push desativado aqui, as notificações in-app continuarão aparecendo se estiverem habilitadas.
          </p>
        </div>

        {/* Back button */}
        <div className="pt-2">
          <Link href="/corretor/respostas">
            <Button variant="outline" className="w-full gap-2 h-10 text-xs">
              <ArrowLeft size={14} />
              Voltar para Respostas
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
