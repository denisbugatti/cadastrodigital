/**
 * Migration Script: Create email templates in Resend
 * Run with: node server/migrateTemplatesToResend.mjs
 *
 * This creates all 7 email templates in Resend's dashboard so they can be
 * edited visually. After running, copy the template IDs into the env vars.
 */

import "dotenv/config";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("❌ RESEND_API_KEY not set. Please set it in .env");
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

/* ─── Design Constants ─── */
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663342930280/bDyKxbJirDkukZmvFFZQ8p/one-innovation-logo_b13de89b.jpg";
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

/* ─── Helper Functions ─── */
function emailWrapper(content, preheader = "") {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]><style>* { font-family: Arial, sans-serif !important; }</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${BG_DARK};font-family:'Montserrat','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG_DARK};padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin-bottom:24px;">
          <tr>
            <td align="center" style="padding:16px 0;">
              <img src="${LOGO_URL}" alt="One Innovation" width="120" height="auto" style="display:block;border:0;max-width:120px;height:auto;" />
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${BG_CARD};border-radius:16px;overflow:hidden;border:1px solid ${BORDER};">
          ${content}
        </table>
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

function headerBar(title, color = BLUE) {
  return `<tr>
    <td style="background:linear-gradient(135deg,${color},${color}dd);padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;letter-spacing:0.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
        ${title}
      </h1>
    </td>
  </tr>`;
}

function p(text, opts = {}) {
  const { size = "15px", color = TEXT_MUTED, weight = "400", margin = "0 0 16px" } = opts;
  return `<p style="margin:${margin};color:${color};font-size:${size};line-height:1.7;font-weight:${weight};font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${text}</p>`;
}

