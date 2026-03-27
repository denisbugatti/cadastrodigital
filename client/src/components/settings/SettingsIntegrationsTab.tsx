/**
 * SettingsIntegrationsTab
 * Painel central de configuração e conexão de integrações por formulário.
 * Permite ativar/desativar e configurar cada integração (Webhook, Google Sheets,
 * RD Station, WhatsApp, E-mail) sem precisar abrir o builder.
 * Acessível apenas por gestores (role check feito no backend via staffAdminProcedure).
 */

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Webhook, Sheet, Mail, MessageCircle, Globe, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, Settings2, ExternalLink, Loader2, Save,
  Plus, Trash2, Eye, EyeOff, TestTube2, RefreshCw, AlertTriangle,
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
    key: "webhook",
    label: "Webhook",
    icon: <Webhook size={16} />,
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    description: "Envie respostas para qualquer URL via HTTP POST/PUT",
  },
  {
    key: "googleSheets",
    label: "Google Sheets",
    icon: <Sheet size={16} />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    description: "Registre respostas automaticamente em planilhas",
  },
  {
    key: "rdStation",
    label: "RD Station",
    icon: <Globe size={16} />,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    description: "Envie leads diretamente ao RD Station CRM",
  },
  {
    key: "email",
    label: "E-mail",
    icon: <Mail size={16} />,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    description: "Receba respostas por e-mail automaticamente",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    icon: <MessageCircle size={16} />,
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    description: "Envie notificações via WhatsApp ao receber resposta",
  },
] as const;

type IntegrationKey = "webhook" | "googleSheets" | "rdStation" | "email" | "whatsapp";

// ─── Helper: extract integration status from form webhook object ───
function getIntegrationStatus(webhook: any, key: IntegrationKey): boolean {
  if (!webhook) return false;
  if (key === "webhook") return !!webhook.enabled;
  return !!(webhook.integrations?.[key]?.enabled);
}

function getIntegrationData(webhook: any, key: IntegrationKey): any {
  if (!webhook) return {};
  if (key === "webhook") return webhook;
  return webhook.integrations?.[key] ?? {};
}

