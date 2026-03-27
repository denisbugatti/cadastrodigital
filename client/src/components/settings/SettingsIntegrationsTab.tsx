/**
 * SettingsIntegrationsTab
 * Painel central de configuração e conexão de integrações por formulário.
 * Fluxo funcional: lê dados reais do banco, permite edição inline e salva
 * de volta ao banco preservando todos os campos do webhook.
 */

import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Webhook, Sheet, Mail, MessageCircle, Globe, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Settings2, ExternalLink, Loader2, Save,
  Plus, Eye, EyeOff, TestTube2, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Link } from "wouter";

// ─── Integration definitions ───
const INTEGRATIONS = [
  {
    key: "webhook" as const,
    label: "Webhook",
    icon: <Webhook size={16} />,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    description: "Envie respostas para qualquer URL via HTTP POST/PUT",
  },
  {
    key: "googleSheets" as const,
    label: "Google Sheets",
    icon: <Sheet size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    description: "Registre respostas automaticamente em planilhas",
  },
  {
    key: "rdStation" as const,
    label: "RD Station",
    icon: <Globe size={16} />,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    description: "Envie leads diretamente ao RD Station CRM",
  },
  {
    key: "email" as const,
    label: "E-mail",
    icon: <Mail size={16} />,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    description: "Receba respostas por e-mail automaticamente",
  },
  {
    key: "whatsapp" as const,
    label: "WhatsApp",
    icon: <MessageCircle size={16} />,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    description: "Envie notificações via WhatsApp ao receber resposta",
  },
];

type IntegrationKey = "webhook" | "googleSheets" | "rdStation" | "email" | "whatsapp";

// ─── Helpers to read/write the nested webhook JSON ───
function readIntegrationData(webhook: any, key: IntegrationKey): Record<string, any> {
  if (!webhook) return {};
  if (key === "webhook") {
    // Top-level webhook fields (enabled, url, method, headers, sendOnComplete, sendOnPartial)
    const { integrations, tracking, ...rest } = webhook;
    return rest;
  }
  return webhook?.integrations?.[key] ?? {};
}

function isIntegrationActive(webhook: any, key: IntegrationKey): boolean {
  if (!webhook) return false;
  if (key === "webhook") return !!webhook.enabled;
  return !!(webhook?.integrations?.[key]?.enabled);
}

function buildNewWebhook(currentWebhook: any, key: IntegrationKey, editData: Record<string, any>): any {
  const base = currentWebhook ?? {};
  if (key === "webhook") {
    // Merge top-level fields, preserving integrations and tracking
    return {
      ...base,
      ...editData,
      integrations: base.integrations ?? {},
      tracking: base.tracking ?? {},
    };
  }
  return {
    ...base,
    integrations: {
      ...(base.integrations ?? {}),
      [key]: editData,
    },
  };
}

// ─── Per-integration edit panel ───
interface IntegrationPanelProps {
  formId: number;
  integrationKey: IntegrationKey;
  initialData: Record<string, any>;
  onSave: (data: Record<string, any>) => Promise<void>;
  isSaving: boolean;
}

