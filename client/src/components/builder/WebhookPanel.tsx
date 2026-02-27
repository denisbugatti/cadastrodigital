/**
 * FormFlow Webhook & Integrations Panel (Light Theme)
 * Configure webhook URL, method, headers, triggers, and integrations per form.
 * Integrations: RD Station, WhatsApp, Email
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook, Plus, Trash2, Send, CheckCircle, AlertCircle, Copy, Check,
  Mail, MessageCircle, BarChart3, ChevronDown, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { WebhookSettings } from "@/lib/builderTypes";

interface WebhookPanelProps {
  webhook: WebhookSettings;
  formTitle: string;
  onUpdate: (updates: Partial<WebhookSettings>) => void;
}

type IntegrationSection = "webhook" | "rdstation" | "whatsapp" | "email";

export function WebhookPanel({ webhook, formTitle, onUpdate }: WebhookPanelProps) {
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [expandedSection, setExpandedSection] = useState<IntegrationSection | null>("webhook");

  const integrations = webhook.integrations ?? {
    rdStation: { enabled: false, apiToken: "", conversionIdentifier: "" },
    whatsapp: { enabled: false, phoneNumber: "", message: "Nova resposta recebida no formulário!" },
    email: { enabled: false, recipients: "", subject: "Nova resposta no formulário" },
  };

  const updateIntegration = (key: string, value: any) => {
    onUpdate({
      integrations: {
        ...integrations,
        [key]: { ...(integrations as any)[key], ...value },
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
    integrations.whatsapp?.enabled,
    integrations.email?.enabled,
  ].filter(Boolean).length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
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
                      <span className="text-sm font-body font-semibold text-foreground block">A cada resposta parcial</span>
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
                  <a key={g.name} href={g.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border bg-white hover:border-brand/30 hover:bg-secondary/30 transition-all group">
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
                  Encontre em RD Station → Configurações → Integrações → Tokens de API
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

        {/* ─── WhatsApp Section ─── */}
        <IntegrationCard
          title="WhatsApp"
          description="Receba respostas via WhatsApp"
          icon={<MessageCircle size={20} className="text-[#25D366]" />}
          iconBg="bg-green-50"
          enabled={integrations.whatsapp?.enabled ?? false}
          onToggle={() => updateIntegration("whatsapp", { enabled: !integrations.whatsapp?.enabled })}
          expanded={expandedSection === "whatsapp"}
          onToggleExpand={() => toggleSection("whatsapp")}
        >
          {!integrations.whatsapp?.enabled ? (
            <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
              Ative para receber um resumo das respostas diretamente no seu WhatsApp quando alguém preencher o formulário.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Número do WhatsApp</label>
                <input
                  type="text"
                  value={integrations.whatsapp?.phoneNumber ?? ""}
                  onChange={(e) => updateIntegration("whatsapp", { phoneNumber: e.target.value })}
                  placeholder="+55 11 99999-9999"
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]/40 transition-all"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Número com código do país (ex: +5511999999999)
                </p>
              </div>
              <div>
                <label className="text-sm font-body font-semibold text-foreground mb-2 block">Mensagem personalizada</label>
                <textarea
                  value={integrations.whatsapp?.message ?? ""}
                  onChange={(e) => updateIntegration("whatsapp", { message: e.target.value })}
                  placeholder="Nova resposta recebida no formulário!"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-secondary border border-border text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 focus:border-[#25D366]/40 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Esta mensagem será enviada junto com o resumo das respostas
                </p>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-green-50 text-green-700 border border-green-200">
                <MessageCircle size={16} />
                <span>As respostas serão enviadas como mensagem formatada via API do WhatsApp.</span>
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
      </div>
    </div>
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
}

function IntegrationCard({
  title, description, icon, iconBg,
  enabled, onToggle, expanded, onToggleExpand, children,
}: IntegrationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border transition-all ${
        enabled ? "border-brand/30 bg-white shadow-sm" : "border-border bg-white"
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
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-display font-bold text-foreground">{title}</h4>
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
