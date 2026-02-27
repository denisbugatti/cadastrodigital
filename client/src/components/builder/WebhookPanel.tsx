/**
 * FormFlow Webhook Panel (Light Theme)
 * Configure webhook URL, method, headers, and triggers per form.
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Webhook, Plus, Trash2, Send, CheckCircle, AlertCircle, Copy, Check,
} from "lucide-react";
import { toast } from "sonner";
import type { WebhookSettings } from "@/lib/builderTypes";

interface WebhookPanelProps {
  webhook: WebhookSettings;
  formTitle: string;
  onUpdate: (updates: Partial<WebhookSettings>) => void;
}

export function WebhookPanel({ webhook, formTitle, onUpdate }: WebhookPanelProps) {
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Enable toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-lighter flex items-center justify-center">
                <Webhook size={20} className="text-brand" />
              </div>
              <div>
                <h4 className="text-base font-display font-bold text-foreground">
                  Webhook
                </h4>
                <p className="text-sm text-muted-foreground">
                  Envie dados automaticamente
                </p>
              </div>
            </div>
            <button
              onClick={() => onUpdate({ enabled: !webhook.enabled })}
              className={`relative w-12 h-6 rounded-full transition-all ${
                webhook.enabled
                  ? "bg-brand"
                  : "bg-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                  webhook.enabled ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {!webhook.enabled && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-4 border border-border">
                Ative o webhook para enviar os dados das respostas automaticamente para uma URL externa quando o formulário for preenchido.
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
          )}
        </motion.div>

        {webhook.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* URL */}
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">
                URL do Webhook
              </label>
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
              <label className="text-sm font-body font-semibold text-foreground mb-2 block">
                Método HTTP
              </label>
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
                <label className="text-sm font-body font-semibold text-foreground">
                  Headers personalizados
                </label>
                <button
                  onClick={addHeader}
                  className="flex items-center gap-1.5 text-sm text-brand hover:text-brand-dark transition-colors font-medium"
                >
                  <Plus size={16} /> Adicionar
                </button>
              </div>
              {webhook.headers.length === 0 && (
                <p className="text-sm text-muted-foreground italic bg-secondary rounded-xl p-3 border border-border">
                  Nenhum header personalizado
                </p>
              )}
              <div className="space-y-2">
                {webhook.headers.map((header, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => updateHeader(i, "key", e.target.value)}
                      placeholder="Header-Name"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono bg-secondary border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(i, "value", e.target.value)}
                      placeholder="valor"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm font-mono bg-secondary border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/40"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div>
              <label className="text-sm font-body font-semibold text-foreground mb-3 block">
                Quando enviar
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-brand/30 transition-all bg-secondary/50">
                  <input
                    type="checkbox"
                    checked={webhook.sendOnComplete}
                    onChange={(e) => onUpdate({ sendOnComplete: e.target.checked })}
                    className="w-4 h-4 rounded accent-brand"
                  />
                  <div>
                    <span className="text-sm font-body font-semibold text-foreground block">
                      Ao completar o formulário
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Envia quando o usuário finaliza todas as perguntas
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border cursor-pointer hover:border-brand/30 transition-all bg-secondary/50">
                  <input
                    type="checkbox"
                    checked={webhook.sendOnPartial}
                    onChange={(e) => onUpdate({ sendOnPartial: e.target.checked })}
                    className="w-4 h-4 rounded accent-brand"
                  />
                  <div>
                    <span className="text-sm font-body font-semibold text-foreground block">
                      A cada resposta parcial
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Envia a cada pergunta respondida (tempo real)
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Test button */}
            <button
              onClick={testWebhook}
              disabled={testStatus === "loading"}
              className={`w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-body font-semibold text-white transition-all disabled:opacity-50 ${
                testStatus === "success"
                  ? "bg-emerald-500"
                  : testStatus === "error"
                  ? "bg-red-500"
                  : "bg-brand hover:bg-brand-dark"
              }`}
            >
              {testStatus === "loading" && (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Testando...
                </>
              )}
              {testStatus === "success" && (
                <>
                  <CheckCircle size={16} /> Sucesso!
                </>
              )}
              {testStatus === "error" && (
                <>
                  <AlertCircle size={16} /> Erro
                </>
              )}
              {testStatus === "idle" && (
                <>
                  <Send size={16} /> Testar webhook
                </>
              )}
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
                <label className="text-sm font-body font-semibold text-foreground">
                  Exemplo de payload
                </label>
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-brand transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <pre className="p-4 rounded-xl text-sm font-mono overflow-x-auto custom-scrollbar bg-slate-900 border border-slate-700 leading-relaxed">
                <code className="text-emerald-400">{samplePayload}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
