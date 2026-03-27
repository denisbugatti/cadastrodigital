/**
 * FormFlow Webhook & Integrations Panel (Light Theme)
 * Configure webhook URL, method, headers, triggers, and integrations per form.
 * Integrations: RD Station, WhatsApp, Email, Google Sheets, CRM Manus
 * Tracking: GTM, Google Analytics, Facebook Pixel, TikTok Pixel
 */

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook, Plus, Trash2, Send, CheckCircle, AlertCircle, Copy, Check,
  Mail, BarChart3, ChevronDown, ChevronRight,
  Table2, Building2, Tag, Activity, Eye, Upload, Shield, RefreshCw, Loader2, FileKey, X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import type { WebhookSettings } from "@/lib/builderTypes";

interface WebhookPanelProps {
  webhook: WebhookSettings;
  formTitle: string;
  onUpdate: (updates: Partial<WebhookSettings>) => void;
}

type IntegrationSection = "webhook" | "rdstation" | "email" | "googlesheets" | "crmmanus" | "gtm" | "ga" | "fbpixel" | "tiktok";

export function WebhookPanel({ webhook, formTitle, onUpdate }: WebhookPanelProps) {
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<IntegrationSection | null>("webhook");

  const integrations = webhook.integrations ?? {
    rdStation: { enabled: false, apiToken: "", conversionIdentifier: "" },
    email: { enabled: false, recipients: "", subject: "Nova resposta no formulário" },
    googleSheets: { enabled: false, spreadsheetUrl: "", sheetName: "Respostas" },
    crmManus: { enabled: false, webhookUrl: "", funnelName: "", stageName: "" },
  };

  const tracking = webhook.tracking ?? {
    gtm: { enabled: false, containerId: "" },
    googleAnalytics: { enabled: false, measurementId: "" },
    facebookPixel: { enabled: false, pixelId: "" },
    tiktokPixel: { enabled: false, pixelId: "" },
  };

  const updateIntegration = (key: string, value: any) => {
    onUpdate({
      integrations: {
        ...integrations,
        [key]: { ...(integrations as any)[key], ...value },
      },
    });
  };

  const updateTracking = (key: string, value: any) => {
    onUpdate({
      tracking: {
        ...tracking,
        [key]: { ...(tracking as any)[key], ...value },
      },
    });
  };

  const toggleSection = (section: IntegrationSection) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const addHeader = () => {
    onUpdate({
      headers: [...webhook.headers, { key: "", value: "" }],
    });
  };

  const updateHeader = (index: number, field: "key" | "value", val: string) => {
    const newHeaders = [...webhook.headers];
    newHeaders[index] = { ...newHeaders[index], [field]: val };
    onUpdate({ headers: newHeaders });
  };

  const removeHeader = (index: number) => {
    onUpdate({
      headers: webhook.headers.filter((_, i) => i !== index),
    });
  };

  const testWebhook = async () => {
    if (!webhook.url) {
      toast.error("Insira a URL do webhook primeiro");
      return;
    }
    setTestStatus("loading");
    setTimeout(() => {
      if (webhook.url.startsWith("http")) {
        setTestStatus("success");
        toast.success("Webhook testado com sucesso!");
      } else {
        setTestStatus("error");
        toast.error("URL inválida. Use http:// ou https://");
      }
      setTimeout(() => setTestStatus("idle"), 3000);
    }, 1500);
  };

  const samplePayload = JSON.stringify(
    {
      event: "form.completed",
      form_id: "form_abc123",
      form_title: formTitle || "Pesquisa de Satisfação",
      submitted_at: new Date().toISOString(),
      responses: [
        { question: "Qual seu nome?", type: "name", answer: "João Silva" },
        { question: "Qual seu e-mail?", type: "email", answer: "joao@email.com" },
        { question: "Como avalia nosso serviço?", type: "rating", answer: 5 },
      ],
    },
    null,
    2
  );

  const copyPayload = () => {
    navigator.clipboard.writeText(samplePayload);
    setCopied(true);
    toast.success("Payload copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const activeIntegrationsCount = [
    webhook.enabled,
    integrations.rdStation?.enabled,
    integrations.email?.enabled,
    integrations.googleSheets?.enabled,
    integrations.crmManus?.enabled,
  ].filter(Boolean).length;

  const activeTrackingCount = [
    tracking.gtm?.enabled,
    tracking.googleAnalytics?.enabled,
    tracking.facebookPixel?.enabled,
    tracking.tiktokPixel?.enabled,
  ].filter(Boolean).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-card">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
        {/* Header */}
        <div className="mb-2">
          <h3 className="text-lg font-display font-bold text-foreground">
            Integrações
          </h3>
          <p className="text-sm text-muted-foreground">
            Conecte as respostas do formulário a serviços externos.
            {activeIntegrationsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-lighter text-brand">
                {activeIntegrationsCount} ativa{activeIntegrationsCount > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {/* ─── Webhook Section ─── */}
        <IntegrationCard
          title="Webhook"
          description="Envie dados para qualquer URL"
          icon={<Webhook size={20} className="text-brand" />}
          iconBg="bg-brand-lighter"
          enabled={webhook.enabled}
          onToggle={() => onUpdate({ enabled: !webhook.enabled })}
          expanded={expandedSection === "webhook"}
          onToggleExpand={() => toggleSection("webhook")}
        >
          {!webhook.enabled ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
                Ative o webhook para enviar os dados das respostas automaticamente para uma URL externa.
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-muted-foreground">Compatível com:</span>
                {[
                  { name: "n8n", color: "#EA4B71" },
                  { name: "Make", color: "#6D3BF5" },
                  { name: "Zapier", color: "#FF4A00" },
                  { name: "Webhook.site", color: "#3B82F6" },
                ].map((s) => (
                  <span key={s.name} className="px-2 py-0.5 rounded-md text-xs font-semibold text-white" style={{ backgroundColor: s.color }}>{s.name}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* URL */}
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">URL do Webhook</label>
                <input
                  type="text"
                  value={webhook.url ?? ""}
                  onChange={(e) => onUpdate({ url: e.target.value })}
                  placeholder="https://seu-servidor.com/webhook"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40 transition-all font-mono"
                />
              </div>

              {/* Method */}
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Método HTTP</label>
                <div className="flex gap-2">
                  {(["POST", "PUT"] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => onUpdate({ method })}
                      className={`px-5 py-2.5 rounded-xl text-sm font-mono font-semibold transition-all border ${
                        webhook.method === method
                          ? "border-brand bg-brand-lighter text-brand"
                          : "border-border bg-secondary text-muted-foreground hover:border-brand/30"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Headers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-body font-semibold text-foreground">Headers personalizados</label>
                  <button onClick={addHeader} className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-dark transition-colors font-medium">
                    <Plus size={16} /> Adicionar
                  </button>
                </div>
                {webhook.headers.length === 0 && (
                  <p className="text-sm text-muted-foreground italic bg-secondary rounded-xl p-3 border border-border">Nenhum header personalizado</p>
                )}
                <div className="space-y-2">
                  {webhook.headers.map((header, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" value={header.key} onChange={(e) => updateHeader(i, "key", e.target.value)} placeholder="Header-Name" className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono bg-secondary border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40" />
                      <input type="text" value={header.value} onChange={(e) => updateHeader(i, "value", e.target.value)} placeholder="valor" className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono bg-secondary border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40" />
                      <button onClick={() => removeHeader(i)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Triggers */}
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-3 block">Quando enviar</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:border-brand/30 transition-all bg-secondary/50">
                    <input type="checkbox" checked={webhook.sendOnComplete} onChange={(e) => onUpdate({ sendOnComplete: e.target.checked })} className="w-4 h-4 rounded accent-brand" />
                    <div>
                      <span className="text-sm font-body font-semibold text-foreground block">Ao completar o formulário</span>
                      <span className="text-xs text-muted-foreground">Envia quando o usuário finaliza todas as perguntas</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:border-brand/30 transition-all bg-secondary/50">
                    <input type="checkbox" checked={webhook.sendOnPartial} onChange={(e) => onUpdate({ sendOnPartial: e.target.checked })} className="w-4 h-4 rounded accent-brand" />
                    <div>
                      <span className="text-sm font-body font-semibold text-foreground block">Respostas parciais</span>
                      <span className="text-xs text-muted-foreground">Envia a cada pergunta respondida (tempo real)</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Test button */}
              <button
                onClick={testWebhook}
                disabled={testStatus === "loading"}
                className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-body font-semibold text-white transition-all disabled:opacity-50 ${
                  testStatus === "success" ? "bg-emerald-500" : testStatus === "error" ? "bg-red-500" : "bg-brand hover:bg-brand-dark"
                }`}
              >
                {testStatus === "loading" && (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Testando...</>)}
                {testStatus === "success" && (<><CheckCircle size={16} /> Sucesso!</>)}
                {testStatus === "error" && (<><AlertCircle size={16} /> Erro</>)}
                {testStatus === "idle" && (<><Send size={16} /> Testar webhook</>)}
              </button>

              {/* Quick setup guides */}
              <div className="space-y-2">
                <label className="text-sm font-body font-semibold text-foreground">Guias rápidos</label>
                {[
                  { name: "n8n", desc: "Crie um Webhook node e cole a URL", color: "#EA4B71", url: "https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" },
                  { name: "Make", desc: "Crie um cenário com trigger Webhook", color: "#6D3BF5", url: "https://www.make.com/en/help/tools/webhooks" },
                  { name: "Zapier", desc: "Use o trigger Webhooks by Zapier", color: "#FF4A00", url: "https://zapier.com/apps/webhook/integrations" },
                ].map((g) => (
                  <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-brand/30 hover:bg-secondary/30 transition-all group">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: g.color }}>{g.name[0]}</span>
                    <div className="flex-1"><span className="text-sm font-semibold text-foreground block">{g.name}</span><span className="text-xs text-muted-foreground">{g.desc}</span></div>
                  </a>
                ))}
              </div>

              {/* Sample payload */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-body font-semibold text-foreground">Exemplo de payload</label>
                  <button onClick={copyPayload} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <pre className="p-4 rounded-xl text-sm font-mono overflow-x-auto custom-scrollbar bg-slate-900 border border-slate-700 leading-relaxed">
                  <code className="text-emerald-400">{samplePayload}</code>
                </pre>
              </div>
            </div>
          )}
        </IntegrationCard>

        {/* ─── Google Sheets Section ─── */}
        <GoogleSheetsSection
          integrations={integrations}
          updateIntegration={updateIntegration}
          expandedSection={expandedSection}
          toggleSection={toggleSection}
        />

        {/* ─── CRM Manus Section ─── */}
        <IntegrationCard
          title="CRM"
          description="Envie leads para seu CRM"
          icon={<Building2 size={20} className="text-[#6366F1]" />}
          iconBg="bg-indigo-50"
          enabled={integrations.crmManus?.enabled ?? false}
          onToggle={() => updateIntegration("crmManus", { enabled: !integrations.crmManus?.enabled })}
          expanded={expandedSection === "crmmanus"}
          onToggleExpand={() => toggleSection("crmmanus")}
        >
          {!integrations.crmManus?.enabled ? (
            <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
              Ative para enviar automaticamente os leads do formulário para o seu CRM via webhook. Os dados serão enviados no formato padrão de lead com nome, email, telefone e respostas.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">URL do Webhook do CRM</label>
                <input
                  type="text"
                  value={integrations.crmManus?.webhookUrl ?? ""}
                  onChange={(e) => updateIntegration("crmManus", { webhookUrl: e.target.value })}
                  placeholder="https://seu-crm.manus.space/api/webhooks/leads"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]/40 transition-all font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  URL do endpoint de webhook do seu CRM para receber leads
                </p>
              </div>
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Nome do Funil</label>
                <input
                  type="text"
                  value={integrations.crmManus?.funnelName ?? ""}
                  onChange={(e) => updateIntegration("crmManus", { funnelName: e.target.value })}
                  placeholder="ex: Captação Site"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]/40 transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Em qual funil do CRM o lead será criado (se vazio, usa o nome do formulário)
                </p>
              </div>
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Etapa inicial</label>
                <input
                  type="text"
                  value={integrations.crmManus?.stageName ?? ""}
                  onChange={(e) => updateIntegration("crmManus", { stageName: e.target.value })}
                  placeholder="ex: Novo"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]/40 transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Em qual etapa do funil o lead será inserido (padrão: "Novo")
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Building2 size={16} />
                <span>Os campos nome, email e telefone serão extraídos automaticamente das respostas.</span>
              </div>
            </div>
          )}
        </IntegrationCard>

        {/* ─── RD Station Section ─── */}
        <IntegrationCard
          title="RD Station"
          description="Envie leads para o RD Station Marketing"
          icon={<BarChart3 size={20} className="text-[#00A650]" />}
          iconBg="bg-green-50"
          enabled={integrations.rdStation?.enabled ?? false}
          onToggle={() => updateIntegration("rdStation", { enabled: !integrations.rdStation?.enabled })}
          expanded={expandedSection === "rdstation"}
          onToggleExpand={() => toggleSection("rdstation")}
        >
          {!integrations.rdStation?.enabled ? (
            <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
              Ative para enviar automaticamente as respostas como conversões no RD Station Marketing. Você precisará de um token de API do RD Station.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Token de API</label>
                <input
                  type="password"
                  value={integrations.rdStation?.apiToken ?? ""}
                  onChange={(e) => updateIntegration("rdStation", { apiToken: e.target.value })}
                  placeholder="Seu token de API do RD Station"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#00A650]/20 focus:border-[#00A650]/40 transition-all font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Encontre em RD Station &rarr; Configurações &rarr; Integrações &rarr; Tokens de API
                </p>
              </div>
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Identificador de conversão</label>
                <input
                  type="text"
                  value={integrations.rdStation?.conversionIdentifier ?? ""}
                  onChange={(e) => updateIntegration("rdStation", { conversionIdentifier: e.target.value })}
                  placeholder="ex: formulario-contato-site"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#00A650]/20 focus:border-[#00A650]/40 transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Nome que identifica esta conversão no RD Station (aparece nos relatórios)
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200">
                <CheckCircle size={16} />
                <span>Os campos nome e email serão mapeados automaticamente para o RD Station.</span>
              </div>
            </div>
          )}
        </IntegrationCard>

        {/* ─── Email Section ─── */}
        <IntegrationCard
          title="Email"
          description="Receba respostas por email"
          icon={<Mail size={20} className="text-[#EA4335]" />}
          iconBg="bg-red-50"
          enabled={integrations.email?.enabled ?? false}
          onToggle={() => updateIntegration("email", { enabled: !integrations.email?.enabled })}
          expanded={expandedSection === "email"}
          onToggleExpand={() => toggleSection("email")}
        >
          {!integrations.email?.enabled ? (
            <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
              Ative para receber um email com o resumo das respostas sempre que alguém preencher o formulário.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Destinatários</label>
                <input
                  type="text"
                  value={integrations.email?.recipients ?? ""}
                  onChange={(e) => updateIntegration("email", { recipients: e.target.value })}
                  placeholder="email@exemplo.com, outro@exemplo.com"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#EA4335]/20 focus:border-[#EA4335]/40 transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Separe múltiplos emails com vírgula
                </p>
              </div>
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Assunto do email</label>
                <input
                  type="text"
                  value={integrations.email?.subject ?? ""}
                  onChange={(e) => updateIntegration("email", { subject: e.target.value })}
                  placeholder="Nova resposta no formulário"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#EA4335]/20 focus:border-[#EA4335]/40 transition-all"
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
                <Mail size={16} />
                <span>O email incluirá todas as respostas formatadas em uma tabela HTML.</span>
              </div>
            </div>
          )}
        </IntegrationCard>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ─── MÉTRICAS E CONVERSÕES ─── */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <div className="pt-4 border-t border-border">
          <div className="mb-4">
            <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
              <Activity size={20} className="text-muted-foreground" />
              Métricas e conversões
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Os eventos sempre são enviados para essas integrações, indiferente se forem completas ou incompletas.
              {activeTrackingCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-lighter text-brand">
                  {activeTrackingCount} ativa{activeTrackingCount > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          {/* ─── Google Tag Manager ─── */}
          <div className="space-y-4">
            <IntegrationCard
              title="Google Tag Manager"
              description="Adicione o ID do seu container do GTM"
              icon={<Tag size={20} className="text-[#4285F4]" />}
              iconBg="bg-blue-50"
              enabled={tracking.gtm?.enabled ?? false}
              onToggle={() => updateTracking("gtm", { enabled: !tracking.gtm?.enabled })}
              expanded={expandedSection === "gtm"}
              onToggleExpand={() => toggleSection("gtm")}
              badge="EMPRESA"
              badgeColor="bg-gray-100 text-gray-600"
            >
              {!tracking.gtm?.enabled ? (
                <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
                  Ative para injetar o Google Tag Manager no formulário. Eventos de início e conclusão serão disparados automaticamente.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-2 block">Container ID</label>
                    <input
                      type="text"
                      value={tracking.gtm?.containerId ?? ""}
                      onChange={(e) => updateTracking("gtm", { containerId: e.target.value })}
                      placeholder="GTM-XXXXXXX"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#4285F4]/20 focus:border-[#4285F4]/40 transition-all font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Encontre em tagmanager.google.com &rarr; Administrador &rarr; ID do container
                    </p>
                  </div>
                </div>
              )}
            </IntegrationCard>

            {/* ─── Google Analytics ─── */}
            <IntegrationCard
              title="Google Analytics"
              description="Adicione o ID de Métrica do Google Analytics"
              icon={<BarChart3 size={20} className="text-[#E37400]" />}
              iconBg="bg-orange-50"
              enabled={tracking.googleAnalytics?.enabled ?? false}
              onToggle={() => updateTracking("googleAnalytics", { enabled: !tracking.googleAnalytics?.enabled })}
              expanded={expandedSection === "ga"}
              onToggleExpand={() => toggleSection("ga")}
              badge="PRO"
              badgeColor="bg-purple-100 text-purple-600"
            >
              {!tracking.googleAnalytics?.enabled ? (
                <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
                  Ative para rastrear visualizações e eventos do formulário no Google Analytics 4.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-2 block">Measurement ID</label>
                    <input
                      type="text"
                      value={tracking.googleAnalytics?.measurementId ?? ""}
                      onChange={(e) => updateTracking("googleAnalytics", { measurementId: e.target.value })}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#E37400]/20 focus:border-[#E37400]/40 transition-all font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Encontre em analytics.google.com &rarr; Administrador &rarr; Fluxos de dados &rarr; ID da métrica
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-orange-50 text-orange-700 border border-orange-200">
                    <Eye size={16} />
                    <span>Eventos disparados: <code className="font-mono text-xs bg-orange-100 px-1 rounded">form_start</code>, <code className="font-mono text-xs bg-orange-100 px-1 rounded">form_step</code>, <code className="font-mono text-xs bg-orange-100 px-1 rounded">form_complete</code></span>
                  </div>
                </div>
              )}
            </IntegrationCard>

            {/* ─── Facebook Pixel ─── */}
            <IntegrationCard
              title="Facebook"
              description="Adicione o ID do seu pixel no Facebook"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>}
              iconBg="bg-blue-50"
              enabled={tracking.facebookPixel?.enabled ?? false}
              onToggle={() => updateTracking("facebookPixel", { enabled: !tracking.facebookPixel?.enabled })}
              expanded={expandedSection === "fbpixel"}
              onToggleExpand={() => toggleSection("fbpixel")}
              badge="PRO"
              badgeColor="bg-purple-100 text-purple-600"
            >
              {!tracking.facebookPixel?.enabled ? (
                <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
                  Ative para rastrear conversões do formulário no Facebook/Meta Ads. O pixel será carregado automaticamente.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-2 block">Pixel ID</label>
                    <input
                      type="text"
                      value={tracking.facebookPixel?.pixelId ?? ""}
                      onChange={(e) => updateTracking("facebookPixel", { pixelId: e.target.value })}
                      placeholder="123456789012345"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Encontre em business.facebook.com &rarr; Gerenciador de Eventos &rarr; Fontes de dados
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    <Eye size={16} />
                    <span>Eventos disparados: <code className="font-mono text-xs bg-blue-100 px-1 rounded">PageView</code>, <code className="font-mono text-xs bg-blue-100 px-1 rounded">Lead</code>, <code className="font-mono text-xs bg-blue-100 px-1 rounded">CompleteRegistration</code></span>
                  </div>
                </div>
              )}
            </IntegrationCard>

            {/* ─── TikTok Pixel ─── */}
            <IntegrationCard
              title="TikTok"
              description="Adicione seu TikTok Events Manager ID"
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="#000000"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.78a8.18 8.18 0 004.76 1.52V6.85a4.84 4.84 0 01-1-.16z"/></svg>}
              iconBg="bg-gray-100"
              enabled={tracking.tiktokPixel?.enabled ?? false}
              onToggle={() => updateTracking("tiktokPixel", { enabled: !tracking.tiktokPixel?.enabled })}
              expanded={expandedSection === "tiktok"}
              onToggleExpand={() => toggleSection("tiktok")}
              badge="PRO"
              badgeColor="bg-purple-100 text-purple-600"
              badgeExtra="NOVO"
              badgeExtraColor="bg-green-100 text-green-600"
            >
              {!tracking.tiktokPixel?.enabled ? (
                <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
                  Ative para rastrear conversões do formulário no TikTok Ads. O pixel será carregado automaticamente.
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-body font-semibold text-foreground mb-2 block">Events Manager ID</label>
                    <input
                      type="text"
                      value={tracking.tiktokPixel?.pixelId ?? ""}
                      onChange={(e) => updateTracking("tiktokPixel", { pixelId: e.target.value })}
                      placeholder="CXXXXXXXXXXXXXXXXX"
                      className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/40 transition-all font-mono"
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Encontre em ads.tiktok.com &rarr; Ativos &rarr; Eventos &rarr; Gerenciamento de eventos web
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-gray-100 text-gray-700 border border-gray-200">
                    <Eye size={16} />
                    <span>Eventos disparados: <code className="font-mono text-xs bg-gray-200 px-1 rounded">ViewContent</code>, <code className="font-mono text-xs bg-gray-200 px-1 rounded">SubmitForm</code>, <code className="font-mono text-xs bg-gray-200 px-1 rounded">CompleteRegistration</code></span>
                  </div>
                </div>
              )}
            </IntegrationCard>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Google Sheets Section Component ─── */

function GoogleSheetsSection({
  integrations,
  updateIntegration,
  expandedSection,
  toggleSection,
}: {
  integrations: NonNullable<WebhookSettings["integrations"]>;
  updateIntegration: (key: string, value: any) => void;
  expandedSection: IntegrationSection | null;
  toggleSection: (section: IntegrationSection) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [uploadingKey, setUploadingKey] = useState(false);

  const testMutation = trpc.integrations.testGoogleSheets.useMutation();

  const gs = integrations.googleSheets ?? {
    enabled: false,
    spreadsheetUrl: "",
    sheetName: "Respostas",
    serviceAccountJson: "",
    serviceAccountEmail: "",
    connectionStatus: "untested" as const,
    connectionError: "",
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Selecione um arquivo JSON de conta de servi\u00e7o do Google.");
      return;
    }

    setUploadingKey(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.client_email || !json.private_key || json.type !== "service_account") {
          toast.error("Arquivo inv\u00e1lido. Certifique-se de que \u00e9 uma chave de conta de servi\u00e7o do Google (Service Account).");
          setUploadingKey(false);
          return;
        }

        updateIntegration("googleSheets", {
          serviceAccountJson: ev.target?.result as string,
          serviceAccountEmail: json.client_email,
          connectionStatus: "untested",
          connectionError: "",
        });

        toast.success(`Chave carregada: ${json.client_email}`);
      } catch {
        toast.error("Erro ao ler o arquivo JSON. Verifique se o arquivo est\u00e1 correto.");
      }
      setUploadingKey(false);
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo.");
      setUploadingKey(false);
    };
    reader.readAsText(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleTestConnection = async () => {
    if (!gs.spreadsheetUrl || !gs.serviceAccountJson) {
      toast.error("Configure a URL da planilha e a chave de conta de servi\u00e7o primeiro.");
      return;
    }

    setTestingConnection(true);
    try {
      const result = await testMutation.mutateAsync({
        spreadsheetUrl: gs.spreadsheetUrl,
        sheetName: gs.sheetName || "Respostas",
        serviceAccountJson: gs.serviceAccountJson,
      });

      if (result.success) {
        updateIntegration("googleSheets", {
          connectionStatus: "connected",
          connectionError: "",
          serviceAccountEmail: result.serviceAccountEmail || gs.serviceAccountEmail,
        });
        toast.success(`Conex\u00e3o OK! Planilha: ${result.sheetTitle}`);
      } else {
        updateIntegration("googleSheets", {
          connectionStatus: "error",
          connectionError: result.error || "Erro desconhecido",
        });
        toast.error(result.error || "Falha ao conectar");
      }
    } catch (err: any) {
      updateIntegration("googleSheets", {
        connectionStatus: "error",
        connectionError: err?.message || "Erro de conex\u00e3o",
      });
      toast.error("Erro ao testar conex\u00e3o");
    }
    setTestingConnection(false);
  };

  const handleRemoveKey = () => {
    updateIntegration("googleSheets", {
      serviceAccountJson: "",
      serviceAccountEmail: "",
      connectionStatus: "untested",
      connectionError: "",
    });
    toast.info("Chave de conta de servi\u00e7o removida.");
  };

  return (
    <IntegrationCard
      title="Google Sheets"
      description="Envie respostas para uma planilha"
      icon={<Table2 size={20} className="text-[#0F9D58]" />}
      iconBg="bg-green-50"
      enabled={gs.enabled}
      onToggle={() => updateIntegration("googleSheets", { enabled: !gs.enabled })}
      expanded={expandedSection === "googlesheets"}
      onToggleExpand={() => toggleSection("googlesheets")}
    >
      {!gs.enabled ? (
        <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
          Ative para enviar automaticamente cada resposta como uma nova linha na sua planilha do Google Sheets.
        </p>
      ) : (
        <div className="space-y-4">
          {/* URL da Planilha */}
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">URL da Planilha</label>
            <input
              type="text"
              value={gs.spreadsheetUrl ?? ""}
              onChange={(e) => updateIntegration("googleSheets", { spreadsheetUrl: e.target.value, connectionStatus: "untested" })}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0F9D58]/20 focus:border-[#0F9D58]/40 transition-all font-mono"
            />
          </div>

          {/* Nome da Aba */}
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">Nome da aba</label>
            <input
              type="text"
              value={gs.sheetName ?? "Respostas"}
              onChange={(e) => updateIntegration("googleSheets", { sheetName: e.target.value })}
              placeholder="Respostas"
              className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0F9D58]/20 focus:border-[#0F9D58]/40 transition-all"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Nome da aba na planilha (padr\u00e3o: \"Respostas\")
            </p>
          </div>

          {/* Service Account Key Upload */}
          <div>
            <label className="text-sm font-body font-semibold text-foreground mb-2 block">
              <div className="flex items-center gap-2">
                <FileKey size={14} />
                Conta de Servi\u00e7o (Service Account)
              </div>
            </label>

            {gs.serviceAccountEmail ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-green-50 border border-green-200">
                  <Shield size={16} className="text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-green-700 font-medium text-xs truncate">{gs.serviceAccountEmail}</p>
                    <p className="text-green-600/70 text-[11px]">Chave configurada</p>
                  </div>
                  <button
                    onClick={handleRemoveKey}
                    className="p-1 rounded-lg hover:bg-green-100 text-green-600 transition-colors shrink-0"
                    title="Remover chave"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingKey}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-secondary border-2 border-dashed border-border hover:border-[#0F9D58]/40 hover:bg-green-50/50 text-muted-foreground hover:text-[#0F9D58] transition-all"
                >
                  {uploadingKey ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploadingKey ? "Carregando..." : "Enviar arquivo JSON da Service Account"}
                </button>
                <p className="text-xs text-muted-foreground">
                  Fa\u00e7a o download da chave JSON no <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer" className="text-[#0F9D58] underline">Google Cloud Console</a>.
                  Depois, compartilhe a planilha com o email da conta de servi\u00e7o.
                </p>
              </div>
            )}
          </div>

          {/* Connection Status & Test Button */}
          {gs.serviceAccountJson && gs.spreadsheetUrl && (
            <div className="space-y-2">
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#0F9D58] text-white hover:bg-[#0B8A4B] disabled:opacity-50 transition-all"
              >
                {testingConnection ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                {testingConnection ? "Testando conex\u00e3o..." : "Testar conex\u00e3o"}
              </button>

              {gs.connectionStatus === "connected" && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle size={16} />
                  <span>Conex\u00e3o verificada com sucesso</span>
                </div>
              )}

              {gs.connectionStatus === "error" && gs.connectionError && (
                <div className="flex items-start gap-2 px-4 py-2.5 rounded-xl text-sm bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{gs.connectionError}</span>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200">
            <Table2 size={16} className="shrink-0" />
            <span>Cada resposta ser\u00e1 adicionada como uma nova linha com: Data, Protocolo, Nome, Email e todas as respostas.</span>
          </div>
        </div>
      )}
    </IntegrationCard>
  );
}

/* ─── Integration Card Component ─── */

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  enabled: boolean;
  onToggle: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  badgeExtra?: string;
  badgeExtraColor?: string;
}

function IntegrationCard({
  title, description, icon, iconBg,
  enabled, onToggle, expanded, onToggleExpand, children,
  badge, badgeColor, badgeExtra, badgeExtraColor,
}: IntegrationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border transition-all ${
        enabled ? "border-brand/30 bg-card shadow-sm" : "border-border bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-display font-bold text-foreground">{title}</h4>
              {badge && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${badgeColor || "bg-gray-100 text-gray-600"}`}>{badge}</span>
              )}
              {badgeExtra && (
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${badgeExtraColor || "bg-green-100 text-green-600"}`}>{badgeExtra}</span>
              )}
              {enabled && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-green-100 text-green-700">ATIVO</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {expanded ? <ChevronDown size={16} className="text-muted-foreground" /> : <ChevronRight size={16} className="text-muted-foreground" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`relative w-11 h-6 rounded-full transition-all ml-3 shrink-0 ${
            enabled ? "bg-brand" : "bg-border"
          }`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
            enabled ? "left-5" : "left-0.5"
          }`} />
        </button>
      </div>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
