/**
 * Publish/refresh the Resend e-mail templates — now BRAND-AWARE (One + Vitacon).
 *
 *   node server/updateResendTemplates.mjs            → both brands
 *   node server/updateResendTemplates.mjs one        → only One (update in place)
 *   node server/updateResendTemplates.mjs vitacon    → only Vitacon (create new + print UUIDs)
 *
 * One templates are UPDATED in place (known UUIDs). Vitacon templates are CREATED
 * (new UUIDs) and printed at the end — paste that JSON back so the UUIDs can be wired
 * into server/emailService.ts. The rendered HTML is also written to
 * server/resend-templates-<brand>/ as a fallback for manual dashboard upload.
 */

import "dotenv/config";
import { Resend } from "resend";
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}
const resend = new Resend(RESEND_API_KEY);

/* ─── Per-brand theme. Swap the Vitacon logo/color here when you have them. ─── */
const THEMES = {
  one: {
    brandName: "One Innovation",
    logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663342930280/idQysuOkKZvswPXU.png",
    bg: "#0D8BD9",
    footer: "One Innovation — Empreendimentos Inovadores",
    // Existing templates → updated in place.
    ids: {
      "invite-staff": "41d689fb-2ed7-469a-9e3d-6204085bd5bc",
      "protocol-pending": "1d4c3ca1-026d-42ef-83c7-3b37cedcb802",
      "approval": "bd17dc65-aa61-4ba9-8444-4f9baa841c2e",
      "rejection": "9a49a11e-5022-4e3d-bf2b-cdeb80e13ac9",
      "cadence-abandono-v1": "dd26aab4-fdf6-4d3f-97f3-5915686d4a67",
      "cadence-abandono-v2": "9cb9b98c-7330-4280-9f15-258cbaaeca48",
      "cadence-abandono-v3": "0d780f6f-08cf-45d6-9f7c-bf8afeb58358",
      "cadence-rejection-v1": "73360690-8866-4c88-9a65-b8dc053c1ef1",
      "cadence-rejection-v2": "7771cbf0-4b04-4254-824a-21ac3440a1ed",
      "cadence-rejection-v3": "ac1d6bb6-499e-4ab1-8794-62518cc7e0bd",
      "corretor-notification": "164cfd9d-0780-4c4d-9841-59f2693d0552",
    },
  },
  vitacon: {
    brandName: "Vitacon",
    logoUrl: "", // TODO: URL do logo Vitacon (PNG). Vazio → usa o texto "Vitacon".
    bg: "#4A4A4F", // cinza Vitacon
    footer: "Vitacon — Cadastro Digital",
    ids: null, // created on run, UUIDs printed at the end
  },
};

