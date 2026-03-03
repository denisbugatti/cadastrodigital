/**
 * Email Service — One Innovation Design System
 * All emails use the same premium dark design matching the One Innovation brand.
 * Font: Montserrat | Colors: Dark #0a0a0f bg, Blue #0D8BD9 accent, White text
 * Sender: one@cadastrodigital.com.br
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] RESEND_API_KEY not configured. Email sending disabled.");
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

/* ─── Design Constants ─── */
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/one-innovation-logo_b13de89b.jpg";
const FROM_EMAIL = "one@cadastrodigital.com.br";
const FROM_NAME = "One Innovation";
const BG_DARK = "#0a0a0f";
const BG_CARD = "#141420";
const BG_CARD_INNER = "#1a1a2e";
const BLUE = "#0D8BD9";
const BLUE_LIGHT = "#70BEFA";
const GREEN = "#16a34a";
const GREEN_BG = "#0a2618";
const AMBER = "#f59e0b";
const AMBER_BG = "#2a1f0a";
const TEXT_WHITE = "#f0f0f5";
const TEXT_MUTED = "#9ca3af";
const TEXT_DIM = "#6b7280";
const BORDER = "#2a2a3e";

/**
 * Base email wrapper with One Innovation dark premium design.
 * All emails share this same shell.
 */
function emailWrapper(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style>* { font-family: Arial, sans-serif !important; }</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG_DARK};font-family:'Montserrat','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_DARK};padding:40px 16px;">
    <tr>
      <td align="center">
        <!-- Logo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-bottom:24px;">
          <tr>
            <td align="center" style="padding:16px 0;">
              <img src="${LOGO_URL}" alt="One Innovation" width="120" height="auto" style="display:block;border:0;max-width:120px;height:auto;" />
            </td>
          </tr>
        </table>
        <!-- Main Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${BG_CARD};border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
          ${content}
        </table>
        <!-- Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-top:24px;">
          <tr>
            <td align="center" style="padding:16px 0;">
              <p style="margin:0 0 8px;color:${TEXT_DIM};font-size:11px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;letter-spacing:0.5px;">
                One Innovation — Empreendimentos Inovadores
              </p>
              <p style="margin:0;color:${TEXT_DIM};font-size:11px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                Este é um e-mail automático. Por favor, não responda.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Styled CTA button */
function ctaButton(text: string, url: string, color: string = BLUE): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 24px;">
        <a href="${url}" target="_blank" style="display:inline-block;background-color:${color};color:#ffffff;font-size:15px;font-weight:600;padding:14px 36px;border-radius:10px;text-decoration:none;font-family:'Montserrat','Segoe UI',Arial,sans-serif;letter-spacing:0.3px;mso-padding-alt:0;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
}

/** Styled info box */
function infoBox(label: string, value: string, borderColor: string = BLUE): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:0 0 24px;">
        <div style="display:inline-block;background-color:${BG_CARD_INNER};border:1px solid ${borderColor};border-radius:12px;padding:18px 36px;">
          <p style="margin:0 0 6px;color:${TEXT_MUTED};font-size:10px;text-transform:uppercase;letter-spacing:2.5px;font-weight:600;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
            ${label}
          </p>
          <p style="margin:0;color:${borderColor};font-size:26px;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace;">
            ${value}
          </p>
        </div>
      </td>
    </tr>
  </table>`;
}

/** Styled header bar */
function headerBar(title: string, color: string = BLUE): string {
  return `<tr>
    <td style="background:linear-gradient(135deg,${color},${color}dd);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:0.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
        ${title}
      </h1>
    </td>
  </tr>`;
}

/** Paragraph text */
function p(text: string, opts?: { size?: string; color?: string; weight?: string; margin?: string }): string {
  const { size = "15px", color = TEXT_MUTED, weight = "400", margin = "0 0 16px" } = opts || {};
  return `<p style="margin:${margin};color:${color};font-size:${size};line-height:1.7;font-weight:${weight};font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${text}</p>`;
}

