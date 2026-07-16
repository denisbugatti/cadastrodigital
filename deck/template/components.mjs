/* ============================================================
   VITACON — Componentes de slide (render → HTML)
   Cada função recebe (s, ctx) e devolve o HTML de um .slide.
   ctx = { projeto, pageNum, total, fixo(name), foto(name), wm }
   ============================================================ */

import { BRASIL } from "./brasil-map.mjs";

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const ARROW = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 18 L18 6 M9 6 h9 v9"/></svg>`;
const BIGV = `<svg class="capaV" viewBox="0 0 270 320" fill="none"><path d="M20 6 L120 300 L150 300 L250 6 L206 6 L135 232 L64 6 Z" fill="#2800FF"/></svg><svg class="capaV-out" viewBox="0 0 270 320"><path d="M22 6 L135 300 L248 6" stroke="#2800FF" stroke-width="5" fill="none"/></svg>`;
const IG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>`;
const YT = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.5 12 5.5 12 5.5s-6 0-7.9.6A3 3 0 0 0 2 8.2 31 31 0 0 0 1.7 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.6 7.9.6 7.9.6s6 0 7.9-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 22.3 12 31 31 0 0 0 22 8.2ZM10 15V9l5 3Z"/></svg>`;
const IN = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4 0 4.75 2.65 4.75 6.1V21H21v-5.4c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V21H13z"/></svg>`;

/* ---------- chrome ---------- */
function wm(ctx, cls = "wordmark") {
  return `<img class="${cls}" src="${ctx.wm}" alt="Vitacon">`;
}
function wmH(ctx, h) {
  return `<img src="${ctx.wm}" alt="Vitacon" style="height:${h}px;width:auto;display:block">`;
}
function chrome(ctx, { pg = true } = {}) {
  const p = esc(ctx.projeto.nome);
  const nn = String(ctx.pageNum).padStart(2, "0");
  const tt = String(ctx.total).padStart(2, "0");
  return `
    <div class="hd">${wm(ctx)}<div class="proj">${p}</div></div>
    <div class="side">${p}</div>
    <div class="ft">
      <div class="pg">${pg ? `<b>${nn}</b> / ${tt}` : ""}</div>
      <div class="arrow">${ARROW}</div>
    </div>`;
}
function rotulo(txt) {
  return `<div class="rotulo"><span class="tr"></span><span class="tx">${esc(txt)}</span></div>`;
}
// negrito simples via **texto**
function rich(t) {
  return esc(t).replace(/\*\*(.+?)\*\*/g, '<span class="azul">$1</span>');
}

/* =====================================================================
   COMPONENTES
   ===================================================================== */

const C = {};

/* ---- capa (capa oficial Vitacon, fixa e pixel-exata) ---- */
C.capa = (s, ctx) => `
  <div class="slide">
    <div class="imagem">
      <img src="${ctx.fixo(s.fixo || "capa-vitacon.png")}">
    </div>
  </div>`;

/* ---- estatística (número + imagem) ---- */
C.estatistica = (s, ctx) => `
  <div class="slide">
    <div class="estat">
      <div class="media">${s.imagem ? `<img src="${ctx.foto(s.imagem)}">` : ""}</div>
      <div class="info">
        ${rotulo(s.rotulo || "")}
        <div class="num">${esc(s.numero)}<small>${esc(s.unidade || "")}</small></div>
        <div class="desc">${esc(s.descricao || "")}</div>
      </div>
    </div>
    ${chrome(ctx)}
  </div>`;

/* ---- lista de distâncias ---- */
C.lista = (s, ctx) => {
  const rows = (s.itens || []).map(
    (i) => `<div class="row"><div class="nome">${esc(i.nome)}</div><div class="val">${esc(i.valor)}</div></div>`
  ).join("");
  return `
  <div class="slide">
    <div class="lista">
      <div class="col-esq">
        ${rotulo(s.rotulo || "")}
        <div class="h1">${rich(s.titulo || "")}</div>
      </div>
      <div class="col-dir">${rows}</div>
    </div>
    ${chrome(ctx)}
  </div>`;
};

