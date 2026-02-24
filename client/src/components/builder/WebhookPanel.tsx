/**
 * FormFlow Webhook Panel
 * Design: Dark futuristic with glassmorphism.
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
  onUpdate: (updates: Partial<WebhookSettings>) => void;
}

export function WebhookPanel({ webhook, onUpdate }: WebhookPanelProps) {
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

    // Simulate test
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
      form_title: "Pesquisa de Satisfação",
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
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {/* Enable toggle */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Webhook size={16} className="text-neon-blue" />
              <h4 className="text-xs font-body font-semibold text-foreground">
                Webhook
              </h4>
            </div>
            <button
              onClick={() => onUpdate({ enabled: !webhook.enabled })}
              className={`relative w-10 h-5 rounded-full transition-all ${
                webhook.enabled
                  ? "bg-neon-blue shadow-[0_0_10px_oklch(0.65_0.2_250_/_0.4)]"
                  : "bg-glass-border"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                  webhook.enabled ? "left-5.5" : "left-0.5"
                }`}
              />
            </button>
          </div>

          {!webhook.enabled && (
            <p className="text-[10px] text-muted-foreground/60">
              Ative o webhook para enviar os dados das respostas automaticamente para uma URL externa quando o formulário for preenchido.
            </p>
          )}
        </motion.div>

        {webhook.enabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* URL */}
            <div>
              <label className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                URL do Webhook
              </label>
              <input
                type="text"
                value={webhook.url}
                onChange={(e) => onUpdate({ url: e.target.value })}
                placeholder="https://seu-servidor.com/webhook"
                className="w-full px-3 py-2.5 rounded-lg text-xs bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-neon-blue/40 transition-colors font-mono"
              />
            </div>

            {/* Method */}
            <div>
              <label className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Método HTTP
              </label>
              <div className="flex gap-2">
                {(["POST", "PUT"] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => onUpdate({ method })}
                    className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all border ${
                      webhook.method === method
                        ? "border-neon-blue/40 text-neon-blue"
                        : "border-glass-border text-muted-foreground hover:border-glass-hover"
                    }`}
                    style={{
                      background:
                        webhook.method === method
                          ? "oklch(0.18 0.03 250 / 0.3)"
                          : "oklch(0.14 0.015 260)",
                    }}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Headers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
                  Headers personalizados
                </label>
                <button
                  onClick={addHeader}
                  className="flex items-center gap-1 text-[10px] text-neon-blue hover:text-neon-cyan transition-colors"
                >
                  <Plus size={11} /> Adicionar
                </button>
              </div>
              {webhook.headers.length === 0 && (
                <p className="text-[10px] text-muted-foreground/40 italic">
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
                      className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-mono bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-neon-blue/40"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => updateHeader(i, "value", e.target.value)}
                      placeholder="valor"
                      className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-mono bg-transparent border border-glass-border text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-neon-blue/40"
                    />
                    <button
                      onClick={() => removeHeader(i)}
                      className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div>
              <label className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Quando enviar
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-glass-border cursor-pointer hover:border-glass-hover transition-all" style={{ background: "oklch(0.14 0.015 260)" }}>
                  <input
                    type="checkbox"
                    checked={webhook.sendOnComplete}
                    onChange={(e) => onUpdate({ sendOnComplete: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-neon-blue"
                  />
                  <div>
                    <span className="text-[10px] font-body font-semibold text-foreground block">
                      Ao completar o formulário
                    </span>
                    <span className="text-[9px] text-muted-foreground/50">
                      Envia quando o usuário finaliza todas as perguntas
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-2.5 rounded-lg border border-glass-border cursor-pointer hover:border-glass-hover transition-all" style={{ background: "oklch(0.14 0.015 260)" }}>
                  <input
                    type="checkbox"
                    checked={webhook.sendOnPartial}
                    onChange={(e) => onUpdate({ sendOnPartial: e.target.checked })}
                    className="w-3.5 h-3.5 rounded accent-neon-blue"
                  />
                  <div>
                    <span className="text-[10px] font-body font-semibold text-foreground block">
                      A cada resposta parcial
                    </span>
                    <span className="text-[9px] text-muted-foreground/50">
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-body font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{
                background:
                  testStatus === "success"
                    ? "oklch(0.55 0.2 150)"
                    : testStatus === "error"
                    ? "oklch(0.55 0.2 25)"
                    : "linear-gradient(135deg, oklch(0.65 0.2 250), oklch(0.55 0.25 270))",
                boxShadow:
                  testStatus === "success"
                    ? "0 0 15px oklch(0.55 0.2 150 / 0.3)"
                    : testStatus === "error"
                    ? "0 0 15px oklch(0.55 0.2 25 / 0.3)"
                    : "0 0 15px oklch(0.65 0.2 250 / 0.3)",
              }}
            >
              {testStatus === "loading" && (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Testando...
                </>
              )}
              {testStatus === "success" && (
                <>
                  <CheckCircle size={13} /> Sucesso!
                </>
              )}
              {testStatus === "error" && (
                <>
                  <AlertCircle size={13} /> Erro
                </>
              )}
              {testStatus === "idle" && (
                <>
                  <Send size={13} /> Testar webhook
                </>
              )}
            </button>

            {/* Sample payload */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-body font-semibold text-muted-foreground uppercase tracking-wider">
                  Exemplo de payload
                </label>
                <button
                  onClick={copyPayload}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-neon-blue transition-colors"
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? "Copiado" : "Copiar"}
                </button>
              </div>
              <pre
                className="p-3 rounded-lg text-[9px] font-mono overflow-x-auto custom-scrollbar border border-glass-border leading-relaxed"
                style={{ background: "oklch(0.08 0.01 260)" }}
              >
                <code className="text-neon-cyan/70">{samplePayload}</code>
              </pre>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