/* ─── Brand kit: HTML helpers bound to a theme ─── */
function makeKit(theme) {
  const BG = theme.bg;
  const WHITE = "#FFFFFF";
  const WHITE_SOFT = "rgba(255,255,255,0.85)";
  const WHITE_DIM = "rgba(255,255,255,0.6)";
  const WHITE_BORDER = "rgba(255,255,255,0.3)";
  const WHITE_BG_SUBTLE = "rgba(255,255,255,0.08)";
  const WHITE_BG_CARD = "rgba(255,255,255,0.12)";
  const GREEN = "#34D399";
  const GREEN_BG = "rgba(52,211,153,0.15)";
  const AMBER = "#FBBF24";
  const AMBER_BG = "rgba(251,191,36,0.15)";

  const logoBlock = theme.logoUrl
    ? `<img src="${theme.logoUrl}" alt="${theme.brandName}" width="120" height="auto" style="display:block;border:0;max-width:140px;height:auto;" />`
    : `<span style="display:inline-block;color:${WHITE};font-size:26px;font-weight:700;letter-spacing:1px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${theme.brandName}</span>`;

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
<body style="margin:0;padding:0;background-color:${BG};font-family:'Montserrat','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin-bottom:32px;">
          <tr>
            <td align="left" style="padding:0;">
              ${logoBlock}
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
          ${content}
        </table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin-top:40px;">
          <tr>
            <td align="center" style="padding:16px 0;border-top:1px solid ${WHITE_BORDER};">
              <p style="margin:0 0 4px;color:${WHITE_DIM};font-size:11px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;letter-spacing:0.5px;">
                ${theme.footer}
              </p>
              <p style="margin:0;color:${WHITE_DIM};font-size:11px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
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

  function p(text, opts = {}) {
    const { size = "16px", color = WHITE_SOFT, weight = "400", margin = "0 0 16px" } = opts;
    return `<p style="margin:${margin};color:${color};font-size:${size};line-height:1.7;font-weight:${weight};font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${text}</p>`;
  }

  function ctaButton(text, url, variant = "white") {
    const bg = variant === "amber" ? AMBER : variant === "green" ? GREEN : WHITE;
    const color = BG;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="left" style="padding:8px 0 24px;">
        <a href="${url}" target="_blank" style="display:inline-block;background-color:${bg};color:${color};font-size:15px;font-weight:600;padding:14px 36px;border-radius:12px;text-decoration:none;font-family:'Montserrat','Segoe UI',Arial,sans-serif;letter-spacing:0.3px;">
          ${text}
        </a>
      </td>
    </tr>
  </table>`;
  }

  function infoBox(label, value) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 24px;">
        <div style="display:inline-block;background-color:${WHITE_BG_CARD};border:1px solid ${WHITE_BORDER};border-radius:12px;padding:20px 40px;">
          <p style="margin:0 0 6px;color:${WHITE_DIM};font-size:10px;text-transform:uppercase;letter-spacing:2.5px;font-weight:600;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
            ${label}
          </p>
          <p style="margin:0;color:${WHITE};font-size:28px;font-weight:700;letter-spacing:3px;font-family:'Courier New',monospace;">
            ${value}
          </p>
        </div>
      </td>
    </tr>
  </table>`;
  }

  function highlightBox(text, variant = "default") {
    const bg = variant === "green" ? GREEN_BG : variant === "amber" ? AMBER_BG : WHITE_BG_SUBTLE;
    const borderColor = variant === "green" ? GREEN : variant === "amber" ? AMBER : WHITE_BORDER;
    const textColor = variant === "green" ? GREEN : variant === "amber" ? AMBER : WHITE;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:8px 0 24px;">
        <div style="background:${bg};border:1px solid ${borderColor};border-radius:12px;padding:20px 28px;text-align:center;">
          <p style="margin:0;color:${textColor};font-size:16px;font-weight:600;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
            ${text}
          </p>
        </div>
      </td>
    </tr>
  </table>`;
  }

  function reasonBox(reason) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr>
      <td style="background:${AMBER_BG};border-left:4px solid ${AMBER};padding:16px 20px;border-radius:0 12px 12px 0;">
        <p style="margin:0 0 6px;color:${AMBER};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
          O que precisa ser corrigido:
        </p>
        <p style="margin:0;color:${WHITE};font-size:14px;line-height:1.6;font-family:'Montserrat','Segoe UI',Arial,sans-serif;">
          ${reason}
        </p>
      </td>
    </tr>
  </table>`;
  }

  function stepsBlock() {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr>
      <td style="padding:8px 0;color:${WHITE_SOFT};font-size:14px;font-family:'Montserrat','Segoe UI',Arial,sans-serif;line-height:1.8;">
        <span style="color:${WHITE};font-weight:600;margin-right:8px;">1.</span> Envie o protocolo para seu corretor<br>
        <span style="color:${WHITE};font-weight:600;margin-right:8px;">2.</span> Aguarde a análise do jurídico<br>
        <span style="color:${WHITE};font-weight:600;margin-right:8px;">3.</span> Receba a aprovação por e-mail
      </td>
    </tr>
  </table>`;
  }

  function dataTable(rows) {
    let html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${WHITE_BORDER};border-radius:12px;overflow:hidden;margin-bottom:24px;background:${WHITE_BG_SUBTLE};">`;
    rows.forEach((row, i) => {
      const borderBottom = i < rows.length - 1 ? `border-bottom:1px solid ${WHITE_BORDER};` : "";
      html += `<tr>
      <td style="padding:10px 14px;color:${WHITE_DIM};font-size:12px;${borderBottom}font-family:'Montserrat','Segoe UI',Arial,sans-serif;text-transform:uppercase;letter-spacing:1px;width:100px;">${row.label}</td>
      <td style="padding:10px 14px;color:${WHITE};font-size:14px;font-weight:500;${borderBottom}font-family:'Montserrat','Segoe UI',Arial,sans-serif;">${row.value}</td>
    </tr>`;
    });
    html += `</table>`;
    return html;
  }

  return { emailWrapper, p, ctaButton, infoBox, highlightBox, reasonBox, stepsBlock, dataTable, WHITE, WHITE_DIM };
}