/** Highlight box with gradient border */
function highlightBox(text: string, color: string = BLUE): string {
  const bgColor = color === GREEN ? GREEN_BG : color === AMBER ? AMBER_BG : BG_CARD_INNER;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 24px;">
        <div style="background:${bgColor};border:1px solid ${color}66;border-radius:12px;padding:20px 28px;text-align:center;">
          <p style="margin:0;color:${color};font-size:16px;font-weight:600;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
            ${text}
          </p>
        </div>
      </td>
    </tr>
  </table>`;
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 1: CONVITE PARA CORRETORES/GERENTES (Boas-vindas)
   ═══════════════════════════════════════════════════════════════ */

export interface InviteEmailParams {
  to: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  inviteeName?: string;
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, inviterName, role, inviteUrl, inviteeName } = params;

  const roleLabel: Record<string, string> = {
    diretor: "Diretor(a)",
    gerente: "Gerente",
    corretor: "Corretor(a)",
  };
  const roleDisplay = roleLabel[role] || role;
  const greeting = inviteeName ? `Olá, ${inviteeName}!` : "Olá!";

  const content = `
    ${headerBar("Bem-vindo(a) à One Innovation")}
    <tr>
      <td style="padding:32px;">
        ${p(greeting, { size: "18px", color: TEXT_WHITE, weight: "600" })}
        ${p(`<strong style="color:${TEXT_WHITE}">${inviterName}</strong> convidou você para fazer parte da equipe <strong style="color:${BLUE_LIGHT}">One Innovation</strong> como <strong style="color:${BLUE_LIGHT}">${roleDisplay}</strong>.`)}
        ${p("Para começar, clique no botão abaixo para aceitar o convite e definir sua senha de acesso:")}
        ${ctaButton("Aceitar Convite e Definir Senha", inviteUrl)}
        ${highlightBox("Você terá acesso ao painel de gestão de cadastros, validação de documentos e acompanhamento de clientes.")}
        ${p(`Se o botão não funcionar, copie e cole este link no navegador:<br><a href="${inviteUrl}" style="color:${BLUE_LIGHT};word-break:break-all;font-size:13px;">${inviteUrl}</a>`, { size: "13px", color: TEXT_DIM })}
        ${p("Este convite expira em 7 dias.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
      </td>
    </tr>`;

  const html = emailWrapper(content, `${inviterName} convidou você para a equipe One Innovation`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Bem-vindo(a) à One Innovation — ${inviterName} convidou você`,
      html,
    });
    if (error) { console.error("[Email] Invite error:", error); return false; }
    console.log(`[Email] Invite sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed invite:", (err as Error).message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 2: CADASTRO COMPLETO — PENDENTE DE APROVAÇÃO
   ═══════════════════════════════════════════════════════════════ */

export interface ProtocolEmailParams {
  to: string;
  respondentName?: string;
  protocolCode: string;
  formTitle: string;
}

export async function sendProtocolEmail(params: ProtocolEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, respondentName, protocolCode, formTitle } = params;
  const greeting = respondentName ? `Olá, ${respondentName}!` : "Olá!";

  const content = `
    ${headerBar("Cadastro Recebido com Sucesso")}
    <tr>
      <td style="padding:32px;">
        ${p(greeting, { size: "18px", color: TEXT_WHITE, weight: "600" })}
        ${p(`Seu cadastro em <strong style="color:${BLUE_LIGHT}">${formTitle}</strong> foi recebido e está <strong style="color:${AMBER}">pendente de aprovação</strong> pelo nosso jurídico.`)}
        ${p("Abaixo está o seu código de protocolo. Envie este código para o seu corretor:")}
        ${infoBox("Código de Protocolo", protocolCode)}
        ${highlightBox(`Falta pouco para a sua próxima conquista!<br><span style="font-size:13px;font-weight:400;color:${TEXT_MUTED}">Seu corretor entrará em contato com os próximos passos.</span>`)}
        ${p(`<strong style="color:${TEXT_WHITE}">Próximos passos:</strong>`, { margin: "0 0 8px" })}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td style="padding:8px 0;color:${TEXT_MUTED};font-size:14px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;line-height:1.6;">
              <span style="color:${BLUE};font-weight:600;margin-right:8px;">1.</span> Envie o protocolo para seu corretor<br>
              <span style="color:${BLUE};font-weight:600;margin-right:8px;">2.</span> Aguarde a análise do jurídico<br>
              <span style="color:${BLUE};font-weight:600;margin-right:8px;">3.</span> Receba a aprovação por e-mail
            </td>
          </tr>
        </table>
      </td>
    </tr>`;

  const html = emailWrapper(content, `Protocolo ${protocolCode} — Cadastro pendente de aprovação`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Protocolo ${protocolCode} — Cadastro recebido com sucesso`,
      html,
      text: `${greeting}\n\nSeu cadastro em "${formTitle}" foi recebido.\nCódigo de protocolo: ${protocolCode}\n\nEnvie este código para o seu corretor.\nFalta pouco para a sua próxima conquista!\n\n---\nOne Innovation`,
    });
    if (error) { console.error("[Email] Protocol error:", error); return false; }
    console.log(`[Email] Protocol sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed protocol:", (err as Error).message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 3: CADASTRO APROVADO — PARABÉNS!
   ═══════════════════════════════════════════════════════════════ */

export interface ApprovalEmailParams {
  to: string;
  clientName: string;
}

export async function sendApprovalEmail(params: ApprovalEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, clientName } = params;

  const content = `
    ${headerBar("Parabéns! Cadastro Aprovado", GREEN)}
    <tr>
      <td style="padding:32px;">
        ${p(`Olá, ${clientName}!`, { size: "18px", color: TEXT_WHITE, weight: "600" })}
        ${p(`Temos uma <strong style="color:${GREEN}">ótima notícia</strong>! Seu cadastro foi analisado pelo nosso jurídico e foi <strong style="color:${GREEN}">aprovado com sucesso</strong>.`)}
        ${highlightBox(`Você está apto(a) para adquirir o seu imóvel da One Innovation!<br><br><span style="font-size:24px;">🏠</span>`, GREEN)}
        ${p(`Seu corretor entrará em contato para dar continuidade ao processo. Fique atento ao seu telefone e e-mail.`)}
        ${p(`<strong style="color:${TEXT_WHITE}">Essa conquista está cada vez mais perto!</strong>`, { size: "16px", margin: "16px 0 0" })}
      </td>
    </tr>`;

  const html = emailWrapper(content, `Parabéns ${clientName}! Seu cadastro foi aprovado.`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Parabéns, ${clientName}! Seu cadastro foi aprovado! 🎉`,
      html,
    });
    if (error) { console.error("[Email] Approval error:", error); return false; }
    console.log(`[Email] Approval sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed approval:", (err as Error).message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 4: REENVIO DE DOCUMENTO / CORREÇÃO DE DADOS
   ═══════════════════════════════════════════════════════════════ */

export interface RejectionEmailParams {
  to: string;
  clientName: string;
  reason: string;
  formUrl?: string;
}

export async function sendRejectionEmail(params: RejectionEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, clientName, reason, formUrl } = params;

  const content = `
    ${headerBar("Revisão Necessária", AMBER)}
    <tr>
      <td style="padding:32px;">
        ${p(`Olá, ${clientName}!`, { size: "18px", color: TEXT_WHITE, weight: "600" })}
        ${p("Identificamos que alguns dados ou documentos do seu cadastro precisam de um pequeno ajuste. Não se preocupe, é rápido!")}
        <!-- Reason Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 8px 8px 0;">
              <p style="margin:0 0 6px;color:${AMBER};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                O que precisa ser corrigido:
              </p>
              <p style="margin:0;color:${TEXT_WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                ${reason}
              </p>
            </td>
          </tr>
        </table>
        ${formUrl ? ctaButton("Corrigir meu cadastro →", formUrl, AMBER) : ""}
        ${p("Após a correção, seu cadastro será reavaliado automaticamente.")}
        ${p(`Qualquer dúvida, entre em contato com o seu corretor.`, { size: "13px", color: TEXT_DIM, margin: "16px 0 0" })}
      </td>
    </tr>`;

  const html = emailWrapper(content, `${clientName}, precisamos de um ajuste no seu cadastro`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Atenção: Revisão necessária no seu cadastro`,
      html,
    });
    if (error) { console.error("[Email] Rejection error:", error); return false; }
    console.log(`[Email] Rejection sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed rejection:", (err as Error).message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 5: CADÊNCIA DE ABANDONO (cadastro incompleto)
   3 variações para rotação ao longo das semanas
   ═══════════════════════════════════════════════════════════════ */

export interface CadenceEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
  /** Which email in the cadence sequence (1-based) */
  sequenceNumber: number;
  /** Total emails in the cadence */
  totalInSequence: number;
}

/**
 * Get the cadence email variation based on sequence number.
 * Rotates between 3 different messages for variety.
 */
function getCadenceVariation(sequenceNumber: number): {
  subject: string;
  headline: string;
  body: string;
  ctaText: string;
  highlight: string;
} {
  const variation = ((sequenceNumber - 1) % 3) + 1;

  switch (variation) {
    case 1:
      return {
        subject: "Seu cadastro está quase pronto!",
        headline: "Falta pouco para finalizar",
        body: "Notamos que você começou seu cadastro, mas ainda não finalizou. Seus dados foram salvos automaticamente — basta continuar de onde parou.",
        ctaText: "Continuar meu cadastro →",
        highlight: "Seu próximo imóvel está a poucos cliques de distância!",
      };
    case 2:
      return {
        subject: "Não perca essa oportunidade!",
        headline: "Sua oportunidade está esperando",
        body: "Os melhores empreendimentos da One Innovation estão disponíveis para quem finaliza o cadastro. Não deixe essa chance passar!",
        ctaText: "Finalizar cadastro agora →",
        highlight: "Empreendimentos exclusivos nas melhores localizações de São Paulo.",
      };
    case 3:
    default:
      return {
        subject: "Lembrete: finalize seu cadastro",
        headline: "Estamos esperando por você",
        body: "Seu cadastro está salvo e pronto para ser finalizado. Complete as informações restantes e dê o próximo passo rumo ao seu novo imóvel.",
        ctaText: "Completar cadastro →",
        highlight: "Falta pouco para essa conquista se concretizar!",
      };
  }
}

export async function sendCadenceEmail(params: CadenceEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, clientName, formTitle, formUrl, sequenceNumber, totalInSequence } = params;
  const greeting = clientName ? `Olá, ${clientName}!` : "Olá!";
  const variation = getCadenceVariation(sequenceNumber);

  const content = `
    ${headerBar(variation.headline)}
    <tr>
      <td style="padding:32px;">
        ${p(greeting, { size: "18px", color: TEXT_WHITE, weight: "600" })}
        ${p(variation.body)}
        ${p(`Formulário: <strong style="color:${BLUE_LIGHT}">${formTitle}</strong>`, { size: "14px" })}
        ${ctaButton(variation.ctaText, formUrl)}
        ${highlightBox(variation.highlight)}
        ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
      </td>
    </tr>`;

  const html = emailWrapper(content, variation.body.substring(0, 100));

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `${variation.subject} — ${formTitle}`,
      html,
    });
    if (error) { console.error("[Email] Cadence error:", error); return false; }
    console.log(`[Email] Cadence ${sequenceNumber}/${totalInSequence} sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed cadence:", (err as Error).message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EMAIL 6: CADÊNCIA DE REPROVAÇÃO (precisa corrigir)
   ═══════════════════════════════════════════════════════════════ */

export interface RejectionCadenceEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
  reason: string;
  sequenceNumber: number;
  totalInSequence: number;
}