/* ---- institucional stats (p8) ---- */
C.institucional = (s, ctx) => {
  const stats = (s.stats || []).map(
    (st) => `<div class="stat"><div class="n">${esc(st.n)}</div><div class="l">${esc(st.l)}</div></div>`
  ).join("");
  return `
  <div class="slide">
    <div class="inst-bg"></div>
    <div class="inst">
      <div class="h1" style="max-width:1050px">${rich(s.titulo || "")}</div>
      <div class="lead" style="margin-top:26px">${esc(s.descricao || "")}</div>
      ${s.link ? `<div class="link">${esc(s.link)}</div>` : ""}
      ${s.print ? `<div class="print"><img src="${ctx.foto(s.print)}"></div>` : ""}
      <div class="stats">${stats}</div>
    </div>
    ${chrome(ctx)}
  </div>`;
};

/* ---- divisor ---- */
C.divisor = (s, ctx) => {
  const cls = [s.fundo === "azul" ? "azul" : "preto", s.destaque ? "destaque" : ""].join(" ");
  const proj = esc(ctx.projeto.nome);
  const miniChrome = s.fundo === "azul" || s.chrome === false ? "" : `
    <div class="hd" style="justify-content:flex-end"><div class="proj">${proj}</div></div>
    <div class="side">${proj}</div>
    <div class="ft"><div class="pg"></div><div class="arrow">${ARROW}</div></div>`;
  return `
  <div class="slide">
    <div class="divisor ${cls}">
      ${s.rotuloTopo ? `<div class="rot-top">${esc(s.rotuloTopo)}</div>` : ""}
      <h1>${esc(s.titulo)}</h1>
      ${s.fundo === "azul" ? `<div class="wm-bottom">${wmH(ctx, 56)}</div>` : ""}
    </div>
    ${miniChrome}
  </div>`;
};

/* ---- demanda embarcada ---- */
C.demanda = (s, ctx) => {
  const kpis = (s.kpis || []).map(
    (k) => `<div class="kpi"><div class="n">${esc(k.n)}</div><div class="k">${esc(k.k)}</div></div>`
  ).join("");
  return `
  <div class="slide">
    <div class="demanda">
      ${s.imagem ? `<div class="bg"><img src="${ctx.foto(s.imagem)}"></div>` : ""}
      <div class="veil"></div>
      <div class="content">
        <div class="tag">${esc(s.tag || "Demanda Embarcada")}</div>
        <div class="titulo">${esc(s.titulo)}</div>
        ${s.sub ? `<div class="sub">${esc(s.sub)}</div>` : ""}
        <div class="cards">${kpis}</div>
      </div>
    </div>
    ${chrome(ctx)}
  </div>`;
};

/* ---- comparativo Mercado × Vitacon ---- */
C.comparativo = (s, ctx) => {
  const rows = (s.linhas || []).map((l) => `
    <div class="trow">
      <div class="lab">${esc(l.lab)}</div>
      <div class="mkt">${esc(l.mercado)}</div>
      <div class="vit">${esc(l.vitacon)} <span style="color:#38d67a">↗</span></div>
      <div class="bar" style="--w:${esc(l.barra || "70%")}"></div>
    </div>`).join("");
  return `
  <div class="slide">
    <div class="comp">
      <div class="left">
        ${rotulo(s.rotulo || `Projeto Powered by Housi`)}
        <div class="h2">${rich(s.titulo || "")}</div>
        <div class="thead"><span></span><span>Mercado</span><span class="v">Vitacon · Housi</span></div>
        ${rows}
        ${s.cta ? `<div class="cta">${esc(s.cta)} ${ARROW}</div>` : ""}
      </div>
      <div class="right">${s.imagem ? `<img src="${ctx.foto(s.imagem)}">` : ""}</div>
    </div>
    ${chrome(ctx)}
  </div>`;
};