function IntegrationPanel({ formId, integrationKey, initialData, onSave, isSaving }: IntegrationPanelProps) {
  const [data, setData] = useState<Record<string, any>>({ ...initialData });
  const [showJson, setShowJson] = useState(false);
  const [testingSheets, setTestingSheets] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const testGoogleSheets = trpc.integrations.testGoogleSheets.useMutation();

  // Re-seed if initialData changes (e.g. after save + invalidate)
  const prevInitialRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(initialData);
    if (serialized !== prevInitialRef.current) {
      prevInitialRef.current = serialized;
      setData({ ...initialData });
    }
  }, [initialData]);

  function set(field: string, value: any) {
    setData(prev => ({ ...prev, [field]: value }));
  }

  async function handleTestSheets() {
    if (!data.spreadsheetUrl || !data.serviceAccountJson) {
      toast.error("Preencha a URL da planilha e o JSON da conta de serviço");
      return;
    }
    setTestingSheets(true);
    setTestResult(null);
    try {
      const result = await testGoogleSheets.mutateAsync({
        spreadsheetUrl: data.spreadsheetUrl,
        sheetName: data.sheetName || "Respostas",
        serviceAccountJson: data.serviceAccountJson,
      });
      const msg = result.error ?? (result.success ? "Conexão bem-sucedida! Planilha acessível." : "Falha na conexão");
      setTestResult({ ok: result.success, message: msg });
      if (result.success) {
        try {
          const parsed = JSON.parse(data.serviceAccountJson);
          if (parsed.client_email) set("serviceAccountEmail", parsed.client_email);
        } catch {}
        set("connectionStatus", "connected");
        set("connectionError", "");
      } else {
        set("connectionStatus", "error");
        set("connectionError", result.error ?? "Falha");
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message ?? "Erro ao testar conexão" });
    } finally {
      setTestingSheets(false);
    }
  }

  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        set("serviceAccountJson", text);
        if (parsed.client_email) set("serviceAccountEmail", parsed.client_email);
        setTestResult(null);
        toast.success("Arquivo JSON carregado");
      } catch {
        toast.error("Arquivo JSON inválido");
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  return (
    <div className="space-y-3 pt-2">
      {/* ── Webhook ── */}
      {integrationKey === "webhook" && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-body font-semibold text-foreground">Ativar Webhook</Label>
            <Switch checked={!!data.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">URL de destino</Label>
            <Input
              value={data.url ?? ""}
              onChange={(e) => set("url", e.target.value)}
              placeholder="https://seu-servidor.com/webhook"
              className="text-xs h-8"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-body text-muted-foreground mb-1 block">Método HTTP</Label>
              <select
                value={data.method ?? "POST"}
                onChange={(e) => set("method", e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg text-xs font-body text-foreground bg-input border border-border focus:outline-none transition-all appearance-none"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-body text-muted-foreground">Enviar ao completar</Label>
              <Switch checked={!!data.sendOnComplete} onCheckedChange={(v) => set("sendOnComplete", v)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-body text-muted-foreground">Enviar parcialmente</Label>
            <Switch checked={!!data.sendOnPartial} onCheckedChange={(v) => set("sendOnPartial", v)} />
          </div>
        </>
      )}

      {/* ── Google Sheets ── */}
      {integrationKey === "googleSheets" && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-body font-semibold text-foreground">Ativar Google Sheets</Label>
            <Switch checked={!!data.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">URL da planilha</Label>
            <Input
              value={data.spreadsheetUrl ?? ""}
              onChange={(e) => set("spreadsheetUrl", e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Nome da aba</Label>
            <Input
              value={data.sheetName ?? "Respostas"}
              onChange={(e) => set("sheetName", e.target.value)}
              placeholder="Respostas"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">
              Conta de serviço (JSON)
              {data.serviceAccountEmail && (
                <span className="ml-2 text-emerald-600 font-medium">{data.serviceAccountEmail}</span>
              )}
            </Label>
            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input type="file" accept=".json" className="hidden" onChange={handleJsonUpload} />
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-border bg-background hover:bg-secondary/50 transition-colors text-xs font-body text-muted-foreground">
                  <Plus size={12} />
                  {data.serviceAccountJson ? "Substituir arquivo JSON" : "Carregar arquivo JSON"}
                </div>
              </label>
              {data.serviceAccountJson && (
                <Button
                  variant="ghost" size="sm" className="h-8 w-8 p-0"
                  onClick={() => setShowJson(v => !v)}
                  title={showJson ? "Ocultar JSON" : "Ver JSON"}
                >
                  {showJson ? <EyeOff size={12} /> : <Eye size={12} />}
                </Button>
              )}
            </div>
            {showJson && data.serviceAccountJson && (
              <textarea
                readOnly value={data.serviceAccountJson}
                className="mt-2 w-full h-24 text-[10px] font-mono bg-secondary/50 border border-border rounded-lg px-2 py-1.5 resize-none text-muted-foreground"
              />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline" size="sm"
              onClick={handleTestSheets}
              disabled={testingSheets || !data.spreadsheetUrl || !data.serviceAccountJson}
              className="gap-2 text-xs h-8"
            >
              {testingSheets ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
              Testar conexão
            </Button>
            {testResult && (
              <span className={`flex items-center gap-1 text-xs font-body ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}>
                {testResult.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {testResult.message}
              </span>
            )}
          </div>
          {data.connectionStatus === "connected" && !testResult && (
            <p className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 size={11} /> Última conexão testada com sucesso
            </p>
          )}
          {data.connectionStatus === "error" && !testResult && data.connectionError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle size={11} /> {data.connectionError}
            </p>
          )}
        </>
      )}

      {/* ── RD Station ── */}
      {integrationKey === "rdStation" && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-body font-semibold text-foreground">Ativar RD Station</Label>
            <Switch checked={!!data.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Token da API</Label>
            <Input
              value={data.apiToken ?? ""}
              onChange={(e) => set("apiToken", e.target.value)}
              placeholder="Seu token do RD Station"
              type="password"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Identificador de conversão</Label>
            <Input
              value={data.conversionIdentifier ?? ""}
              onChange={(e) => set("conversionIdentifier", e.target.value)}
              placeholder="ex: formulario-cadastro"
              className="text-xs h-8"
            />
          </div>
        </>
      )}

      {/* ── E-mail ── */}
      {integrationKey === "email" && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-body font-semibold text-foreground">Ativar notificação por e-mail</Label>
            <Switch checked={!!data.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Destinatários (separados por vírgula)</Label>
            <Input
              value={data.recipients ?? ""}
              onChange={(e) => set("recipients", e.target.value)}
              placeholder="email@empresa.com, outro@empresa.com"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Assunto do e-mail</Label>
            <Input
              value={data.subject ?? ""}
              onChange={(e) => set("subject", e.target.value)}
              placeholder="Nova resposta recebida"
              className="text-xs h-8"
            />
          </div>
        </>
      )}

      {/* ── WhatsApp ── */}
      {integrationKey === "whatsapp" && (
        <>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-body font-semibold text-foreground">Ativar notificação WhatsApp</Label>
            <Switch checked={!!data.enabled} onCheckedChange={(v) => set("enabled", v)} />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Número de destino</Label>
            <Input
              value={data.phoneNumber ?? ""}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="+55 11 99999-9999"
              className="text-xs h-8"
            />
          </div>
          <div>
            <Label className="text-xs font-body text-muted-foreground mb-1 block">Mensagem</Label>
            <textarea
              value={data.message ?? ""}
              onChange={(e) => set("message", e.target.value)}
              placeholder="Nova resposta recebida em {{form_title}}"
              rows={3}
              className="w-full px-3 py-2 rounded-xl text-xs font-body text-foreground bg-input border border-border focus:outline-none focus:ring-1 focus:ring-brand/30 transition-all resize-none"
            />
          </div>
        </>
      )}

      {/* ── Save button ── */}
      <div className="flex justify-end pt-3 border-t border-border/50">
        <Button
          size="sm"
          onClick={() => onSave(data)}
          disabled={isSaving}
          className="gap-2 text-xs"
        >
          {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          Salvar configuração
        </Button>
      </div>
    </div>
  );
}

// ─── Main component ───
export function SettingsIntegrationsTab() {
  const utils = trpc.useUtils();
  const { data: forms, isLoading } = trpc.forms.list.useQuery();

  // Track which panel is open: "formId-integrationKey"
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  // Track which form+integration is currently saving
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const updateForm = trpc.forms.update.useMutation();

  function togglePanel(formId: number, key: IntegrationKey) {
    const panelKey = `${formId}-${key}`;
    setOpenPanel(prev => prev === panelKey ? null : panelKey);
  }

  async function handleSave(form: any, key: IntegrationKey, editData: Record<string, any>) {
    const panelKey = `${form.id}-${key}`;
    setSavingKey(panelKey);
    try {
      const newWebhook = buildNewWebhook(form.webhook, key, editData);
      await updateForm.mutateAsync({ id: form.id, webhook: newWebhook });
      // Invalidate so the list refreshes with the new data
      await utils.forms.list.invalidate();
      toast.success("Integração salva com sucesso");
    } catch (err: any) {
      toast.error(err.message ?? "Erro ao salvar integração");
    } finally {
      setSavingKey(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!forms || forms.length === 0) {
    return (
      <div className="text-center py-16">
        <Webhook className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
        <p className="text-sm font-body text-muted-foreground">Nenhum formulário encontrado.</p>
        <p className="text-xs text-muted-foreground mt-1">Crie um formulário para configurar integrações.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-display font-bold text-foreground">Integrações</h2>
        <p className="text-sm font-body text-muted-foreground mt-0.5">
          Configure conexões externas para cada formulário. As alterações são salvas diretamente no banco de dados.
        </p>
      </div>

      {/* Forms list */}
      <div className="space-y-3">
        {(forms as any[]).map((form: any) => {
          const webhook = form.webhook ?? {};
          const activeIntegrations = INTEGRATIONS.filter(intg => isIntegrationActive(webhook, intg.key));

          return (
            <Card key={form.id} className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {/* Form header */}
              <CardHeader className="px-5 py-4 pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                      <Settings2 size={16} className="text-brand" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-display font-semibold text-foreground truncate">{form.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {activeIntegrations.length === 0 ? (
                          <span className="text-xs font-body text-muted-foreground">Nenhuma integração ativa</span>
                        ) : (
                          activeIntegrations.map(intg => (
                            <Badge
                              key={intg.key}
                              variant="outline"
                              className={`text-[10px] font-body px-1.5 py-0 h-4 gap-1 ${intg.color} border-current/30`}
                            >
                              {intg.icon}
                              {intg.label}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/builder/${form.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 shrink-0">
                      <ExternalLink size={12} />
                      Editor
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              {/* Integration rows */}
              <CardContent className="px-5 pb-4 pt-0">
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {INTEGRATIONS.map((intg) => {
                    const isActive = isIntegrationActive(webhook, intg.key);
                    const panelKey = `${form.id}-${intg.key}`;
                    const isOpen = openPanel === panelKey;
                    const isSaving = savingKey === panelKey;
                    // Read current data from the form (fresh from server after invalidate)
                    const currentData = readIntegrationData(webhook, intg.key);

                    return (
                      <div key={intg.key} className="bg-background">
                        {/* Row toggle */}
                        <button
                          onClick={() => togglePanel(form.id, intg.key)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${intg.bg} ${intg.color}`}>
                            {intg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-body font-medium text-foreground">{intg.label}</span>
                              {isActive ? (
                                <span className="flex items-center gap-1 text-[10px] font-body text-emerald-600">
                                  <CheckCircle2 size={10} /> Ativo
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground">
                                  <XCircle size={10} /> Inativo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-body text-muted-foreground">{intg.description}</p>
                          </div>
                          {isOpen
                            ? <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                            : <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                          }
                        </button>

                        {/* Config panel — each integration gets its own isolated component with local state */}
                        {isOpen && (
                          <div className={`px-4 pb-2 border-t border-border ${intg.bg}`}>
                            <IntegrationPanel
                              key={panelKey} // Forces remount when panel changes, ensuring fresh state
                              formId={form.id}
                              integrationKey={intg.key}
                              initialData={currentData}
                              onSave={(editData) => handleSave(form, intg.key, editData)}
                              isSaving={isSaving}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