function getRejectionCadenceVariation(sequenceNumber: number): {
  subject: string;
  headline: string;
  body: string;
  ctaText: string;
} {
  const variation = ((sequenceNumber - 1) % 3) + 1;

  switch (variation) {
    case 1:
      return {
        subject: "Lembrete: ajuste necessário no seu cadastro",
        headline: "Ajuste rápido necessário",
        body: "Identificamos que seu cadastro precisa de uma pequena correção. É rápido e fácil — basta acessar e atualizar as informações.",
        ctaText: "Corrigir meu cadastro →",
      };
    case 2:
      return {
        subject: "Seu cadastro está quase aprovado!",
        headline: "Quase lá!",
        body: "Seu cadastro está muito perto de ser aprovado. Só precisamos que você faça um pequeno ajuste para prosseguirmos com a análise.",
        ctaText: "Fazer a correção →",
      };
    case 3:
    default:
      return {
        subject: "Não perca sua vaga — corrija seu cadastro",
        headline: "Não deixe passar essa oportunidade",
        body: "Seu cadastro ainda precisa de correção para ser aprovado. Não perca a oportunidade de garantir seu imóvel na One Innovation.",
        ctaText: "Atualizar cadastro agora →",
      };
  }
}

export async function sendRejectionCadenceEmail(params: RejectionCadenceEmailParams): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, clientName, formTitle, formUrl, reason, sequenceNumber, totalInSequence } = params;
  const greeting = clientName ? `Olá, ${clientName}!` : "Olá!";
  const variation = getRejectionCadenceVariation(sequenceNumber);

  const content = `
    ${headerBar(variation.headline, AMBER)}
    <tr>
      <td style="padding:32px;">
        ${p(greeting, { size: "18px", color: TEXT_WHITE, weight: "600" })}
        ${p(variation.body)}
        <!-- Reason Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 8px 8px 0;">
              <p style="margin:0 0 6px;color:${AMBER};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                O que precisa ser corrigido:
              </p>
              <p style="margin:0;color:${TEXT_WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                ${reason}
              </p>
            </td>
          </tr>
        </table>
        ${ctaButton(variation.ctaText, formUrl, AMBER)}
        ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
        ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
      </td>
    </tr>`;

  const html = emailWrapper(content, `${clientName || "Olá"}, seu cadastro precisa de correção`);

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `${variation.subject}`,
      html,
    });
    if (error) { console.error("[Email] Rejection cadence error:", error); return false; }
    console.log(`[Email] Rejection cadence ${sequenceNumber}/${totalInSequence} sent to ${to} (id: ${data?.id})`);
    return true;
  } catch (err) {
    console.error("[Email] Failed rejection cadence:", (err as Error).message);
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════
   LEGACY: Follow-up Email (simple, single send)
   Kept for backwards compatibility
   ═══════════════════════════════════════════════════════════════ */

export interface FollowUpEmailParams {
  to: string;
  clientName?: string;
  formTitle: string;
  formUrl: string;
}

export async function sendFollowUpEmail(params: FollowUpEmailParams): Promise<boolean> {
  return sendCadenceEmail({
    ...params,
    sequenceNumber: 1,
    totalInSequence: 1,
  });
}