// ─── Main component ───
export function SettingsIntegrationsTab() {
  const utils = trpc.useUtils();
  const { data: forms, isLoading } = trpc.forms.list.useQuery();
  const updateForm = trpc.forms.update.useMutation({
    onSuccess: () => {
      utils.forms.list.invalidate();
      toast.success("Integração salva com sucesso");
    },
    onError: (err) => toast.error(err.message),
  });

  const testGoogleSheets = trpc.integrations.testGoogleSheets.useMutation();

  // Which form's integration panel is expanded: { formId, integrationKey }
  const [expanded, setExpanded] = useState<{ formId: number; key: IntegrationKey } | null>(null);

  // Local edit state per form+integration
  const [editState, setEditState] = useState<Record<string, any>>({});

  // Show/hide service account JSON
  const [showJson, setShowJson] = useState(false);

  // Google Sheets test state
  const [testingSheets, setTestingSheets] = useState(false);
  const [sheetsTestResult, setSheetsTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const editKey = expanded ? `${expanded.formId}-${expanded.key}` : null;

  // When a panel opens, seed editState from the form's current webhook data
  useEffect(() => {
    if (!expanded || !forms) return;
    const form = forms.find((f: any) => f.id === expanded.formId);
    if (!form) return;
    const key = `${expanded.formId}-${expanded.key}`;
    if (editState[key] !== undefined) return; // Already seeded
    const data = getIntegrationData(form.webhook, expanded.key);
    setEditState(prev => ({ ...prev, [key]: { ...data } }));
    setSheetsTestResult(null);
  }, [expanded, forms]);

  function toggleExpand(formId: number, key: IntegrationKey) {
    if (expanded?.formId === formId && expanded?.key === key) {
      setExpanded(null);
    } else {
      setExpanded({ formId, key });
      setSheetsTestResult(null);
    }
  }

  function updateEdit(field: string, value: any) {
    if (!editKey) return;
    setEditState(prev => ({
      ...prev,
      [editKey]: { ...prev[editKey], [field]: value },
    }));
  }

  function handleSave(form: any) {
    if (!expanded || !editKey) return;
    const current = editState[editKey] ?? {};
    const currentWebhook = form.webhook ?? {};

    let newWebhook: any;
    if (expanded.key === "webhook") {
      newWebhook = { ...currentWebhook, ...current };
    } else {
      newWebhook = {
        ...currentWebhook,
        integrations: {
          ...(currentWebhook.integrations ?? {}),
          [expanded.key]: current,
        },
      };
    }

    updateForm.mutate({ id: form.id, webhook: newWebhook });
  }

  async function handleTestGoogleSheets(form: any) {
    if (!editKey) return;
    const data = editState[editKey] ?? {};
    if (!data.spreadsheetUrl || !data.serviceAccountJson) {
      toast.error("Preencha a URL da planilha e o JSON da conta de serviço");
      return;
    }
    setTestingSheets(true);
    setSheetsTestResult(null);
    try {
      const result = await testGoogleSheets.mutateAsync({
        spreadsheetUrl: data.spreadsheetUrl,
        sheetName: data.sheetName || "Respostas",
        serviceAccountJson: data.serviceAccountJson,
      });
      const msg = (result as any).message ?? result.error ?? (result.success ? "Conexão bem-sucedida!" : "Falha na conexão");
      setSheetsTestResult({ ok: result.success, message: msg });
      if (result.success) {
        // Save the service account email extracted from the JSON
        try {
          const parsed = JSON.parse(data.serviceAccountJson);
          if (parsed.client_email) updateEdit("serviceAccountEmail", parsed.client_email);
        } catch {}
        updateEdit("connectionStatus", "connected");
        updateEdit("connectionError", undefined);
      } else {
        updateEdit("connectionStatus", "error");
        updateEdit("connectionError", (result as any).message ?? result.error);
      }
    } catch (err: any) {
      setSheetsTestResult({ ok: false, message: err.message ?? "Erro ao testar conexão" });
    } finally {
      setTestingSheets(false);
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
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">Integrações</h2>
          <p className="text-sm font-body text-muted-foreground mt-0.5">
            Configure conexões externas para cada formulário — Webhook, Google Sheets, RD Station, E-mail e WhatsApp.
          </p>
        </div>
      </div>

      {/* Forms list */}
      <div className="space-y-3">
        {(forms as any[]).map((form: any) => {
          const webhook = form.webhook ?? {};
          const activeIntegrations = INTEGRATIONS.filter(intg => getIntegrationStatus(webhook, intg.key as IntegrationKey));

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
                      <div className="flex items-center gap-2 mt-0.5">
                        {activeIntegrations.length === 0 ? (
                          <span className="text-xs font-body text-muted-foreground">Nenhuma integração ativa</span>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {activeIntegrations.map(intg => (
                              <Badge
                                key={intg.key}
                                variant="outline"
                                className={`text-[10px] font-body px-1.5 py-0 h-4 gap-1 ${intg.color} border-current/30`}
                              >
                                {intg.icon}
                                {intg.label}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link href={`/builder/${form.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 shrink-0">
                      <ExternalLink size={12} />
                      Abrir editor
                    </Button>
                  </Link>
                </div>
              </CardHeader>

              {/* Integration rows */}
              <CardContent className="px-5 pb-4 pt-0">
                <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {INTEGRATIONS.map((intg) => {
                    const isActive = getIntegrationStatus(webhook, intg.key as IntegrationKey);
                    const isOpen = expanded?.formId === form.id && expanded?.key === intg.key;
                    const currentEditKey = `${form.id}-${intg.key}`;
                    const editData = editState[currentEditKey] ?? getIntegrationData(webhook, intg.key as IntegrationKey);

                    return (
                      <div key={intg.key} className="bg-background">
                        {/* Row header */}
                        <button
                          onClick={() => toggleExpand(form.id, intg.key as IntegrationKey)}
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
                                  <CheckCircle2 size={10} />
                                  Ativo
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] font-body text-muted-foreground">
                                  <XCircle size={10} />
                                  Inativo
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-body text-muted-foreground truncate">{intg.description}</p>
                          </div>
                          {isOpen ? (
                            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                          )}
                        </button>

                        {/* Expanded config panel */}
                        {isOpen && (
                          <div className={`px-4 pb-4 pt-2 border-t border-border ${intg.bg}`}>
                            {intg.key === "webhook" && (
                              <WebhookConfig
                                data={editData}
                                onChange={updateEdit}
                              />
                            )}
                            {intg.key === "googleSheets" && (
                              <GoogleSheetsConfig
                                data={editData}
                                onChange={updateEdit}
                                onTest={() => handleTestGoogleSheets(form)}
                                testing={testingSheets}
                                testResult={sheetsTestResult}
                                showJson={showJson}
                                onToggleShowJson={() => setShowJson(v => !v)}
                              />
                            )}
                            {intg.key === "rdStation" && (
                              <RdStationConfig data={editData} onChange={updateEdit} />
                            )}
                            {intg.key === "email" && (
                              <EmailConfig data={editData} onChange={updateEdit} />
                            )}
                            {intg.key === "whatsapp" && (
                              <WhatsAppConfig data={editData} onChange={updateEdit} />
                            )}

                            {/* Save button */}
                            <div className="flex justify-end mt-4 pt-3 border-t border-border/50">
                              <Button
                                size="sm"
                                onClick={() => handleSave(form)}
                                disabled={updateForm.isPending}
                                className="gap-2 text-xs"
                              >
                                {updateForm.isPending ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Save size={12} />
                                )}
                                Salvar configuração
                              </Button>
                            </div>
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

// ─── Webhook Config ───
function WebhookConfig({ data, onChange }: { data: any; onChange: (f: string, v: any) => void }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-body font-medium text-foreground">Ativar Webhook</Label>
        <Switch
          checked={!!data.enabled}
          onCheckedChange={(v) => onChange("enabled", v)}
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">URL de destino</Label>
        <Input
          value={data.url ?? ""}
          onChange={(e) => onChange("url", e.target.value)}
          placeholder="https://seu-servidor.com/webhook"
          className="text-xs h-8"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-body text-muted-foreground mb-1 block">Método</Label>
          <select
            value={data.method ?? "POST"}
            onChange={(e) => onChange("method", e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg text-xs font-body text-foreground bg-input border border-border focus:outline-none transition-all appearance-none"
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs font-body text-muted-foreground">Enviar ao completar</Label>
          <Switch
            checked={!!data.sendOnComplete}
            onCheckedChange={(v) => onChange("sendOnComplete", v)}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Google Sheets Config ───
function GoogleSheetsConfig({
  data, onChange, onTest, testing, testResult, showJson, onToggleShowJson,
}: {
  data: any;
  onChange: (f: string, v: any) => void;
  onTest: () => void;
  testing: boolean;
  testResult: { ok: boolean; message: string } | null;
  showJson: boolean;
  onToggleShowJson: () => void;
}) {
  function handleJsonUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        onChange("serviceAccountJson", text);
        if (parsed.client_email) onChange("serviceAccountEmail", parsed.client_email);
        toast.success("Arquivo JSON carregado com sucesso");
      } catch {
        toast.error("Arquivo JSON inválido");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-body font-medium text-foreground">Ativar Google Sheets</Label>
        <Switch
          checked={!!data.enabled}
          onCheckedChange={(v) => onChange("enabled", v)}
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">URL da planilha</Label>
        <Input
          value={data.spreadsheetUrl ?? ""}
          onChange={(e) => onChange("spreadsheetUrl", e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="text-xs h-8"
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Nome da aba</Label>
        <Input
          value={data.sheetName ?? "Respostas"}
          onChange={(e) => onChange("sheetName", e.target.value)}
          placeholder="Respostas"
          className="text-xs h-8"
        />
      </div>

      {/* Service Account */}
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
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={onToggleShowJson}
              title={showJson ? "Ocultar JSON" : "Ver JSON"}
            >
              {showJson ? <EyeOff size={12} /> : <Eye size={12} />}
            </Button>
          )}
        </div>
        {showJson && data.serviceAccountJson && (
          <textarea
            readOnly
            value={data.serviceAccountJson}
            className="mt-2 w-full h-24 text-[10px] font-mono bg-secondary/50 border border-border rounded-lg px-2 py-1.5 resize-none text-muted-foreground"
          />
        )}
      </div>

      {/* Test connection */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onTest}
          disabled={testing || !data.spreadsheetUrl || !data.serviceAccountJson}
          className="gap-2 text-xs h-8"
        >
          {testing ? <Loader2 size={12} className="animate-spin" /> : <TestTube2 size={12} />}
          Testar conexão
        </Button>
        {testResult && (
          <span className={`flex items-center gap-1 text-xs font-body ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}>
            {testResult.ok ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
            {testResult.message}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── RD Station Config ───
function RdStationConfig({ data, onChange }: { data: any; onChange: (f: string, v: any) => void }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-body font-medium text-foreground">Ativar RD Station</Label>
        <Switch
          checked={!!data.enabled}
          onCheckedChange={(v) => onChange("enabled", v)}
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Token da API</Label>
        <Input
          value={data.apiToken ?? ""}
          onChange={(e) => onChange("apiToken", e.target.value)}
          placeholder="Seu token do RD Station"
          type="password"
          className="text-xs h-8"
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Identificador de conversão</Label>
        <Input
          value={data.conversionIdentifier ?? ""}
          onChange={(e) => onChange("conversionIdentifier", e.target.value)}
          placeholder="ex: formulario-cadastro"
          className="text-xs h-8"
        />
      </div>
    </div>
  );
}

// ─── Email Config ───
function EmailConfig({ data, onChange }: { data: any; onChange: (f: string, v: any) => void }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-body font-medium text-foreground">Ativar notificação por e-mail</Label>
        <Switch
          checked={!!data.enabled}
          onCheckedChange={(v) => onChange("enabled", v)}
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Destinatários (separados por vírgula)</Label>
        <Input
          value={data.recipients ?? ""}
          onChange={(e) => onChange("recipients", e.target.value)}
          placeholder="email@empresa.com, outro@empresa.com"
          className="text-xs h-8"
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Assunto do e-mail</Label>
        <Input
          value={data.subject ?? ""}
          onChange={(e) => onChange("subject", e.target.value)}
          placeholder="Nova resposta recebida"
          className="text-xs h-8"
        />
      </div>
    </div>
  );
}

// ─── WhatsApp Config ───
function WhatsAppConfig({ data, onChange }: { data: any; onChange: (f: string, v: any) => void }) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-body font-medium text-foreground">Ativar notificação WhatsApp</Label>
        <Switch
          checked={!!data.enabled}
          onCheckedChange={(v) => onChange("enabled", v)}
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Número de destino</Label>
        <Input
          value={data.phoneNumber ?? ""}
          onChange={(e) => onChange("phoneNumber", e.target.value)}
          placeholder="+55 11 99999-9999"
          className="text-xs h-8"
        />
      </div>
      <div>
        <Label className="text-xs font-body text-muted-foreground mb-1 block">Mensagem</Label>
        <textarea
          value={data.message ?? ""}
          onChange={(e) => onChange("message", e.target.value)}
          placeholder="Nova resposta recebida em {{form_title}}"
          rows={3}
          className="w-full px-3 py-2 rounded-xl text-xs font-body text-foreground bg-input border border-border focus:outline-none focus:ring-1 focus:ring-brand/30 transition-all resize-none"
        />
      </div>
    </div>
  );
}