/* ---- plano de pagamento ---- */
C.plano = (s, ctx) => {
  const b = s.blocos || [];
  const blocos = b.map((x) => `
    <div class="bloco ${x.azul ? "azul" : ""}">
      <div class="cap">${esc(x.cap)}</div>
      ${x.pct ? `<div class="pct">${esc(x.pct)}</div>` : ""}
      <div class="val">${esc(x.val)}</div>
    </div>`).join("");
  return `
  <div class="slide">
    <div class="plano-bg"></div>
    <div class="plano">
      ${rotulo(s.rotulo || "Plano de Pagamento")}
      <div class="h2">${rich(s.titulo || "")}</div>
      <div class="blocos">${blocos}</div>
      ${s.nota ? `<div class="nota">${esc(s.nota)}</div>` : ""}
    </div>
    ${chrome(ctx)}
  </div>`;
};

/* ---- simulação de rentabilidade ---- */
C.simulacao = (s, ctx) => {
  const linhas = (s.linhas || []).map((l) => {
    const cls = l.tipo === "receita" ? "receita" : l.neg ? "neg" : "";
    return `<div class="linha ${cls}"><div class="l">${esc(l.l)}</div><div class="v">${esc(l.v)}</div></div>`;
  }).join("");
  return `
  <div class="slide">
    <div class="sim">
      <div class="left">
        ${rotulo(s.rotulo || "Simulação de Rentabilidade")}
        <div class="topo"><div class="l">${esc(s.investidoLabel || "Total investido")}</div><div class="v">${esc(s.investido)}</div></div>
        <div style="margin-top:18px">${linhas}</div>
        <div class="sep"></div>
        <div class="fim"><div class="l">${esc(s.mensalLabel || "Renda mensal líquida")}</div><div class="v">${esc(s.mensal)}</div></div>
        <div class="fim ano"><div class="l">${esc(s.anualLabel || "Renda anual líquida")}</div><div class="v">${esc(s.anual)}</div></div>
      </div>
      <div class="right">${s.imagem ? `<img src="${ctx.foto(s.imagem)}">` : ""}</div>
    </div>
    ${chrome(ctx)}
  </div>`;
};

/* ---- cadastro CTA ---- */
C.cadastro = (s, ctx) => `
  <div class="slide">
    <div class="cad">
      <div class="cad-bg"></div>
      <div class="content">
        <div class="rot">${rotulo(s.rotulo || "Cadastro Exclusivo")}</div>
        <h1>${rich(s.titulo || "Lançamentos **exclusivos** para clientes cadastrados da Vitacon")}</h1>
        <div class="btn">${esc(s.botao || "Fale com um dos nossos corretores")} <span class="ico" style="width:34px;height:34px">${ARROW}</span></div>
      </div>
      <div class="mock">
        <div style="font-size:44px;font-weight:300">\\</div>
        <div class="mtit">${esc(s.mockTitulo || "Cadastro exclusivo")}</div>
        <div class="msub">${esc(s.mockSub || "Acesso antecipado aos próximos lançamentos Vitacon — antes do mercado.")}</div>
        <div class="field"><div class="fl">Nome completo</div><div class="fi">Seu nome</div></div>
        <div class="field"><div class="fl">E-mail</div><div class="fi">voce@email.com</div></div>
        <div class="field"><div class="fl">WhatsApp</div><div class="fi">(11) 9 0000-0000</div></div>
        <div class="mbtn">${esc(s.mockBtn || "Quero acesso exclusivo")}</div>
      </div>
      <div class="lgpd"><span class="badge">🔒 LGPD</span> Dados confidenciais</div>
    </div>
    ${chrome(ctx)}
  </div>`;