function ctaButton(text, url, color = BLUE) {
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

function infoBox(label, value, borderColor = BLUE) {
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

function highlightBox(text, color = BLUE) {
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

/* ═══════════════════════════════════════════════════════════
   TEMPLATE DEFINITIONS
   ═══════════════════════════════════════════════════════════ */

const templates = [
  {
    name: "Convite Staff",
    alias: "one-invite-staff",
    subject: "Bem-vindo(a) à One Innovation — {{{INVITER_NAME}}} convidou você",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "INVITEE_NAME", type: "string", fallbackValue: "Olá" },
      { key: "INVITER_NAME", type: "string", fallbackValue: "One Innovation" },
      { key: "ROLE_DISPLAY", type: "string", fallbackValue: "Corretor(a)" },
      { key: "INVITE_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
    ],
    html: emailWrapper(`
      ${headerBar("Bem-vindo(a) à One Innovation")}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{INVITEE_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p(`<strong style="color:${TEXT_WHITE}">{{{INVITER_NAME}}}</strong> convidou você para fazer parte da equipe <strong style="color:${BLUE_LIGHT}">One Innovation</strong> como <strong style="color:${BLUE_LIGHT}">{{{ROLE_DISPLAY}}}</strong>.`)}
          ${p("Para começar, clique no botão abaixo para aceitar o convite e definir sua senha de acesso:")}
          ${ctaButton("Aceitar Convite e Definir Senha", "{{{INVITE_URL}}}")}
          ${highlightBox("Você terá acesso ao painel de gestão de cadastros, validação de documentos e acompanhamento de clientes.")}
          ${p(`Se o botão não funcionar, copie e cole este link no navegador:<br><a href="{{{INVITE_URL}}}" style="color:${BLUE_LIGHT};word-break:break-all;font-size:13px;">{{{INVITE_URL}}}</a>`, { size: "13px", color: TEXT_DIM })}
          ${p("Este convite expira em 7 dias.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "{{{INVITER_NAME}}} convidou você para a equipe One Innovation"),
  },
  {
    name: "Cadastro Pendente - Protocolo",
    alias: "one-protocol-pending",
    subject: "Protocolo {{{PROTOCOL_CODE}}} — Cadastro recebido com sucesso",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "PROTOCOL_CODE", type: "string", fallbackValue: "---" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
    ],
    html: emailWrapper(`
      ${headerBar("Cadastro Recebido com Sucesso")}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p(`Seu cadastro em <strong style="color:${BLUE_LIGHT}">{{{FORM_TITLE}}}</strong> foi recebido e está <strong style="color:${AMBER}">pendente de aprovação</strong> pelo nosso jurídico.`)}
          ${p("Abaixo está o seu código de protocolo. Envie este código para o seu corretor:")}
          ${infoBox("Código de Protocolo", "{{{PROTOCOL_CODE}}}")}
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
      </tr>
    `, "Protocolo {{{PROTOCOL_CODE}}} — Cadastro pendente de aprovação"),
  },
  {
    name: "Cadastro Aprovado",
    alias: "one-approval",
    subject: "Parabéns, {{{CLIENT_NAME}}}! Seu cadastro foi aprovado! 🎉",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Cliente" },
    ],
    html: emailWrapper(`
      ${headerBar("Parabéns! Cadastro Aprovado", GREEN)}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p(`Temos uma <strong style="color:${GREEN}">ótima notícia</strong>! Seu cadastro foi analisado pelo nosso jurídico e foi <strong style="color:${GREEN}">aprovado com sucesso</strong>.`)}
          ${highlightBox(`Você está apto(a) para adquirir o seu imóvel da One Innovation!<br><br><span style="font-size:24px;">🏠</span>`, GREEN)}
          ${p("Seu corretor entrará em contato para dar continuidade ao processo. Fique atento ao seu telefone e e-mail.")}
          ${p(`<strong style="color:${TEXT_WHITE}">Essa conquista está cada vez mais perto!</strong>`, { size: "16px", margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Parabéns {{{CLIENT_NAME}}}! Seu cadastro foi aprovado."),
  },
  {
    name: "Revisão Necessária",
    alias: "one-rejection",
    subject: "Atenção: Revisão necessária no seu cadastro",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Cliente" },
      { key: "REASON", type: "string", fallbackValue: "Documento ou dado precisa de correção" },
      { key: "FORM_URL", type: "string", fallbackValue: "" },
    ],
    html: emailWrapper(`
      ${headerBar("Revisão Necessária", AMBER)}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Identificamos que alguns dados ou documentos do seu cadastro precisam de um pequeno ajuste. Não se preocupe, é rápido!")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 6px;color:${AMBER};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  O que precisa ser corrigido:
                </p>
                <p style="margin:0;color:${TEXT_WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  {{{REASON}}}
                </p>
              </td>
            </tr>
          </table>
          ${ctaButton("Corrigir meu cadastro →", "{{{FORM_URL}}}", AMBER)}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.")}
          ${p("Qualquer dúvida, entre em contato com o seu corretor.", { size: "13px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "{{{CLIENT_NAME}}}, precisamos de um ajuste no seu cadastro"),
  },
  {
    name: "Cadência Abandono - Var 1",
    alias: "one-cadence-abandono-v1",
    subject: "Seu cadastro está quase pronto! — {{{FORM_TITLE}}}",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
      { key: "FORM_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
    ],
    html: emailWrapper(`
      ${headerBar("Falta pouco para finalizar")}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Notamos que você começou seu cadastro, mas ainda não finalizou. Seus dados foram salvos automaticamente — basta continuar de onde parou.")}
          ${p(`Formulário: <strong style="color:${BLUE_LIGHT}">{{{FORM_TITLE}}}</strong>`, { size: "14px" })}
          ${ctaButton("Continuar meu cadastro →", "{{{FORM_URL}}}")}
          ${highlightBox("Seu próximo imóvel está a poucos cliques de distância!")}
          ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Seu cadastro está quase pronto!"),
  },
  {
    name: "Cadência Abandono - Var 2",
    alias: "one-cadence-abandono-v2",
    subject: "Não perca essa oportunidade! — {{{FORM_TITLE}}}",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
      { key: "FORM_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
    ],
    html: emailWrapper(`
      ${headerBar("Sua oportunidade está esperando")}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Os melhores empreendimentos da One Innovation estão disponíveis para quem finaliza o cadastro. Não deixe essa chance passar!")}
          ${p(`Formulário: <strong style="color:${BLUE_LIGHT}">{{{FORM_TITLE}}}</strong>`, { size: "14px" })}
          ${ctaButton("Finalizar cadastro agora →", "{{{FORM_URL}}}")}
          ${highlightBox("Empreendimentos exclusivos nas melhores localizações de São Paulo.")}
          ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Não perca essa oportunidade!"),
  },
  {
    name: "Cadência Abandono - Var 3",
    alias: "one-cadence-abandono-v3",
    subject: "Lembrete: finalize seu cadastro — {{{FORM_TITLE}}}",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
      { key: "FORM_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
    ],
    html: emailWrapper(`
      ${headerBar("Estamos esperando por você")}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Seu cadastro está salvo e pronto para ser finalizado. Complete as informações restantes e dê o próximo passo rumo ao seu novo imóvel.")}
          ${p(`Formulário: <strong style="color:${BLUE_LIGHT}">{{{FORM_TITLE}}}</strong>`, { size: "14px" })}
          ${ctaButton("Completar cadastro →", "{{{FORM_URL}}}")}
          ${highlightBox("Falta pouco para essa conquista se concretizar!")}
          ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Lembrete: finalize seu cadastro"),
  },
  {
    name: "Cadência Reprovação - Var 1",
    alias: "one-cadence-rejection-v1",
    subject: "Lembrete: ajuste necessário no seu cadastro",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
      { key: "FORM_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
      { key: "REASON", type: "string", fallbackValue: "Documento ou dado precisa de correção" },
    ],
    html: emailWrapper(`
      ${headerBar("Ajuste rápido necessário", AMBER)}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Identificamos que seu cadastro precisa de uma pequena correção. É rápido e fácil — basta acessar e atualizar as informações.")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 6px;color:${AMBER};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  O que precisa ser corrigido:
                </p>
                <p style="margin:0;color:${TEXT_WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  {{{REASON}}}
                </p>
              </td>
            </tr>
          </table>
          ${ctaButton("Corrigir meu cadastro →", "{{{FORM_URL}}}", AMBER)}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
          ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Seu cadastro precisa de correção"),
  },
  {
    name: "Cadência Reprovação - Var 2",
    alias: "one-cadence-rejection-v2",
    subject: "Seu cadastro está quase aprovado!",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
      { key: "FORM_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
      { key: "REASON", type: "string", fallbackValue: "Documento ou dado precisa de correção" },
    ],
    html: emailWrapper(`
      ${headerBar("Quase lá!", AMBER)}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Seu cadastro está muito perto de ser aprovado. Só precisamos que você faça um pequeno ajuste para prosseguirmos com a análise.")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 6px;color:${AMBER};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  O que precisa ser corrigido:
                </p>
                <p style="margin:0;color:${TEXT_WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  {{{REASON}}}
                </p>
              </td>
            </tr>
          </table>
          ${ctaButton("Fazer a correção →", "{{{FORM_URL}}}", AMBER)}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
          ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Seu cadastro está quase aprovado!"),
  },
  {
    name: "Cadência Reprovação - Var 3",
    alias: "one-cadence-rejection-v3",
    subject: "Não perca sua vaga — corrija seu cadastro",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CLIENT_NAME", type: "string", fallbackValue: "Olá" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro One Innovation" },
      { key: "FORM_URL", type: "string", fallbackValue: "https://one.cadastrodigital.com.br" },
      { key: "REASON", type: "string", fallbackValue: "Documento ou dado precisa de correção" },
    ],
    html: emailWrapper(`
      ${headerBar("Não deixe passar essa oportunidade", AMBER)}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CLIENT_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p("Seu cadastro ainda precisa de correção para ser aprovado. Não perca a oportunidade de garantir seu imóvel na One Innovation.")}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 8px 8px 0;">
                <p style="margin:0 0 6px;color:${AMBER};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  O que precisa ser corrigido:
                </p>
                <p style="margin:0;color:${TEXT_WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
                  {{{REASON}}}
                </p>
              </td>
            </tr>
          </table>
          ${ctaButton("Atualizar cadastro agora →", "{{{FORM_URL}}}", AMBER)}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
          ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: TEXT_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Não perca sua vaga — corrija seu cadastro"),
  },
  {
    name: "Notificação Corretor",
    alias: "one-corretor-notification",
    subject: "Novo cadastro: {{{PROTOCOL_CODE}}} — {{{FORM_TITLE}}}",
    from: "One Innovation <one@cadastrodigital.com.br>",
    variables: [
      { key: "CORRETOR_NAME", type: "string", fallbackValue: "Corretor" },
      { key: "FORM_TITLE", type: "string", fallbackValue: "Cadastro" },
      { key: "PROTOCOL_CODE", type: "string", fallbackValue: "---" },
      { key: "RESPONDENT_NAME", type: "string", fallbackValue: "" },
      { key: "RESPONDENT_EMAIL", type: "string", fallbackValue: "" },
      { key: "RESPONDENT_PHONE", type: "string", fallbackValue: "" },
      { key: "SUBMITTED_AT", type: "string", fallbackValue: "" },
    ],
    html: emailWrapper(`
      ${headerBar("Novo Cadastro Recebido")}
      <tr>
        <td style="padding:32px;">
          ${p("Olá, {{{CORRETOR_NAME}}}!", { size: "18px", color: TEXT_WHITE, weight: "600" })}
          ${p(`Um novo cadastro foi recebido no formulário <strong style="color:${BLUE_LIGHT}">{{{FORM_TITLE}}}</strong>.`)}
          ${infoBox("Código de Protocolo", "{{{PROTOCOL_CODE}}}")}
          <p style="margin:0 0 12px;color:${TEXT_MUTED};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
            Dados do Interessado
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:10px;overflow:hidden;margin-bottom:24px;background:${BG_CARD_INNER};">
            <tr><td style="padding:10px 14px;color:${TEXT_DIM};font-size:12px;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Nome</td><td style="padding:10px 14px;color:${TEXT_WHITE};font-size:14px;font-weight:500;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;">{{{RESPONDENT_NAME}}}</td></tr>
            <tr><td style="padding:10px 14px;color:${TEXT_DIM};font-size:12px;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Email</td><td style="padding:10px 14px;color:${TEXT_WHITE};font-size:14px;font-weight:500;border-bottom:1px solid ${BORDER};font-family:'Montserrat','Segoe UI',Arial,sans-serif;">{{{RESPONDENT_EMAIL}}}</td></tr>
            <tr><td style="padding:10px 14px;color:${TEXT_DIM};font-size:12px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;">Telefone</td><td style="padding:10px 14px;color:${TEXT_WHITE};font-size:14px;font-weight:500;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">{{{RESPONDENT_PHONE}}}</td></tr>
          </table>
          ${p("Recebido em: {{{SUBMITTED_AT}}}", { size: "13px", color: TEXT_DIM })}
          ${p("Acesse o painel para ver todos os detalhes e gerar a ficha de cadastro.", { margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Novo cadastro recebido — {{{PROTOCOL_CODE}}}"),
  },
];

/* ═══════════════════════════════════════════════════════════
   MIGRATION EXECUTION
   ═══════════════════════════════════════════════════════════ */

async function migrate() {
  console.log("🚀 Starting Resend template migration...\n");
  console.log(`Found ${templates.length} templates to create.\n`);

  const results = [];

  for (const template of templates) {
    try {
      console.log(`📧 Creating template: ${template.name}...`);

      const { data, error } = await resend.templates.create({
        name: template.name,
        alias: template.alias,
        subject: template.subject,
        from: template.from,
        html: template.html,
        variables: template.variables,
      });

      if (error) {
        console.error(`   ❌ Error: ${JSON.stringify(error)}`);
        results.push({ name: template.name, alias: template.alias, status: "error", error });
        continue;
      }

      console.log(`   ✅ Created with ID: ${data.id}`);

      // Publish the template
      try {
        const publishResult = await resend.templates.publish(data.id);
        console.log(`   📤 Published successfully`);
      } catch (pubErr) {
        console.warn(`   ⚠️ Publish failed (can publish manually): ${pubErr.message}`);
      }

      results.push({ name: template.name, alias: template.alias, id: data.id, status: "success" });

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}`);
      results.push({ name: template.name, alias: template.alias, status: "error", error: err.message });
    }
  }

  console.log("\n═══════════════════════════════════════════════════");
  console.log("MIGRATION RESULTS");
  console.log("═══════════════════════════════════════════════════\n");

  const successful = results.filter(r => r.status === "success");
  const failed = results.filter(r => r.status === "error");

  console.log(`✅ ${successful.length} templates created successfully`);
  console.log(`❌ ${failed.length} templates failed\n`);

  if (successful.length > 0) {
    console.log("Template IDs (save these for env vars):\n");
    for (const r of successful) {
      console.log(`  ${r.alias} = ${r.id}`);
    }

    console.log("\n\nEnvironment variables to add:\n");
    console.log("# Resend Template IDs");
    for (const r of successful) {
      const envKey = `RESEND_TEMPLATE_${r.alias.replace(/-/g, "_").toUpperCase()}`;
      console.log(`${envKey}=${r.id}`);
    }
  }

  if (failed.length > 0) {
    console.log("\nFailed templates:");
    for (const r of failed) {
      console.log(`  ${r.name}: ${JSON.stringify(r.error)}`);
    }
  }
}

migrate().catch(console.error);
