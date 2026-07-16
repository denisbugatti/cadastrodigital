#!/usr/bin/env node
/* ============================================================
   VITACON — Gera o HTML EDITÁVEL do deck (para editarmos à mão).
   Uso:  node deck/editable.mjs <slug>
   Saída: deck/empreendimentos/<slug>/<slug>.html
          (CSS linkado, caminhos de imagem relativos, 1 comentário por página)
   Depois: editar o .html à mão  →  node deck/html2pdf.mjs <slug>
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderSlide } from "./template/components.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DECK = __dirname;

const slug = process.argv[2];
if (!slug) { console.error("uso: node deck/editable.mjs <slug>"); process.exit(1); }

const projDir = join(DECK, "empreendimentos", slug);
const dadosPath = join(projDir, "dados.json");
if (!existsSync(dadosPath)) { console.error("não achei", dadosPath); process.exit(1); }

const dados = JSON.parse(readFileSync(dadosPath, "utf8"));
const projeto = dados.projeto || {};
const slides = dados.slides || [];

// caminhos RELATIVOS a partir de empreendimentos/<slug>/<slug>.html
const foto = (name) => `fotos/${name}`;
const fixo = (name) => `../../assets-fixos/${name}`;
const wm = fixo("vitacon-wordmark.png");

function numera(s) {
  if (s.tipo === "capa" || s.tipo === "juridico") return false;
  if (s.tipo === "imagem") return !!s.chrome;
  if (s.tipo === "divisor") return s.fundo !== "azul" && s.chrome !== false;
  return true;
}
const total = dados.numeracaoTotal || slides.filter(numera).length;

function rotulo(s) {
  const bits = [s.tipo.toUpperCase()];
  const t = s.titulo || s.numero || s.imagem || s.fixo;
  if (t) bits.push(String(t).replace(/\n/g, " ").slice(0, 42));
  return bits.join(" · ");
}

let pageNum = 0;
const bodies = slides.map((s, i) => {
  if (numera(s)) pageNum += 1;
  const ctx = { projeto, pageNum, total, foto, fixo, wm };
  const banner = `\n    <!-- ═══════════════ PÁGINA ${String(i + 1).padStart(2, "0")} · ${rotulo(s)} ═══════════════ -->`;
  return banner + "\n    " + renderSlide(s, ctx).trim();
}).join("\n");

const html = `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=1920">
  <title>${projeto.nome || slug} — Vitacon</title>
  <link rel="stylesheet" href="../../template/styles.css">
  <!--
    ▸ Este arquivo é EDITÁVEL à mão, página por página.
    ▸ Cada <div class="slide"> é uma página (1920×1080).
    ▸ Depois de editar:  node deck/html2pdf.mjs ${slug}
  -->
</head>
<body>
${bodies}
</body>
</html>
`;

const out = join(projDir, `${slug}.html`);
writeFileSync(out, html);
console.log("✅ HTML editável:", out, `(${slides.length} páginas)`);