/* ---- imagem cheia (renders / entorno / fixos baked) ---- */
C.imagem = (s, ctx) => {
  const src = s.fixo ? ctx.fixo(s.fixo) : ctx.foto(s.imagem);
  return `
  <div class="slide">
    <div class="imagem">
      <img class="${s.fit === "contain" ? "contain" : ""}" src="${src}">
      ${s.titulo ? `<div class="cap ${s.rosa ? "rosa" : ""}">${esc(s.titulo)}</div>` : ""}
      ${s.legenda ? `<div class="legenda">${esc(s.legenda)}</div>` : ""}
    </div>
    ${s.chrome ? chrome(ctx) : ""}
  </div>`;
};

/* ---- jurídico + redes ---- */
C.juridico = (s, ctx) => `
  <div class="slide">
    <div class="jur">
      <div class="redes">
        <div class="tit">${esc(s.redesTitulo || "SIGA-NOS NAS REDES SOCIAIS")}</div>
        <div class="ic"><span>${IG}</span><span>${YT}</span><span>${IN}</span></div>
      </div>
      <div class="marca">${wmH(ctx, 64)}
        <div class="tl">${esc(ctx.projeto.tagline || "Valorize com a cidade")}</div>
      </div>
      <div class="legal">${esc(s.legal || "")}</div>
    </div>
  </div>`;

/* ---- mapa do Brasil com SP em neon (identidade Vitacon) ---- */
function mapaBrasil() {
  const outros = BRASIL.locations
    .filter((l) => l.id !== "sp")
    .map((l) => `<path d="${l.path}" class="uf"/>`)
    .join("");
  const sp = BRASIL.locations.find((l) => l.id === "sp");
  return `<svg class="brasil" viewBox="${BRASIL.viewBox}" preserveAspectRatio="xMidYMid meet">
    <defs>
      <filter id="neon" x="-70%" y="-70%" width="240%" height="240%">
        <feGaussianBlur stdDeviation="7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="b"/></feMerge>
      </filter>
      <radialGradient id="spgrad" cx="45%" cy="42%" r="72%">
        <stop offset="0%" stop-color="#5a76ff"/>
        <stop offset="55%" stop-color="#2800FF"/>
        <stop offset="100%" stop-color="#1400a0"/>
      </radialGradient>
    </defs>
    <g class="ufs">${outros}</g>
    <path d="${sp.path}" class="sp-glow"/>
    <path d="${sp.path}" class="sp-fill"/>
  </svg>`;
}

/* ---- São Paulo (capital do turismo) — dados + mapa ao lado ---- */
C.saopaulo = (s, ctx) => {
  const nums = (s.stats || []).map((st) => {
    const t = String(st.n);
    const first = t.charAt(0);
    const rest = t.slice(1);
    return `<div class="sp-num"><div class="n"><b>${esc(first)}</b>${esc(rest)}</div><div class="l">${esc(st.l)}</div></div>`;
  }).join("");
  const notas = (s.notas || []).map((n) => `<div class="sp-note">${rich(n)}</div>`).join("");
  return `
  <div class="slide">
    <div class="sp-slide">
      <div class="sp-left">
        ${rotulo(s.rotulo || "Capital do turismo")}
        <div class="sp-top">
          <div class="sp-nums">${nums}</div>
          <div class="sp-notes">${notas}</div>
        </div>
        ${s.badge ? `<div class="sp-badge">${esc(s.badge)} ${ARROW}</div>` : ""}
        <div class="sp-title-big">${esc(s.titulo || "São Paulo")}</div>
        ${s.fonte ? `<div class="sp-fonte">${esc(s.fonte)}</div>` : ""}
      </div>
      <div class="sp-right">
        ${mapaBrasil()}
      </div>
    </div>
    ${chrome(ctx)}
  </div>`;
};

export function renderSlide(s, ctx) {
  const fn = C[s.tipo];
  if (!fn) return `<div class="slide"><div class="slide-pad">⚠️ tipo desconhecido: ${esc(s.tipo)}</div></div>`;
  return fn(s, ctx);
}
export const TIPOS = Object.keys(C);