/* ─── The 11 templates, built for a given brand ─── */
function buildTemplates(theme) {
  const k = makeKit(theme);
  const { emailWrapper, p, ctaButton, infoBox, highlightBox, reasonBox, stepsBlock, dataTable, WHITE, WHITE_DIM } = k;
  const B = theme.brandName;

  return [
    {
      alias: "invite-staff", name: "Convite Staff",
      subject: `{{{INVITER_NAME}}} convidou você para a equipe ${B}`,
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Bem-vindo(a) à equipe!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{INVITEE_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p(`<strong>{{{INVITER_NAME}}}</strong> convidou você para fazer parte da equipe <strong>${B}</strong> como <strong>{{{ROLE_DISPLAY}}}</strong>.`)}
          ${p("Para começar, clique no botão abaixo para aceitar o convite e definir sua senha de acesso:")}
          ${ctaButton("Aceitar Convite →", "{{{INVITE_URL}}}")}
          ${highlightBox("Você terá acesso ao painel de gestão de cadastros, validação de documentos e acompanhamento de clientes.")}
          ${p(`Se o botão não funcionar, copie e cole este link:<br><a href="{{{INVITE_URL}}}" style="color:${WHITE};text-decoration:underline;word-break:break-all;font-size:13px;">{{{INVITE_URL}}}</a>`, { size: "13px", color: WHITE_DIM })}
          ${p("Este convite expira em 7 dias.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, `{{{INVITER_NAME}}} convidou você para a equipe ${B}`),
    },
    {
      alias: "protocol-pending", name: "Cadastro Pendente - Protocolo",
      subject: "Protocolo {{{PROTOCOL_CODE}}} — Cadastro pendente de aprovação",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Cadastro recebido!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p(`Seu cadastro em <strong>{{{FORM_TITLE}}}</strong> foi recebido e está pendente de aprovação pelo nosso jurídico.`)}
          ${p("Abaixo está o seu código de protocolo. Envie este código para o seu corretor:")}
          ${infoBox("Código de Protocolo", "{{{PROTOCOL_CODE}}}")}
          ${highlightBox(`Falta pouco para a sua próxima conquista!<br><span style="font-size:13px;font-weight:400;color:${WHITE_DIM}">Seu corretor entrará em contato com os próximos passos.</span>`)}
          ${p("<strong>Próximos passos:</strong>", { color: WHITE, margin: "0 0 8px" })}
          ${stepsBlock()}
        </td>
      </tr>
    `, "Protocolo {{{PROTOCOL_CODE}}} — Cadastro pendente de aprovação"),
    },
    {
      alias: "approval", name: "Cadastro Aprovado",
      subject: "Parabéns {{{CLIENT_NAME}}}! Seu cadastro foi aprovado.",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Parabéns!", { size: "32px", color: WHITE, weight: "700", margin: "0 0 8px" })}
          ${p("Seu cadastro foi aprovado com sucesso!", { size: "20px", color: WHITE, weight: "600", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p(`Temos uma ótima notícia! Seu cadastro na <strong>${B}</strong> foi analisado e <strong>aprovado com sucesso</strong>.`)}
          ${highlightBox("Essa conquista está cada vez mais perto!", "green")}
          ${p("Seu corretor entrará em contato para dar continuidade ao processo. Fique atento ao seu telefone e e-mail.")}
        </td>
      </tr>
    `, "Parabéns {{{CLIENT_NAME}}}! Seu cadastro foi aprovado."),
    },
    {
      alias: "rejection", name: "Revisão Necessária",
      subject: "{{{CLIENT_NAME}}}, precisamos de um ajuste no seu cadastro",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Revisão necessária", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p("Identificamos que alguns dados ou documentos do seu cadastro precisam de um pequeno ajuste. Não se preocupe, é rápido!")}
          ${reasonBox("{{{REASON}}}")}
          ${ctaButton("Corrigir meu cadastro →", "{{{FORM_URL}}}")}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.")}
          ${p("Qualquer dúvida, entre em contato com o seu corretor.", { size: "13px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "{{{CLIENT_NAME}}}, precisamos de um ajuste no seu cadastro"),
    },
    {
      alias: "cadence-abandono-v1", name: "Cadência Abandono - Var 1",
      subject: "Seu cadastro está quase pronto!",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Falta pouco para finalizar!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p("Notamos que você começou seu cadastro, mas ainda não finalizou. Seus dados foram salvos automaticamente — basta continuar de onde parou.")}
          ${p(`Formulário: <strong>{{{FORM_TITLE}}}</strong>`, { size: "14px" })}
          ${ctaButton("Continuar meu cadastro →", "{{{FORM_URL}}}")}
          ${highlightBox("Seu próximo imóvel está a poucos cliques de distância!")}
          ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Seu cadastro está quase pronto!"),
    },
    {
      alias: "cadence-abandono-v2", name: "Cadência Abandono - Var 2",
      subject: "Não perca essa oportunidade!",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Sua oportunidade está esperando!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p(`Os melhores empreendimentos da <strong>${B}</strong> estão disponíveis para quem finaliza o cadastro. Não deixe essa chance passar!`)}
          ${p(`Formulário: <strong>{{{FORM_TITLE}}}</strong>`, { size: "14px" })}
          ${ctaButton("Finalizar cadastro agora →", "{{{FORM_URL}}}")}
          ${highlightBox("Empreendimentos exclusivos nas melhores localizações de São Paulo.")}
          ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Não perca essa oportunidade!"),
    },
    {
      alias: "cadence-abandono-v3", name: "Cadência Abandono - Var 3",
      subject: "Lembrete: finalize seu cadastro",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Estamos esperando por você!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p("Seu cadastro está salvo e pronto para ser finalizado. Complete as informações restantes e dê o próximo passo rumo ao seu novo imóvel.")}
          ${p(`Formulário: <strong>{{{FORM_TITLE}}}</strong>`, { size: "14px" })}
          ${ctaButton("Completar cadastro →", "{{{FORM_URL}}}")}
          ${highlightBox("Falta pouco para essa conquista se concretizar!")}
          ${p("Se você já finalizou o cadastro, por favor desconsidere este e-mail.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Lembrete: finalize seu cadastro"),
    },
    {
      alias: "cadence-rejection-v1", name: "Cadência Reprovação - Var 1",
      subject: "Seu cadastro precisa de correção",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Ajuste rápido necessário", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p("Identificamos que seu cadastro precisa de uma pequena correção. É rápido e fácil — basta acessar e atualizar as informações.")}
          ${reasonBox("{{{REASON}}}")}
          ${ctaButton("Corrigir meu cadastro →", "{{{FORM_URL}}}")}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
          ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Seu cadastro precisa de correção"),
    },
    {
      alias: "cadence-rejection-v2", name: "Cadência Reprovação - Var 2",
      subject: "Seu cadastro está quase aprovado!",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Quase lá!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p("Seu cadastro está muito perto de ser aprovado. Só precisamos que você faça um pequeno ajuste para prosseguirmos com a análise.")}
          ${reasonBox("{{{REASON}}}")}
          ${ctaButton("Fazer a correção →", "{{{FORM_URL}}}")}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
          ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Seu cadastro está quase aprovado!"),
    },
    {
      alias: "cadence-rejection-v3", name: "Cadência Reprovação - Var 3",
      subject: "Não perca sua vaga — corrija seu cadastro",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Não deixe passar essa oportunidade!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CLIENT_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p(`Seu cadastro ainda precisa de correção para ser aprovado. Não perca a oportunidade de garantir seu imóvel na <strong>${B}</strong>.`)}
          ${reasonBox("{{{REASON}}}")}
          ${ctaButton("Atualizar cadastro agora →", "{{{FORM_URL}}}")}
          ${p("Após a correção, seu cadastro será reavaliado automaticamente.", { size: "13px" })}
          ${p("Se você já fez a correção, por favor desconsidere este e-mail.", { size: "12px", color: WHITE_DIM, margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Não perca sua vaga — corrija seu cadastro"),
    },
    {
      alias: "corretor-notification", name: "Notificação Corretor",
      subject: "Novo cadastro recebido — {{{PROTOCOL_CODE}}}",
      html: emailWrapper(`
      <tr>
        <td style="padding:0 0 32px;">
          ${p("Novo cadastro recebido!", { size: "28px", color: WHITE, weight: "700", margin: "0 0 24px" })}
          ${p("Olá, <strong>{{{CORRETOR_NAME}}}</strong>!", { size: "18px", color: WHITE, weight: "500" })}
          ${p(`Um novo cadastro foi recebido no formulário <strong>{{{FORM_TITLE}}}</strong>.`)}
          ${infoBox("Código de Protocolo", "{{{PROTOCOL_CODE}}}")}
          ${p("Dados do Interessado", { size: "11px", color: WHITE_DIM, weight: "700", margin: "0 0 12px" })}
          ${dataTable([
            { label: "Nome", value: "{{{RESPONDENT_NAME}}}" },
            { label: "Email", value: "{{{RESPONDENT_EMAIL}}}" },
            { label: "Telefone", value: "{{{RESPONDENT_PHONE}}}" },
          ])}
          ${p("Recebido em: {{{SUBMITTED_AT}}}", { size: "13px", color: WHITE_DIM })}
          ${p("Acesse o painel para ver todos os detalhes e gerar a ficha de cadastro.", { margin: "16px 0 0" })}
        </td>
      </tr>
    `, "Novo cadastro recebido — {{{PROTOCOL_CODE}}}"),
    },
  ];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function publishBrand(brandKey) {
  const theme = THEMES[brandKey];
  if (!theme) {
    console.error(`Unknown brand: ${brandKey}`);
    return;
  }
  const templates = buildTemplates(theme);
  const outDir = path.join(process.cwd(), "server", `resend-templates-${brandKey}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`\n━━━ ${theme.brandName} (${templates.length} templates) ━━━`);
  const newIds = {};
  let ok = 0, fail = 0;

  for (const t of templates) {
    // Always write a local HTML copy (fallback for manual upload in the Resend dashboard)
    fs.writeFileSync(path.join(outDir, `${t.alias}.html`), t.html);

    try {
      if (theme.ids && theme.ids[t.alias]) {
        const { error } = await resend.templates.update(theme.ids[t.alias], { html: t.html });
        if (error) throw new Error(JSON.stringify(error));
        console.log(`  ✅ update  ${t.alias}`);
      } else {
        const { data, error } = await resend.templates.create({
          name: `${brandKey}-${t.alias}`,
          alias: `${brandKey}-${t.alias}`,
          subject: t.subject,
          html: t.html,
        });
        if (error) throw new Error(JSON.stringify(error));
        newIds[t.alias] = data?.id;
        console.log(`  ✅ create  ${t.alias} → ${data?.id}`);
      }
      ok++;
    } catch (err) {
      console.log(`  ❌ ${t.alias}: ${err.message}`);
      fail++;
    }
    await sleep(300);
  }

  console.log(`  (${ok} ok, ${fail} fail). HTML salvo em ${outDir}`);
  if (Object.keys(newIds).length) {
    console.log(`\n📋 COLE ISTO DE VOLTA (UUIDs do ${brandKey} para o emailService.ts):\n`);
    console.log(JSON.stringify({ [brandKey]: newIds }, null, 2));
  }
}

async function main() {
  const arg = process.argv[2];
  const brands = arg ? [arg] : ["one", "vitacon"];
  for (const b of brands) {
    await publishBrand(b);
  }
  console.log("\n✔ Concluído.\n");
}

// Only run when invoked directly (so the templates can be imported for tests/render
// without touching Resend).
const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) main().catch(console.error);

export { THEMES, buildTemplates, makeKit };
